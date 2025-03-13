// src/types/index.ts
import { MedicalSection } from './medical';

// Note model
export interface Note {
  id: string;
  content: string;
  audioUrl?: string;
  metadata: {
    timestamp: Date;
    duration: number;
    categories: string[];
    confidence: number;
    actionItems?: ActionItem[];
    medicalSections?: Record<MedicalSection, string[]>; // Added medical sections
    isMedicalNote?: boolean; // Flag to identify medical notes
  };
  exports: NoteExport[];
}

export interface ActionItem {
  type: 'task' | 'event' | 'reminder';
  content: string;
  dueDate?: Date;
  priority: number;
}

export interface NoteExport {
  targetSystem: 'calendar' | 'todoist' | 'notion';
  status: 'pending' | 'exported' | 'failed';
  exportedAt?: Date;
}

// AI Analysis
export interface ContentAnalysis {
  categories: string[];
  sentiment: number;
  actionItems: {
    type: string;
    content: string;
    suggestedPriority: number;
  }[];
  suggestedTags: string[];
  medicalSections?: Record<MedicalSection, string[]>; // Added medical sections
  isMedicalNote?: boolean; // Flag to identify medical notes
}

// API Responses
export interface TranscriptionResult {
  success: boolean;
  data?: {
    rawText: string;
  };
  error?: {
    message: string;
    code: string;
    details?: Record<string, any>;
  };
}

// Re-export medical types
export * from './medical';
