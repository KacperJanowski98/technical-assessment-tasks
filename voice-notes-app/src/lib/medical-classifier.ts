import { ContentAnalysis, MedicalSection, SECTION_KEYWORDS } from '@/types';

/**
 * Analyzes text content and classifies it into medical sections
 * based on keywords defined in SECTION_KEYWORDS
 */
export function classifyMedicalContent(text: string): Record<MedicalSection, string[]> {
  // Initialize all sections with empty arrays
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
    
    // Find the most relevant section for this line based on keywords
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
}

/**
 * Enhances the standard content analysis with medical section classification
 */
export function enhanceWithMedicalClassification(
  analysis: ContentAnalysis, 
  text: string
): ContentAnalysis {
  // Detect if this is likely a medical note
  const isMedicalNote = detectIfMedicalNote(text);
  
  if (isMedicalNote) {
    // Classify content into medical sections
    const medicalSections = classifyMedicalContent(text);
    
    // Add medical categories to the existing categories if needed
    const enhancedCategories = [...analysis.categories];
    if (!enhancedCategories.includes('Medical')) {
      enhancedCategories.push('Medical');
    }
    
    // Return enhanced analysis
    return {
      ...analysis,
      categories: enhancedCategories,
      medicalSections,
      isMedicalNote
    };
  }
  
  // Return original analysis if not a medical note
  return analysis;
}

/**
 * Detect if the text is likely to be a medical note
 * based on keyword frequency and patterns
 */
function detectIfMedicalNote(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Check for common medical terms
  const medicalTerms = [
    'pacjent', 'diagnoza', 'badanie', 'leczenie', 'zalecenia',
    'objawy', 'wywiad', 'lek', 'recepta', 'dawkowanie',
    'choroba', 'medycyna', 'lekarz', 'szpital', 'przychodnia',
    'osłuchowo', 'palpacyjnie'
  ];
  
  // Count how many medical terms appear in the text
  const matchCount = medicalTerms.filter(term => lowerText.includes(term)).length;
  
  // Check for section headers that might indicate a medical note
  const hasSectionHeaders = /wywiad|badanie|rozpoznanie|diagnoza|zalecenia/i.test(lowerText);
  
  // If we have multiple medical terms or explicit section headers, classify as medical
  return matchCount >= 3 || hasSectionHeaders;
}
