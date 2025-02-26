import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_WHISPER_SERVER_URL;

// Types
export interface TranscriptionResponse {
  success: boolean;
  data?: {
    rawText: string;
  };
  error?: {
    message: string;
    code: string;
    details?: Record<string, any>;
  };
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  uploadDir?: string;
  modelPath?: string;
  binaryPath?: string;
  modelName?: string;
  model?: string;
  error?: string;
}

// API client
export const api = {
  /**
   * Check the health of the whisper server
   */
  checkHealth: async (): Promise<HealthCheckResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check error:', error);
      return { status: 'error', error: 'Failed to connect to the server' };
    }
  },

  /**
   * Send audio file for transcription
   */
  transcribeAudio: async (
    audioBlob: Blob,
    options?: { language?: string; task?: string; format?: string }
  ): Promise<TranscriptionResponse> => {
    try {
      const formData = new FormData();
    //   formData.append('audio', audioBlob, 'recording.wav');
        formData.append('audio', audioBlob, 'recording.webm');

        if (options?.language) {
        formData.append('language', options.language);
        }
        
        if (options?.task) {
        formData.append('task', options.task);
        }
        
        if (options?.format) {
        formData.append('format', options.format);
        }

        const response = await axios.post(
        `${API_BASE_URL}/api/transcribe`,
        formData,
        {
            headers: {
            'Content-Type': 'multipart/form-data',
            },
        }
        );

        return response.data;
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        success: false,
        error: {
          message: 'Failed to transcribe audio',
          code: 'TRANSCRIPTION_ERROR',
          details: { originalError: error },
        },
      };
    }
  },
};

export default api;