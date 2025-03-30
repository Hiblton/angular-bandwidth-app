import { Injectable } from '@angular/core';
import { BandwidthInfo, VideoQuality } from '../models/video.model';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BandwidthService {
  private readonly TEST_FILE_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Moon.jpg/220px-Moon.jpg';
  private readonly TEST_ITERATIONS = 3;

  checkBandwidth(): Observable<BandwidthInfo> {
    return from(this.measureBandwidth()).pipe(
      map(speed => ({
        speed,
        quality: this.determineQuality(speed)
      }))
    );
  }

  private async measureBandwidth(): Promise<number> {
    const speeds: number[] = [];
    
    for (let i = 0; i < this.TEST_ITERATIONS; i++) {
      const startTime = performance.now();
      const response = await fetch(this.TEST_FILE_URL);
      const blob = await response.blob();
      const endTime = performance.now();
      
      const durationInSeconds = (endTime - startTime) / 1000;
      const fileSizeInBits = blob.size * 8;
      const speedMbps = (fileSizeInBits / durationInSeconds) / 1_000_000;
      
      speeds.push(speedMbps);
    }

    // Calculate average speed
    return speeds.reduce((a, b) => a + b, 0) / speeds.length;
  }

  private determineQuality(speedMbps: number): VideoQuality {
    if (speedMbps < 2) {
      return VideoQuality.LOW;
    } else if (speedMbps < 5) {
      return VideoQuality.MEDIUM;
    } else {
      return VideoQuality.HIGH;
    }
  }
}
