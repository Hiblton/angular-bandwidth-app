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
      const videos = await this.getVideos();
      
      // If we're at the limit, remove the oldest video
      if (videos.length >= this.MAX_VIDEOS) {
        console.log('Storage limit reached, removing oldest video');
        videos.sort((a, b) => a.timestamp - b.timestamp);
        videos.shift(); // Remove oldest video
      }

      videos.push(recording);
      await this.saveToStorage(videos);
    } catch (error) {
      console.error('Error saving video:', error);
      throw error;
    }
  }

  async getVideos(): Promise<VideoRecording[]> {
    try {
      const videos = await localforage.getItem<VideoRecording[]>(this.STORAGE_KEY);
      return videos || [];
    } catch (error) {
      console.error('Error getting videos from storage:', error);
      return [];
    }
  }

  async deleteVideo(id: string): Promise<void> {
    try {
      const videos = await this.getVideos();
      const filteredVideos = videos.filter(video => video.id !== id);
      await this.saveToStorage(filteredVideos);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  private async saveToStorage(videos: VideoRecording[]): Promise<void> {
    try {
      await localforage.setItem(this.STORAGE_KEY, videos);
    } catch (error) {
      console.error('Error saving videos to storage:', error);
      throw error;
    }
  }

  private async cleanupOldRecordings(): Promise<void> {
    try {
      const videos = await this.getVideos();
      
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
} 