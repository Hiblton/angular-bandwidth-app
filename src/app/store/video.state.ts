import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector, NgxsOnInit } from '@ngxs/store';
import { VideoRecording, VideoQuality, BandwidthInfo } from '../models/video.model';
import { VideoStorageService } from '../services/video-storage.service';
import { tap } from 'rxjs/operators';

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

export interface VideoStateModel {
  recordings: VideoRecording[];
  bandwidth: BandwidthInfo | null;
  selectedQuality: VideoQuality;
}

const defaults: VideoStateModel = {
  recordings: [],
  bandwidth: null,
  selectedQuality: VideoQuality.MEDIUM
};

@State<VideoStateModel>({
  name: 'videos',
  defaults
})
@Injectable()
export class VideoState implements NgxsOnInit {
  constructor(private videoStorageService: VideoStorageService) {
    console.log('VideoState initialized');
  }

  async ngxsOnInit(ctx: StateContext<VideoStateModel>) {
    console.log('VideoState ngxsOnInit');
  }

  @Selector()
  static recordings(state: VideoStateModel): VideoRecording[] {
    console.log('Recordings selector called:', state.recordings);
    return state.recordings;
  }

  @Selector()
  static selectedQuality(state: VideoStateModel): VideoQuality {
    return state.selectedQuality;
  }

  @Selector()
  static bandwidth(state: VideoStateModel): BandwidthInfo | null {
    return state.bandwidth;
  }

  @Action(LoadVideos)
  async loadVideos(ctx: StateContext<VideoStateModel>) {
    console.log('Loading videos from storage');
    try {
      const videos = await this.videoStorageService.getVideos();
      console.log('Loaded videos:', videos);
      ctx.patchState({
        recordings: videos
      });
    } catch (error) {
      console.error('Error loading videos:', error);
      ctx.patchState({
        recordings: []
      });
    }
  }

  @Action(AddVideo)
  async addVideo(ctx: StateContext<VideoStateModel>, action: AddVideo) {
    const state = ctx.getState();
    if (!state.recordings.some(v => v.id === action.video.id)) {
      await this.videoStorageService.saveVideo(action.video);
      ctx.patchState({
        recordings: [...state.recordings, action.video]
      });
    }
  }

  @Action(DeleteVideo)
  async deleteVideo(ctx: StateContext<VideoStateModel>, action: DeleteVideo) {
    console.log('Deleting video:', action.id);
    try {
      await this.videoStorageService.deleteVideo(action.id);
      const state = ctx.getState();
      ctx.patchState({
        recordings: state.recordings.filter(video => video.id !== action.id)
      });
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  }

  @Action(SetBandwidth)
  setBandwidth(ctx: StateContext<VideoStateModel>, action: SetBandwidth) {
    ctx.patchState({
      bandwidth: action.bandwidth
    });
  }

  @Action(SetQuality)
  setQuality(ctx: StateContext<VideoStateModel>, action: SetQuality) {
    ctx.patchState({
      selectedQuality: action.quality
    });
  }
}
