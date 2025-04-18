import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector, NgxsOnInit } from '@ngxs/store';
import { VideoStorageService } from '../services/video-storage.service';
import { VideoStateModel, VideoQuality, VideoRecording, BandwidthInfo } from '../types/video.types';
import { AddVideo, DeleteVideo, LoadVideos, SetBandwidth, SetQuality } from './video.actions';

const defaults: VideoStateModel = {
  recordings: [],
  bandwidth: null,
  selectedQuality: VideoQuality.MEDIUM,
  loading: false,
  error: null
};

@State<VideoStateModel>({
  name: 'videos',
  defaults
})
@Injectable()
export class VideoState implements NgxsOnInit {
  constructor(private videoStorageService: VideoStorageService) {}

  async ngxsOnInit(ctx: StateContext<VideoStateModel>) {
    await this.loadVideos(ctx);
  }

  @Selector()
  static recordings(state: VideoStateModel): VideoRecording[] {
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

  @Selector()
  static loading(state: VideoStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: VideoStateModel): string | null {
    return state.error;
  }

  @Action(LoadVideos)
  async loadVideos(ctx: StateContext<VideoStateModel>) {
    ctx.patchState({ loading: true, error: null });
    try {
      const videos = await this.videoStorageService.getVideos();
      ctx.patchState({
        recordings: videos,
        loading: false
      });
    } catch (error) {
      ctx.patchState({
        recordings: [],
        loading: false,
        error: 'Failed to load videos'
      });
    }
  }

  @Action(AddVideo)
  async addVideo(ctx: StateContext<VideoStateModel>, action: AddVideo) {
    ctx.patchState({ loading: true, error: null });
    try {
      const state = ctx.getState();
      if (!state.recordings.some(v => v.id === action.video.id)) {
        await this.videoStorageService.saveVideo(action.video);
        ctx.patchState({
          recordings: [...state.recordings, action.video],
          loading: false
        });
      }
    } catch (error) {
      ctx.patchState({
        loading: false,
        error: 'Failed to add video'
      });
    }
  }

  @Action(DeleteVideo)
  async deleteVideo(ctx: StateContext<VideoStateModel>, action: DeleteVideo) {
    ctx.patchState({ loading: true, error: null });
    try {
      await this.videoStorageService.deleteVideo(action.id);
      const state = ctx.getState();
      ctx.patchState({
        recordings: state.recordings.filter(video => video.id !== action.id),
        loading: false
      });
    } catch (error) {
      ctx.patchState({
        loading: false,
        error: 'Failed to delete video'
      });
    }
  }

  @Action(SetBandwidth)
  setBandwidth(ctx: StateContext<VideoStateModel>, action: SetBandwidth) {
    ctx.patchState({
      bandwidth: action.bandwidth,
      error: null
    });
  }

  @Action(SetQuality)
  setQuality(ctx: StateContext<VideoStateModel>, action: SetQuality) {
    ctx.patchState({
      selectedQuality: action.quality,
      error: null
    });
  }
}
