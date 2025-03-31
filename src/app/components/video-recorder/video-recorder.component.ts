import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { WebcamComponent, WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { Store } from '@ngxs/store';
import { VideoState, AddVideo, LoadVideos } from '../../store/video.state';
import { VideoStorageService } from '../../services/video-storage.service';
import { v4 as uuidv4 } from 'uuid';
import { BehaviorSubject, Observable, Subscription, filter, tap, Subject } from 'rxjs';
import { VideoRecording } from '../../models/video.model';
import { BandwidthService, VideoQuality } from '../../services/bandwidth.service';

@Component({
  selector: 'app-video-recorder',
  templateUrl: './video-recorder.component.html',
  styleUrls: ['./video-recorder.component.scss']
})
export class VideoRecorderComponent implements OnInit, OnDestroy {
  @ViewChild('webcam') webcam!: WebcamComponent;

  // Webcam properties
  public webcamImage: WebcamImage | null = null;
  public errors: WebcamInitError[] = [];
  public videoOptions: MediaTrackConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    // Add advanced video constraints
    advanced: [
      {
        // Enable noise reduction and echo cancellation
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
    // Add advanced audio settings
    advanced: [{
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      // Attempt to reduce echo further
      channelCount: { ideal: 1 }, // Mono audio can help reduce echo
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
  public maxRecordingTime: number = 10; // 10 seconds max
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
  public videoQuality$: Observable<VideoQuality>;
  public bandwidth$: Observable<number>;

  constructor(
    private store: Store,
    private videoStorageService: VideoStorageService,
    private cdr: ChangeDetectorRef,
    private bandwidthService: BandwidthService
  ) {
    this.videoQuality$ = this.bandwidthService.quality$;
    this.bandwidth$ = this.bandwidthService.bandwidth$;
  }

  async ngOnInit(): Promise<void> {
    // Load existing videos first
    this.store.dispatch(new LoadVideos());
    
    this.initializeCamera();
    this.setupQualitySubscription();
    try {
      // Measure bandwidth on component init
      const bandwidth = await this.bandwidthService.measureBandwidth();
      console.log('Measured bandwidth:', bandwidth, 'Mbps');
    } catch (error) {
      console.error('Failed to measure bandwidth:', error);
      this.webcamError = 'Failed to measure bandwidth. Using medium quality.';
    }
  }

  private async getMediaStream(): Promise<MediaStream | null> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: this.videoOptions,
        audio: this.audioConstraints
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  }

  private async restartCamera(): Promise<void> {
    if (this.webcam) {
      // Get the current video track and stop it
      const videoElement = (this.webcam as any).video.nativeElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      try {
        // Get new stream with updated constraints
        const newStream = await this.getMediaStream();
        if (newStream && videoElement) {
          videoElement.srcObject = newStream;
          console.log('Camera restarted with new constraints');
        }
      } catch (error) {
        console.error('Error restarting camera:', error);
        this.webcamError = 'Failed to restart camera with new quality settings';
      }

      // Force Angular to detect changes
      this.cdr.detectChanges();
    }
  }

  private initializeCamera(): void {
    WebcamUtil.getAvailableVideoInputs()
      .then(async (devices: MediaDeviceInfo[]) => {
        this.availableWebcams = devices;
        if (devices.length > 0) {
          this.currentWebcam = devices[0];
          
          try {
            const stream = await this.getMediaStream();
            if (stream && this.webcam) {
              const videoElement = (this.webcam as any).video.nativeElement;
              if (videoElement) {
                videoElement.srcObject = stream;
                console.log('Camera initialized with stream');
              }
            }
          } catch (error) {
            console.error('Error initializing camera stream:', error);
            this.webcamError = 'Failed to initialize camera stream';
          }
        }
      })
      .catch(err => {
        console.error('Error getting webcams:', err);
        this.webcamError = 'Failed to initialize webcam. Please check permissions and try again.';
      });
  }

  private setupQualitySubscription(): void {
    const qualitySub = this.videoQuality$.pipe(
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
      frameRate: { ideal: 30 },
      advanced: [
        {
          noiseSuppression: true,
          echoCancellation: true
        }
      ]
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

  public handleInitError(error: WebcamInitError): void {
    console.error('Error initializing webcam:', error);
    this.errors.push(error);
  }

  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) return;

    try {
      const videoElement = (this.webcam as any).video.nativeElement;
      if (!videoElement || !videoElement.srcObject) {
        console.error('No video stream available');
        return;
      }

      const stream = videoElement.srcObject as MediaStream;
      
      // Ensure we have both audio and video tracks
      if (!stream.getAudioTracks().length) {
        // If no audio track, try to get a new stream with audio
        const newStream = await this.getMediaStream();
        if (!newStream) {
          throw new Error('Failed to get media stream with audio');
        }
        // Add audio track to existing stream
        newStream.getAudioTracks().forEach(track => stream.addTrack(track));
      }

      // Create a new MediaRecorder with the stream
      this.mediaRecorder = new MediaRecorder(stream, {
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
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const recording: VideoRecording = {
          id: uuidv4(),
          blob,
          timestamp: Date.now(),
          duration: Math.round(this.recordingTime * 1000), // Convert seconds to milliseconds
          quality: this.bandwidthService.getQuality()
        };

        // Only dispatch to store, the state will handle storage
        this.store.dispatch(new AddVideo(recording));
        this.recordedChunks = [];
      };

      // Request data every second while recording
      this.mediaRecorder.start(1000);
      this.startRecordingTimer();

      // Set timeout to stop recording after MAX_RECORDING_TIME
      this.recordingTimeout = setTimeout(() => {
        this.stopRecording();
      }, this.MAX_RECORDING_TIME);

    } catch (error) {
      console.error('Error starting recording:', error);
      this.webcamError = 'Failed to start recording. Please try again.';
      this.isRecording = false;
    }
  }

  private startRecordingTimer(): void {
    this.recordingTimer = setInterval(() => {
      const currentTime = Date.now();
      this.recordingTime = (currentTime - this.recordingStartTime) / 1000;
      this.recordingProgress = (this.recordingTime / this.maxRecordingTime) * 100;

      if (this.recordingTime >= this.maxRecordingTime) {
        this.stopRecording();
      }

      this.cdr.detectChanges();
    }, 100);
  }

  public stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      // Calculate final duration before stopping
      const finalDuration = Math.round((Date.now() - this.recordingStartTime));
      
      // Update the onstop callback to use the final duration
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const recording: VideoRecording = {
          id: uuidv4(),
          blob,
          timestamp: Date.now(),
          duration: finalDuration, // Use the final duration directly in milliseconds
          quality: this.bandwidthService.getQuality()
        };

        // Only dispatch to store, the state will handle storage
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

    // Reinitialize the camera to ensure it's still running
    this.initializeCamera();
  }

  public toggleCamera(): void {
    this.showNextWebcam.next();
  }

  public cameraWasSwitched(deviceId: string): void {
    this.currentWebcam = this.availableWebcams.find(webcam => webcam.deviceId === deviceId) || null;
  }

  setQuality(quality: VideoQuality) {
    this.bandwidthService.setQuality(quality);
  }

  ngOnDestroy(): void {
    this.stopRecording();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
