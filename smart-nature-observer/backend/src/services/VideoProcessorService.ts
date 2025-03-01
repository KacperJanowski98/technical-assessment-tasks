import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { 
  ProcessedVideoData, 
  FrameData, 
  VideoProcessorConfig,
  VideoMetadata,
  SegmentationUpdate,
  Mask,
  Point
} from '../types';
import { ModelService } from './ModelService';

export class VideoProcessorService {
  private config: VideoProcessorConfig;
  private modelService: ModelService;
  private videoStore: Map<string, VideoMetadata> = new Map();
  private frameStore: Map<string, Map<string, FrameData>> = new Map(); // videoId -> {frameId -> FrameData}

  constructor(config: VideoProcessorConfig, modelService: ModelService) {
    this.config = config;
    this.modelService = modelService;
    
    // Ensure directories exist
    this.ensureDirectoriesExist();
  }

  private async ensureDirectoriesExist() {
    const dirs = [
      path.resolve(__dirname, '../../uploads'),
      path.resolve(__dirname, '../../processing')
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Error creating directory ${dir}:`, error);
      }
    }
  }

  public async processVideo(file: Express.Multer.File): Promise<ProcessedVideoData> {
    // Generate unique ID for the video
    const videoId = uuidv4();
    
    // Create paths for the original and processed videos
    const originalPath = path.join(__dirname, '../../uploads', `${videoId}_original${path.extname(file.originalname)}`);
    const processingPath = path.join(__dirname, '../../processing', `${videoId}`);
    
    try {
      // Ensure processing directory exists
      await fs.mkdir(processingPath, { recursive: true });
      
      // Save the uploaded file
      await fs.writeFile(originalPath, file.buffer);
      
      // Get video metadata
      const metadata = await this.getVideoMetadata(originalPath);
      
      // Create video metadata object
      const videoMetadata: VideoMetadata = {
        id: videoId,
        filename: file.originalname,
        originalPath,
        processingPath,
        duration: metadata.duration,
        resolution: {
          width: metadata.width,
          height: metadata.height
        },
        fps: metadata.fps,
        createdAt: new Date(),
        status: 'processing'
      };
      
      // Store the metadata
      this.videoStore.set(videoId, videoMetadata);
      
      // Initialize frame store for this video
      this.frameStore.set(videoId, new Map());
      
      // Extract frames asynchronously
      this.extractFrames(videoId, originalPath, processingPath, metadata)
        .catch(error => {
          console.error(`Error extracting frames for video ${videoId}:`, error);
          const metadata = this.videoStore.get(videoId);
          if (metadata) {
            metadata.status = 'error';
            metadata.errorMessage = `Error extracting frames: ${error instanceof Error ? error.message : 'Unknown error'}`;
            this.videoStore.set(videoId, metadata);
          }
        });
      
      // Return processed video data with empty frames for now
      // Frames will be populated as they are processed
      return {
        id: videoId,
        frames: [],
        metadata: {
          duration: metadata.duration,
          resolution: {
            width: metadata.width,
            height: metadata.height
          },
          fps: metadata.fps
        }
      };
    } catch (error: any) {
      console.error(`Error processing video ${videoId}:`, error);
      
      // Update video status to error
      const metadata = this.videoStore.get(videoId);
      if (metadata) {
        metadata.status = 'error';
        metadata.errorMessage = `Error processing video: ${error?.message || 'Unknown error'}`;
        this.videoStore.set(videoId, metadata);
      }
      
      throw new Error(`Failed to process video: ${error?.message || 'Unknown error'}`);
    }
  }

  private async getVideoMetadata(filePath: string): Promise<{ duration: number; width: number; height: number; fps: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        if (!videoStream) {
          return reject(new Error('No video stream found'));
        }
        
        // Parse fps from string like '30/1'
        let fps = 30; // Default
        if (videoStream.r_frame_rate) {
          const [numerator, denominator] = videoStream.r_frame_rate.split('/').map(Number);
          if (denominator && denominator !== 0) {
            fps = numerator / denominator;
          }
        }
        
        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps
        });
      });
    });
  }

  private async extractFrames(videoId: string, originalPath: string, processingPath: string, metadata: { duration: number; width: number; height: number; fps: number }): Promise<void> {
    try {
      // Calculate total frames based on duration and fps
      const totalFrames = Math.ceil(metadata.duration * metadata.fps);
      
      // Extract a frame every second for processing
      // This is a simplified approach - in a real app, you might want more frames
      const frameInterval = 1; // 1 second
      
      for (let second = 0; second < metadata.duration; second += frameInterval) {
        const timestamp = second;
        const frameId = `${videoId}_${timestamp}`;
        const outputPath = path.join(processingPath, `frame_${timestamp}.jpg`);
        
        // Extract frame using ffmpeg
        await this.extractFrameAt(originalPath, timestamp, outputPath, this.config.processingResolution);
        
        // Process frame with SAM2 model
        const segmentation = await this.modelService.processFrame(outputPath);
        
        // Create thumbnail (in a real app, you might want to resize this)
        const thumbnailBase64 = await this.createThumbnail(outputPath);
        
        // Create frame data
        const frameData: FrameData = {
          id: frameId,
          timestamp: timestamp,
          segmentation,
          thumbnail: thumbnailBase64,
          imagePath: outputPath
        };
        
        // Store frame data
        const frameStore = this.frameStore.get(videoId);
        if (frameStore) {
          frameStore.set(frameId, frameData);
        }
      }
      
      // Update video status to ready
      const videoMetadata = this.videoStore.get(videoId);
      if (videoMetadata) {
        videoMetadata.status = 'ready';
        this.videoStore.set(videoId, videoMetadata);
      }
    } catch (error: any) {
      console.error(`Error extracting frames for video ${videoId}:`, error);
      const metadata = this.videoStore.get(videoId);
      if (metadata) {
        metadata.status = 'error';
        metadata.errorMessage = `Error extracting frames: ${error?.message || 'Unknown error'}`;
        this.videoStore.set(videoId, metadata);
      }
      throw error;
    }
  }

  private extractFrameAt(videoPath: string, timestamp: number, outputPath: string, resolution: { width: number; height: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: `${resolution.width}x${resolution.height}`
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });
  }

  private async createThumbnail(imagePath: string): Promise<string> {
    // Read image and convert to base64
    const imageBuffer = await fs.readFile(imagePath);
    return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  }

  public async getProcessedVideo(videoId: string): Promise<ProcessedVideoData | null> {
    const metadata = this.videoStore.get(videoId);
    if (!metadata) {
      return null;
    }
    
    const frameStore = this.frameStore.get(videoId);
    if (!frameStore) {
      return null;
    }
    
    // Convert Map to array and sort by timestamp
    const frames = Array.from(frameStore.values()).sort((a, b) => a.timestamp - b.timestamp);
    
    return {
      id: videoId,
      frames,
      metadata: {
        duration: metadata.duration,
        resolution: metadata.resolution,
        fps: metadata.fps
      }
    };
  }

  public async extractFrame(videoId: string, timestamp: number): Promise<FrameData | null> {
    const videoMetadata = this.videoStore.get(videoId);
    if (!videoMetadata) {
      throw new Error(`Video with ID ${videoId} not found`);
    }
    
    const frameStore = this.frameStore.get(videoId);
    if (!frameStore) {
      throw new Error(`Frame store for video ${videoId} not found`);
    }
    
    // First, check if we already have a frame at this exact timestamp
    const frameId = `${videoId}_${timestamp}`;
    let frame = frameStore.get(frameId);
    
    if (frame) {
      return frame;
    }
    
    // If not, find the closest frame
    const frames = Array.from(frameStore.values());
    if (frames.length === 0) {
      throw new Error(`No frames available for video ${videoId}`);
    }
    
    // Sort frames by timestamp
    frames.sort((a, b) => a.timestamp - b.timestamp);
    
    // Find the closest frame
    let closestFrame = frames[0];
    let minDiff = Math.abs(closestFrame.timestamp - timestamp);
    
    for (const frame of frames) {
      const diff = Math.abs(frame.timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestFrame = frame;
      }
    }
    
    return closestFrame;
  }

  public async updateSegmentation(videoId: string, frameId: string, updates: SegmentationUpdate): Promise<void> {
    const frameStore = this.frameStore.get(videoId);
    if (!frameStore) {
      throw new Error(`Frame store for video ${videoId} not found`);
    }
    
    const frame = frameStore.get(frameId);
    if (!frame) {
      throw new Error(`Frame ${frameId} not found for video ${videoId}`);
    }
    
    // Update masks
    if (updates.masks) {
      for (const maskUpdate of updates.masks) {
        const maskIndex = frame.segmentation.masks.findIndex(mask => mask.id === maskUpdate.id);
        if (maskIndex !== -1) {
          frame.segmentation.masks[maskIndex] = {
            ...frame.segmentation.masks[maskIndex],
            ...maskUpdate.updates
          };
        }
      }
    }
    
    // Update labels
    if (updates.labels) {
      for (const labelUpdate of updates.labels) {
        const labelIndex = frame.segmentation.labels.findIndex(label => label.id === labelUpdate.id);
        if (labelIndex !== -1) {
          frame.segmentation.labels[labelIndex] = {
            ...frame.segmentation.labels[labelIndex],
            ...labelUpdate.updates
          };
        }
      }
    }
    
    // Save updated frame
    frameStore.set(frameId, frame);
  }

  public async createMask(videoId: string, frameId: string, points: Point[]): Promise<string> {
    const frameStore = this.frameStore.get(videoId);
    if (!frameStore) {
      throw new Error(`Frame store for video ${videoId} not found`);
    }
    
    const frame = frameStore.get(frameId);
    if (!frame) {
      throw new Error(`Frame ${frameId} not found for video ${videoId}`);
    }
    
    // Generate mask ID
    const maskId = uuidv4();
    
    // If we have a frame image, use the model to generate a mask from the points
    if (frame.imagePath) {
      const newMask = await this.modelService.createMaskFromPoints(frame.imagePath, points);
      newMask.id = maskId;
      
      // Add the new mask to the frame
      frame.segmentation.masks.push(newMask);
      frameStore.set(frameId, frame);
      
      return maskId;
    } else {
      // If we don't have a frame image, create a simple mask with just the points
      const newMask: Mask = {
        id: maskId,
        points,
        visible: true
      };
      
      frame.segmentation.masks.push(newMask);
      frameStore.set(frameId, frame);
      
      return maskId;
    }
  }

  public async deleteMask(videoId: string, frameId: string, maskId: string): Promise<void> {
    const frameStore = this.frameStore.get(videoId);
    if (!frameStore) {
      throw new Error(`Frame store for video ${videoId} not found`);
    }
    
    const frame = frameStore.get(frameId);
    if (!frame) {
      throw new Error(`Frame ${frameId} not found for video ${videoId}`);
    }
    
    // Remove the mask
    frame.segmentation.masks = frame.segmentation.masks.filter(mask => mask.id !== maskId);
    
    // Remove the mask ID from any labels
    for (const label of frame.segmentation.labels) {
      label.maskIds = label.maskIds.filter(id => id !== maskId);
    }
    
    // Save updated frame
    frameStore.set(frameId, frame);
  }

  public async getVideoMetadataById(videoId: string): Promise<VideoMetadata | null> {
    return this.videoStore.get(videoId) || null;
  }

  public async getAllVideos(): Promise<VideoMetadata[]> {
    return Array.from(this.videoStore.values());
  }
}