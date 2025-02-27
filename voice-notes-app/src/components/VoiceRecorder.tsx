import React, { useState } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import api from '@/lib/api';

interface VoiceRecorderProps {
  onTranscriptionComplete?: (text: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscriptionComplete }) => {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    resetRecording,
    error: recordingError,
  } = useVoiceRecorder();

  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    setError(null);
    setTranscription(null);
    await startRecording();
  };

  const handleStopRecording = async () => {
    try {
      const blob = await stopRecording();
      console.log('Recording stopped, blob size:', blob.size);
      
      // Automatically start transcription after recording stops
      if (blob) {
        await handleTranscribe(blob);
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Failed to stop recording');
    }
  };

  const handleTranscribe = async (blobToTranscribe = audioBlob) => {
    if (!blobToTranscribe) {
      setError('No recording available to transcribe');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await api.transcribeAudio(blobToTranscribe);
      
      if (response.success && response.data) {
        setTranscription(response.data.rawText);
        if (onTranscriptionComplete) {
          onTranscriptionComplete(response.data.rawText);
        }
      } else {
        throw new Error(response.error?.message || 'Failed to transcribe audio');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe recording');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Voice Recorder</h2>
      
      {recordingError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {recordingError}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`p-4 rounded-full ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
            disabled={isProcessing}
          >
            {isRecording ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {isRecording 
                ? 'Recording...' 
                : isProcessing 
                  ? 'Transcribing...' 
                  : audioBlob 
                    ? 'Recording complete' 
                    : 'Ready to record'}
            </span>
            <span className="text-lg font-semibold">
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {audioBlob && (
            <button
              onClick={resetRecording}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
              disabled={isRecording || isProcessing}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {audioUrl && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Preview
            {isProcessing && <span className="ml-2 text-blue-500">(Transcribing...)</span>}
          </p>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}

      {transcription && (
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Transcription</p>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md whitespace-pre-wrap">
            {transcription}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="mt-4 flex items-center gap-2 text-blue-500">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Analyzing your voice note...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
