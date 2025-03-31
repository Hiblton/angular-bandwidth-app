import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { VideoQuality, BandwidthInfo } from '../types/video.types';

@Injectable({
  providedIn: 'root'
})
export class BandwidthService {
  private readonly TEST_FILE_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Moon.jpg/1024px-Moon.jpg';
  private readonly TEST_ITERATIONS = 3;
  private readonly QUALITY_THRESHOLDS = {
    HIGH: 5,   // Mbps
    MEDIUM: 2  // Mbps
  };

  private bandwidthSubject = new BehaviorSubject<BandwidthInfo | null>(null);
  bandwidth$ = this.bandwidthSubject.asObservable();

  async measureBandwidth(): Promise<BandwidthInfo> {
    try {
      const speeds: number[] = [];
      
      for (let i = 0; i < this.TEST_ITERATIONS; i++) {
        const startTime = performance.now();
        const response = await fetch(`${this.TEST_FILE_URL}?t=${Date.now()}`);
        const blob = await response.blob();
        const endTime = performance.now();
        
        const duration = (endTime - startTime) / 1000; // seconds
        const fileSize = blob.size / (1024 * 1024); // MB
        const speed = fileSize / duration; // MB/s
        speeds.push(speed * 8); // Convert to Mbps
      }

      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      const quality = this.determineQuality(avgSpeed);
      const bandwidthInfo: BandwidthInfo = { speed: avgSpeed, quality };
      
      this.bandwidthSubject.next(bandwidthInfo);
      return bandwidthInfo;
    } catch (error) {
      const fallbackInfo: BandwidthInfo = {
        speed: 0,
        quality: VideoQuality.MEDIUM
      };
      this.bandwidthSubject.next(fallbackInfo);
      return fallbackInfo;
    }
  }

  private determineQuality(speed: number): VideoQuality {
    if (speed >= this.QUALITY_THRESHOLDS.HIGH) {
      return VideoQuality.HIGH;
    } else if (speed >= this.QUALITY_THRESHOLDS.MEDIUM) {
      return VideoQuality.MEDIUM;
    }
    return VideoQuality.LOW;
  }
}
