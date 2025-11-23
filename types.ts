export interface Video {
  id: string;
  name: string;
  url: string;
}

export interface Schedule {
  id: string;
  startAt: string;
  endAt?: string;
  playlist: string[]; // Array of video IDs
  loopMode?: 'single' | 'playlist' | 'n' | 'none';
  repeats?: number;
  title?: string;
  streamKey?: string;
  started: boolean;
  stopped: boolean;
  createdAt: number;
}

export interface StreamStatus {
  streaming: boolean;
  streamId?: string;
  currentVideo?: string; // path
  uptime?: string;
  title?: string;
}

export interface StreamConfig {
  playlist: string[];
  loopMode: 'single' | 'playlist' | 'n' | 'none';
  repeats: number;
  streamKey: string;
  title: string;
}

export interface CreateScheduleRequest {
  startAt: string;
  endAt?: string;
  playlist: string[];
  loopMode: 'single' | 'playlist' | 'n' | 'none';
  repeats?: number;
  streamKey: string;
  title: string;
}