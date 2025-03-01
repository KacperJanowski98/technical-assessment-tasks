import { useState, useEffect } from 'react';
import { Resolution } from '../types';

export const useResolutionManager = (
  originalResolution: Resolution,
  processingResolution: Resolution,
  containerRef: React.RefObject<HTMLDivElement>
) => {
  const [displayResolution, setDisplayResolution] = useState<Resolution>({
    width: originalResolution.width,
    height: originalResolution.height
  });

  // Calculate a suitable display resolution based on container size
  useEffect(() => {
    const updateDisplayResolution = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Calculate the aspect ratio
      const aspectRatio = originalResolution.width / originalResolution.height;
      
      // Calculate dimensions that maintain aspect ratio and fit in container
      let width = containerWidth;
      let height = width / aspectRatio;
      
      // If height exceeds container, adjust width accordingly
      if (height > containerHeight) {
        height = containerHeight;
        width = height * aspectRatio;
      }
      
      // Ensure dimensions are integers
      width = Math.floor(width);
      height = Math.floor(height);
      
      setDisplayResolution({ width, height });
    };
    
    // Update on mount and when container size changes
    updateDisplayResolution();
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDisplayResolution);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [originalResolution, containerRef]);

  // Convert point from display to original resolution
  const displayToOriginal = (point: { x: number; y: number }): { x: number; y: number } => {
    return {
      x: Math.round((point.x / displayResolution.width) * originalResolution.width),
      y: Math.round((point.y / displayResolution.height) * originalResolution.height)
    };
  };

  // Convert point from original to display resolution
  const originalToDisplay = (point: { x: number; y: number }): { x: number; y: number } => {
    return {
      x: Math.round((point.x / originalResolution.width) * displayResolution.width),
      y: Math.round((point.y / originalResolution.height) * displayResolution.height)
    };
  };

  // Convert point from display to processing resolution
  const displayToProcessing = (point: { x: number; y: number }): { x: number; y: number } => {
    // First convert to original resolution
    const originalPoint = displayToOriginal(point);
    
    // Then convert from original to processing resolution
    return {
      x: Math.round((originalPoint.x / originalResolution.width) * processingResolution.width),
      y: Math.round((originalPoint.y / originalResolution.height) * processingResolution.height)
    };
  };

  // Convert point from processing to display resolution
  const processingToDisplay = (point: { x: number; y: number }): { x: number; y: number } => {
    // First convert to original resolution
    const originalPoint = {
      x: Math.round((point.x / processingResolution.width) * originalResolution.width),
      y: Math.round((point.y / processingResolution.height) * originalResolution.height)
    };
    
    // Then convert from original to display resolution
    return originalToDisplay(originalPoint);
  };

  return {
    displayResolution,
    setDisplayResolution,
    displayToOriginal,
    originalToDisplay,
    displayToProcessing,
    processingToDisplay
  };
};