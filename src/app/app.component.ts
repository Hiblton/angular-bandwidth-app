import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoRecorderComponent } from './components/video-recorder/video-recorder.component';
import { VideoListComponent } from './components/video-list/video-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    VideoRecorderComponent,
    VideoListComponent
  ],
  template: `
    <div class="app-container">
      <div class="recorder-section">
        <app-video-recorder></app-video-recorder>
      </div>
      <div class="list-section">
        <app-video-list></app-video-list>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      padding: 20px;
      height: 100vh;
      box-sizing: border-box;
      background-color: var(--light-color);
    }

    .recorder-section, .list-section {
      height: 100%;
      overflow-y: auto;
      background: white;
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
    }

    @media (max-width: 768px) {
      .app-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
      }
    }
  `]
})
export class AppComponent {}
