import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil, tap, catchError } from 'rxjs/operators';
import { CommonModule, DatePipe } from '@angular/common';
import { VideoRecording } from '../../models/video.model';
import { VideoState, DeleteVideo, LoadVideos } from '../../store/video.state';

@Component({
  selector: 'app-video-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.scss']
})
export class VideoListComponent implements OnInit, OnDestroy {
  videos$: Observable<VideoRecording[]>;
  private destroy$ = new Subject<void>();
  private blobUrls = new Map<string, string>();

  constructor(
    private store: Store,
    private cdr: ChangeDetectorRef
  ) {
    console.log('VideoListComponent initialized');
    this.videos$ = this.store.select(VideoState.recordings).pipe(
      tap(() => {
        // Clean up old blob URLs when videos change
        this.cleanupBlobUrls();
      }),
      catchError(error => {
        console.error('Error selecting recordings:', error);
        return of([]);
      })
    );
  }

  ngOnInit() {
    console.log('VideoListComponent ngOnInit');
    this.store.dispatch(new LoadVideos());

    if (this.videos$) {
      this.videos$.pipe(
        takeUntil(this.destroy$),
        tap(videos => {
          console.log('Videos updated:', videos);
          // Run change detection after videos update
          this.cdr.detectChanges();
        }),
        catchError(error => {
          console.error('Error in videos$ subscription:', error);
          return of([]);
        })
      ).subscribe();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupBlobUrls();
  }

  trackByFn(index: number, video: VideoRecording): string {
    return video.id;
  }

  getVideoUrl(video: VideoRecording): string {
    if (!video) {
      console.error('Video is undefined');
      return '';
    }

    // Check if we already have a blob URL for this video
    if (this.blobUrls.has(video.id)) {
      return this.blobUrls.get(video.id)!;
    }

    console.log('Getting URL for video:', video);
    let blob: Blob;
    
    if (video.blob instanceof Blob) {
      blob = video.blob;
    } else {
      blob = this.base64ToBlob(video.blob as string);
    }

    const url = URL.createObjectURL(blob);
    this.blobUrls.set(video.id, url);
    return url;
  }

  deleteVideo(id: string) {
    if (!id) {
      console.error('Video ID is undefined');
      return;
    }
    console.log('Deleting video:', id);
    
    // Revoke the blob URL before deleting
    if (this.blobUrls.has(id)) {
      URL.revokeObjectURL(this.blobUrls.get(id)!);
      this.blobUrls.delete(id);
    }
    
    this.store.dispatch(new DeleteVideo(id));
  }

  private cleanupBlobUrls() {
    // Revoke all existing blob URLs
    this.blobUrls.forEach(url => URL.revokeObjectURL(url));
    this.blobUrls.clear();
  }

  private base64ToBlob(base64String: string): Blob {
    try {
      // Check if the base64String is actually a base64 string
      if (typeof base64String !== 'string') {
        throw new Error('Invalid base64 string');
      }

      // Remove data URL prefix if present
      const base64Data = base64String.includes('base64,') 
        ? base64String.split('base64,')[1] 
        : base64String;

      // Convert base64 to binary
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return new Blob([bytes], { type: 'video/webm' });
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      throw error;
    }
  }
} 