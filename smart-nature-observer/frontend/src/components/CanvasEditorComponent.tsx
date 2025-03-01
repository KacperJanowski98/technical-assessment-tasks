import React, { useRef, useEffect, useState } from 'react';
import { Frame, Resolution, Point, Mask, EditMode } from '../types';
import { useCanvasEditor } from '../hooks/useCanvasEditor';
import { useResolutionManager } from '../hooks/useResolutionManager';
import {
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaPaintBrush,
  FaCrosshairs,
  FaPlus,
  FaMinus,
  FaUndoAlt,
  FaRedoAlt,
  FaVectorSquare,
  FaDrawPolygon,
  FaHandPaper,
  FaMousePointer
} from 'react-icons/fa';
import ShortcutsDialog from './ShortcutsDialog';
import './ShortcutsDialog.css';

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
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);

  // Ensure frame has segmentation and masks to prevent errors
  const safeMasks = frame?.segmentation?.masks || [];

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
    canUndo,
    canRedo
  } = useCanvasEditor(
    frame.id,
    safeMasks,
    displayToProcessing,
    processingToDisplay,
    onUpdateMask,
    onCreateMask
  );

  // Set canvas dimensions when display resolution changes
  useEffect(() => {
    if (canvasRef.current) {
      // Use same aspect ratio as original image
      const aspectRatio = originalResolution.width / originalResolution.height;
      
      // Calculate new dimensions that fit in the container and maintain aspect ratio
      let width, height;
      const canvasContainer = canvasRef.current.parentElement;
      
      if (canvasContainer) {
        const containerWidth = canvasContainer.clientWidth;
        const containerHeight = canvasContainer.clientHeight;
        
        if (containerWidth / containerHeight > aspectRatio) {
          // Container is wider than needed
          height = containerHeight;
          width = height * aspectRatio;
        } else {
          // Container is taller than needed
          width = containerWidth;
          height = width / aspectRatio;
        }
        
        // Set the canvas dimensions
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    }
  }, [displayResolution, originalResolution]);

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
      
      // Tool shortcuts
      if (e.key === '1') setEditMode('select');
      if (e.key === '2') setEditMode('draw');
      if (e.key === '3') setEditMode('vertex');
      if (e.key === '4') setEditMode('edge');

      // Show shortcuts dialog with '?'
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShortcutsDialogOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, selectedMaskId, frame.id, cancelDrawing, onDeleteMask, setSelectedMaskId, setEditMode]);

  return (
    <div className="canvas-editor" ref={containerRef}>
      {/* Header with tools */}
      <div className="editor-header">
        <div className="editor-toolbar">
          {/* Edit mode tools */}
          <div className="tool-group mode-tools">
            <button 
              title="Selection Mode (1)"
              className={editMode === 'select' ? 'active' : ''}
              onClick={() => setEditMode('select')}
            >
              <FaMousePointer />
            </button>
            
            <button 
              title="Drawing Mode (2)"
              className={editMode === 'draw' || isDrawing ? 'active' : ''}
              onClick={() => {
                if (isDrawing) {
                  cancelDrawing();
                } else {
                  setEditMode('draw');
                  setSelectedMaskId(null);
                }
              }}
            >
              <FaDrawPolygon />
            </button>
            
            <button 
              title="Vertex Edit Mode (3) - Add/Delete Vertices"
              className={editMode === 'vertex' ? 'active' : ''}
              disabled={!selectedMaskId}
              onClick={() => setEditMode('vertex')}
            >
              <FaPlus />
            </button>
            
            <button 
              title="Edge Edit Mode (4) - Move Edges"
              className={editMode === 'edge' ? 'active' : ''}
              disabled={!selectedMaskId}
              onClick={() => setEditMode('edge')}
            >
              <FaHandPaper />
            </button>
          </div>
          
          {/* History controls */}
          <div className="tool-group history-tools">
            <button 
              title="Undo (Ctrl+Z)"
              disabled={!canUndo}
              onClick={undo}
            >
              <FaUndoAlt />
            </button>
            <button 
              title="Redo (Ctrl+Y)"
              disabled={!canRedo}
              onClick={redo}
            >
              <FaRedoAlt />
            </button>
          </div>
          
          {/* Delete selected mask */}
          <div className="tool-group">
            <button 
              title="Delete Selected Mask (Delete)"
              disabled={!selectedMaskId || isDrawing}
              onClick={() => {
                if (selectedMaskId) {
                  onDeleteMask(frame.id, selectedMaskId);
                  setSelectedMaskId(null);
                }
              }}
              className="delete-button"
            >
              <FaTrash />
            </button>
          </div>
        </div>
        
        <div className="editor-info">
          {editMode === 'select' && (
            <span>Select & move masks or vertices</span>
          )}
          {editMode === 'draw' && (
            <span>Click to add points, double-click to complete</span>
          )}
          {editMode === 'vertex' && (
            <span>Click on edges to add vertices, Alt+click to delete vertices</span>
          )}
          {editMode === 'edge' && (
            <span>Click and drag edges to reshape masks</span>
          )}
        </div>
      </div>
      
      {/* Fixed height canvas container */}
      <div className="canvas-container">
        {/* Display frame thumbnail as background */}
        <img
          ref={imageRef}
          src={frame.thumbnail}
          alt={`Frame ${frame.id}`}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            objectFit: 'contain'
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
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: isDrawing ? 'crosshair' : 'default',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
        />
      </div>
      
      {/* Controls area with tools and scrollable mask list */}
      <div className="editor-controls">
        {/* Scrollable mask list */}
        <div className="mask-list">
          <h3>Mask List</h3>
          {safeMasks.length === 0 ? (
            <p className="no-masks">No masks created yet. Use the drawing tool to create masks.</p>
          ) : (
            <ul>
              {safeMasks.map(mask => (
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
      
      {/* Status bar */}
      <div className="editor-status">
        <div className="status-info">
          {isDrawing ? (
            <span className="status-drawing">
              <strong>Drawing:</strong> Click to add points, double-click to finish
            </span>
          ) : selectedMaskId ? (
            <span className="status-editing">
              <strong>Editing:</strong> {getEditModeStatusText(editMode, hoveredEdge !== null)}
            </span>
          ) : (
            <span className="status-idle">
              <strong>Ready:</strong> Select a mask or switch to drawing mode
            </span>
          )}
        </div>
        
        <div className="keyboard-shortcuts">
          <button 
            className="shortcuts-button" 
            title="Keyboard Shortcuts (Press ?)"
            onClick={() => setShortcutsDialogOpen(true)}
          >
            ⌨️ Shortcuts
          </button>
        </div>
      </div>

      {/* Shortcuts Dialog */}
      <ShortcutsDialog 
        isOpen={shortcutsDialogOpen} 
        onClose={() => setShortcutsDialogOpen(false)} 
      />
    </div>
  );
};

// Helper function to get status text based on edit mode
function getEditModeStatusText(mode: 'draw' | 'select' | 'vertex' | 'edge', isHoveringEdge: boolean): string {
  switch(mode) {
    case 'select':
      return 'Drag vertices to reshape mask, press Delete to remove mask';
    case 'vertex':
      return isHoveringEdge 
        ? 'Click to add a new vertex on this edge' 
        : 'Hover over an edge to add a vertex, Alt+click vertex to delete';
    case 'edge':
      return isHoveringEdge 
        ? 'Click and drag to move this edge' 
        : 'Hover over an edge to move it';
    case 'draw':
      return 'Double-click to finish drawing';
  }
}

export default CanvasEditorComponent;