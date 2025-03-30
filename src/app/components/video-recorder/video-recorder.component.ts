import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebcamComponent, WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { Store } from '@ngxs/store';
import { VideoState, AddVideo, SetQuality } from '../../store/video.state';
import { VideoStorageService } from '../../services/video-storage.service';
import { v4 as uuidv4 } from 'uuid';
import { BehaviorSubject, Observable, Subscription, filter, tap } from 'rxjs';
import { VideoRecording, VideoQuality } from '../../models/video.model';
import { WebcamModule } from 'ngx-webcam';

@Component({
  selector: 'app-video-recorder',
  templateUrl: './video-recorder.component.html',
  styleUrls: ['./video-recorder.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, WebcamModule]
})
export class VideoRecorderComponent implements OnInit, OnDestroy {
  @ViewChild('webcam') webcam!: WebcamComponent;

  // Webcam properties
  public webcamImage: WebcamImage | null = null;
  public errors: WebcamInitError[] = [];
  public videoOptions: MediaTrackConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  };
  public quality$: Observable<VideoQuality>;
  public bandwidth$: Observable<any>;
  public VideoQuality = VideoQuality;

  // Recording properties
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private recordingTimer: any;
  public isRecording: boolean = false;
  public recordingTime: number = 0;
  public maxRecordingTime: number = 10; // 10 seconds max
  public recordingProgress: number = 0;

  // Camera controls
  public showNextWebcam = new BehaviorSubject<boolean>(false);
  public nextWebcamObservable: Observable<boolean> = this.showNextWebcam.asObservable();
  public availableWebcams: MediaDeviceInfo[] = [];
  public currentWebcam: MediaDeviceInfo | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    public store: Store,
    private videoStorageService: VideoStorageService,
    private cdr: ChangeDetectorRef
  ) {
    this.quality$ = this.store.select(VideoState.selectedQuality);
    this.bandwidth$ = this.store.select(VideoState.bandwidth);
  }

  ngOnInit(): void {
    this.initializeCamera();
    this.setupQualitySubscription();
  }

  private initializeCamera(): void {
    WebcamUtil.getAvailableVideoInputs()
      .then((devices: MediaDeviceInfo[]) => {
        this.availableWebcams = devices;
        if (devices.length > 0) {
          this.currentWebcam = devices[0];
          this.showNextWebcam.next(false);
        }
      })
      .catch(err => console.error('Error getting webcams:', err));
  }

  private setupQualitySubscription(): void {
    const qualitySub = this.quality$.pipe(
      filter(quality => quality !== undefined),
      tap(quality => {
        console.log('Quality updated:', quality);
        this.updateVideoQuality(quality);
      })
    ).subscribe();

    this.subscriptions.push(qualitySub);
  }

  private updateVideoQuality(quality: VideoQuality): void {
    const constraints: MediaTrackConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    };

    switch (quality) {
      case VideoQuality.LOW:
        constraints.width = { ideal: 640 };
        constraints.height = { ideal: 480 };
        constraints.frameRate = { ideal: 15 };
        break;
      case VideoQuality.MEDIUM:
        constraints.width = { ideal: 1280 };
        constraints.height = { ideal: 720 };
        constraints.frameRate = { ideal: 30 };
        break;
      case VideoQuality.HIGH:
        constraints.width = { ideal: 1920 };
        constraints.height = { ideal: 1080 };
        constraints.frameRate = { ideal: 60 };
        break;
    }

    this.videoOptions = constraints;
    this.restartCamera();
  }

  private restartCamera(): void {
    if (this.webcam) {
      (this.webcam as any).stopCamera();
      setTimeout(() => {
        (this.webcam as any).startCamera();
      }, 100);
    }
  }

  public handleInitError(error: WebcamInitError): void {
    console.error('Error initializing webcam:', error);
    this.errors.push(error);
  }

  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
  }

  public startRecording(): void {
    if (!this.webcam || this.isRecording) return;

    this.recordedChunks = [];
    this.recordingStartTime = Date.now();
    this.isRecording = true;
    this.recordingTime = 0;
    this.recordingProgress = 0;

    const videoElement = (this.webcam as any).video.nativeElement;
    if (!videoElement) {
      console.error('No video element available');
      return;
    }

    const mediaStream = videoElement.captureStream(30);
    this.mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const recording: VideoRecording = {
        id: uuidv4(),
        blob,
        timestamp: Date.now(),
        duration: this.recordingTime,
        quality: this.store.selectSnapshot(VideoState.selectedQuality) || VideoQuality.MEDIUM
      };

      this.videoStorageService.saveVideo(recording)
        .then(() => {
          this.store.dispatch(new AddVideo(recording));
          this.stopRecording();
        })
        .catch(error => {
          console.error('Error saving video:', error);
          this.stopRecording();
        });
    };

    this.mediaRecorder.start();
    this.startRecordingTimer();
  }

  private startRecordingTimer(): void {
    this.recordingTimer = setInterval(() => {
      this.recordingTime = (Date.now() - this.recordingStartTime) / 1000;
      this.recordingProgress = (this.recordingTime / this.maxRecordingTime) * 100;

      if (this.recordingTime >= this.maxRecordingTime) {
        this.stopRecording();
      }

      this.cdr.detectChanges();
    }, 100);
  }

  public stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.mediaRecorder = null;
    }

    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    this.isRecording = false;
    this.recordingTime = 0;
    this.recordingProgress = 0;
    this.cdr.detectChanges();
  }

  public toggleCamera(): void {
    const currentValue = this.showNextWebcam.value;
    this.showNextWebcam.next(!currentValue);
  }

  public cameraWasSwitched(deviceId: string): void {
    this.currentWebcam = this.availableWebcams.find(webcam => webcam.deviceId === deviceId) || null;
  }

  setQuality(quality: VideoQuality) {
    this.store.dispatch(new SetQuality(quality));
  }

  ngOnDestroy(): void {
    this.stopRecording();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
