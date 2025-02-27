import React, { useState, useEffect } from 'react';
import { Note, ActionItem, MedicalSection } from '@/types';
import notesDb from '@/lib/db';
import MedicalNoteView from './MedicalNoteView';
import { VET_CATEGORIES } from '@/lib/ai'; // Import the existing categories

interface NoteDetailProps {
  note: Note;
  onClose: () => void;
  onUpdate: (updatedNote: Note) => void;
}

const NoteDetail: React.FC<NoteDetailProps> = ({ note, onClose, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState(note.content);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    note.metadata.categories || []
  );
  const [actionItems, setActionItems] = useState<ActionItem[]>(
    note.metadata.actionItems || []
  );
  
  // State for medical sections editing
  const [medicalSections, setMedicalSections] = useState<Record<MedicalSection, string[]>>(
    note.metadata.medicalSections || {
      Wywiad: [],
      Badanie: [],
      Diagnoza: [],
      Zalecenia: [],
      Kontekst: [],
    }
  );

  // State for custom category input
  const [customCategory, setCustomCategory] = useState("");

  // Check if this is a medical note
  const isMedicalNote = note.metadata.isMedicalNote;

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Handle category checkbox change
  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category]);
    } else {
      setSelectedCategories(prev => prev.filter(cat => cat !== category));
    }
  };

  // Add custom category
  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
      setSelectedCategories(prev => [...prev, customCategory.trim()]);
      setCustomCategory("");
    }
  };

  // Update section content
  const handleSectionChange = (section: MedicalSection, sectionContent: string) => {
    const lines = sectionContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
      
    setMedicalSections(prev => ({
      ...prev,
      [section]: lines
    }));
  };

  // Generate full content from sections for non-sectioned editing
  useEffect(() => {
    if (isMedicalNote && note.metadata.medicalSections) {
      // Update the full content whenever sections change
      const allContent = Object.entries(medicalSections)
        .filter(([_, lines]) => lines.length > 0)
        .flatMap(([_, lines]) => lines)
        .join('. ');
        
      setContent(allContent);
    }
  }, [isMedicalNote, medicalSections]);

  const handleSave = () => {
    // Create updated note
    const updatedNote: Note = {
      ...note,
      content: content, // This is the full note content
      metadata: {
        ...note.metadata,
        categories: selectedCategories,
        actionItems: [...actionItems],
        // If it's a medical note, update the sections
        medicalSections: isMedicalNote ? medicalSections : note.metadata.medicalSections,
        isMedicalNote: note.metadata.isMedicalNote
      }
    };

    // Save to database
    const result = notesDb.updateNote(note.id, updatedNote);
    
    if (result) {
      onUpdate(result);
      setEditMode(false);
    }
  };

  const handleAddActionItem = () => {
    setActionItems([...actionItems, {
      type: 'task',
      content: '',
      priority: 1
    }]);
  };

  const handleActionItemChange = (index: number, field: keyof ActionItem, value: any) => {
    const updatedItems = [...actionItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setActionItems(updatedItems);
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  // Function to render each editable section
  const renderEditableSection = (section: MedicalSection, title: string, colorClass: string) => {
    const sectionContent = medicalSections[section].join('\n');
    
    return (
      <div className="mb-4" key={section}>
        <div className={`px-3 py-1 rounded-t-md font-medium ${colorClass}`}>
          {title}
        </div>
        <textarea 
          value={sectionContent}
          onChange={(e) => handleSectionChange(section, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-b-md text-black min-h-[100px]"
          placeholder={`Enter ${title} information here...`}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">
            {editMode ? 'Edit Note' : (isMedicalNote ? 'Medical Note Details' : 'Note Details')}
          </h2>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Metadata */}
          <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <p>Recorded on: {formatDate(note.metadata.timestamp)}</p>
            <p>Duration: {Math.floor(note.metadata.duration / 60)}:{String(note.metadata.duration % 60).padStart(2, '0')}</p>
            {note.audioUrl && (
              <div className="mt-2">
                <audio src={note.audioUrl} controls className="w-full" />
              </div>
            )}
          </div>
          
          {/* Note Content - Show different UI based on medical note status and edit mode */}
          {isMedicalNote ? (
            <>
              {/* Medical Note - Section-based editing in edit mode */}
              {editMode ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Edit Medical Sections
                  </label>
                  <div className="space-y-4">
                    {renderEditableSection(
                      'Wywiad', 
                      'Wywiad (Medical History)', 
                      'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    )}
                    
                    {renderEditableSection(
                      'Badanie', 
                      'Badanie (Examination)', 
                      'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    )}
                    
                    {renderEditableSection(
                      'Diagnoza', 
                      'Diagnoza (Diagnosis)', 
                      'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                    )}
                    
                    {renderEditableSection(
                      'Zalecenia', 
                      'Zalecenia (Recommendations)', 
                      'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    )}
                    
                    {renderEditableSection(
                      'Kontekst', 
                      'Kontekst (Context)', 
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    )}
                  </div>
                </div>
              ) : (
                /* In view mode show the MedicalNoteView */
                <div className="mb-6">
                  <MedicalNoteView sections={medicalSections} />
                </div>
              )}
            </>
          ) : (
            /* For non-medical notes, standard content editing */
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content
              </label>
              {editMode ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md h-32 text-black"
                />
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md whitespace-pre-wrap">
                  {note.content}
                </div>
              )}
            </div>
          )}
          
          {/* Categories */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categories
            </label>
            {editMode ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {VET_CATEGORIES.map(category => (
                  <div key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => handleCategoryChange(category, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
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
            )}
          </div>
          
          {/* Action Items */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Action Items
              </label>
              {editMode && (
                <button
                  onClick={handleAddActionItem}
                  className="px-2 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                >
                  Add Item
                </button>
              )}
            </div>
            
            {actionItems.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No action items</p>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    {editMode ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <select
                            value={item.type}
                            onChange={(e) => handleActionItemChange(index, 'type', e.target.value)}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-black"
                          >
                            <option value="task">Task</option>
                            <option value="event">Event</option>
                            <option value="reminder">Reminder</option>
                          </select>
                          <select
                            value={item.priority}
                            onChange={(e) => handleActionItemChange(index, 'priority', parseInt(e.target.value))}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-black"
                          >
                            <option value="1">Low Priority</option>
                            <option value="2">Medium Priority</option>
                            <option value="3">High Priority</option>
                          </select>
                          <button
                            onClick={() => handleRemoveActionItem(index)}
                            className="p-1 text-red-500 hover:text-red-700"
                            aria-label="Remove"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <textarea
                          value={item.content}
                          onChange={(e) => handleActionItemChange(index, 'content', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <span 
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.type === 'task' 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : item.type === 'event'
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            }`}
                          >
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </span>
                          <span 
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.priority === 1
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : item.priority === 2
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {item.priority === 1 ? 'Low' : item.priority === 2 ? 'Medium' : 'High'} Priority
                          </span>
                        </div>
                        <p className="mt-2">{item.content}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetail;