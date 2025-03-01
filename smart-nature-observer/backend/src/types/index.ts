// Types matching the VideoProcessor interface from the frontend

export interface Point {
  x: number;
  y: number;
}

export interface Mask {
  id: string;
  points: Point[];
  color?: string;
  label?: string;
  visible?: boolean;
}

export interface Label {
  id: string;
  name: string;
  maskIds: string[];
}

export interface FrameData {
  id: string;
  timestamp: number;
  segmentation: {
    masks: Mask[];
    labels: Label[];
    confidence: number[];
  };
  thumbnail: string; // Base64 for filmroll
  imagePath?: string; // Path to the extracted frame image
}

export interface ProcessedVideoData {
  id: string;
  frames: FrameData[];
  metadata: {
    duration: number;
    resolution: {
      width: number;
      height: number;
    };
    fps: number;
  };
}

export interface VideoProcessorConfig {
  processingResolution: {
    width: number;
    height: number;
  };
  outputResolution: {
    width: number;
    height: number;
  };
  model: {
    type: 'SAM2' | 'other';
    configuration: Record<string, any>;
  };
}

export interface SegmentationUpdate {
  masks?: {
    id: string;
    updates: Partial<Mask>;
  }[];
  labels?: {
    id: string;
    updates: Partial<Label>;
  }[];
}

export interface VideoMetadata {
  id: string;
  filename: string;
  originalPath: string;
  processingPath: string;
  duration: number;
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
  createdAt: Date;
  status: 'processing' | 'ready' | 'error';
  errorMessage?: string;
}

export interface ModelHealth {
  status: 'operational' | 'degraded' | 'unavailable';
  message: string;
  latency?: number;
}