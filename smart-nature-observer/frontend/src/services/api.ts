import axios from 'axios';
import { Video, Frame, Point, Mask } from '../types';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API endpoints for videos
export const getHealthStatus = async (): Promise<{ api: { status: string }, model: { status: string } }> => {
  const response = await api.get('/health');
  return response.data;
};

export const uploadVideo = async (file: File): Promise<Video> => {
  const formData = new FormData();
  formData.append('video', file);
  
  const response = await axios.post(`${API_URL}/videos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

export const getAllVideos = async (): Promise<Video[]> => {
  const response = await api.get('/videos');
  return response.data;
};

export const getVideoById = async (videoId: string): Promise<Video> => {
  const response = await api.get(`/videos/${videoId}`);
  
  // Convert metadata structure if needed
  const data = response.data;
  
  // Make sure we have proper structure
  if (data) {
    // Add title from filename if not present
    if (!data.title && data.metadata && data.metadata.filename) {
      data.title = data.metadata.filename;
    }
    
    // Extract resolution from metadata if needed
    if (!data.resolution && data.metadata && data.metadata.resolution) {
      data.resolution = data.metadata.resolution;
    }
    
    // Make sure frames have proper structure
    if (data.frames) {
      data.frames = data.frames.map((frame: any) => {
        if (!frame.segmentation) {
          frame.segmentation = { masks: [] };
        }
        if (!frame.segmentation.masks) {
          frame.segmentation.masks = [];
        }
        return frame;
      });
    }
  }
  
  return data;
};

export const getFrameAtTimestamp = async (videoId: string, timestamp: number): Promise<Frame> => {
  const response = await api.get(`/videos/${videoId}/frames/at/${timestamp}`);
  return response.data;
};

export const updateSegmentation = async (
  videoId: string,
  frameId: string,
  segmentation: {
    masks: Mask[]
  }
): Promise<Frame> => {
  const response = await api.patch(
    `/videos/${videoId}/frames/${frameId}/segmentation`,
    { segmentation }
  );
  return response.data;
};

export const createMask = async (
  videoId: string,
  frameId: string,
  points: Point[]
): Promise<Mask> => {
  const response = await api.post(
    `/videos/${videoId}/frames/${frameId}/masks`,
    { points }
  );
  return response.data;
};

export const deleteMask = async (
  videoId: string,
  frameId: string,
  maskId: string
): Promise<void> => {
  await api.delete(`/videos/${videoId}/frames/${frameId}/masks/${maskId}`);
};

export const exportResults = async (videoId: string): Promise<Blob> => {
  const response = await api.get(`/videos/${videoId}/export`, {
    responseType: 'blob'
  });
  return response.data;
};