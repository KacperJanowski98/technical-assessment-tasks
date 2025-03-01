import { useState, useEffect, useRef } from 'react';
import { Point, Mask } from '../types';

export const useCanvasEditor = (
  frameId: string,
  masks: Mask[],
  displayToProcessing: (point: Point) => Point,
  processingToDisplay: (point: Point) => Point,
  onUpdateMask: (frameId: string, maskId: string, points: Point[]) => void,
  onCreateMask: (frameId: string, points: Point[]) => void
) => {
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [hoveredMaskId, setHoveredMaskId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [dragPointIndex, setDragPointIndex] = useState<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Helper functions for point operations
  const pointInRadius = (point: Point, target: Point, radius: number): boolean => {
    const dx = point.x - target.x;
    const dy = point.y - target.y;
    return dx * dx + dy * dy <= radius * radius;
  };
  
  // Draw everything on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each visible mask
    masks.forEach(mask => {
      if (!mask.visible) return;
      
      const isSelected = mask.id === selectedMaskId;
      const isHovered = mask.id === hoveredMaskId;
      
      // Set up styles based on mask state
      ctx.strokeStyle = mask.color || (isSelected ? '#ff3366' : '#33aaff');
      ctx.lineWidth = isSelected || isHovered ? 3 : 2;
      ctx.fillStyle = mask.color ? mask.color + '33' : (isSelected ? '#ff336633' : '#33aaff33');
      
      // Convert points to display resolution
      const displayPoints = mask.points.map(point => processingToDisplay(point));
      
      // Draw the mask shape
      if (displayPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(displayPoints[0].x, displayPoints[0].y);
        
        for (let i = 1; i < displayPoints.length; i++) {
          ctx.lineTo(displayPoints[i].x, displayPoints[i].y);
        }
        
        if (displayPoints.length > 2) {
          ctx.closePath();
          ctx.fill();
        }
        
        ctx.stroke();
        
        // Draw points for selected mask
        if (isSelected) {
          displayPoints.forEach((point, index) => {
            const isHoveredPoint = hoveredPoint && 
              pointInRadius(hoveredPoint, point, 10) &&
              selectedMaskId === mask.id;
            
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = isHoveredPoint ? '#ff3366' : '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#ff3366';
            ctx.lineWidth = 2;
            ctx.stroke();
          });
        }
      }
    });
    
    // Draw current points when creating a new mask
    if (currentPoints.length > 0) {
      ctx.strokeStyle = '#33cc33';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      
      // Connect to mouse position if hovering
      if (hoveredPoint && isDrawing) {
        ctx.lineTo(hoveredPoint.x, hoveredPoint.y);
      }
      
      ctx.stroke();
      
      // Draw points
      currentPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#33cc33';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  }, [masks, selectedMaskId, hoveredMaskId, currentPoints, hoveredPoint, isDrawing, processingToDisplay]);
  
  // Handle mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setHoveredPoint({ x, y });
    
    // Handle dragging a point
    if (isDragging && selectedMaskId && dragPointIndex !== null && dragStartPoint) {
      const selectedMask = masks.find(mask => mask.id === selectedMaskId);
      if (selectedMask) {
        // Calculate the new position for the dragged point
        const newPoints = [...selectedMask.points];
        newPoints[dragPointIndex] = displayToProcessing({ x, y });
        
        // Update the mask with the new points
        onUpdateMask(frameId, selectedMaskId, newPoints);
      }
      return;
    }
    
    // Check if hovering over a point in the selected mask
    if (selectedMaskId) {
      const selectedMask = masks.find(mask => mask.id === selectedMaskId);
      if (selectedMask) {
        const displayPoints = selectedMask.points.map(point => processingToDisplay(point));
        
        for (let i = 0; i < displayPoints.length; i++) {
          if (pointInRadius({ x, y }, displayPoints[i], 10)) {
            canvas.style.cursor = 'pointer';
            return;
          }
        }
      }
    }
    
    // Check if hovering over any mask
    let hovered = null;
    
    for (const mask of masks) {
      if (!mask.visible) continue;
      
      const displayPoints = mask.points.map(point => processingToDisplay(point));
      
      if (displayPoints.length > 2) {
        const isInside = isPointInPolygon({ x, y }, displayPoints);
        if (isInside) {
          hovered = mask.id;
          canvas.style.cursor = 'pointer';
          break;
        }
      }
    }
    
    setHoveredMaskId(hovered);
    
    if (!hovered && !isDragging) {
      canvas.style.cursor = isDrawing ? 'crosshair' : 'default';
    }
  };
  
  // Helper to check if a point is inside a polygon
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const intersect = 
        ((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
        (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / 
                  (polygon[j].y - polygon[i].y) + polygon[i].x);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only handle left clicks
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickPoint = { x, y };
    
    // If a mask is selected, check if clicking on a control point
    if (selectedMaskId) {
      const selectedMask = masks.find(mask => mask.id === selectedMaskId);
      if (selectedMask) {
        const displayPoints = selectedMask.points.map(point => processingToDisplay(point));
        
        for (let i = 0; i < displayPoints.length; i++) {
          if (pointInRadius(clickPoint, displayPoints[i], 10)) {
            // Start dragging this point
            setIsDragging(true);
            setDragStartPoint(displayPoints[i]);
            setDragPointIndex(i);
            return;
          }
        }
      }
    }
    
    // If clicking on a mask, select it
    if (hoveredMaskId) {
      setSelectedMaskId(hoveredMaskId);
      return;
    }
    
    // Otherwise, start drawing a new mask
    if (!isDrawing) {
      setIsDrawing(true);
      setCurrentPoints([clickPoint]);
    } else {
      // Add a point to the current drawing
      setCurrentPoints(prev => [...prev, clickPoint]);
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartPoint(null);
      setDragPointIndex(null);
    }
  };
  
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Complete the drawing of a new mask
    if (isDrawing && currentPoints.length > 2) {
      // Convert display points to processing resolution
      const processingPoints = currentPoints.map(point => displayToProcessing(point));
      
      // Create the new mask
      onCreateMask(frameId, processingPoints);
      
      // Reset drawing state
      setIsDrawing(false);
      setCurrentPoints([]);
    }
  };
  
  const cancelDrawing = () => {
    setIsDrawing(false);
    setCurrentPoints([]);
  };
  
  return {
    canvasRef,
    selectedMaskId,
    setSelectedMaskId,
    isDrawing,
    hoveredMaskId,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleDoubleClick,
    cancelDrawing
  };
};