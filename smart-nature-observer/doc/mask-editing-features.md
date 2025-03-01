# Enhanced Mask Editing Features

This document provides an overview of the enhanced mask editing features implemented in the Smart Nature Observer application.

## Key Features

### 1. Advanced Vertex Management

- **Add Vertices**: In vertex mode, click on any edge of a selected mask to add a new vertex at that position. This allows for creating more detailed and accurate masks.
- **Delete Vertices**: Hold Alt and click on any vertex to remove it, simplifying the mask geometry when needed. Requires at least 3 vertices to remain.
- **Vertex Dragging**: In selection mode, you can drag any vertex to reshape the mask.

### 2. Edge Manipulation

- **Edge Mode**: A dedicated mode for manipulating edges of the mask.
- **Visual Feedback**: Edges are highlighted when hovered, making it easier to identify which edge you're working with.

### 3. Undo/Redo System

- Complete history tracking for all mask manipulations.
- Undo (Ctrl+Z) and Redo (Ctrl+Y or Ctrl+Shift+Z) keyboard shortcuts.
- Visual indicators showing when undo/redo is available.

### 4. Improved User Interface

- **Tool Modes**: Clear separation between different editing modes (Select, Draw, Vertex, Edge).
- **Tooltips**: Informative tooltips for all controls.
- **Status Messages**: Context-sensitive help messages that update based on the current mode and action.
- **Keyboard Shortcuts**: Comprehensive keyboard shortcuts for faster editing.

## Keyboard Shortcuts

### Navigation
- **Left/Right Arrow**: Navigate between frames
- **Space**: Play/pause video playback

### Tool Selection
- **1**: Selection mode
- **2**: Drawing mode
- **3**: Vertex editing mode
- **4**: Edge editing mode

### Editing
- **Ctrl+Z**: Undo
- **Ctrl+Y** or **Ctrl+Shift+Z**: Redo
- **Alt+Click**: Delete vertex (in vertex mode)
- **Delete**: Delete selected mask
- **Escape**: Cancel drawing
- **?**: Show keyboard shortcuts help

## Technical Implementation

### Vertex Management
Vertices can be added by detecting when the cursor is near an edge and inserting a new point in the polygon array:

```typescript
// Adding a new vertex on an edge
if (editMode === 'vertex' && hoveredEdge) {
  const processingPoint = displayToProcessing(clickPoint);
  newPoints.splice(
    hoveredEdge.endIndex === 0 ? selectedMask.points.length : hoveredEdge.endIndex, 
    0, 
    processingPoint
  );
}
```

### History Management
All editing operations are tracked in a history stack that enables undo and redo:

```typescript
const saveToHistory = (action: HistoryAction) => {
  // If we're not at the end of the history, remove future actions
  if (historyIndex < history.length - 1) {
    setHistory(prev => prev.slice(0, historyIndex + 1));
  }
  
  // Add the new action to history
  setHistory(prev => [...prev, action]);
  setHistoryIndex(prev => prev + 1);
};
```

## Usage Tips

1. **Start with Draw Mode**: Create the initial mask by clicking to add points and double-clicking to complete.
2. **Refine with Vertex Mode**: Add additional points to improve the precision of the mask.
3. **Clean Up if Needed**: Remove unnecessary vertices by Alt+clicking them.
4. **Use Undo/Redo**: If you make a mistake, use undo to step back.
5. **Save Often**: Export your work regularly to avoid losing progress.

## Future Improvements

- Freehand drawing mode for more natural mask creation
- Automatic vertex snapping to important features
- Mask labeling and categorization 
- Keyboard shortcuts for navigating mask list
- Multi-mask selection and operations