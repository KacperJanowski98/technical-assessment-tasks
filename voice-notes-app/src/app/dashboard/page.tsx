'use client';

import React, { useEffect, useState } from 'react';
import notesDb from '@/lib/db';
import { Note } from '@/types';

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ name: string; count: number }[]>([]);
  const [actionItemStats, setActionItemStats] = useState<{ 
    total: number; 
    byType: Record<string, number>;
    byPriority: Record<number, number>;
  }>({
    total: 0,
    byType: {},
    byPriority: {}
  });

  useEffect(() => {
    // Load notes from storage
    const loadedNotes = notesDb.getAllNotes();
    setNotes(loadedNotes);
    
    // Calculate statistics
    calculateStats(loadedNotes);
  }, []);

  const calculateStats = (notes: Note[]) => {
    // Category statistics
    const categories: Record<string, number> = {};
    
    // Action item statistics
    let totalActionItems = 0;
    const actionItemsByType: Record<string, number> = {};
    const actionItemsByPriority: Record<number, number> = {};
    
    notes.forEach(note => {
      // Count categories
      note.metadata.categories.forEach(category => {
        categories[category] = (categories[category] || 0) + 1;
      });
      
      // Count action items
      if (note.metadata.actionItems) {
        totalActionItems += note.metadata.actionItems.length;
        
        note.metadata.actionItems.forEach(item => {
          // By type
          actionItemsByType[item.type] = (actionItemsByType[item.type] || 0) + 1;
          
          // By priority
          actionItemsByPriority[item.priority] = (actionItemsByPriority[item.priority] || 0) + 1;
        });
      }
    });
    
    // Convert category stats to array and sort
    const categoriesArray = Object.entries(categories).map(([name, count]) => ({
      name,
      count
    })).sort((a, b) => b.count - a.count);
    
    setCategoryStats(categoriesArray);
    setActionItemStats({
      total: totalActionItems,
      byType: actionItemsByType,
      byPriority: actionItemsByPriority
    });
  };

  // Calculate average note length
  const averageNoteLength = notes.length 
    ? Math.round(notes.reduce((sum, note) => sum + note.content.length, 0) / notes.length) 
    : 0;

  // Calculate average actions per note
  const averageActionsPerNote = notes.length
    ? parseFloat((actionItemStats.total / notes.length).toFixed(1))
    : 0;

  // Helpers for rendering
  const getColorForCategory = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    ];
    return colors[index % colors.length];
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Total Notes</h3>
          <p className="text-4xl font-bold">{notes.length}</p>
        </div>
        
        {/* Average Note Length */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Avg. Note Length</h3>
          <p className="text-4xl font-bold">{averageNoteLength}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">characters</p>
        </div>
        
        {/* Total Action Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Action Items</h3>
          <p className="text-4xl font-bold">{actionItemStats.total}</p>
        </div>
        
        {/* Average Action Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Avg. Actions/Note</h3>
          <p className="text-4xl font-bold">{averageActionsPerNote}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Top Categories</h2>
          {categoryStats.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No categories yet</p>
          ) : (
            <div className="space-y-4">
              {categoryStats.slice(0, 8).map((category, index) => (
                <div key={category.name} className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${getColorForCategory(index)} mr-2`}>
                    {category.name}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(category.count / categoryStats[0].count) * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium">{category.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Action Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Action Items</h2>
          {actionItemStats.total === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No action items yet</p>
          ) : (
            <div className="space-y-6">
              {/* By Type */}
              <div>
                <h3 className="text-lg font-medium mb-3">By Type</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900 text-center">
                    <span className="block text-2xl font-bold text-green-800 dark:text-green-200">
                      {actionItemStats.byType['task'] || 0}
                    </span>
                    <span className="text-sm text-green-700 dark:text-green-300">Tasks</span>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-100 dark:bg-purple-900 text-center">
                    <span className="block text-2xl font-bold text-purple-800 dark:text-purple-200">
                      {actionItemStats.byType['event'] || 0}
                    </span>
                    <span className="text-sm text-purple-700 dark:text-purple-300">Events</span>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-center">
                    <span className="block text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                      {actionItemStats.byType['reminder'] || 0}
                    </span>
                    <span className="text-sm text-yellow-700 dark:text-yellow-300">Reminders</span>
                  </div>
                </div>
              </div>
              
              {/* By Priority */}
              <div>
                <h3 className="text-lg font-medium mb-3">By Priority</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900 text-center">
                    <span className="block text-2xl font-bold text-blue-800 dark:text-blue-200">
                      {actionItemStats.byPriority[1] || 0}
                    </span>
                    <span className="text-sm text-blue-700 dark:text-blue-300">Low</span>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-center">
                    <span className="block text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                      {actionItemStats.byPriority[2] || 0}
                    </span>
                    <span className="text-sm text-yellow-700 dark:text-yellow-300">Medium</span>
                  </div>
                  <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900 text-center">
                    <span className="block text-2xl font-bold text-red-800 dark:text-red-200">
                      {actionItemStats.byPriority[3] || 0}
                    </span>
                    <span className="text-sm text-red-700 dark:text-red-300">High</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}