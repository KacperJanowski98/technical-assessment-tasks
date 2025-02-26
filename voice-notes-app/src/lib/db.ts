import { Note } from '@/types';

// Storage key for local storage
const STORAGE_KEY = 'voice-notes-data';

/**
 * Client-side storage for notes
 * In a production app, this would connect to a real database
 */
export const notesDb = {
  /**
   * Get all notes
   */
  getAllNotes: (): Note[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const notesJson = localStorage.getItem(STORAGE_KEY);
      if (!notesJson) return [];
      
      const notes = JSON.parse(notesJson) as Note[];
      
      // Convert ISO strings back to Date objects
      return notes.map(note => ({
        ...note,
        metadata: {
          ...note.metadata,
          timestamp: new Date(note.metadata.timestamp),
          actionItems: note.metadata.actionItems?.map(item => ({
            ...item,
            dueDate: item.dueDate ? new Date(item.dueDate) : undefined
          }))
        },
        exports: note.exports.map(exp => ({
          ...exp,
          exportedAt: exp.exportedAt ? new Date(exp.exportedAt) : undefined
        }))
      }));
    } catch (error) {
      console.error('Error retrieving notes from localStorage:', error);
      return [];
    }
  },
  
  /**
   * Get note by ID
   */
  getNoteById: (id: string): Note | null => {
    const notes = notesDb.getAllNotes();
    return notes.find(note => note.id === id) || null;
  },
  
  /**
   * Save a new note
   */
  saveNote: (note: Omit<Note, 'id'>): Note => {
    const notes = notesDb.getAllNotes();
    
    // Generate a unique ID
    const id = `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the new note with ID
    const newNote: Note = {
      ...note,
      id
    };
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...notes, newNote]));
    
    return newNote;
  },
  
  /**
   * Update an existing note
   */
  updateNote: (id: string, updates: Partial<Note>): Note | null => {
    const notes = notesDb.getAllNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) return null;
    
    // Create updated note
    const updatedNote = {
      ...notes[noteIndex],
      ...updates,
      metadata: {
        ...notes[noteIndex].metadata,
        ...(updates.metadata || {})
      }
    };
    
    // Update the notes array
    notes[noteIndex] = updatedNote;
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    
    return updatedNote;
  },
  
  /**
   * Delete a note
   */
  deleteNote: (id: string): boolean => {
    const notes = notesDb.getAllNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteIndex === -1) return false;
    
    // Remove the note
    notes.splice(noteIndex, 1);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    
    return true;
  },
  
  /**
   * Clear all notes (for testing/reset)
   */
  clearAllNotes: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export default notesDb;