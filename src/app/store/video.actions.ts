import { VideoRecording, VideoQuality, BandwidthInfo } from '../types/video.types';

export class AddVideo {
  static readonly type = '[Video] Add Video';
  constructor(public video: VideoRecording) {}
}

export class DeleteVideo {
  static readonly type = '[Video] Delete Video';
  constructor(public id: string) {}
}

export class LoadVideos {
  static readonly type = '[Video] Load Videos';
}

export class SetBandwidth {
  static readonly type = '[Video] Set Bandwidth';
  constructor(public bandwidth: BandwidthInfo) {}
}

export class SetQuality {
  static readonly type = '[Video] Set Quality';
  constructor(public quality: VideoQuality) {}
} 