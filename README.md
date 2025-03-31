# Angular Bandwidth & Video Recording App

A responsive web application built with Angular 15 that measures user bandwidth, provides adaptive web camera quality settings, and allows recording and storing video snippets locally.

Live Demo: [https://hiblton.github.io/angular-bandwidth-app/](https://hiblton.github.io/angular-bandwidth-app/)

## Features

- **Automatic Bandwidth Detection**
  - Measures user's bandwidth on app load
  - Automatically selects optimal video quality
  - Fallback to Medium quality if detection fails

- **Adaptive Video Quality**
  - Low Quality (360p) for < 2 Mbps
  - Medium Quality (720p) for 2-5 Mbps
  - High Quality (1080p) for > 5 Mbps
  - Manual quality override available

- **Video Recording**
  - Up to 10 seconds recording length
  - Progress indicator
  - Manual stop option
  - Quality indicator

- **Video Management**
  - Persistent storage across sessions
  - Video playback
  - Delete functionality
  - Duration display

## Technology Stack

- Angular 15
- NGXS for state management
- LocalForage for persistent storage
- WebRTC for camera access and recording
- SCSS for styling

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/hiblton/angular-bandwidth-app.git
   cd angular-bandwidth-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm start
   ```

4. Open browser at `http://localhost:4200`

## Build

To build the project:
```bash
npm run build
```

The build artifacts will be stored in the `dist/angular-bandwidth-app` directory.

## Implementation Details

### State Management
- Using NGXS for centralized state management
- States include:
  - Video recordings
  - Bandwidth information
  - Selected quality
  - Loading states
  - Error states

### Persistence Strategy
- LocalForage for IndexedDB storage
- Video blobs are converted to base64 for storage
- Automatic cleanup of old recordings (30 days)
- Maximum 10 videos stored

### Video Recording
- WebRTC MediaRecorder API
- Quality settings:
  ```typescript
  LOW: { width: 640, height: 480, frameRate: 15 }
  MEDIUM: { width: 1280, height: 720, frameRate: 30 }
  HIGH: { width: 1920, height: 1080, frameRate: 60 }
  ```

### Bandwidth Detection
- Downloads a test file
- Measures download speed
- Uses multiple iterations for accuracy
- Fallback mechanism for failed detection

## Technical Challenges & Solutions

1. **Blob Storage**
   - Challenge: Storing large video blobs in IndexedDB
   - Solution: Base64 conversion with efficient chunking

2. **Memory Management**
   - Challenge: Memory leaks from video elements
   - Solution: Proper cleanup of blob URLs and MediaRecorder instances

3. **Quality Switching**
   - Challenge: Seamless camera quality changes
   - Solution: Stream restart with new constraints

4. **Browser Compatibility**
   - Challenge: Different browser implementations of MediaRecorder
   - Solution: Standardized video format (WebM) and codec selection

## Error Handling

- Camera permission denials
- Bandwidth detection failures
- Storage quota exceeded
- Device compatibility issues

## Future Improvements

1. Video thumbnails generation
2. Custom video player controls
3. Video sharing functionality
4. Better compression for storage
5. Network status monitoring

## License

MIT
