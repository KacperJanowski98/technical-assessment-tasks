import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ServerStatus {
  status: 'ok' | 'error';
  uploadDir?: string;
  modelPath?: string;
  binaryPath?: string;
  modelName?: string;
  model?: string;
  error?: string;
}

const ServerHealthCheck = () => {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkServerHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_WHISPER_SERVER_URL}/health`
      );
      setStatus(response.data);
    } catch (err) {
      console.error('Error checking server health:', err);
      setError('Could not connect to the Whisper server. Please ensure it is running.');
      setStatus({ status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Whisper Server Status</h3>
        <button
          onClick={checkServerHealth}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {loading ? 'Checking...' : 'Check Connection'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
          {error}
        </div>
      )}

      {status && (
        <div className={`p-3 rounded-md ${status.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <p className="font-semibold">Status: {status.status.toUpperCase()}</p>
          
          {status.status === 'ok' && (
            <div className="mt-2 text-sm">
              <p><span className="font-medium">Model:</span> {status.modelName}</p>
              <p><span className="font-medium">Model Path:</span> {status.modelPath}</p>
              <p><span className="font-medium">Binary Path:</span> {status.binaryPath}</p>
              <p><span className="font-medium">Upload Directory:</span> {status.uploadDir}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServerHealthCheck;