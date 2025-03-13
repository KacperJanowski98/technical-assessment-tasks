// src/components/__tests__/MedicalNoteView.test.tsx
import { render, screen } from '@testing-library/react';
import MedicalNoteView from '../MedicalNoteView';
import { MedicalSection } from '@/types';
import '@testing-library/jest-dom';

describe('MedicalNoteView', () => {
  const sampleSections: Record<MedicalSection, string[]> = {
    Wywiad: ['Pacjent skarży się na kaszel od 3 dni'],
    Badanie: ['Pacjent ma gorączkę 38.5°C', 'Osłuchowo słyszalne świsty'],
    Diagnoza: ['Rozpoznanie: zapalenie oskrzeli'],
    Zalecenia: ['Zalecam antybiotyk'],
    Kontekst: [],
  };

  test('renders all sections correctly', () => {
    render(<MedicalNoteView sections={sampleSections} />);
    
    // Check if the component renders the heading
    expect(screen.getByText('Medical Note Sections')).toBeInTheDocument();
    
    // Check if all non-empty sections are displayed
    expect(screen.getByText('Wywiad')).toBeInTheDocument();
    expect(screen.getByText('Badanie')).toBeInTheDocument();
    expect(screen.getByText('Diagnoza')).toBeInTheDocument();
    expect(screen.getByText('Zalecenia')).toBeInTheDocument();
    
    // Check if the context section is not displayed (as it's empty)
    expect(screen.queryByText('Kontekst')).not.toBeInTheDocument();
    
    // Check if the content of each section is displayed
    expect(screen.getByText('Pacjent skarży się na kaszel od 3 dni')).toBeInTheDocument();
    expect(screen.getByText('Pacjent ma gorączkę 38.5°C')).toBeInTheDocument();
    expect(screen.getByText('Osłuchowo słyszalne świsty')).toBeInTheDocument();
    expect(screen.getByText('Rozpoznanie: zapalenie oskrzeli')).toBeInTheDocument();
    expect(screen.getByText('Zalecam antybiotyk')).toBeInTheDocument();
  });
});
