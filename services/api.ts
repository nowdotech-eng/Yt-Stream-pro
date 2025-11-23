import { API_BASE_URL } from '../constants';
import { Video, StreamStatus, Schedule, CreateScheduleRequest, StreamConfig } from '../types';

// Mock data store for offline mode
let mockVideos: Video[] = [
  { id: '1', name: 'Big Buck Bunny', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { id: '2', name: 'Elephant Dream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { id: '3', name: 'For Bigger Blazes', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
];

let mockSchedules: Schedule[] = [
  {
    id: 's1',
    startAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    playlist: ['1', '2'],
    loopMode: 'playlist',
    title: 'Daily Broadcast',
    streamKey: 'live_12345',
    started: false,
    stopped: false,
    createdAt: Date.now()
  }
];

let mockStatus: StreamStatus = {
  streaming: false
};

let streamStartTime: number | null = null;
let currentStreamTitle: string | undefined = undefined;

const isOfflineError = (err: any) => {
  // Fetch throws TypeError on network errors (like connection refused)
  return err instanceof TypeError || err.message === 'Failed to fetch';
};

export const api = {
  getVideos: async (): Promise<Video[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/videos`);
      if (!res.ok) throw new Error('Failed to fetch videos');
      return res.json();
    } catch (err) {
      console.warn('Backend unreachable. Serving demo data for videos.');
      return mockVideos;
    }
  },

  uploadVideo: async (file: File): Promise<Video> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload video');
      return res.json();
    } catch (err) {
      if (isOfflineError(err)) {
        console.warn('Backend unreachable. Simulating upload.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newVideo: Video = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: URL.createObjectURL(file)
        };
        mockVideos = [...mockVideos, newVideo];
        return newVideo;
      }
      throw err;
    }
  },

  getStatus: async (): Promise<StreamStatus> => {
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json();
    } catch (err) {
      // Update mock uptime if streaming
      if (mockStatus.streaming && streamStartTime) {
        const elapsed = Math.floor((Date.now() - streamStartTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        mockStatus.uptime = `${hours}h ${minutes}m ${seconds}s`;
        mockStatus.title = currentStreamTitle;
      }
      return mockStatus;
    }
  },

  startStream: async (config: StreamConfig): Promise<{ ok: boolean; streamId: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/stream/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to start stream');
      }
      return res.json();
    } catch (err: any) {
      if (isOfflineError(err)) {
         console.warn('Backend unreachable. Simulating stream start.');
         streamStartTime = Date.now();
         currentStreamTitle = config.title;
         mockStatus = {
             streaming: true,
             streamId: 'mock-stream-' + Date.now(),
             currentVideo: mockVideos.find(v => v.id === config.playlist[0])?.name,
             uptime: '0s',
             title: currentStreamTitle
         };
         return { ok: true, streamId: mockStatus.streamId! };
      }
      throw err;
    }
  },

  stopStream: async (streamId: string): Promise<{ ok: boolean }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/stream/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId }),
      });
      if (!res.ok) throw new Error('Failed to stop stream');
      return res.json();
    } catch (err: any) {
      if (isOfflineError(err)) {
          console.warn('Backend unreachable. Simulating stream stop.');
          mockStatus = { streaming: false };
          streamStartTime = null;
          currentStreamTitle = undefined;
          return { ok: true };
      }
      throw err;
    }
  },

  updateStreamMetadata: async (streamId: string, data: { title: string }): Promise<void> => {
    try {
        // Assuming backend would support this endpoint
        const res = await fetch(`${API_BASE_URL}/stream/${streamId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update stream metadata');
    } catch (err: any) {
        if (isOfflineError(err) || err.message === 'Failed to update stream metadata') {
            console.warn('Backend unreachable or endpoint missing. Simulating metadata update.');
            if (mockStatus.streaming && mockStatus.streamId === streamId) {
                currentStreamTitle = data.title;
                mockStatus.title = data.title;
            }
            return;
        }
        throw err;
    }
  },

  getSchedules: async (): Promise<Schedule[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/schedules`);
      if (!res.ok) throw new Error('Failed to fetch schedules');
      return res.json();
    } catch (err) {
      console.warn('Backend unreachable. Serving demo data for schedules.');
      return mockSchedules;
    }
  },

  createSchedule: async (req: CreateScheduleRequest): Promise<Schedule> => {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error('Failed to create schedule');
      return res.json();
    } catch (err: any) {
        if (isOfflineError(err)) {
            console.warn('Backend unreachable. Simulating schedule creation.');
            const newSchedule: Schedule = {
                id: Math.random().toString(36).substr(2, 9),
                ...req,
                started: false,
                stopped: false,
                createdAt: Date.now()
            };
            mockSchedules = [...mockSchedules, newSchedule];
            return newSchedule;
        }
        throw err;
    }
  },

  cancelSchedule: async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/${id}/cancel`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to cancel schedule');
    } catch (err: any) {
        if (isOfflineError(err)) {
            console.warn('Backend unreachable. Simulating schedule cancellation.');
            mockSchedules = mockSchedules.filter(s => s.id !== id);
            return;
        }
        throw err;
    }
  },
};