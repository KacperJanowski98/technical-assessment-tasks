# Medical Notes Classification

This document describes the implementation of medical notes classification in the Smart Voice Notes Organizer.

## Overview

The application has been enhanced to detect and classify medical notes into specialized sections based on the content. This feature enables healthcare professionals to organize their voice notes more effectively by automatically separating information into relevant medical sections.

## Medical Sections

Medical notes are classified into five main sections:

1. **Wywiad** (Medical History) - Default section for general patient information
2. **Badanie** (Examination) - Physical examination findings
3. **Diagnoza** (Diagnosis) - Diagnostic assessment and conclusions
4. **Zalecenia** (Recommendations) - Treatment plans and patient instructions
5. **Kontekst** (Context) - Environmental or social factors relevant to the case

## Classification Process

When a user records and transcribes a note, the following process occurs:

1. The system analyzes the text content for medical terminology
2. If the note is detected as medical in nature:
   - It is labeled with the "Medical" category
   - The content is divided into appropriate sections
   - The UI displays a special medical note view with color-coded sections

## Implementation Details

The classification is implemented using keyword-based pattern matching:

```typescript
// Example section keywords
const SECTION_KEYWORDS: Record<MedicalSection, string[]> = {
  Badanie: ['bada', 'osłuch', 'palp', 'temp'],
  Diagnoza: ['rozpozn', 'diagnoz', 'podejrz'],
  Zalecenia: ['zalec', 'przepis', 'kontrol'],
  Kontekst: ['dom', 'rodzin', 'środowisk', 'koleżank'],
  Wywiad: [] // Default section
};
```

Each sentence or line in the note is analyzed and assigned to the appropriate section based on the presence of these keywords. If no matching keywords are found, the content is placed in the "Wywiad" section by default.

## User Interface

Medical notes have the following UI features:

1. Highlighted with a distinct color in the notes list
2. Display a "Medical Note" badge for easy identification
3. Show the content organized into color-coded sections
4. Special treatment of the "Medical" category tag

## Example

**Original transcription:**
```
Pacjent lat 45 zgłasza się z bólem w klatce piersiowej. Wywiad rodzinny dodatni w kierunku chorób serca. Osłuchowo stwierdzam szmery nad zastawką mitralną. Badanie ciśnienia: 160/95. Diagnoza wstępna: nadciśnienie tętnicze, podejrzenie niewydolności zastawki mitralnej. Zalecam wykonanie EKG, Echo serca oraz kontrolę ciśnienia 2x dziennie. Pacjent mieszka sam, brak wsparcia środowiskowego.
```

**Classified sections:**
- **Wywiad**: "Pacjent lat 45 zgłasza się z bólem w klatce piersiowej. Wywiad rodzinny dodatni w kierunku chorób serca."
- **Badanie**: "Osłuchowo stwierdzam szmery nad zastawką mitralną. Badanie ciśnienia: 160/95."
- **Diagnoza**: "Diagnoza wstępna: nadciśnienie tętnicze, podejrzenie niewydolności zastawki mitralnej."
- **Zalecenia**: "Zalecam wykonanie EKG, Echo serca oraz kontrolę ciśnienia 2x dziennie."
- **Kontekst**: "Pacjent mieszka sam, brak wsparcia środowiskowego."

## Technical Architecture

The medical classification system consists of:

1. **Types** - Definitions for medical sections and note structure
2. **Classifier** - Logic for detecting medical notes and sorting content into sections
3. **UI Components** - Visual representation of medical notes and sections
4. **Integration** - Connection with the existing voice notes system

## Future Improvements

1. Machine learning-based classification for more accurate section detection
2. Support for additional medical specialties with specialized sections
3. Extraction of structured medical data (vitals, medications, allergies)
4. Export to electronic health record systems
5. Templates for common medical note types
