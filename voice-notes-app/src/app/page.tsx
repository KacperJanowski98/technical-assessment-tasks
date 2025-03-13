'use client';

import React, { useState, useEffect } from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import NotesList from '@/components/NotesList';
import NoteDetail from '@/components/NoteDetail';
import ServerHealthCheck from '@/components/ServerHealthCheck';
import { analyzeContent } from '@/lib/ai';
import notesDb from '@/lib/db';
import { Note } from '@/types';

export default function Home() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load notes on initial render
  useEffect(() => {
    const loadNotes = () => {
      const storedNotes = notesDb.getAllNotes();
      setNotes(storedNotes);
    };

    loadNotes();
  }, []);

  const handleTranscriptionComplete = async (text: string) => {
    setIsLoading(true);
    try {
      // Analyze content with AI
      const analysis = await analyzeContent(text);
      
      // Create a new note
      const newNote: Omit<Note, 'id'> = {
        content: text,
        metadata: {
          timestamp: new Date(),
          duration: 60, // Placeholder - should come from recording time
          categories: analysis.categories,
          confidence: 0.8, // Placeholder
          actionItems: analysis.actionItems.map(item => ({
            type: item.type as 'task' | 'event' | 'reminder',
            content: item.content,
            priority: item.suggestedPriority
          })),
          // Add the medical sections from the analysis
          medicalSections: analysis.medicalSections,
          // Add the flag to identify medical notes
          isMedicalNote: analysis.isMedicalNote
        },
        exports: []
      };
      
      // Save the note
      const savedNote = notesDb.saveNote(newNote);
      
      // Update the notes list
      setNotes(prev => [savedNote, ...prev]);
      
    } catch (error) {
      console.error('Error processing transcription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteUpdate = (updatedNote: Note) => {
    setNotes(prev => 
      prev.map(note => note.id === updatedNote.id ? updatedNote : note)
    );
    setSelectedNote(updatedNote);
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Smart Voice Notes Organizer</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1">
          <div className="space-y-8">
            <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
            <ServerHealthCheck />
          </div>
        </div>
        
        <div className="col-span-1 lg:col-span-2">
          <NotesList 
            onSelectNote={setSelectedNote} 
          />
        </div>
      </div>
      
      {selectedNote && (
        <NoteDetail 
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onUpdate={handleNoteUpdate}
        />
      )}
      
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
            <p className="text-lg">Processing your note...</p>
          </div>
        </div>
      )}
    </main>
  );
}