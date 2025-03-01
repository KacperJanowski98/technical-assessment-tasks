import React, { useRef, useEffect } from 'react';
import { Frame, Resolution, Point, Mask } from '../types';
import { useCanvasEditor } from '../hooks/useCanvasEditor';
import { useResolutionManager } from '../hooks/useResolutionManager';
import { FaTrash, FaEye, FaEyeSlash, FaPaintBrush, FaEraser, FaCrosshairs } from 'react-icons/fa';

interface CanvasEditorProps {
  frame: Frame;
  originalResolution: Resolution;
  processingResolution: Resolution;
  onUpdateMask: (frameId: string, maskId: string, points: Point[]) => void;
  onCreateMask: (frameId: string, points: Point[]) => void;
  onDeleteMask: (frameId: string, maskId: string) => void;
  onToggleMaskVisibility: (frameId: string, maskId: string) => void;
}

const CanvasEditorComponent: React.FC<CanvasEditorProps> = ({
  frame,
  originalResolution,
  processingResolution,
  onUpdateMask,
  onCreateMask,
  onDeleteMask,
  onToggleMaskVisibility
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Resolution management
  const { 
    displayResolution,
    displayToProcessing,
    processingToDisplay
  } = useResolutionManager(originalResolution, processingResolution, containerRef);

  // Canvas editor
  const {
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
  } = useCanvasEditor(
    frame.id,
    frame.segmentation.masks,
    displayToProcessing,
    processingToDisplay,
    onUpdateMask,
    onCreateMask
  );

  // Set canvas dimensions when display resolution changes
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = displayResolution.width;
      canvasRef.current.height = displayResolution.height;
    }
  }, [displayResolution]);

  // Handle keyboard events for tool operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to cancel drawing
      if (e.key === 'Escape' && isDrawing) {
        cancelDrawing();
      }
      
      // Delete to remove selected mask
      if (e.key === 'Delete' && selectedMaskId) {
        onDeleteMask(frame.id, selectedMaskId);
        setSelectedMaskId(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, selectedMaskId, frame.id, cancelDrawing, onDeleteMask, setSelectedMaskId]);

  return (
    <div className="canvas-editor" ref={containerRef}>
      <div 
        className="canvas-container"
        style={{
          width: displayResolution.width,
          height: displayResolution.height,
          position: 'relative'
        }}
      >
        {/* Display frame thumbnail as background */}
        <img
          ref={imageRef}
          src={frame.thumbnail}
          alt={`Frame ${frame.id}`}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
        
        {/* Canvas overlay for drawing and editing masks */}
        <canvas
          ref={canvasRef}
          width={displayResolution.width}
          height={displayResolution.height}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            cursor: isDrawing ? 'crosshair' : 'default'
          }}
        />
      </div>
      
      <div className="editor-tools">
        <div className="tools-panel">
          <button 
            title="Draw Mask (then double-click to finish)"
            className={isDrawing ? 'active' : ''}
            onClick={() => {
              if (!isDrawing) {
                setSelectedMaskId(null);
              } else {
                cancelDrawing();
              }
            }}
          >
            <FaPaintBrush />
          </button>
          
          <button 
            title="Select Mask"
            disabled={isDrawing}
            className={!isDrawing && !selectedMaskId ? 'active' : ''}
            onClick={() => {
              if (isDrawing) cancelDrawing();
              setSelectedMaskId(null);
            }}
          >
            <FaCrosshairs />
          </button>
          
          <button 
            title="Delete Selected Mask"
            disabled={!selectedMaskId || isDrawing}
            onClick={() => {
              if (selectedMaskId) {
                onDeleteMask(frame.id, selectedMaskId);
                setSelectedMaskId(null);
              }
            }}
          >
            <FaTrash />
          </button>
        </div>
        
        <div className="mask-list">
          <h3>Masks</h3>
          {frame.segmentation.masks.length === 0 ? (
            <p className="no-masks">No masks created yet. Use the draw tool to create masks.</p>
          ) : (
            <ul>
              {frame.segmentation.masks.map(mask => (
                <li 
                  key={mask.id}
                  className={mask.id === selectedMaskId ? 'selected' : ''}
                  onClick={() => {
                    if (isDrawing) cancelDrawing();
                    setSelectedMaskId(mask.id);
                  }}
                >
                  <div 
                    className="mask-color" 
                    style={{ background: mask.color || '#33aaff' }}
                  />
                  <span className="mask-label">{mask.label || `Mask ${mask.id.slice(0, 4)}`}</span>
                  
                  <button 
                    title={mask.visible ? 'Hide Mask' : 'Show Mask'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMaskVisibility(frame.id, mask.id);
                    }}
                  >
                    {mask.visible ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="editor-status">
        {isDrawing ? (
          <span className="status-drawing">
            <strong>Drawing:</strong> Click to add points, double-click to finish
          </span>
        ) : selectedMaskId ? (
          <span className="status-editing">
            <strong>Editing:</strong> Drag points to reshape, press Delete to remove mask
          </span>
        ) : (
          <span className="status-idle">
            <strong>Ready:</strong> Click Draw to create a new mask, or select an existing mask
          </span>
        )}
      </div>
    </div>
  );
};

export default CanvasEditorComponent;