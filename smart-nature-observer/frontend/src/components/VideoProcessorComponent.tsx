import React, { useState, useEffect, useRef } from 'react';
import { Video, Frame } from '../types';
import { FaPlay, FaPause, FaArrowRight, FaArrowLeft, FaForward, FaBackward } from 'react-icons/fa';

interface VideoProcessorProps {
  video: Video;
  onFrameSelect: (frameId: string) => void;
  selectedFrameId?: string;
}

const VideoProcessorComponent: React.FC<VideoProcessorProps> = ({
  video,
  onFrameSelect,
  selectedFrameId
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const playbackTimerRef = useRef<number | null>(null);

  // Ensure the video has valid properties with defaults
  const safeVideo = {
    ...video,
    duration: isNaN(video.duration) ? 0 : video.duration,
    frames: video.frames || []
  };
  
  // Check if frames exist
  const hasFrames = safeVideo.frames.length > 0;
  
  // Find the current frame index
  const currentFrameIndex = hasFrames 
    ? safeVideo.frames.findIndex(frame => frame.id === selectedFrameId)
    : -1;
  
  // Get the current frame or default to the first one
  const currentFrame = hasFrames && currentFrameIndex >= 0 
    ? safeVideo.frames[currentFrameIndex] 
    : hasFrames ? safeVideo.frames[0] : null;

  // Manage playback
  useEffect(() => {
    // Clean up any existing timer
    if (playbackTimerRef.current !== null) {
      window.clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    
    // If playing, start a timer to advance frames
    if (isPlaying && hasFrames) {
      // Calculate interval based on video FPS and playback speed
      const fps = safeVideo.fps || 24; // Default to 24fps if not available
      const intervalMs = 1000 / (fps * playbackSpeed);
      
      playbackTimerRef.current = window.setInterval(() => {
        // Stop at the end of the frames
        if (currentFrameIndex >= safeVideo.frames.length - 1) {
          setIsPlaying(false);
          return;
        }
        
        // Advance to the next frame
        const nextIndex = currentFrameIndex + 1;
        const nextFrame = safeVideo.frames[nextIndex];
        onFrameSelect(nextFrame.id);
        setCurrentTime(nextFrame.timestamp || 0);
      }, intervalMs);
    }
    
    // Clean up on unmount
    return () => {
      if (playbackTimerRef.current !== null) {
        window.clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, currentFrameIndex, hasFrames, playbackSpeed, safeVideo.frames, safeVideo.fps, onFrameSelect]);

  // Toggle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Move to the next frame
  const nextFrame = () => {
    if (hasFrames && currentFrameIndex < safeVideo.frames.length - 1) {
      const nextFrame = safeVideo.frames[currentFrameIndex + 1];
      onFrameSelect(nextFrame.id);
      setCurrentTime(nextFrame.timestamp || 0);
    }
  };

  // Move to the previous frame
  const prevFrame = () => {
    if (hasFrames && currentFrameIndex > 0) {
      const prevFrame = safeVideo.frames[currentFrameIndex - 1];
      onFrameSelect(prevFrame.id);
      setCurrentTime(prevFrame.timestamp || 0);
    }
  };

  // Handle time slider change
  const handleTimeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    
    // Find the nearest frame to this timestamp if frames exist
    if (hasFrames) {
      const nearest = safeVideo.frames.reduce((prev, curr) => {
        const prevDiff = Math.abs((prev.timestamp || 0) - time);
        const currDiff = Math.abs((curr.timestamp || 0) - time);
        return currDiff < prevDiff ? curr : prev;
      });
      
      onFrameSelect(nearest.id);
    }
  };

  // Format timestamp as mm:ss
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "00:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle speed change
  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlaybackSpeed(parseFloat(e.target.value));
  };

  return (
    <div className="video-processor">
      <div className="video-display">
        {currentFrame && (
          <div className="current-frame">
            <img src={currentFrame.thumbnail} alt={`Frame at ${formatTime(currentFrame.timestamp || 0)}`} />
          </div>
        )}
      </div>
      
      <div className="frame-counter">
        {hasFrames ? (
          `Frame: ${currentFrameIndex + 1} / ${safeVideo.frames.length}`
        ) : (
          "No frames available"
        )}
      </div>
      
      <div className="video-controls">
        <div className="transport-controls">
          <button 
            className="transport-button"
            onClick={prevFrame} 
            disabled={!hasFrames || currentFrameIndex <= 0}
            title="Previous Frame"
          >
            <FaArrowLeft size={18} />
          </button>
          
          <button 
            className="transport-button play-button"
            onClick={togglePlayback}
            disabled={!hasFrames}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
          </button>
          
          <button 
            className="transport-button"
            onClick={nextFrame} 
            disabled={!hasFrames || currentFrameIndex >= safeVideo.frames.length - 1}
            title="Next Frame"
          >
            <FaArrowRight size={18} />
          </button>
          
          <select 
            className="speed-select"
            value={playbackSpeed} 
            onChange={handleSpeedChange}
            title="Playback Speed"
          >
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
        
        <div className="timeline-controls">
          <span className="time-display">{formatTime(currentTime)}</span>
          
          <input
            type="range"
            min="0"
            max={safeVideo.duration}
            step="0.1"
            value={currentTime}
            onChange={handleTimeSliderChange}
            className="time-slider"
            title="Timeline"
          />
          
          <span className="duration-display">{formatTime(safeVideo.duration)}</span>
        </div>
      </div>
      
      <div className="frame-thumbnails">
        {hasFrames ? (
          safeVideo.frames.map((frame, index) => (
            <div 
              key={frame.id}
              className={`frame-thumbnail ${frame.id === selectedFrameId ? 'selected' : ''}`}
              onClick={() => {
                onFrameSelect(frame.id);
                setCurrentTime(frame.timestamp || 0);
              }}
              title={`Frame ${index + 1} - ${formatTime(frame.timestamp || 0)}`}
            >
              <img src={frame.thumbnail} alt={`Frame ${index + 1}`} />
              <span>{formatTime(frame.timestamp || 0)}</span>
            </div>
          ))
        ) : (
          <div className="no-frames-message">No frames available. Video may still be processing.</div>
        )}
      </div>
    </div>
  );
};

export default VideoProcessorComponent;