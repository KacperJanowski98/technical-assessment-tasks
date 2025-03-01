export interface Point {
  x: number;
  y: number;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface Mask {
  id: string;
  points: Point[];
  visible: boolean;
  label?: string;
  color?: string;
}

export interface Segmentation {
  masks: Mask[];
  labels?: string[];
}

export interface Frame {
  id: string;
  timestamp: number;
  thumbnail: string;
  segmentation: Segmentation;
}

export interface VideoMetadata {
  id: string;
  filename: string;
  duration: number;
  resolution: Resolution;
  fps: number;
  status: string;
  createdAt: string;
}

export interface Video {
  id: string;
  title?: string;
  filename?: string;
  duration: number;
  resolution: Resolution;
  fps: number;
  frames?: Frame[];
  processingStatus?: 'pending' | 'processing' | 'complete' | 'error';
  status?: string;
  createdAt?: string;
}

export interface CanvasEditorProps {
  frame: Frame;
  originalResolution: Resolution;
  displayResolution: Resolution;
  onUpdateMask: (frameId: string, maskId: string, points: Point[]) => void;
  onCreateMask: (frameId: string, points: Point[]) => void;
  onDeleteMask: (frameId: string, maskId: string) => void;
  onToggleMaskVisibility: (frameId: string, maskId: string) => void;
}

export interface VideoProcessorProps {
  video: Video;
  onFrameSelect: (frameId: string) => void;
  selectedFrameId?: string;
}

export interface ResolutionManagerProps {
  originalResolution: Resolution;
  processingResolution: Resolution;
  displayResolution: Resolution;
  onDisplayResolutionChange: (resolution: Resolution) => void;
}