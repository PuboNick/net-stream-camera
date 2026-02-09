# WebRTC 流媒体服务器

基于 Mediasoup 的高性能 WebRTC 网络视频流解决方案，支持多种视频源和实时通信功能。

## 功能特性

- **基于 Mediasoup** - 使用业界领先的 WebRTC 流媒体库，提供低延迟、高并发的视频传输
- **多源视频输入** - 支持 FFmpeg Producer 和 GStreamer Producer
- **多种协议支持** - 支持 RTSP 协议和 USB 摄像头输入
- **双向音频通信** - 支持音频播放和语音对讲功能
- **录制功能** - 支持网页端视频/音频录制和 Node.js 后台分片录制
- **内置播放器** - 集成多种视频播放器（ArtPlayer、Video.js、XGPlayer）
- **跨平台兼容** - 最低支持 Ubuntu 16.04，Node.js 16+
- **现代前端** - Web 端基于 React 18，兼容 React 19

## 项目结构

```
webrtc-server/
├── apps/
│   ├── server/          # WebRTC 服务端 (NestJS + Mediasoup)
│   ├── web-client/      # Web 客户端 (React + Vite)
│   ├── rtp-client/      # RTP 客户端处理
│   └── video-play/      # 视频播放器组件
├── package.json         # 根项目配置
├── tsconfig.json        # TypeScript 配置
└── yarn.lock           # 依赖锁定文件
```

## 技术栈

### 服务端
- **框架**: NestJS + Express
- **WebRTC**: Mediasoup
- **视频处理**: FFmpeg, GStreamer
- **通信**: WebSocket
- **音频**: Speaker (Node.js 音频输出)

### 客户端
- **框架**: React 18/19
- **构建工具**: Vite
- **WebRTC 客户端**: mediasoup-client
- **录制**: RecordRTC
- **UI 组件**: Ant Design

### 播放器支持
- ArtPlayer
- Video.js
- XGPlayer

## 环境要求

- **操作系统**: Ubuntu 16.04+ (推荐)
- **Node.js**: >= 16 (推荐 18+)
- **包管理器**: Yarn 或 PNPM
- **外部依赖**: FFmpeg, GStreamer (用于视频流处理)

## 快速开始

### 1. 安装依赖

```bash
# 安装根项目依赖
yarn install

# 初始化所有子项目
yarn boot
```

### 2. 构建项目

```bash
yarn build
```

### 3. 启动服务端

```bash
cd apps/server
yarn start:dev    # 开发模式
# 或
yarn start:prod   # 生产模式
```

服务端默认在 `8080` 端口启动。

### 4. 启动 Web 客户端

```bash
cd apps/web-client
yarn dev
```

客户端默认在 `5173` 端口启动。

## 使用说明

### 视频流播放

服务端支持多种视频源输入：

- **RTSP 流**: `rtsp://username:password@ip:port/path`
- **USB 摄像头**: `/dev/video0` (Linux)
- **本地文件**: 支持常见视频格式

### Web 客户端功能

1. **视频播放** - 实时播放 WebRTC 视频流
2. **视频录制** - 录制正在播放的视频流并下载
3. **语音对讲** - 按住说话按钮进行实时语音对讲
4. **音频播放** - 播放视频流的音频轨道

### API 接口

- `POST /wav/play` - 播放 WAV 音频文件（用于语音对讲）
- WebSocket `/webrtc` - WebRTC 信令通信

## 配置说明

服务端配置位于 `apps/server/src/meidasoup/configure.ts`，可调整：

- Mediasoup Worker 数量
- RTP 端口范围
- 音视频编解码配置
- WebRTC 传输配置

## 开发指南

### 添加新的视频源类型

在 `apps/server/src/meidasoup/producer/` 中创建新的 Producer 类，实现以下接口：

```typescript
interface Producer {
  createProducer(): Promise<void>;
  destroy(): Promise<void>;
}
```

### 自定义播放器

在 `apps/video-play/src/components/` 中添加新的播放器组件，参考现有实现。

## 系统架构

```
┌─────────────┐      WebSocket      ┌─────────────┐
│  Web Client │ ◄──────────────────► │   Server    │
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

## 许可证

UNLICENSED

## 支持与贡献

如有问题或建议，欢迎提交 Issue 或 Pull Request。
