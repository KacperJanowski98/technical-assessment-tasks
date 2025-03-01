/**
 * This file contains example code for testing the enhanced mask editing functionality
 * You can use these snippets to test different aspects of the implementation
 */

// Sample mask data for testing
const sampleMasks = [
  {
    id: 'mask1',
    points: [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 200, y: 200 },
      { x: 100, y: 200 }
    ],
    visible: true,
    label: 'Square',
    color: '#ff3366'
  },
  {
    id: 'mask2',
    points: [
      { x: 250, y: 150 },
      { x: 350, y: 150 },
      { x: 300, y: 250 }
    ],
    visible: true,
    label: 'Triangle',
    color: '#33aaff'
  },
  {
    id: 'mask3',
    points: [
      { x: 400, y: 100 },
      { x: 450, y: 100 },
      { x: 500, y: 150 },
      { x: 500, y: 200 },
      { x: 450, y: 250 },
      { x: 400, y: 250 },
      { x: 350, y: 200 },
      { x: 350, y: 150 }
    ],
    visible: true,
    label: 'Octagon', 
    color: '#33cc33'
  }
];

// Example of inserting a vertex into a mask
function insertVertex(mask, edgeIndex, newPoint) {
  const newPoints = [...mask.points];
  const insertAt = (edgeIndex + 1) % mask.points.length;
  newPoints.splice(insertAt, 0, newPoint);
  return {
    ...mask,
    points: newPoints
  };
}

// Example of removing a vertex from a mask
function removeVertex(mask, vertexIndex) {
  if (mask.points.length <= 3) {
    console.warn('Cannot remove vertex: mask must have at least 3 vertices');
    return mask;
  }
  
  const newPoints = [...mask.points];
  newPoints.splice(vertexIndex, 1);
  return {
    ...mask,
    points: newPoints
  };
}

// Example of finding the nearest edge to a point
function findNearestEdge(mask, point, threshold = 10) {
  let minDistance = Infinity;
  let nearestEdge = null;
  
  for (let i = 0; i < mask.points.length; i++) {
    const startPoint = mask.points[i];
    const endPoint = mask.points[(i + 1) % mask.points.length];
    
    const distance = pointToLineDistance(point, startPoint, endPoint);
    
    if (distance < minDistance && distance < threshold) {
      minDistance = distance;
      nearestEdge = {
        maskId: mask.id,
        startIndex: i,
        endIndex: (i + 1) % mask.points.length
      };
    }
  }
  
  return nearestEdge;
}

// Helper function to calculate distance from point to line segment
function pointToLineDistance(point, lineStart, lineEnd) {
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
}

// Example history action records for undo/redo
const exampleHistoryActions = [
  {
    type: 'CREATE_MASK',
    maskId: 'mask1',
    previousPoints: null,
    newPoints: sampleMasks[0].points
  },
  {
    type: 'UPDATE_MASK',
    maskId: 'mask1',
    previousPoints: sampleMasks[0].points,
    newPoints: [
      { x: 100, y: 100 },
      { x: 250, y: 100 }, // Changed from 200 to 250
      { x: 200, y: 200 },
      { x: 100, y: 200 }
    ]
  },
  {
    type: 'UPDATE_MASK',
    maskId: 'mask1',
    previousPoints: [
      { x: 100, y: 100 },
      { x: 250, y: 100 },
      { x: 200, y: 200 },
      { x: 100, y: 200 }
    ],
    newPoints: [
      { x: 100, y: 100 },
      { x: 250, y: 100 },
      { x: 200, y: 200 },
      { x: 100, y: 200 },
      { x: 150, y: 150 } // Added a new vertex
    ]
  }
];

// Example usage in React component testing
/*
Test Scenario 1: Adding a vertex
1. Select a mask (set selectedMaskId to 'mask1')
2. Switch to vertex mode (set editMode to 'vertex')
3. Hover over an edge (set hoveredEdge to something like { maskId: 'mask1', startIndex: 0, endIndex: 1 })
4. Click on the edge (call handleMouseDown with appropriate event)
5. The mask should now have a new vertex added between the two edge vertices

Test Scenario 2: Deleting a vertex
1. Select a mask (set selectedMaskId to 'mask1')
2. Switch to vertex mode (set editMode to 'vertex')
3. Hover over a vertex
4. Alt+click on the vertex (call handleMouseDown with e.altKey = true)
5. The mask should now have that vertex removed (if it had more than 3 vertices)

Test Scenario 3: Undo/Redo
1. Perform some edit operations (add vertices, move vertices, etc.)
2. Call undo()
3. The last operation should be reversed
4. Call redo()
5. The operation should be reapplied
*/