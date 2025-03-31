export enum VideoQuality {
  LOW = '360p',
  MEDIUM = '720p',
  HIGH = '1080p'
}

export interface VideoRecording {
  id: string;
  blob: Blob | string;  // Can be either Blob for runtime or string for storage
  timestamp: number;
  duration: number;
  quality: VideoQuality;
  thumbnailUrl?: string;
}

export interface BandwidthInfo {
  speed: number;
  quality: VideoQuality;
}

export interface VideoStateModel {
  recordings: VideoRecording[];
  bandwidth: BandwidthInfo | null;
  selectedQuality: VideoQuality;
  loading: boolean;
  error: string | null;
}
