import React, { useState, useRef } from 'react';
import { Video, Resolution, Frame } from '../types';
import VideoProcessorComponent from './VideoProcessorComponent';
import CanvasEditorComponent from './CanvasEditorComponent';
import { useVideoProcessor } from '../hooks/useVideoProcessor';
import { FaDownload, FaArrowLeft, FaSpinner } from 'react-icons/fa';

interface VideoEditorProps {
  videoId: string;
  onBack: () => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ videoId, onBack }) => {
  const {
    video,
    currentFrame,
    isLoading,
    error,
    selectFrame,
    addMask,
    updateMask,
    deleteMask,
    toggleMaskVisibility,
    exportResults
  } = useVideoProcessor(videoId);
  
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process export request
  const handleExport = async () => {
    if (!video) return;
    
    setIsExporting(true);
    
    try {
      const blob = await exportResults();
      
      if (blob) {
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${video.title}_segmented.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !video) {
    return (
      <div className="video-editor loading">
        <FaSpinner className="spinner" />
        <p>Loading video data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-editor error">
        <p>{error}</p>
        <button onClick={onBack}>Back to Video List</button>
      </div>
    );
  }

  if (!video || !currentFrame) {
    return (
      <div className="video-editor error">
        <p>No video data available</p>
        <button onClick={onBack}>Back to Video List</button>
      </div>
    );
  }

  // Default resolution if not available from video
  const defaultResolution: Resolution = {
    width: 720,
    height: 480
  };
  
  // Processing resolution 
  const processingResolution: Resolution = {
    width: 720,
    height: 480
  };
  
  // Make sure video has a resolution property
  if (!video.resolution) {
    video.resolution = defaultResolution;
  }
  
  // Make sure currentFrame has segmentation data
  if (!currentFrame.segmentation) {
    currentFrame.segmentation = { masks: [] };
  }
  
  // Make sure segmentation has a masks property
  if (!currentFrame.segmentation.masks) {
    currentFrame.segmentation.masks = [];
  }

  return (
    <div className="video-editor" ref={containerRef}>
      <div className="editor-header">
        <button className="back-button" onClick={onBack}>
          <FaArrowLeft /> Back to Videos
        </button>
        
        <h1>{video.title || video.filename || `Video ${video.id.substring(0, 8)}`}</h1>
        
        <button 
          className="export-button"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? <FaSpinner className="spinner" /> : <FaDownload />} 
          {isExporting ? 'Exporting...' : 'Export Results'}
        </button>
      </div>
      
      <div className="editor-main">
        <div className="video-processor-section">
          <VideoProcessorComponent
            video={video}
            onFrameSelect={selectFrame}
            selectedFrameId={currentFrame.id}
          />
        </div>
        
        <div className="canvas-editor-section">
          <CanvasEditorComponent
            frame={currentFrame}
            originalResolution={video.resolution}
            processingResolution={processingResolution}
            onUpdateMask={updateMask}
            onCreateMask={addMask}
            onDeleteMask={deleteMask}
            onToggleMaskVisibility={toggleMaskVisibility}
          />
        </div>
      </div>
      
      <div className="editor-sidebar">
        <div className="video-info-panel">
          <h3>Video Information</h3>
          <ul>
            <li><strong>Duration:</strong> <span>{Math.floor(video.duration / 60)}:{Math.floor(video.duration % 60).toString().padStart(2, '0')}</span></li>
            <li><strong>Resolution:</strong> <span>{video.resolution.width}x{video.resolution.height}</span></li>
            <li><strong>Total Frames:</strong> <span>{video.frames ? video.frames.length : 0}</span></li>
            <li><strong>FPS:</strong> <span>{video.fps}</span></li>
            <li><strong>Current Time:</strong> <span>{Math.floor(currentFrame.timestamp / 60)}:{Math.floor(currentFrame.timestamp % 60).toString().padStart(2, '0')}</span></li>
          </ul>
        </div>
        
        <div className="segmentation-info">
          <h3>Segmentation Info</h3>
          <ul>
            <li><strong>Current Masks:</strong> <span>{currentFrame.segmentation.masks.length}</span></li>
            <li><strong>Processing Resolution:</strong> <span>{processingResolution.width}x{processingResolution.height}</span></li>
            <li><strong>Status:</strong> <span>{video.status || "Ready"}</span></li>
          </ul>
        </div>
        
        <div className="instructions">
          <h4>Instructions</h4>
          <ul>
            <li>Use the canvas editor to create and edit masks</li>
            <li>Double-click to complete drawing a mask</li>
            <li>Click on a mask to select it for editing</li>
            <li>Press Delete to remove the selected mask</li>
            <li>Export when finished to save your segmentation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;