import React, { useState } from 'react';
import * as api from '../services/api';

interface VideoUploaderProps {
  onVideoUploaded: (videoId: string) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a video file first');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);

      // Upload the file
      const response = await api.uploadVideo(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Notify parent component
      onVideoUploaded(response.id);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="video-uploader">
      <h2>Upload Nature Video</h2>
      <p>Select a video file of natural scenes to analyze with our AI segmentation tools.</p>
      
      <div className="upload-area">
        <input 
          type="file"
          id="video-upload"
          accept="video/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        <div className="file-info">
          {file && (
            <div>
              <strong>Selected file:</strong> {file.name}
              <br />
              <strong>Size:</strong> {(file.size / (1024 * 1024)).toFixed(2)} MB
            </div>
          )}
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {isUploading && (
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
            <span>{Math.round(progress)}%</span>
          </div>
        )}
        
        <button 
          className="upload-button"
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </div>
      
      <div className="upload-notes">
        <p><strong>Note:</strong> Supported formats include MP4, MOV, AVI (max 50MB)</p>
        <p>After upload, the video will be processed for AI segmentation.</p>
      </div>
    </div>
  );
};

export default VideoUploader;