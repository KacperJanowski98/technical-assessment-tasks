import React, { useState } from 'react';
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

  // Check if frames exist
  const hasFrames = video.frames && video.frames.length > 0;
  
  // Find the current frame index
  const currentFrameIndex = hasFrames ? video.frames!.findIndex(
    frame => frame.id === selectedFrameId
  ) : -1;
  
  // Get the current frame or default to the first one
  const currentFrame = hasFrames && currentFrameIndex >= 0 
    ? video.frames![currentFrameIndex] 
    : hasFrames ? video.frames![0] : null;

  // Start or stop playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Move to the next frame
  const nextFrame = () => {
    if (hasFrames && currentFrameIndex < video.frames!.length - 1) {
      const nextFrame = video.frames![currentFrameIndex + 1];
      onFrameSelect(nextFrame.id);
      setCurrentTime(nextFrame.timestamp);
    }
  };

  // Move to the previous frame
  const prevFrame = () => {
    if (hasFrames && currentFrameIndex > 0) {
      const prevFrame = video.frames![currentFrameIndex - 1];
      onFrameSelect(prevFrame.id);
      setCurrentTime(prevFrame.timestamp);
    }
  };

  // Handle time slider change
  const handleTimeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    
    // Find the nearest frame to this timestamp if frames exist
    if (hasFrames) {
      const nearest = video.frames!.reduce((prev, curr) => {
        return Math.abs(curr.timestamp - time) < Math.abs(prev.timestamp - time)
          ? curr
          : prev;
      });
      
      onFrameSelect(nearest.id);
    }
  };

  // Format timestamp as mm:ss
  const formatTime = (seconds: number): string => {
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
            <img src={currentFrame.thumbnail} alt={`Frame at ${formatTime(currentFrame.timestamp)}`} />
          </div>
        )}
      </div>
      
      <div className="frame-counter">
        {hasFrames ? (
          `Frame: ${currentFrameIndex + 1} / ${video.frames!.length}`
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
            title="Play/Pause"
          >
            {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
          </button>
          
          <button 
            className="transport-button"
            onClick={nextFrame} 
            disabled={!hasFrames || currentFrameIndex >= video.frames!.length - 1}
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
            max={video.duration}
            step="0.1"
            value={currentTime}
            onChange={handleTimeSliderChange}
            className="time-slider"
            title="Timeline"
          />
          
          <span className="duration-display">{formatTime(video.duration)}</span>
        </div>
      </div>
      
      <div className="frame-thumbnails">
        {hasFrames ? (
          video.frames!.map((frame, index) => (
            <div 
              key={frame.id}
              className={`frame-thumbnail ${frame.id === selectedFrameId ? 'selected' : ''}`}
              onClick={() => {
                onFrameSelect(frame.id);
                setCurrentTime(frame.timestamp);
              }}
              title={`Frame ${index + 1} - ${formatTime(frame.timestamp)}`}
            >
              <img src={frame.thumbnail} alt={`Frame ${index + 1}`} />
              <span>{formatTime(frame.timestamp)}</span>
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