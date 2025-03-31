import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum VideoQuality {
  LOW = '360p',
  MEDIUM = '720p',
  HIGH = '1080p'
}

@Injectable({
  providedIn: 'root'
})
export class BandwidthService {
  private readonly TEST_FILE_SIZE = 1024 * 1024; // 1MB test file
  private readonly TEST_ITERATIONS = 3;
  private readonly TIMEOUT_MS = 10000;

  private bandwidthSubject = new BehaviorSubject<number>(0);
  private qualitySubject = new BehaviorSubject<VideoQuality>(VideoQuality.MEDIUM);

  bandwidth$ = this.bandwidthSubject.asObservable();
  quality$ = this.qualitySubject.asObservable();

  async measureBandwidth(): Promise<number> {
    try {
      const speeds: number[] = [];
      
      // Create a test file with random data
      const testData = new Uint8Array(this.TEST_FILE_SIZE);
      for (let i = 0; i < this.TEST_FILE_SIZE; i++) {
        testData[i] = Math.floor(Math.random() * 256);
      }
      const testBlob = new Blob([testData], { type: 'application/octet-stream' });
      const testUrl = URL.createObjectURL(testBlob);
      
      for (let i = 0; i < this.TEST_ITERATIONS; i++) {
        const startTime = performance.now();
        const response = await fetch(testUrl, {
          cache: 'no-store'
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const blob = await response.blob();
        const endTime = performance.now();
        
        const durationSeconds = (endTime - startTime) / 1000;
        const fileSizeInBits = blob.size * 8;
        const speedMbps = (fileSizeInBits / durationSeconds) / 1_000_000;
        
        speeds.push(speedMbps);
      }

      // Clean up the test URL
      URL.revokeObjectURL(testUrl);

      // Calculate average speed
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      this.bandwidthSubject.next(avgSpeed);
      
      // Set quality based on bandwidth
      if (avgSpeed < 2) {
        this.qualitySubject.next(VideoQuality.LOW);
      } else if (avgSpeed <= 5) {
        this.qualitySubject.next(VideoQuality.MEDIUM);
      } else {
        this.qualitySubject.next(VideoQuality.HIGH);
      }

      return avgSpeed;
    } catch (error) {
      console.error('Bandwidth measurement failed:', error);
      // Default to medium quality on error
      this.qualitySubject.next(VideoQuality.MEDIUM);
      return 3; // Default to 3 Mbps
    }
  }

  setQuality(quality: VideoQuality) {
    this.qualitySubject.next(quality);
  }

  getQuality(): VideoQuality {
    return this.qualitySubject.value;
  }
}
