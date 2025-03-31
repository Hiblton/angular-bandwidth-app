import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngxs/store';
import { VideoState, LoadVideos, DeleteVideo } from '../../store/video.state';
import { VideoRecording } from '../../models/video.model';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-video-list',
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.scss']
})
export class VideoListComponent implements OnInit, OnDestroy {
  videos$: Observable<VideoRecording[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  private destroy$ = new Subject<void>();
  private blobUrls: { [key: string]: string } = {};

  constructor(
    private store: Store,
    private cdr: ChangeDetectorRef
  ) {
    this.videos$ = this.store.select(VideoState.recordings);
    this.loading$ = this.store.select(VideoState.loading);
    this.error$ = this.store.select(VideoState.error);
  }

  ngOnInit(): void {
    // Load videos only once
    this.store.dispatch(new LoadVideos());

    // Subscribe to videos$ to handle blob URLs
    this.videos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(videos => {
        // Revoke old blob URLs
        Object.values(this.blobUrls).forEach(url => URL.revokeObjectURL(url));
        this.blobUrls = {};

        // Create new blob URLs
        videos.forEach(video => {
          if (video.blob instanceof Blob) {
            this.blobUrls[video.id] = URL.createObjectURL(video.blob);
          }
        });

        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Clean up blob URLs
    Object.values(this.blobUrls).forEach(url => URL.revokeObjectURL(url));
  }

  trackByVideoId(index: number, video: VideoRecording): string {
    return video.id;
  }

  getVideoUrl(video: VideoRecording): string {
    return this.blobUrls[video.id] || '';
  }

  deleteVideo(video: VideoRecording): void {
    this.store.dispatch(new DeleteVideo(video.id));
  }
} 