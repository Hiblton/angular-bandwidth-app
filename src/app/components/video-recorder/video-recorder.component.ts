import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { WebcamComponent, WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { Store } from '@ngxs/store';
import { Subject, Observable, Subscription } from 'rxjs';
import { BandwidthService } from '../../services/bandwidth.service';
import { VideoQuality, VideoRecording, BandwidthInfo } from '../../types/video.types';
import { AddVideo, LoadVideos } from '../../store/video.actions';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-video-recorder',
  templateUrl: './video-recorder.component.html',
  styleUrls: ['./video-recorder.component.scss']
})
export class VideoRecorderComponent implements OnInit, OnDestroy {
  @ViewChild('webcam') webcam!: WebcamComponent;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  // Webcam properties
  public webcamImage: WebcamImage | null = null;
  public errors: WebcamInitError[] = [];
  public videoOptions: MediaTrackConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    advanced: [
      {
        noiseSuppression: true,
        echoCancellation: true
      }
    ]
  };

  // Audio constraints
  private audioConstraints: MediaTrackConstraints = {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    advanced: [{
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: { ideal: 1 },
      sampleRate: { ideal: 48000 },
      sampleSize: { ideal: 16 }
    }]
  };

  // Quality and bandwidth observables
  public readonly qualities: VideoQuality[] = [
    VideoQuality.LOW,
    VideoQuality.MEDIUM,
    VideoQuality.HIGH
  ];

  // Recording properties
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime: number = 0;
  private recordingTimer: any;
  public isRecording: boolean = false;
  public recordingTime: number = 0;
  public maxRecordingTime: number = 10000; // 10 seconds
  public recordingProgress: number = 0;

  // Camera controls
  public showNextWebcam = new Subject<void>();
  public availableWebcams: MediaDeviceInfo[] = [];
  public currentWebcam: MediaDeviceInfo | null = null;

  private subscriptions: Subscription[] = [];
  private readonly MAX_RECORDING_TIME = 10000; // 10 seconds
  private recordingTimeout: any;
  public webcamError: string | null = null;

  // Observables
  public bandwidth$: Observable<BandwidthInfo | null>;

  readonly VideoQuality = VideoQuality;
  readonly qualityConstraints = {
    [VideoQuality.LOW]: { width: 640, height: 480, frameRate: 15 },
    [VideoQuality.MEDIUM]: { width: 1280, height: 720, frameRate: 30 },
    [VideoQuality.HIGH]: { width: 1920, height: 1080, frameRate: 60 }
  };

  currentQuality: VideoQuality = VideoQuality.MEDIUM;
  stream: MediaStream | null = null;
  progressInterval: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private cdr: ChangeDetectorRef,
    private bandwidthService: BandwidthService
  ) {
    this.bandwidth$ = this.bandwidthService.bandwidth$;
  }

  async ngOnInit(): Promise<void> {
    try {
      this.store.dispatch(new LoadVideos());
      await this.measureBandwidth();
      await this.initializeCamera();
    } catch (error) {
      this.webcamError = 'Failed to initialize the application. Please check your camera permissions and try again.';
    }
  }

  private async getMediaStream(): Promise<MediaStream | null> {
    try {
      const constraints = {
        video: this.qualityConstraints[this.currentQuality],
        audio: this.audioConstraints
      };
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      this.webcamError = 'Error accessing media devices. Please check your camera and microphone permissions.';
      return null;
    }
  }

  private async restartCamera(): Promise<void> {
    if (this.webcam) {
      const videoElement = (this.webcam as any).video.nativeElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      try {
        const newStream = await this.getMediaStream();
        if (newStream && videoElement) {
          videoElement.srcObject = newStream;
          this.stream = newStream;
          this.webcamError = null;
        }
      } catch {
        this.webcamError = 'Failed to restart camera with new quality settings';
      }

      this.cdr.detectChanges();
    }
  }

  private async initializeCamera(): Promise<void> {
    try {
      const devices = await WebcamUtil.getAvailableVideoInputs();
      this.availableWebcams = devices;
      
      if (devices.length === 0) {
        throw new Error('No cameras found');
      }

      this.currentWebcam = devices[0];
      const stream = await this.getMediaStream();
      
      if (!stream) {
        throw new Error('Failed to get media stream');
      }

      if (this.webcam) {
        const videoElement = (this.webcam as any).video.nativeElement;
        if (videoElement) {
          videoElement.srcObject = stream;
          this.stream = stream;
          this.webcamError = null;
        } else {
          throw new Error('Video element not found');
        }
      }
    } catch (error) {
      this.webcamError = 'Failed to initialize webcam. Please check your camera permissions and try again.';
    }
  }

  private updateVideoQuality(quality: VideoQuality): void {
    this.currentQuality = quality;
    this.videoOptions = this.qualityConstraints[quality];
    this.restartCamera();
  }

  public handleInitError(error: WebcamInitError): void {
    if (!this.errors.some(e => e.message === error.message)) {
      this.errors.push(error);
    }
  }

  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) return;

    try {
      if (!this.stream) {
        await this.initializeCamera();
      }

      if (!this.stream) {
        throw new Error('No video stream available');
      }

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      this.recordedChunks = [];
      this.recordingStartTime = Date.now();
      this.isRecording = true;
      this.recordingTime = 0;
      this.recordingProgress = 0;

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const duration = Date.now() - this.recordingStartTime;
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const recording: VideoRecording = {
          id: uuidv4(),
          blob,
          timestamp: Date.now(),
          duration,
          quality: this.currentQuality
        };

        this.store.dispatch(new AddVideo(recording));
        this.recordedChunks = [];
      };

      this.mediaRecorder.start(1000);
      this.startRecordingTimer();

      this.recordingTimeout = setTimeout(() => {
        this.stopRecording();
      }, this.MAX_RECORDING_TIME);

    } catch (error) {
      this.webcamError = 'Failed to start recording. Please try again.';
      this.isRecording = false;
    }
  }

  private startRecordingTimer(): void {
    this.recordingTimer = setInterval(() => {
      const elapsed = Date.now() - this.recordingStartTime;
      this.recordingTime = elapsed / 1000; // Convert to seconds for display
      this.recordingProgress = (elapsed / this.maxRecordingTime) * 100;

      if (elapsed >= this.maxRecordingTime) {
        this.stopRecording();
      }

      this.cdr.detectChanges();
    }, 100);
  }

  public stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      const duration = Date.now() - this.recordingStartTime;
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const recording: VideoRecording = {
          id: uuidv4(),
          blob,
          timestamp: Date.now(),
          duration,
          quality: this.currentQuality
        };

        this.store.dispatch(new AddVideo(recording));
        this.recordedChunks = [];
      };

      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }

    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }

    this.isRecording = false;
    this.recordingTime = 0;
    this.recordingProgress = 0;
    this.cdr.detectChanges();
  }

  public toggleCamera(): void {
    this.showNextWebcam.next();
  }

  public cameraWasSwitched(deviceId: string): void {
    this.currentWebcam = this.availableWebcams.find(webcam => webcam.deviceId === deviceId) || null;
  }

  async updateQuality(quality: VideoQuality) {
    this.updateVideoQuality(quality);
  }

  private async measureBandwidth() {
    try {
      const bandwidthInfo = await this.bandwidthService.measureBandwidth();
      this.currentQuality = bandwidthInfo.quality;
      this.updateVideoQuality(this.currentQuality);
    } catch {
      this.currentQuality = VideoQuality.MEDIUM;
      this.updateVideoQuality(this.currentQuality);
    }
  }

  private stopMediaTracks() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  private clearProgressInterval() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.stopRecording();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
    this.stopMediaTracks();
    this.clearProgressInterval();
  }
}
