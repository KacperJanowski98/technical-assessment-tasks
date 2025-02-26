import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceRecorderResult {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  resetRecording: () => void;
  error: string | null;
}

export const useVoiceRecorder = (): VoiceRecorderResult => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  // Cleanup function to stop all recording-related resources
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startRecording = async (): Promise<void> => {
    try {
      setError(null);
      cleanup();
      audioChunksRef.current = [];
      setRecordingTime(0);

      // Check if browser supports MediaRecorder
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer to track recording duration
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsRecording(false);
    }
  };

  const stopRecording = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        reject(new Error('No active recording to stop'));
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsRecording(false);
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  };

  const resetRecording = useCallback(() => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }

    cleanup();
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setError(null);
    audioChunksRef.current = [];
  }, [isRecording, cleanup]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    resetRecording,
    error
  };
};

export default useVoiceRecorder;