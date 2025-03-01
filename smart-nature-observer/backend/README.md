# Smart Nature Observer - Backend

This is the backend for the Smart Nature Observer video analytics system. It provides a REST API for video processing, frame extraction, and segmentation using the SAM2 model.

## Features

- Video upload and processing
- Frame extraction and segmentation
- SAM2 model integration
- REST API matching the VideoProcessor interface
- Health check endpoint

## Project Structure

```
backend/
├── src/
│   ├── controllers/    # API route handlers
│   ├── services/       # Business logic
│   ├── types/          # TypeScript type definitions
│   ├── scripts/        # Python scripts for SAM2 integration
│   └── server.ts       # Express server setup
├── models/             # SAM2 model weights
├── uploads/            # Uploaded videos storage
└── processing/         # Processed frames and segmentation data
```

## API Endpoints

### Health Check
- `GET /api/health` - Check the health of the API and SAM2 model

### Video Processing
- `POST /api/videos` - Upload and process a video
- `GET /api/videos` - Get all videos
- `GET /api/videos/:videoId` - Get a specific video

### Frame Navigation
- `GET /api/videos/:videoId/frames/at/:timestamp` - Get frame at specific timestamp

### Segmentation Manipulation
- `PATCH /api/videos/:videoId/frames/:frameId/segmentation` - Update segmentation
- `POST /api/videos/:videoId/frames/:frameId/masks` - Create a new mask
- `DELETE /api/videos/:videoId/frames/:frameId/masks/:maskId` - Delete a mask

### Export
- `GET /api/videos/:videoId/export` - Export processed results

## Installation

### Prerequisites

- Node.js (v14 or later)
- Python 3.8 or later
- FFmpeg

### Setup

1. Install Node.js dependencies:
   ```
   npm install
   ```

2. Set up the SAM2 model:
   ```
   chmod +x src/scripts/setup-sam2.sh
   ./src/scripts/setup-sam2.sh
   ```

3. Build the TypeScript code:
   ```
   npm run build
   ```

### Development

Run the server in development mode:
```
npm run dev
```

### Production

Build and start the server:
```
npm run build
npm start
```

## Environment Variables

- `PORT` - Port for the Express server (default: 3001)
- `NODE_ENV` - Environment (development or production)

## Integration with Frontend

The backend is designed to work with the Smart Nature Observer frontend. The API endpoints match the VideoProcessor interface required by the frontend.

For development, ensure CORS is properly configured to allow the frontend to access the backend API.

## SAM2 Model

This backend uses the Segment Anything 2 (SAM2) model from Meta AI Research. The model is integrated via Python scripts that are called by the Node.js backend.

- Repository: https://github.com/facebookresearch/sam2
- Model Weights: https://dl.fbaipublicfiles.com/segment_anything_2/sam2_l.pt