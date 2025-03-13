import { analyzeContent } from '../ai';
import { MedicalSection, SECTION_KEYWORDS } from '@/types';

// Helper function to access the internal classifyVetContent function
// (You may need to export this function from ai.ts to test it directly)
const mockClassifyVetContent = (text: string): Record<MedicalSection, string[]> => {
  // Initialize with empty arrays
  const sections: Record<MedicalSection, string[]> = {
    Wywiad: [],
    Badanie: [],
    Diagnoza: [],
    Zalecenia: [],
    Kontekst: [],
  };

  // Split text into sentences or lines
  const lines = text
    .split(/[.!?]\s+|\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Classify each line
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    // Find the most relevant section based on keywords
    let assignedSection: MedicalSection = 'Wywiad'; // Default
    let maxMatches = 0;
    
    Object.entries(SECTION_KEYWORDS).forEach(([section, keywords]) => {
      const matches = keywords.filter(keyword => lowerLine.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        assignedSection = section as MedicalSection;
      }
    });
    
    // Add the line to the assigned section
    sections[assignedSection].push(line);
  });

  return sections;
};

describe('Medical note classification', () => {
  // Test sample texts for each section
  const badanieText = 'Pacjent wykazuje podwyższoną temperaturę. Osłuchowo stwierdzone świsty w oskrzelach.';
  const diagnozaText = 'Rozpoznanie: zapalenie oskrzeli. Podejrzewam alergię na pyłki traw.';
  const zaleceniaText = 'Zalecam przyjmowanie antybiotyku dwa razy dziennie. Kontrola za tydzień.';
  const kontekstText = 'Pacjent mieszka w domu z kotem. W rodzinie występują alergie.';
  const wywiadText = 'Pacjent zgłasza kaszel od dwóch tygodni. Wcześniej nie chorował.';

  // Combined text with multiple sections
  const combinedText = `${badanieText} ${diagnozaText} ${zaleceniaText} ${kontekstText} ${wywiadText}`;

  test('should classify "Badanie" text correctly', async () => {
    const sections = mockClassifyVetContent(badanieText);
    expect(sections.Badanie.length).toBeGreaterThan(0);
    expect(sections.Badanie.join(' ').toLowerCase()).toContain('temperaturę');
    expect(sections.Badanie.join(' ').toLowerCase()).toContain('osłuchowo');
  });
  
  test('should classify "Diagnoza" text correctly', async () => {
    const sections = mockClassifyVetContent(diagnozaText);
    expect(sections.Diagnoza.length).toBeGreaterThan(0);
    expect(sections.Diagnoza.join(' ').toLowerCase()).toContain('rozpoznanie');
    expect(sections.Diagnoza.join(' ').toLowerCase()).toContain('podejrzewam');
  });
  
  test('should classify "Zalecenia" text correctly', async () => {
    const sections = mockClassifyVetContent(zaleceniaText);
    expect(sections.Zalecenia.length).toBeGreaterThan(0);
    expect(sections.Zalecenia.join(' ').toLowerCase()).toContain('zalecam');
    expect(sections.Zalecenia.join(' ').toLowerCase()).toContain('kontrola');
  });

  test('should classify "Kontekst" text correctly', async () => {
    const sections = mockClassifyVetContent(kontekstText);
    expect(sections.Kontekst.length).toBeGreaterThan(0);
    expect(sections.Kontekst.join(' ').toLowerCase()).toContain('rodzinie');
    expect(sections.Kontekst.join(' ').toLowerCase()).toContain('domu');
  });

  test('should classify "Wywiad" text correctly', async () => {
    const sections = mockClassifyVetContent(wywiadText);
    expect(sections.Wywiad.length).toBeGreaterThan(0);
  });

  test('should classify a mixed text into appropriate sections', async () => {
    const sections = mockClassifyVetContent(combinedText);
    
    // Check all sections have content
    expect(sections.Badanie.length).toBeGreaterThan(0);
    expect(sections.Diagnoza.length).toBeGreaterThan(0);
    expect(sections.Zalecenia.length).toBeGreaterThan(0);
    expect(sections.Kontekst.length).toBeGreaterThan(0);
    
    // Verify specific content in each section
    expect(sections.Badanie.some(line => line.includes('temperaturę'))).toBeTruthy();
    expect(sections.Diagnoza.some(line => line.includes('Rozpoznanie'))).toBeTruthy();
    expect(sections.Zalecenia.some(line => line.includes('Zalecam'))).toBeTruthy();
    expect(sections.Kontekst.some(line => line.includes('rodzinie'))).toBeTruthy();
  });

  test('analyzeContent should include medical sections and flag', async () => {
    const analysis = await analyzeContent(combinedText);
    
    // Check the analysis result has medical sections
    expect(analysis.medicalSections).toBeDefined();
    expect(analysis.isMedicalNote).toBe(true);
    
    // Verify sections are populated as expected
    expect(analysis.medicalSections!.Badanie.length).toBeGreaterThan(0);
    expect(analysis.medicalSections!.Diagnoza.length).toBeGreaterThan(0);
    expect(analysis.medicalSections!.Zalecenia.length).toBeGreaterThan(0);
    expect(analysis.medicalSections!.Kontekst.length).toBeGreaterThan(0);
  });
});
