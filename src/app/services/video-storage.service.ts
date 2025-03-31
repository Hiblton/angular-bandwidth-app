import { Injectable } from '@angular/core';
import { VideoRecording } from '../models/video.model';
import * as localforage from 'localforage';

@Injectable({
  providedIn: 'root'
})
export class VideoStorageService {
  private readonly STORAGE_KEY = 'recorded_videos';
  private readonly MAX_VIDEOS = 10; // Maximum number of videos to store

  constructor() {
    this.cleanupOldRecordings();
  }

  async saveVideo(recording: VideoRecording): Promise<void> {
    try {
      const videos = await this.getVideosFromStorage();
      
      // If we're at the limit, remove the oldest video
      if (videos.length >= this.MAX_VIDEOS) {
        console.log('Storage limit reached, removing oldest video');
        videos.sort((a, b) => a.timestamp - b.timestamp);
        videos.shift(); // Remove oldest video
      }

      console.log('Saving video with duration:', recording.duration);

      // Convert blob to base64 before saving
      const videoToSave = {
        ...recording,
        blob: await this.blobToBase64(recording.blob as Blob)
      };

      console.log('Video to save duration:', videoToSave.duration);
      videos.push(videoToSave);
      await this.saveToStorage(videos);
    } catch (error) {
      console.error('Error saving video:', error);
      throw error;
    }
  }

  async getVideos(): Promise<VideoRecording[]> {
    try {
      const videos = await this.getVideosFromStorage();
      if (!videos || !videos.length) return [];

      console.log('Retrieved videos from storage:', videos.map(v => ({ id: v.id, duration: v.duration })));

      // Convert base64 back to blob
      const convertedVideos = await Promise.all(videos.map(async video => {
        console.log('Processing video duration:', video.duration);
        return {
          ...video,
          blob: video.blob instanceof Blob ? video.blob : await this.base64ToBlob(video.blob as string)
        };
      }));

      console.log('Converted videos:', convertedVideos.map(v => ({ id: v.id, duration: v.duration })));
      return convertedVideos;
    } catch (error) {
      console.error('Error getting videos from storage:', error);
      return [];
    }
  }

  private async getVideosFromStorage(): Promise<VideoRecording[]> {
    const videos = await localforage.getItem<VideoRecording[]>(this.STORAGE_KEY);
    if (videos) {
      console.log('Raw videos from storage:', videos.map(v => ({ id: v.id, duration: v.duration })));
    }
    return videos || [];
  }

  async deleteVideo(id: string): Promise<void> {
    try {
      const videos = await this.getVideosFromStorage();
      const filteredVideos = videos.filter(video => video.id !== id);
      await this.saveToStorage(filteredVideos);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  private async saveToStorage(videos: VideoRecording[]): Promise<void> {
    try {
      console.log('Saving videos to storage with durations:', videos.map(v => ({ id: v.id, duration: v.duration })));
      await localforage.setItem(this.STORAGE_KEY, videos);
    } catch (error) {
      console.error('Error saving videos to storage:', error);
      throw error;
    }
  }

  private async cleanupOldRecordings(): Promise<void> {
    try {
      const videos = await this.getVideosFromStorage();
      
      // Remove videos older than 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      let filteredVideos = videos.filter(video => video.timestamp > thirtyDaysAgo);
      
      // If still too many videos, keep only the most recent ones
      if (filteredVideos.length > this.MAX_VIDEOS) {
        filteredVideos.sort((a, b) => b.timestamp - a.timestamp);
        filteredVideos = filteredVideos.slice(0, this.MAX_VIDEOS);
      }
      
      if (filteredVideos.length !== videos.length) {
        await this.saveToStorage(filteredVideos);
      }
    } catch (error) {
      console.error('Error cleaning up old recordings:', error);
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
        console.error('Error converting base64 to blob:', error);
        reject(error);
      }
    });
  }
} 