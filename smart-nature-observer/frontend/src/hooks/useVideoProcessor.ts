import { useState, useEffect } from 'react';
import { Video, Frame } from '../types';
import * as api from '../services/api';

export const useVideoProcessor = (videoId?: string) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [currentFrame, setCurrentFrame] = useState<Frame | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch video data
  useEffect(() => {
    if (!videoId) return;

    const fetchVideo = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const videoData = await api.getVideoById(videoId);
        setVideo(videoData);
        
        // Set the first frame as current if available
        if (videoData.frames && videoData.frames.length > 0) {
          setCurrentFrame(videoData.frames[0]);
        }
      } catch (err) {
        console.error('Error fetching video:', err);
        setError('Failed to load video data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  // Select a frame by ID
  const selectFrame = (frameId: string) => {
    if (!video) return;
    
    const frame = video.frames.find(f => f.id === frameId);
    if (frame) {
      setCurrentFrame(frame);
    }
  };

  // Select a frame by timestamp
  const selectFrameByTimestamp = async (timestamp: number) => {
    if (!videoId) return;
    
    setIsLoading(true);
    try {
      const frame = await api.getFrameAtTimestamp(videoId, timestamp);
      setCurrentFrame(frame);
      
      // Update the frames array in the video object if needed
      setVideo(prevVideo => {
        if (!prevVideo) return null;
        
        const frameIndex = prevVideo.frames.findIndex(f => f.id === frame.id);
        if (frameIndex >= 0) {
          const updatedFrames = [...prevVideo.frames];
          updatedFrames[frameIndex] = frame;
          return { ...prevVideo, frames: updatedFrames };
        } else {
          return { ...prevVideo, frames: [...prevVideo.frames, frame] };
        }
      });
    } catch (err) {
      console.error('Error fetching frame:', err);
      setError('Failed to load frame data');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a mask to a frame
  const addMask = async (frameId: string, points: { x: number; y: number }[]) => {
    if (!videoId) return;
    
    setIsLoading(true);
    try {
      const newMask = await api.createMask(videoId, frameId, points);
      
      // Update current frame and video state
      setCurrentFrame(prevFrame => {
        if (!prevFrame || prevFrame.id !== frameId) return prevFrame;
        
        return {
          ...prevFrame,
          segmentation: {
            ...prevFrame.segmentation,
            masks: [...prevFrame.segmentation.masks, newMask]
          }
        };
      });
      
      // Update the frames array in the video object
      setVideo(prevVideo => {
        if (!prevVideo) return null;
        
        return {
          ...prevVideo,
          frames: prevVideo.frames.map(f => {
            if (f.id === frameId) {
              return {
                ...f,
                segmentation: {
                  ...f.segmentation,
                  masks: [...f.segmentation.masks, newMask]
                }
              };
            }
            return f;
          })
        };
      });
    } catch (err) {
      console.error('Error adding mask:', err);
      setError('Failed to create a new mask');
    } finally {
      setIsLoading(false);
    }
  };

  // Update a mask in a frame
  const updateMask = async (frameId: string, maskId: string, points: { x: number; y: number }[]) => {
    if (!videoId || !video) return;
    
    setIsLoading(true);
    try {
      // Find the frame and update its mask
      const frame = video.frames.find(f => f.id === frameId);
      if (!frame) throw new Error('Frame not found');
      
      const updatedMasks = frame.segmentation.masks.map(mask => 
        mask.id === maskId ? { ...mask, points } : mask
      );
      
      // Update the segmentation on the server
      await api.updateSegmentation(videoId, frameId, { 
        masks: updatedMasks 
      });
      
      // Update local state
      const updatedFrame = { 
        ...frame, 
        segmentation: { 
          ...frame.segmentation, 
          masks: updatedMasks 
        } 
      };
      
      if (currentFrame?.id === frameId) {
        setCurrentFrame(updatedFrame);
      }
      
      setVideo(prevVideo => {
        if (!prevVideo) return null;
        
        return {
          ...prevVideo,
          frames: prevVideo.frames.map(f => 
            f.id === frameId ? updatedFrame : f
          )
        };
      });
    } catch (err) {
      console.error('Error updating mask:', err);
      setError('Failed to update mask');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a mask from a frame
  const deleteMask = async (frameId: string, maskId: string) => {
    if (!videoId) return;
    
    setIsLoading(true);
    try {
      await api.deleteMask(videoId, frameId, maskId);
      
      // Update current frame if it's the same frame
      if (currentFrame?.id === frameId) {
        setCurrentFrame(prevFrame => {
          if (!prevFrame) return null;
          
          return {
            ...prevFrame,
            segmentation: {
              ...prevFrame.segmentation,
              masks: prevFrame.segmentation.masks.filter(mask => mask.id !== maskId)
            }
          };
        });
      }
      
      // Update the video state
      setVideo(prevVideo => {
        if (!prevVideo) return null;
        
        return {
          ...prevVideo,
          frames: prevVideo.frames.map(f => {
            if (f.id === frameId) {
              return {
                ...f,
                segmentation: {
                  ...f.segmentation,
                  masks: f.segmentation.masks.filter(mask => mask.id !== maskId)
                }
              };
            }
            return f;
          })
        };
      });
    } catch (err) {
      console.error('Error deleting mask:', err);
      setError('Failed to delete mask');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle mask visibility
  const toggleMaskVisibility = async (frameId: string, maskId: string) => {
    if (!videoId || !video) return;
    
    try {
      // Find the frame and toggle the mask visibility
      const frame = video.frames.find(f => f.id === frameId);
      if (!frame) return;
      
      const updatedMasks = frame.segmentation.masks.map(mask => 
        mask.id === maskId ? { ...mask, visible: !mask.visible } : mask
      );
      
      // Update on the server
      await api.updateSegmentation(videoId, frameId, { masks: updatedMasks });
      
      // Update local state
      const updatedFrame = { 
        ...frame, 
        segmentation: { 
          ...frame.segmentation, 
          masks: updatedMasks 
        } 
      };
      
      if (currentFrame?.id === frameId) {
        setCurrentFrame(updatedFrame);
      }
      
      setVideo(prevVideo => {
        if (!prevVideo) return null;
        
        return {
          ...prevVideo,
          frames: prevVideo.frames.map(f => 
            f.id === frameId ? updatedFrame : f
          )
        };
      });
    } catch (err) {
      console.error('Error toggling mask visibility:', err);
      setError('Failed to update mask visibility');
    }
  };

  // Export results
  const exportResults = async () => {
    if (!videoId) return null;
    
    setIsLoading(true);
    try {
      const blob = await api.exportResults(videoId);
      setIsLoading(false);
      return blob;
    } catch (err) {
      console.error('Error exporting results:', err);
      setError('Failed to export results');
      setIsLoading(false);
      return null;
    }
  };

  return {
    video,
    currentFrame,
    isLoading,
    error,
    selectFrame,
    selectFrameByTimestamp,
    addMask,
    updateMask,
    deleteMask,
    toggleMaskVisibility,
    exportResults
  };
};