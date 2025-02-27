import type { ContentAnalysis } from '@/types';
import { MedicalSection, SECTION_KEYWORDS } from '@/types';

// Categories specific to veterinary medicine in Polish
const VET_CATEGORIES = [
  'Badanie', 'Diagnoza', 'Leczenie', 'Szczepienie', 
  'Operacja', 'Recepta', 'Kontrola', 'Nagły przypadek',
  'Wyniki laboratoryjne', 'Żywienie', 'Zachowanie', 'Profilaktyka'
];

/**
 * Analyzes text content and classifies it into veterinary medical sections
 * based on keywords defined in SECTION_KEYWORDS
 */
function classifyVetContent(text: string): Record<MedicalSection, string[]> {
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
 * A specialized analysis service for veterinary notes in Polish
 */
export const analyzeContent = async (text: string): Promise<ContentAnalysis> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Classify content into veterinary sections
  const medicalSections = classifyVetContent(text);
  
  // Identify specific categories based on content
  const categories = VET_CATEGORIES.filter(category => 
    text.toLowerCase().includes(category.toLowerCase())
  );
  
  // If no specific categories match, add based on section content
  if (categories.length === 0) {
    if (medicalSections['Diagnoza'].length > 0) {
      categories.push('Diagnoza');
    }
    if (medicalSections['Zalecenia'].length > 0) {
      categories.push('Leczenie');
    }
    // Add default category if still empty
    if (categories.length === 0) {
      categories.push('Badanie');
    }
  }
  
  // Extract action items (adapted for veterinary context in Polish)
  const actionItems = [];
  
  // Prescription/medication items
  const medicationRegex = /(przepis|lek|dawkowa|podawa|tabletk|zastrzyk|aplikowa|maść)(?:.*?)([^.!?]+[.!?])/gi;
  let medicationMatch;
  while ((medicationMatch = medicationRegex.exec(text)) !== null) {
    actionItems.push({
      type: 'task',
      content: medicationMatch[2].trim(),
      suggestedPriority: 3 // High priority for medications
    });
  }
  
  // Follow-up appointments
  const followupRegex = /(kontrola|wizyta|ponowne|za\s+\d+\s+(?:dzień|dni|tydzień|tygodni|miesiąc|miesięcy))(?:.*?)([^.!?]+[.!?])/gi;
  let followupMatch;
  while ((followupMatch = followupRegex.exec(text)) !== null) {
    actionItems.push({
      type: 'event',
      content: followupMatch[2].trim(),
      suggestedPriority: 2
    });
  }
  
  // Monitoring instructions
  const monitorRegex = /(obserwowa|monitorowa|sprawdza|jeśli|gdyby|pilnowa)(?:.*?)([^.!?]+[.!?])/gi;
  let monitorMatch;
  while ((monitorMatch = monitorRegex.exec(text)) !== null) {
    actionItems.push({
      type: 'reminder',
      content: monitorMatch[2].trim(),
      suggestedPriority: 2
    });
  }
  
  // Generate suggested tags based on content
  const words = text.toLowerCase().split(/\s+/);
  const commonWords = ['to', 'jest', 'i', 'w', 'na', 'z', 'o', 'do', 'się', 'nie', 'dla', 'przez'];
  
  const possibleTags = words
    .filter(word => word.length > 3)
    .filter(word => !commonWords.includes(word))
    .map(word => word.replace(/[^a-ząęćłńóśźż0-9]/g, ''));
  
  // Get unique words and pick up to 5 for tags
  const suggestedTags = [...new Set(possibleTags)]
    .slice(0, 5)
    .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1));
  
  // Create the analysis result focused on veterinary medicine
  return {
    categories,
    sentiment: 0, // Neutral sentiment for medical notes
    actionItems,
    suggestedTags,
    medicalSections,
    isMedicalNote: true // Always true as we're focusing only on veterinary notes
  };
};
