import React from 'react';
import { MedicalSection } from '@/types';

interface MedicalNoteViewProps {
  sections: Record<MedicalSection, string[]>;
}

const sectionColors: Record<MedicalSection, string> = {
  Wywiad: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  Badanie: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  Diagnoza: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  Zalecenia: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  Kontekst: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
};

/**
 * Component to display medical note sections
 */
const MedicalNoteView: React.FC<MedicalNoteViewProps> = ({ sections }) => {
  // Filter out empty sections
  const nonEmptySections = Object.entries(sections)
    .filter(([_, lines]) => lines.length > 0)
    .map(([section, lines]) => ({ 
      section: section as MedicalSection, 
      lines 
    }));

  if (nonEmptySections.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
        <p className="text-gray-500 dark:text-gray-400 italic">
          No medical sections identified
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Medical Note Sections</h3>
      
      {nonEmptySections.map(({ section, lines }) => (
        <div key={section} className="mb-4">
          <div className={`px-3 py-1 rounded-t-md font-medium ${sectionColors[section]}`}>
            {section}
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-b-md border-t-0 border border-gray-200 dark:border-gray-600">
            {lines.map((line, idx) => (
              <p key={idx} className="mb-1 last:mb-0">
                {line}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MedicalNoteView;
