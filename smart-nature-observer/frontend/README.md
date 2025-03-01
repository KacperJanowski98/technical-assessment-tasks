# Smart Nature Observer Frontend

This is the frontend for the Smart Nature Observer application, a tool for analyzing nature videos using AI segmentation.

## Features

- Video upload and processing
- Interactive canvas for segmentation editing
- Frame-by-frame video navigation
- Mask creation, editing, and visualization
- Export of segmentation results

## Technologies Used

- React + TypeScript
- Canvas API for interactive drawing
- Responsive design for various screen sizes
- Integration with backend REST API

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- Backend server running on port 3001

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

The application will be available at http://localhost:3000.

## Architecture

The frontend is organized into the following structure:

- `src/components/`: React components
- `src/hooks/`: Custom React hooks for business logic
- `src/services/`: API services for backend communication
- `src/types/`: TypeScript type definitions

### Key Components

- **VideoUploader**: Handles video file uploads to the backend
- **VideoList**: Displays available videos
- **VideoProcessor**: Manages frame navigation and playback
- **CanvasEditor**: Interactive segmentation editing interface
- **VideoEditor**: Main editor combining all components

### Custom Hooks

- **useVideoProcessor**: Manages video and frame state
- **useCanvasEditor**: Handles canvas drawing and interaction
- **useResolutionManager**: Manages resolution conversion between display, processing, and original

## Building for Production

To create a production build:

```bash
npm run build
```

The build will be available in the `build` directory.