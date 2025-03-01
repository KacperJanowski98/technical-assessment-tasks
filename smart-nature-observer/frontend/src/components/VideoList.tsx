import React, { useState, useEffect } from 'react';
import { Video } from '../types';
import * as api from '../services/api';
import { FaPlay, FaSpinner } from 'react-icons/fa';

interface VideoListProps {
  onVideoSelect: (videoId: string) => void;
}

const VideoList: React.FC<VideoListProps> = ({ onVideoSelect }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch videos on component mount
  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await api.getAllVideos();
        setVideos(data);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVideos();
  }, []);

  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="video-list loading">
        <FaSpinner className="spinner" />
        <p>Loading videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-list error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="video-list empty">
        <p>No videos uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="video-list">
      <h2>Your Videos</h2>
      
      <div className="video-grid">
        {videos.map(video => (
          <div 
            key={video.id}
            className={`video-card ${video.processingStatus}`}
            onClick={() => {
              if (video.processingStatus === 'complete') {
                onVideoSelect(video.id);
              }
            }}
          >
            {/* Thumbnail (first frame if available) */}
            <div className="video-thumbnail">
              {video.frames && video.frames.length > 0 ? (
                <img src={video.frames[0].thumbnail} alt={video.title} />
              ) : (
                <div className="no-thumbnail">No preview</div>
              )}
              
              {/* Show duration */}
              <span className="video-duration">{formatDuration(video.duration)}</span>
              
              {/* Show play button for completed videos */}
              {video.processingStatus === 'complete' && (
                <div className="play-button">
                  <FaPlay />
                </div>
              )}
              
              {/* Show processing indicator */}
              {video.processingStatus === 'processing' && (
                <div className="processing-indicator">
                  <FaSpinner className="spinner" />
                  <span>Processing</span>
                </div>
              )}
            </div>
            
            <div className="video-info">
              <h3 className="video-title">{video.title}</h3>
              
              <div className="video-details">
                <span className="video-resolution">
                  {video.resolution.width}x{video.resolution.height}
                </span>
                
                <span className="video-frames">
                  {video.frames.length} frames
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoList;