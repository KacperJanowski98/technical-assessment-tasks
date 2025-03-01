import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { VideoController } from './controllers/videoController';
import { HealthController } from './controllers/healthController';
import { VideoProcessorService } from './services/VideoProcessorService';
import { ModelService } from './services/ModelService';
import { VideoProcessorConfig } from './types';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024  // 50MB limit
  } 
});

// Initialize services
const modelService = new ModelService('SAM2', {
  modelPath: path.resolve(__dirname, '../models/sam2_l.pt'),
  pythonPath: path.resolve(__dirname, '../venv/bin/python')
});

const videoProcessorConfig: VideoProcessorConfig = {
  processingResolution: {
    width: 720,
    height: 480
  },
  outputResolution: {
    width: 1920,  // Will be overridden by actual video resolution
    height: 1080  // Will be overridden by actual video resolution
  },
  model: {
    type: 'SAM2',
    configuration: {
      modelPath: path.resolve(__dirname, '../models/sam2_l.pt')
    }
  }
};

const videoProcessorService = new VideoProcessorService(videoProcessorConfig, modelService);

// Initialize controllers
const videoController = new VideoController(videoProcessorService);
const healthController = new HealthController(modelService);

// Health check endpoint
app.get('/api/health', healthController.checkHealth);

// Video routes
app.post('/api/videos', upload.single('video'), videoController.uploadVideo);
app.get('/api/videos', videoController.getAllVideos);
app.get('/api/videos/:videoId', videoController.getVideoById);
app.get('/api/videos/:videoId/frames/at/:timestamp', videoController.getFrameAtTimestamp);
app.patch('/api/videos/:videoId/frames/:frameId/segmentation', videoController.updateSegmentation);
app.post('/api/videos/:videoId/frames/:frameId/masks', videoController.createMask);
app.delete('/api/videos/:videoId/frames/:frameId/masks/:maskId', videoController.deleteMask);
app.get('/api/videos/:videoId/export', videoController.exportResults);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve frontend static files
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  // Handle any requests that don't match the above
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API health check at http://localhost:${PORT}/api/health`);
});