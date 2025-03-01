import { Request, Response } from 'express';
import { VideoProcessorService } from '../services/VideoProcessorService';
import { SegmentationUpdate, Point } from '../types';

export class VideoController {
  private videoProcessorService: VideoProcessorService;
  
  constructor(videoProcessorService: VideoProcessorService) {
    this.videoProcessorService = videoProcessorService;
  }
  
  // Upload and process a video
  public uploadVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No video file provided' });
        return;
      }
      
      const processedVideo = await this.videoProcessorService.processVideo(req.file);
      
      res.status(200).json(processedVideo);
    } catch (error: any) {
      console.error('Error uploading video:', error);
      res.status(500).json({ error: `Failed to upload video: ${error?.message || 'Unknown error'}` });
    }
  };
  
  // Get all videos
  public getAllVideos = async (req: Request, res: Response): Promise<void> => {
    try {
      const videos = await this.videoProcessorService.getAllVideos();
      
      res.status(200).json(videos);
    } catch (error: any) {
      console.error('Error getting all videos:', error);
      res.status(500).json({ error: `Failed to get videos: ${error?.message || 'Unknown error'}` });
    }
  };
  
  // Get a specific video
  public getVideoById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId } = req.params;
      
      const video = await this.videoProcessorService.getProcessedVideo(videoId);
      
      if (!video) {
        res.status(404).json({ error: `Video with ID ${videoId} not found` });
        return;
      }
      
      res.status(200).json(video);
    } catch (error: any) {
      console.error(`Error getting video ${req.params.videoId}:`, error);
      res.status(500).json({ error: `Failed to get video: ${error?.message || 'Unknown error'}` });
    }
  };
  
  // Get frame at specific timestamp
  public getFrameAtTimestamp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId, timestamp } = req.params;
      
      const frame = await this.videoProcessorService.extractFrame(videoId, parseFloat(timestamp));
      
      if (!frame) {
        res.status(404).json({ error: `Frame at timestamp ${timestamp} not found for video ${videoId}` });
        return;
      }
      
      res.status(200).json(frame);
    } catch (error: any) {
      console.error(`Error getting frame at timestamp ${req.params.timestamp}:`, error);
      res.status(500).json({ error: `Failed to get frame: ${error?.message || 'Unknown error'}` });
    }
  };
  
  // Update segmentation
  public updateSegmentation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId, frameId } = req.params;
      const updates: SegmentationUpdate = req.body;
      
      await this.videoProcessorService.updateSegmentation(videoId, frameId, updates);
      
      res.status(200).json({ message: 'Segmentation updated successfully' });
    } catch (error: any) {
      console.error(`Error updating segmentation for frame ${req.params.frameId}:`, error);
      res.status(500).json({ error: `Failed to update segmentation: ${error?.message || 'Unknown error'}` });
    }
  };
  
  // Create mask
  public createMask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId, frameId } = req.params;
      const points: Point[] = req.body.points;
      
      if (!Array.isArray(points) || points.length === 0) {
        res.status(400).json({ error: 'Points array is required' });
        return;
      }
      
      const maskId = await this.videoProcessorService.createMask(videoId, frameId, points);
      
      res.status(201).json({ maskId });
    } catch (error: any) {
      console.error(`Error creating mask for frame ${req.params.frameId}:`, error);
      res.status(500).json({ error: `Failed to create mask: ${error?.message || 'Unknown error'}` });
    }
  };
  
  // Delete mask
  public deleteMask = async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId, frameId, maskId } = req.params;
      
      await this.videoProcessorService.deleteMask(videoId, frameId, maskId);
      
      res.status(200).json({ message: 'Mask deleted successfully' });
    } catch (error: any) {
      console.error(`Error deleting mask ${req.params.maskId}:`, error);
      res.status(500).json({ error: `Failed to delete mask: ${error?.message || 'Unknown error'}` });
    }
  };
  
  // Export processed results
  public exportResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId } = req.params;
      
      const video = await this.videoProcessorService.getProcessedVideo(videoId);
      
      if (!video) {
        res.status(404).json({ error: `Video with ID ${videoId} not found` });
        return;
      }
      
      // In a real implementation, you'd want to generate an export file
      // For this prototype, we'll just return the processed data
      
      res.status(200).json({
        id: video.id,
        metadata: video.metadata,
        frames: video.frames.map(frame => ({
          id: frame.id,
          timestamp: frame.timestamp,
          segmentation: frame.segmentation
        }))
      });
    } catch (error: any) {
      console.error(`Error exporting results for video ${req.params.videoId}:`, error);
      res.status(500).json({ error: `Failed to export results: ${error?.message || 'Unknown error'}` });
    }
  };
}