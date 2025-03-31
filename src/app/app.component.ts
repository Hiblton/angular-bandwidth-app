import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <div class="main-content">
        <app-video-recorder></app-video-recorder>
      </div>
      <div class="sidebar">
        <app-video-list></app-video-list>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      width: 100%;
      height: 100vh;
      background-color: var(--bg-color);
      padding: 20px;
      gap: 20px;
    }

    .main-content {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-color);
    }

    .sidebar {
      width: 320px;
      border-left: 1px solid var(--border-color);
      background-color: var(--bg-color);
    }
  `]
})
export class AppComponent {}
