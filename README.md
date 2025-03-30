# Angular Bandwidth Check and Video Recorder

A responsive web application built with Angular that evaluates the user's bandwidth and provides video recording capabilities with dynamic quality settings.

## Features

- **Bandwidth Check**
  - Automatically measures user's bandwidth on app load
  - Determines video quality based on bandwidth:
    - Low Quality (360p): < 2 Mbps
    - Medium Quality (720p): 2-5 Mbps
    - High Quality (1080p): > 5 Mbps

- **Video Recording**
  - Record video snippets up to 10 seconds
  - Manual quality selection override
  - Real-time recording timer
  - Automatic quality adjustment based on bandwidth

- **Video Management**
  - List of recorded videos with thumbnails
  - Video playback controls
  - Delete functionality
  - Persistent storage (videos remain after page refresh)

## Technical Details

- **State Management**: NGXS for centralized state management
- **Storage**: LocalStorage with Base64 encoding for video persistence
- **Video Processing**: MediaRecorder API for video capture and WebM format
- **Styling**: CSS Grid and Flexbox for responsive layout

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Modern web browser with webcam support

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd angular-bandwidth-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:4200`

## Implementation Details

### Bandwidth Detection
The application uses a test file download to measure bandwidth. It performs multiple measurements and averages them for accuracy.

### Video Storage
Videos are stored in the browser's LocalStorage:
- Video blobs are converted to Base64 strings for storage
- Metadata (quality, duration, timestamp) is stored alongside the video
- Videos older than 30 days are automatically cleaned up

### Error Handling
- Graceful fallback to medium quality if bandwidth detection fails
- User notifications for camera access issues
- Validation for storage limits and video duration

## Browser Support

Tested and supported in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Known Limitations

- LocalStorage has a size limit (typically 5-10MB)
- Video quality is limited by the user's camera capabilities
- Bandwidth measurement may vary based on network conditions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
