import React, { useState, useEffect } from 'react';
import { Note } from '@/types';
import notesDb from '@/lib/db';

interface NotesListProps {
  onSelectNote?: (note: Note) => void;
}

const NotesList: React.FC<NotesListProps> = ({ onSelectNote }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Load notes from storage
  useEffect(() => {
    const loadedNotes = notesDb.getAllNotes();
    setNotes(loadedNotes);
  }, []);

  // Get all unique categories from notes
  const allCategories = Array.from(
    new Set(notes.flatMap(note => note.metadata.categories))
  ).sort();

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => !selectedCategory || note.metadata.categories.includes(selectedCategory))
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime();
      } else {
        return new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime();
      }
    });

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Handle note deletion
  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      notesDb.deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Your Notes</h2>
      
      {/* Filters and sorting */}
      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filter by Category
          </label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black"
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {allCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
      
      {/* Notes list */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <p className="text-lg">No notes found</p>
          <p className="text-sm mt-2">
            {notes.length === 0 
              ? 'Record your first voice note to get started!' 
              : 'Try changing your filters to see more notes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map(note => {
            // Check if it's a medical note
            const isMedicalNote = note.metadata.isMedicalNote;
            const hasMedicalCategory = note.metadata.categories.includes('Medical');
            
            return (
              <div 
                key={note.id}
                className={`p-4 border ${isMedicalNote || hasMedicalCategory 
                  ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10' 
                  : 'border-gray-200 dark:border-gray-700'} 
                  rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors`}
                onClick={() => onSelectNote && onSelectNote(note)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    {isMedicalNote && (
                      <div className="mb-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200">
                          Medical Note
                        </span>
                      </div>
                    )}
                    
                    <p className="line-clamp-2 text-gray-900 dark:text-white">
                      {note.content}
                    </p>
                    
                    <div className="mt-2 flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(note.metadata.timestamp)}
                      </span>
                      <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.floor(note.metadata.duration / 60)}:{String(note.metadata.duration % 60).padStart(2, '0')}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {note.metadata.categories.map(category => (
                        <span 
                          key={category} 
                          className={`px-2 py-1 text-xs rounded-full ${
                            category === 'Medical'
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          }`}
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete note"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotesList;