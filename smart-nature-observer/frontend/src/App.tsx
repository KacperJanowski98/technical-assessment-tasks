import React, { useState, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoList from './components/VideoList';
import VideoEditor from './components/VideoEditor';
import { getHealthStatus } from './services/api';
import './App.css';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'list' | 'upload' | 'editor'>('list');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Check backend health on mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const health = await getHealthStatus();
        setIsBackendReady(health.api.status === 'operational' && health.model.status === 'operational');
      } catch (err) {
        console.error('Backend health check failed:', err);
        setBackendError('Could not connect to the backend service. Please check if it is running.');
      }
    };
    
    checkBackendHealth();
  }, []);

  // Handle video upload completion
  const handleVideoUploaded = (videoId: string) => {
    setSelectedVideoId(videoId);
    setActiveView('editor');
  };

  // Handle video selection from list
  const handleVideoSelect = (videoId: string) => {
    setSelectedVideoId(videoId);
    setActiveView('editor');
  };

  // Handle back to list
  const handleBackToList = () => {
    setActiveView('list');
  };

  if (backendError) {
    return (
      <div className="app backend-error">
        <h1>Smart Nature Observer</h1>
        <div className="error-message">
          <h2>Backend Connection Error</h2>
          <p>{backendError}</p>
          <button onClick={() => window.location.reload()}>Retry Connection</button>
        </div>
      </div>
    );
  }

  if (!isBackendReady) {
    return (
      <div className="app loading">
        <h1>Smart Nature Observer</h1>
        <div className="loading-spinner">
          <p>Connecting to backend service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Smart Nature Observer</h1>
        
        {activeView !== 'editor' && (
          <nav className="app-nav">
            <button 
              className={activeView === 'list' ? 'active' : ''} 
              onClick={() => setActiveView('list')}
            >
              My Videos
            </button>
            <button 
              className={activeView === 'upload' ? 'active' : ''} 
              onClick={() => setActiveView('upload')}
            >
              Upload New Video
            </button>
          </nav>
        )}
      </header>
      
      <main className="app-content">
        {activeView === 'list' && (
          <VideoList onVideoSelect={handleVideoSelect} />
        )}
        
        {activeView === 'upload' && (
          <VideoUploader onVideoUploaded={handleVideoUploaded} />
        )}
        
        {activeView === 'editor' && selectedVideoId && (
          <VideoEditor 
            videoId={selectedVideoId}
            onBack={handleBackToList}
          />
        )}
      </main>
      
      <footer className="app-footer">
        <p>Smart Nature Observer - AI-Powered Video Segmentation Tool</p>
      </footer>
    </div>
  );
};

export default App;