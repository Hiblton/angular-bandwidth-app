import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
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

    .recorder-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }

    .list-section {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 20px;
      overflow: hidden;
    }
  `]
})
export class AppComponent {}
