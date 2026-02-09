# WebRTC Streaming Server

A high-performance WebRTC network video streaming solution based on Mediasoup, supporting multiple video sources and real-time communication features.

## Features

- **Based on Mediasoup** - Uses industry-leading WebRTC streaming library for low-latency, high-concurrency video transmission
- **Multi-source Video Input** - Supports FFmpeg Producer and GStreamer Producer
- **Multiple Protocol Support** - Supports RTSP protocol and USB camera input
- **Bidirectional Audio Communication** - Supports audio playback and voice intercom
- **Recording Capability** - Supports web-side video/audio recording and Node.js backend segmented recording
- **Built-in Players** - Integrated multiple video players (ArtPlayer, Video.js, XGPlayer)
- **Cross-platform Compatible** - Minimum support for Ubuntu 16.04, Node.js 16+
- **Modern Frontend** - Web client based on React 18, compatible with React 19

## Project Structure

```
webrtc-server/
├── apps/
│   ├── server/          # WebRTC Server (NestJS + Mediasoup)
│   ├── web-client/      # Web Client (React + Vite)
│   ├── rtp-client/      # RTP Client Handler
│   └── video-play/      # Video Player Components
├── package.json         # Root Project Configuration
├── tsconfig.json        # TypeScript Configuration
└── yarn.lock           # Dependency Lock File
```

## Tech Stack

### Server
- **Framework**: NestJS + Express
- **WebRTC**: Mediasoup
- **Video Processing**: FFmpeg, GStreamer
- **Communication**: WebSocket
- **Audio**: Speaker (Node.js Audio Output)

### Client
- **Framework**: React 18/19
- **Build Tool**: Vite
- **WebRTC Client**: mediasoup-client
- **Recording**: RecordRTC
- **UI Components**: Ant Design

### Player Support
- ArtPlayer
- Video.js
- XGPlayer

## Requirements

- **OS**: Ubuntu 16.04+ (Recommended)
- **Node.js**: >= 16 (18+ Recommended)
- **Package Manager**: Yarn or PNPM
- **External Dependencies**: FFmpeg, GStreamer (for video stream processing)

## Quick Start

### 1. Install Dependencies

```bash
# Install root project dependencies
yarn install

# Initialize all sub-projects
yarn boot
```

### 2. Build Project

```bash
yarn build
```

### 3. Start Server

```bash
cd apps/server
yarn start:dev    # Development mode
# or
yarn start:prod   # Production mode
```

Server starts on port `8080` by default.

### 4. Start Web Client

```bash
cd apps/web-client
yarn dev
```

Client starts on port `5173` by default.

## Usage Guide

### Video Stream Playback

The server supports various video source inputs:

- **RTSP Stream**: `rtsp://username:password@ip:port/path`
- **USB Camera**: `/dev/video0` (Linux)
- **Local File**: Supports common video formats

### Web Client Features

1. **Video Playback** - Real-time WebRTC video stream playback
2. **Video Recording** - Record playing video streams and download
3. **Voice Intercom** - Press and hold to speak for real-time voice communication
4. **Audio Playback** - Play audio tracks from video streams

### API Endpoints

- `POST /wav/play` - Play WAV audio file (for voice intercom)
- WebSocket `/webrtc` - WebRTC signaling communication

## Configuration

Server configuration is located at `apps/server/src/meidasoup/configure.ts`, adjustable settings include:

- Mediasoup Worker count
- RTP port range
- Audio/video codec configuration
- WebRTC transport configuration

## Development Guide

### Adding New Video Source Types

Create a new Producer class in `apps/server/src/meidasoup/producer/`, implementing the following interface:

```typescript
interface Producer {
  createProducer(): Promise<void>;
  destroy(): Promise<void>;
}
```

### Custom Player

Add new player components in `apps/video-play/src/components/`, referencing existing implementations.

## System Architecture

```
┌─────────────┐      WebSocket      ┌─────────────┐
│  Web Client │ ◄─────────────────► │   Server    │
│  (React)    │      WebRTC         │  (Mediasoup)│
└─────────────┘                     └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
              ┌─────▼─────┐        ┌───────▼───────┐      ┌───────▼──────┐
              │  FFmpeg   │        │  GStreamer    │      │   USB Cam    │
              │  Producer │        │   Producer    │      │   Producer   │
              └───────────┘        └───────────────┘      └──────────────┘
```

## License

UNLICENSED

## Support & Contribution

For issues or suggestions, feel free to submit an Issue or Pull Request.
