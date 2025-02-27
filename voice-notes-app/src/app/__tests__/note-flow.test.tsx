// src/app/__tests__/note-flow.test.tsx
import { render, act } from '@testing-library/react';
import Home from '../page';
import notesDb from '@/lib/db';
import VoiceRecorder from '@/components/VoiceRecorder';

// Mock modules
jest.mock('@/lib/db', () => ({
  saveNote: jest.fn((note) => ({ id: 'test-note-id', ...note })),
  getAllNotes: jest.fn(() => []),
  updateNote: jest.fn(),
}));

jest.mock('@/lib/ai', () => ({
  analyzeContent: jest.fn().mockResolvedValue({
    categories: ['Badanie', 'Diagnoza'],
    sentiment: 0,
    actionItems: [],
    suggestedTags: ['Gorączka', 'Antybiotyk'],
    medicalSections: {
      Wywiad: ['Pacjent skarży się na kaszel od 3 dni'],
      Badanie: ['Pacjent ma gorączkę 38.5°C', 'Osłuchowo słyszalne świsty'],
      Diagnoza: ['Rozpoznanie: zapalenie oskrzeli'],
      Zalecenia: ['Zalecam antybiotyk'],
      Kontekst: [],
    },
    isMedicalNote: true
  }),
}));

// Mock the VoiceRecorder component to capture its props
jest.mock('@/components/VoiceRecorder', () => {
  return jest.fn(props => {
    // Store the props so we can access them in the test
    (VoiceRecorder as any).mockProps = props;
    return <div data-testid="voice-recorder-mock">Voice Recorder Mock</div>;
  });
});

describe('Medical note content categorization', () => {
  const sampleMedicalText = 'Pacjent ma gorączkę 38.5°C. Osłuchowo słyszalne świsty. Rozpoznanie: zapalenie oskrzeli. Zalecam antybiotyk.';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handleTranscriptionComplete should create a note with medical sections', async () => {
    // Render the Home component
    render(<Home />);
    
    // Verify the VoiceRecorder component was rendered with the correct props
    expect(VoiceRecorder).toHaveBeenCalled();
    
    // Access the onTranscriptionComplete callback that was passed to VoiceRecorder
    const { onTranscriptionComplete } = (VoiceRecorder as any).mockProps;
    expect(onTranscriptionComplete).toBeDefined();
    
    // Call the callback with our sample text
    await act(async () => {
      await onTranscriptionComplete(sampleMedicalText);
    });
    
    // Verify the note was saved with medical sections
    expect(notesDb.saveNote).toHaveBeenCalled();
    
    // Check that the saved note has the expected structure
    const savedNote = (notesDb.saveNote as jest.Mock).mock.calls[0][0];
    expect(savedNote.content).toBe(sampleMedicalText);
    expect(savedNote.metadata.isMedicalNote).toBe(true);
    expect(savedNote.metadata.medicalSections).toBeDefined();
    expect(savedNote.metadata.medicalSections.Badanie).toContain('Pacjent ma gorączkę 38.5°C');
  });
});
