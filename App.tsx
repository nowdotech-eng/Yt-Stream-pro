import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { VideoLibrary } from './components/VideoLibrary';
import { StreamControls } from './components/StreamControls';
import { Scheduler } from './components/Scheduler';
import { Dashboard } from './components/Dashboard';
import { Video, StreamStatus } from './types';
import { api } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [videos, setVideos] = useState<Video[]>([]);
  const [status, setStatus] = useState<StreamStatus>({ streaming: false });
  
  const loadVideos = async () => {
    try {
      const data = await api.getVideos();
      setVideos(data);
    } catch (err) {
      console.error('Failed to load videos', err);
    }
  };

  const updateStatus = async () => {
    try {
      const s = await api.getStatus();
      setStatus(s);
    } catch (err) {
      console.error('Status check failed', err);
    }
  };

  useEffect(() => {
    loadVideos();
    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard status={status} onQuickStart={() => setActiveTab('studio')} />;
      case 'library':
        return <VideoLibrary videos={videos} onVideoUploaded={loadVideos} />;
      case 'studio':
        return (
          <StreamControls 
            videos={videos} 
            isStreaming={status.streaming} 
            currentStreamId={status.streamId}
            currentTitle={status.title}
            onStreamStart={updateStatus}
            onStreamStop={updateStatus}
          />
        );
      case 'schedule':
        return <Scheduler videos={videos} />;
      default:
        return <Dashboard status={status} onQuickStart={() => setActiveTab('studio')} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} isStreaming={status.streaming}>
      {renderContent()}
    </Layout>
  );
}

export default App;