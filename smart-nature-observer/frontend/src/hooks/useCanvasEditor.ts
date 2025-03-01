import { useState, useEffect, useRef, useCallback } from 'react';
import { Point, Mask, HistoryAction } from '../types';

export const useCanvasEditor = (
  frameId: string,
  masks: Mask[],
  displayToProcessing: (point: Point) => Point,
  processingToDisplay: (point: Point) => Point,
  onUpdateMask: (frameId: string, maskId: string, points: Point[]) => void,
  onCreateMask: (frameId: string, points: Point[]) => void
) => {
  // History management for undo/redo
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [editMode, setEditMode] = useState<'draw' | 'select' | 'vertex' | 'edge'>('select');
  const [hoveredEdge, setHoveredEdge] = useState<{maskId: string, startIndex: number, endIndex: number} | null>(null);
  
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
  
  // Calculate distance from point to line segment
  const pointToLineDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };
  
  // History management functions
  const saveToHistory = (action: HistoryAction) => {
    // If we're not at the end of the history, remove future actions
    if (historyIndex < history.length - 1) {
      setHistory(prev => prev.slice(0, historyIndex + 1));
    }
    
    // Add the new action to history
    setHistory(prev => [...prev, action]);
    setHistoryIndex(prev => prev + 1);
  };
  
  const updateLastHistoryAction = (maskId: string, newPoints: Point[]) => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      
      const lastAction = prev[prev.length - 1];
      if (lastAction.maskId === maskId && lastAction.newPoints === null) {
        // Update the last action with the new points
        const updatedAction = {
          ...lastAction,
          newPoints: [...newPoints]
        };
        return [...prev.slice(0, prev.length - 1), updatedAction];
      }
      
      return prev;
    });
  };
  
  const undo = useCallback(() => {
    if (historyIndex < 0) return;
    
    const action = history[historyIndex];
    
    if (action.type === 'UPDATE_MASK' && action.previousPoints && action.maskId !== null) {
      onUpdateMask(frameId, action.maskId, action.previousPoints);
    }
    
    // Decrement the history index
    setHistoryIndex(prev => prev - 1);
  }, [history, historyIndex, frameId, onUpdateMask]);
  
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    const action = history[historyIndex + 1];
    
    if (action.type === 'UPDATE_MASK' && action.newPoints && action.maskId !== null) {
      onUpdateMask(frameId, action.maskId, action.newPoints);
    }
    
    // Increment the history index
    setHistoryIndex(prev => prev + 1);
  }, [history, historyIndex, frameId, onUpdateMask]);
  
  // Add keyboard shortcut listeners for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  
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
          
          // Draw edge hover indicators when in vertex or edge mode
          if ((editMode === 'vertex' || editMode === 'edge') && hoveredEdge && hoveredEdge.maskId === mask.id) {
            const startPoint = displayPoints[hoveredEdge.startIndex];
            const endPoint = displayPoints[hoveredEdge.endIndex];
            
            // Draw a thicker, highlighted line for the hovered edge
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(endPoint.x, endPoint.y);
            ctx.strokeStyle = editMode === 'vertex' ? '#33cc33' : '#ff9900';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // If in vertex mode, draw a ghost point where a new vertex would be added
            if (editMode === 'vertex' && hoveredPoint) {
              ctx.beginPath();
              ctx.arc(hoveredPoint.x, hoveredPoint.y, 5, 0, Math.PI * 2);
              ctx.fillStyle = '#33cc3377';
              ctx.fill();
              ctx.strokeStyle = '#33cc33';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
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
  }, [masks, selectedMaskId, hoveredMaskId, currentPoints, hoveredPoint, isDrawing, processingToDisplay, editMode, hoveredEdge]);
  
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
        
        // Check for vertex hover
        for (let i = 0; i < displayPoints.length; i++) {
          if (pointInRadius({ x, y }, displayPoints[i], 10)) {
            canvas.style.cursor = 'pointer';
            return;
          }
        }
        
        // Check for edge hover when in vertex mode
        if (editMode === 'vertex' || editMode === 'edge') {
          for (let i = 0; i < displayPoints.length; i++) {
            const nextIndex = (i + 1) % displayPoints.length;
            if (pointToLineDistance({ x, y }, displayPoints[i], displayPoints[nextIndex]) < 10) {
              setHoveredEdge({ maskId: selectedMask.id, startIndex: i, endIndex: nextIndex });
              canvas.style.cursor = editMode === 'vertex' ? 'cell' : 'move';
              return;
            }
          }
          setHoveredEdge(null);
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
    
    // If we're in vertex mode and hovering over an edge, add a new vertex
    if (editMode === 'vertex' && hoveredEdge && selectedMaskId) {
      const selectedMask = masks.find(mask => mask.id === selectedMaskId);
      if (selectedMask) {
        // Save the current state for undo
        saveToHistory({
          type: 'UPDATE_MASK',
          maskId: selectedMaskId,
          previousPoints: [...selectedMask.points],
          newPoints: null // Will be set after update
        });
        
        // Create a new array of points with the new vertex inserted
        const newPoints = [...selectedMask.points];
        const processingPoint = displayToProcessing(clickPoint);
        // Insert the new point at the correct position
        newPoints.splice(
          hoveredEdge.endIndex === 0 ? selectedMask.points.length : hoveredEdge.endIndex, 
          0, 
          processingPoint
        );
        
        // Update the mask
        onUpdateMask(frameId, selectedMaskId, newPoints);
        return;
      }
    }
    
    // If a mask is selected, check if clicking on a control point
    if (selectedMaskId) {
      const selectedMask = masks.find(mask => mask.id === selectedMaskId);
      if (selectedMask) {
        const displayPoints = selectedMask.points.map(point => processingToDisplay(point));
        
        // Handle vertex dragging or deletion
        for (let i = 0; i < displayPoints.length; i++) {
          if (pointInRadius(clickPoint, displayPoints[i], 10)) {
            // Delete vertex if right-click or Alt+click
            if (e.altKey && selectedMask.points.length > 3) {
              // Save the current state for undo
              saveToHistory({
                type: 'UPDATE_MASK',
                maskId: selectedMaskId,
                previousPoints: [...selectedMask.points],
                newPoints: null // Will be set after update
              });
              
              // Remove the vertex
              const newPoints = [...selectedMask.points];
              newPoints.splice(i, 1);
              onUpdateMask(frameId, selectedMaskId, newPoints);
              return;
            }
            
            // Otherwise, start dragging this point
            // Save the current state for undo (only before starting the drag)
            saveToHistory({
              type: 'UPDATE_MASK',
              maskId: selectedMaskId,
              previousPoints: [...selectedMask.points],
              newPoints: null // Will be set after dragging completes
            });
            
            setIsDragging(true);
            setDragStartPoint(displayPoints[i]);
            setDragPointIndex(i);
            return;
          }
        }
        
        // Handle edge dragging if in edge mode
        if (editMode === 'edge' && hoveredEdge) {
          // Save the current state for undo
          saveToHistory({
            type: 'UPDATE_MASK',
            maskId: selectedMaskId,
            previousPoints: [...selectedMask.points],
            newPoints: null // Will be set after dragging completes
          });
          
          // Start dragging the edge
          setIsDragging(true);
          setDragStartPoint(clickPoint);
          return;
        }
      }
    }
    
    // If clicking on a mask, select it
    if (hoveredMaskId) {
      setSelectedMaskId(hoveredMaskId);
      return;
    }
    
    // Draw mode behavior
    if (editMode === 'draw' || isDrawing) {
      if (!isDrawing) {
        setIsDrawing(true);
        setCurrentPoints([clickPoint]);
      } else {
        // Add a point to the current drawing
        setCurrentPoints(prev => [...prev, clickPoint]);
      }
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      // Complete the history entry from dragging
      if (selectedMaskId) {
        const selectedMask = masks.find(mask => mask.id === selectedMaskId);
        if (selectedMask) {
          // Find the last history action for this mask and update its newPoints
          updateLastHistoryAction(selectedMaskId, selectedMask.points);
        }
      }
      
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
      
      // Save for history
      saveToHistory({
        type: 'CREATE_MASK',
        maskId: null, // Will be set after creation
        previousPoints: null,
        newPoints: processingPoints
      });
      
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
    hoveredEdge,
    editMode,
    setEditMode,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleDoubleClick,
    cancelDrawing,
    undo,
    redo,
    canUndo: historyIndex >= 0,
    canRedo: historyIndex < history.length - 1
  };
};