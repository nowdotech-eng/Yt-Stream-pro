import React, { useState, useRef } from 'react';
import { Upload, Play, Film, Clock, Trash2, Search } from 'lucide-react';
import { Video } from '../types';
import { api } from '../services/api';

interface VideoLibraryProps {
  videos: Video[];
  onVideoUploaded: () => void;
}

export const VideoLibrary: React.FC<VideoLibraryProps> = ({ videos, onVideoUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await api.uploadVideo(file);
      onVideoUploaded();
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredVideos = videos.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search videos..." 
            className="h-10 w-full rounded-md border border-input bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="video/mp4,video/mkv,video/avi"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isUploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredVideos.map((video) => (
          <div 
            key={video.id} 
            className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div className="aspect-video w-full bg-black/20 relative">
               {/* Placeholder for thumbnail since backend doesn't generate one */}
               <video 
                  src={video.url} 
                  className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  preload="metadata"
                  onMouseOver={(e) => e.currentTarget.play()}
                  onMouseOut={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                  }}
                  muted
               />
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                     <Play className="h-6 w-6 text-white fill-white" />
                  </div>
               </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm text-foreground line-clamp-2" title={video.name}>
                  {video.name}
                </h3>
                <Film className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    ID: <span className="font-mono text-xs opacity-70">{video.id.substring(0, 8)}...</span>
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredVideos.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg bg-muted/10">
            <div className="rounded-full bg-muted/50 p-4 mb-4">
              <Film className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No videos found</h3>
            <p className="text-sm text-muted-foreground mt-1">Upload a video to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
