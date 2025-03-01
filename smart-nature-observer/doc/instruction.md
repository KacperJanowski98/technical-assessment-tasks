# Instructions for Claude Code to Generate the Smart Nature Observer Project

## Project Overview

Create a video analytics system for natural environments with a TypeScript backend using the SAM2 model and a React frontend. The system should detect both static (e.g., mountains, trees) and dynamic objects (e.g., animals, birds) in videos.

## Architecture Requirements

1. Create a clearly separated frontend and backend architecture:
   - Frontend: React + TypeScript as specified in Task 1
   - Backend: Express.js + TypeScript with SAM2 model integration

2. The backend should be responsible for:
   - Video processing and analysis
   - Frame extraction and segmentation using SAM2
   - Providing a REST API that matches the VideoProcessor interface

3. The frontend and backend should be able to be combined into a single application.

## Step 1: Frontend Implementation

### 1.1 Strictly Follow the Frontend Stack from Task 1

You must implement the frontend exactly as specified in Task 1:
```typescript
// Core technologies
- React + TypeScript
- Canvas/WebGL for visualization
- Web Workers for processing
```

### 1.2 Implement the CanvasEditor Interface

Implement the CanvasEditor interface exactly as defined in the task:
```typescript
interface CanvasEditor {
  // Canvas setup with resolution handling
  initialize: (container: HTMLElement) => void;
  setResolution: (width: number, height: number) => void;
  
  // Frame navigation (5-10 fps precision)
  seekTo: (timestamp: number) => Promise<void>;
  getCurrentFrame: () => FrameData;
  
  // Interaction handlers
  onPointerDown?: (event: PointerEvent) => void;
  onPointerMove?: (event: PointerEvent) => void;
  onPointerUp?: (event: PointerEvent) => void;
  
  // Mask manipulation
  updateMask: (maskId: string, updates: Partial<Mask>) => void;
  createMask: (points: Point[]) => Promise<string>;
  deleteMask: (maskId: string) => void;
}
```

### 1.3 Implement Resolution Management

Follow the ResolutionManager class specification from Task 1:
```typescript
class ResolutionManager {
  constructor(originalVideo: HTMLVideoElement) {
    this.originalResolution = {
      width: originalVideo.videoWidth,
      height: originalVideo.videoHeight
    };
  }

  getProcessingResolution() {
    // Implement smart downscaling logic
    // Suggest 720p or 360p based on original size
    return this.calculateOptimalProcessingSize();
  }

  scaleSegmentationToOriginal(mask: Mask): Mask {
    // Scale mask coordinates back to original resolution
    // Important: Handle normalization correctly here
    return this.normalizeAndScaleMask(mask);
  }
}
```

### 1.4 Implement Performance Optimizations

Follow the performance optimization guidelines from Task 1:
```typescript
interface PerformanceOptimizations {
  // Frame buffering
  frameBuffer: {
    ahead: number;  // Number of frames to pre-process
    behind: number; // Number of frames to keep in memory
  };

  // Render optimization
  canvasLayers: {
    background: HTMLCanvasElement;  // Original video
    masks: HTMLCanvasElement;       // Segmentation overlay
    interaction: HTMLCanvasElement; // Active editing layer
  };

  // WebGL acceleration
  glContext?: WebGLRenderingContext;
  shaders?: {
    maskBlending: WebGLProgram;
    colorization: WebGLProgram;
  };
}
```

## Step 2: Backend Implementation

### 2.1 Create the Project Structure

Create a project structure with these directories:
```
smart-nature-observer/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── types/
│   │   ├── scripts/
│   │   └── server.ts
│   ├── models/
│   ├── uploads/
│   └── processing/
└── frontend/
    └── [React components as per Task 1]
```

### 2.2 Define TypeScript Types

Create TypeScript definitions that match the VideoProcessor interface from Task 1:
```typescript
interface VideoProcessor {
  // Configuration
  config: {
    processingResolution: {
      width: number;  // suggest 720p/360p for processing
      height: number;
    };
    outputResolution: {
      width: number;  // original video resolution
      height: number;
    };
    model: {
      type: 'SAM2' | 'other';  // SAM 2.1 recommended
      configuration: Record<string, any>;
    };
  };

  // Processing methods
  processVideo: (file: File) => Promise<ProcessedVideoData>;
  extractFrame: (timestamp: number) => Promise<FrameData>;
  updateSegmentation: (frameId: string, updates: SegmentationUpdate) => Promise<void>;
}
```

### 2.3 Implement Core Services

Create these essential services:
1. VideoProcessorService - For handling video processing using FFmpeg
2. ModelManager - For interacting with the SAM2 model
3. Controller classes - For handling API requests

### 2.4 Create SAM2 Integration Scripts

Create Python scripts for:
1. Running automatic segmentation on video frames
2. Generating masks from user-provided points

## Step 3: SAM2 Model Setup

### 3.1 Create a Bash Script for SAM2 Model Setup

Create a bash script (`setup-sam2.sh`) that:
1. Creates necessary directories
2. Sets up a Python virtual environment
3. Installs required Python dependencies
4. Downloads the SAM2 model from https://github.com/facebookresearch/sam2
5. Configures the model for use with our application

Use this information for the SAM2 model:
- Repository URL: https://github.com/facebookresearch/sam2
- Model weights URL: https://dl.fbaipublicfiles.com/segment_anything_2/sam2_l.pt
- Required Python packages: torch, segment-anything-2, opencv-python

## Step 4: API Implementation

### 4.1 Implement REST API Endpoints

Create these endpoints to match the VideoProcessor interface:
1. Video Upload and Processing:
   - POST /api/videos - Upload and process a video

2. Frame Navigation:
   - GET /api/videos/:videoId/frames - Get all extracted frames
   - GET /api/videos/:videoId/frames/:frameId - Get a specific frame
   - GET /api/videos/:videoId/frames/at/:timestamp - Get frame at timestamp

3. Segmentation Manipulation:
   - GET /api/videos/:videoId/frames/:frameId/segmentation - Get segmentation
   - PATCH /api/videos/:videoId/frames/:frameId/segmentation - Update segmentation
   - POST /api/videos/:videoId/frames/:frameId/masks - Create a new mask
   - DELETE /api/videos/:videoId/frames/:frameId/masks/:maskId - Delete a mask

4. Export Functionality:
   - GET /api/videos/:videoId/export - Export processed results

## Step 5: Frontend-Backend Integration

### 5.1 Create Integration Points

Ensure backend API endpoints match the frontend's VideoProcessor interface:
- processVideo
- extractFrame
- updateSegmentation

### 5.2 Handle Resolution Management

Implement resolution handling that:
1. Accepts original video resolution
2. Processes at optimized resolution (720p/360p as suggested)
3. Returns segmentation data scaled to the original resolution

### 5.3 Configure CORS and API Access

Set up proper CORS configuration to allow the frontend to access the backend API from development servers.

## Step 6: Documentation and Testing

### 6.1 Create Documentation

Create a comprehensive README.md that explains:
1. Project setup
2. API documentation
3. Frontend-backend integration
4. Troubleshooting

### 6.2 Add Development Scripts

Create npm scripts for development and production:
- Development mode with hot reload
- Production build
- Combined frontend-backend start script

## Implementation Notes

1. For the SAM2 model:
   - Use the Python bridge pattern to communicate between Node.js and the SAM2 Python model
   - Handle both automatic segmentation and point-based segmentation

2. For performance:
   - Implement proper resolution management
   - Use Web Workers for background processing
   - Optimize canvas operations as specified in the task

3. For integration:
   - Ensure all API responses match the expected TypeScript interfaces
   - Use proper error handling and status codes
   - Implement efficient file handling for video uploads and frame extraction

4. Follow the exact folder structure specified in Task 1:
   ```
   src/
   ├── components/
   │   ├── VideoProcessor/
   │   │   ├── index.tsx
   │   │   ├── ResolutionManager.ts
   │   │   └── FrameProcessor.ts
   │   ├── Canvas/
   │   │   ├── Editor.tsx
   │   │   ├── Tools.tsx
   │   │   └── Filmroll.tsx
   │   └── UI/
   │       ├── Controls.tsx
   │       └── Timeline.tsx
   ├── hooks/
   │   ├── useVideoProcessing.ts
   │   ├── useCanvasEditor.ts
   │   └── useSegmentation.ts
   ├── lib/
   │   ├── models.ts
   │   ├── videoUtils.ts
   │   └── canvasUtils.ts
   └── types/
       └── index.ts
   ```
   