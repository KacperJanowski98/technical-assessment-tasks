import type { ContentAnalysis } from '@/types';
import { enhanceWithMedicalClassification } from './medical-classifier';

const CATEGORIES = [
  'Work', 'Personal', 'Meeting', 'Reminder', 'Idea', 
  'Task', 'Project', 'Learning', 'Finance', 'Health',
  'Medical' // Added medical category
];

/**
 * A mock AI analysis service for notes 
 * In a real application, this would connect to an AI service
 */
export const analyzeContent = async (text: string): Promise<ContentAnalysis> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Basic keyword matching for categories
  const categories = CATEGORIES.filter(category => 
    text.toLowerCase().includes(category.toLowerCase())
  );
  
  // If no categories match, add some based on common patterns
  if (categories.length === 0) {
    if (text.toLowerCase().includes('meeting') || text.toLowerCase().includes('discuss')) {
      categories.push('Meeting');
    }
    
    if (text.toLowerCase().includes('remember') || text.toLowerCase().includes('don\\'t forget')) {
      categories.push('Reminder');
    }
    
    if (text.toLowerCase().includes('idea') || text.toLowerCase().includes('thought')) {
      categories.push('Idea');
    }
    
    // Default category if nothing else matches
    if (categories.length === 0) {
      categories.push('Personal');
    }
  }
  
  // Extract action items using simple heuristics
  const actionItems = [];
  
  // Look for tasks with "need to", "have to", "should", "must"
  const taskRegex = /(need to|have to|should|must|todo|to do|task)\\s+([^.!?]+[.!?])/gi;
  let taskMatch;
  while ((taskMatch = taskRegex.exec(text)) !== null) {
    actionItems.push({
      type: 'task',
      content: taskMatch[2].trim(),
      suggestedPriority: Math.floor(Math.random() * 3) + 1 // Priority from 1-3
    });
  }
  
  // Look for events with time/date indicators
  const eventRegex = /(meeting|call|appointment|event)\\s+([^.!?]+[.!?])/gi;
  let eventMatch;
  while ((eventMatch = eventRegex.exec(text)) !== null) {
    actionItems.push({
      type: 'event',
      content: eventMatch[2].trim(),
      suggestedPriority: Math.floor(Math.random() * 3) + 1
    });
  }
  
  // Look for reminders
  const reminderRegex = /(remember|don't forget|reminder|remind me)\\s+([^.!?]+[.!?])/gi;
  let reminderMatch;
  while ((reminderMatch = reminderRegex.exec(text)) !== null) {
    actionItems.push({
      type: 'reminder',
      content: reminderMatch[2].trim(),
      suggestedPriority: Math.floor(Math.random() * 3) + 1
    });
  }
  
  // Generate sentiment score (-1 to 1)
  // Simple heuristic based on positive/negative words
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'happy', 'positive', 'pleased'];
  const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'negative', 'unhappy', 'problem'];
  
  let sentiment = 0;
  const textLower = text.toLowerCase();
  
  positiveWords.forEach(word => {
    if (textLower.includes(word)) sentiment += 0.2;
  });
  
  negativeWords.forEach(word => {
    if (textLower.includes(word)) sentiment -= 0.2;
  });
  
  // Clamp sentiment between -1 and 1
  sentiment = Math.max(-1, Math.min(1, sentiment));
  
  // Generate suggested tags based on content
  const words = textLower.split(/\\s+/);
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with'];
  
  const possibleTags = words
    .filter(word => word.length > 3) // Only words longer than 3 characters
    .filter(word => !commonWords.includes(word)) // Remove common words
    .map(word => word.replace(/[^a-z0-9]/g, '')); // Remove punctuation
  
  // Get unique words and pick up to 5 for tags
  const suggestedTags = [...new Set(possibleTags)]
    .slice(0, 5)
    .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1)); // Capitalize first letter
  
  // Create the base analysis
  const baseAnalysis: ContentAnalysis = {
    categories,
    sentiment,
    actionItems,
    suggestedTags
  };
  
  // Enhance with medical classification if needed
  return enhanceWithMedicalClassification(baseAnalysis, text);
};