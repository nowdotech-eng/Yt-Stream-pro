import React, { useState, useEffect } from 'react';
import { Play, Square, GripVertical, Plus, X, Settings, Save } from 'lucide-react';
import { Video, StreamConfig } from '../types';
import { api } from '../services/api';

interface StreamControlsProps {
  videos: Video[];
  isStreaming: boolean;
  currentStreamId?: string;
  currentTitle?: string;
  onStreamStart: () => void;
  onStreamStop: () => void;
}

export const StreamControls: React.FC<StreamControlsProps> = ({ 
  videos, 
  isStreaming, 
  currentStreamId, 
  currentTitle,
  onStreamStart, 
  onStreamStop 
}) => {
  const [config, setConfig] = useState<StreamConfig>({
    playlist: [],
    loopMode: 'single',
    repeats: 1,
    streamKey: '',
    title: 'My Live Stream'
  });

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);

  // Sync title from server only if we haven't started editing excessively
  // For simplicity, we sync on mount or if provided title changes and matches what we expect
  useEffect(() => {
    if (isStreaming && currentTitle && !isUpdatingTitle) {
       // Only update if the local state is "default" or out of sync, 
       // but strictly we should let user input override server polling to prevent jumping.
       // Here we just set it once if it's the first load (empty stream key implies fresh load or reset)
       // Or simple approach: only when component mounts or streaming starts.
    }
    // Better approach: When `currentTitle` exists and differs from `config.title`, 
    // it implies remote change. But local change is more important. 
    // We'll leave this manual for now to avoid fighting the poll loop.
    if (isStreaming && currentTitle && config.title === 'My Live Stream') {
        setConfig(c => ({ ...c, title: currentTitle }));
    }
  }, [isStreaming, currentTitle]);

  const addToPlaylist = (videoId: string) => {
    setConfig(prev => ({ ...prev, playlist: [...prev.playlist, videoId] }));
    setIsSelectorOpen(false);
  };

  const removeFromPlaylist = (index: number) => {
    setConfig(prev => ({
      ...prev,
      playlist: prev.playlist.filter((_, i) => i !== index)
    }));
  };

  const handleStart = async () => {
    if (!config.streamKey) return alert('Stream key is required');
    if (config.playlist.length === 0) return alert('Playlist is empty');
    
    setIsLoading(true);
    try {
      await api.startStream(config);
      onStreamStart();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!currentStreamId) return;
    setIsLoading(true);
    try {
      await api.stopStream(currentStreamId);
      onStreamStop();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateTitle = async () => {
    if (!currentStreamId) return;
    setIsUpdatingTitle(true);
    try {
        await api.updateStreamMetadata(currentStreamId, { title: config.title });
        // Optional: Show success toast
    } catch (err: any) {
        alert(err.message || 'Failed to update title');
    } finally {
        setIsUpdatingTitle(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-140px)]">
      {/* Configuration Panel */}
      <div className="lg:col-span-1 space-y-6 bg-card border border-border rounded-xl p-6 h-full overflow-y-auto">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Stream Settings</h2>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Stream Title</label>
            <div className="flex gap-2">
                <input 
                  type="text" 
                  value={config.title}
                  onChange={e => setConfig({...config, title: e.target.value})}
                  className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  // Always enabled to allow updates
                  disabled={false}
                />
                {isStreaming && (
                    <button 
                        onClick={handleUpdateTitle}
                        disabled={isUpdatingTitle}
                        className="bg-primary/90 hover:bg-primary text-white p-2 rounded-md transition-colors disabled:opacity-50"
                        title="Update Stream Title"
                    >
                        {isUpdatingTitle ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>
            {isStreaming && <p className="text-xs text-green-500">Live: You can update the title in real-time.</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Stream Key (RTMP)</label>
            <input 
              type="password" 
              value={config.streamKey}
              onChange={e => setConfig({...config, streamKey: e.target.value})}
              className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              disabled={isStreaming}
              placeholder="sk_live_..."
            />
            <p className="text-xs text-muted-foreground">From YouTube Studio or Twitch Dashboard</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Loop Mode</label>
            <select 
              value={config.loopMode}
              onChange={e => setConfig({...config, loopMode: e.target.value as any})}
              className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              disabled={isStreaming}
            >
              <option value="single">Loop Single Video</option>
              <option value="playlist">Loop Entire Playlist</option>
              <option value="n">Loop N Times</option>
              <option value="none">No Loop</option>
            </select>
          </div>

          {config.loopMode === 'n' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Repeat Count</label>
              <input 
                type="number" 
                min="1"
                value={config.repeats}
                onChange={e => setConfig({...config, repeats: parseInt(e.target.value)})}
                className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                disabled={isStreaming}
              />
            </div>
          )}

          <div className="pt-6">
             {!isStreaming ? (
                <button 
                    onClick={handleStart}
                    disabled={isLoading || config.playlist.length === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-green-600 hover:bg-green-700 py-3 text-white font-semibold shadow-lg shadow-green-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/> : <Play className="h-5 w-5" />}
                    Start Streaming
                </button>
             ) : (
                <button 
                    onClick={handleStop}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-red-600 hover:bg-red-700 py-3 text-white font-semibold shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
                >
                    {isLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/> : <Square className="h-5 w-5 fill-current" />}
                    Stop Streaming
                </button>
             )}
          </div>
        </div>
      </div>

      {/* Playlist Builder */}
      <div className="lg:col-span-2 flex flex-col bg-card border border-border rounded-xl h-full overflow-hidden">
         <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold">Playlist Queue ({config.playlist.length})</h2>
            <button 
                onClick={() => setIsSelectorOpen(true)}
                disabled={isStreaming}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50"
            >
                <Plus className="h-4 w-4" />
                Add Video
            </button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/10">
            {config.playlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <GripVertical className="h-12 w-12 mb-2" />
                    <p>Playlist is empty</p>
                </div>
            ) : (
                config.playlist.map((vidId, idx) => {
                    const vid = videos.find(v => v.id === vidId);
                    return (
                        <div key={`${vidId}-${idx}`} className="group flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:border-primary/30 transition-colors">
                            <span className="text-xs font-mono text-muted-foreground w-6">{idx + 1}</span>
                            <div className="h-10 w-16 bg-black/20 rounded overflow-hidden flex-shrink-0">
                                {/* Simple thumb preview */}
                                {vid && <video src={vid.url} className="h-full w-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{vid ? vid.name : 'Unknown Video'}</p>
                            </div>
                            {!isStreaming && (
                                <button 
                                    onClick={() => removeFromPlaylist(idx)}
                                    className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )
                })
            )}
         </div>
      </div>

      {/* Video Selector Modal */}
      {isSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold">Select Video</h3>
                    <button onClick={() => setIsSelectorOpen(false)}><X className="h-5 w-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid gap-2">
                    {videos.map(video => (
                        <button 
                            key={video.id}
                            onClick={() => addToPlaylist(video.id)}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/30 text-left transition-all"
                        >
                            <div className="h-12 w-20 bg-black/20 rounded overflow-hidden flex-shrink-0">
                                <video src={video.url} className="h-full w-full object-cover" />
                            </div>
                            <span className="font-medium text-sm flex-1">{video.name}</span>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                    ))}
                    {videos.length === 0 && <p className="text-center py-8 text-muted-foreground">No videos in library.</p>}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};