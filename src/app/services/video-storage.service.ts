import { Injectable } from '@angular/core';
import localforage from 'localforage';
import { VideoRecording } from '../types/video.types';

@Injectable({
  providedIn: 'root'
})
export class VideoStorageService {
  private readonly STORAGE_KEY = 'recorded_videos';
  private readonly MAX_VIDEOS = 10;
  private readonly MAX_AGE_DAYS = 30;

  async saveVideo(recording: VideoRecording): Promise<void> {
    const videos = await this.getVideosFromStorage();
    
    if (videos.length >= this.MAX_VIDEOS) {
      const oldestVideo = videos.reduce((oldest, current) => 
        current.timestamp < oldest.timestamp ? current : oldest
      );
      await this.deleteVideo(oldestVideo.id);
    }

    const videoToSave = {
      ...recording,
      blob: recording.blob instanceof Blob ? await this.blobToBase64(recording.blob) : recording.blob
    };

    const updatedVideos = [...videos, videoToSave];
    await this.saveVideosToStorage(updatedVideos);
  }

  async getVideos(): Promise<VideoRecording[]> {
    try {
      const videos = await this.getVideosFromStorage();
      const convertedVideos = await Promise.all(
        videos.map(async video => ({
          ...video,
          blob: typeof video.blob === 'string' ? await this.base64ToBlob(video.blob) : video.blob
        }))
      );
      
      await this.cleanupOldRecordings();
      return convertedVideos;
    } catch (error) {
      return [];
    }
  }

  private async getVideosFromStorage(): Promise<VideoRecording[]> {
    const videos = await localforage.getItem<VideoRecording[]>(this.STORAGE_KEY);
    return videos || [];
  }

  async deleteVideo(id: string): Promise<void> {
    try {
      const videos = await this.getVideosFromStorage();
      const updatedVideos = videos.filter(video => video.id !== id);
      await this.saveVideosToStorage(updatedVideos);
    } catch (error) {
      throw new Error('Failed to delete video');
    }
  }

  private async saveVideosToStorage(videos: VideoRecording[]): Promise<void> {
    try {
      await localforage.setItem(this.STORAGE_KEY, videos);
    } catch (error) {
      throw new Error('Failed to save videos to storage');
    }
  }

  private async cleanupOldRecordings(): Promise<void> {
    try {
      const videos = await this.getVideosFromStorage();
      const now = Date.now();
      const maxAge = this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      const updatedVideos = videos.filter(video => now - video.timestamp <= maxAge);
      
      if (updatedVideos.length !== videos.length) {
        await this.saveVideosToStorage(updatedVideos);
      }
    } catch (error) {
      throw new Error('Failed to clean up old recordings');
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64String: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        if (!base64String || !base64String.includes(',')) {
          throw new Error('Invalid base64 string');
        }
        const byteString = atob(base64String.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: 'video/webm' });
        resolve(blob);
      } catch (error) {
        reject(new Error('Failed to convert base64 to blob'));
      }
    });
  }
} 