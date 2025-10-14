import path from 'path';
import fs from 'fs';

import { FFmpegProducer } from './producer/ffmpeg';
import { AudioProducer } from './producer/audio';

export const debug = false;

export const ffmpegVersion = 'ffmpeg-n4.4';
export const ssrc = 22222222;

export const audioSsrc = 11111111;

export const mediaCodecs: any[] = [
  {
    kind: 'video',
    mimeType: 'video/vp8',
    clockRate: 90000,
  },
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
];

export const FFmpegLib = (() => {
  const lib = path.resolve(`lib/${ffmpegVersion}/bin/ffmpeg`);

  try {
    fs.readFileSync(lib);
    return lib;
  } catch (err) {
    return 'ffmpeg';
  }
})();

export const getCommandOptions = (url, options: { rtp: number; rtcp: number }) => {
  if (url.includes('rtsp')) {
    return [
      '-fflags',
      'nobuffer',
      '-flags',
      'low_delay',
      '-fflags',
      'discardcorrupt',
      '-rtsp_transport ',
      'tcp',
      '-i',
      url,
      '-q',
      '0',
      '-threads',
      '1',
      '-map',
      '0:v:0',
      '-c:v',
      'libvpx',
      '-deadline',
      'realtime',
      '-cpu-used',
      '1',
      '-f',
      'tee',
      `[select=v:f=rtp:ssrc=${ssrc}:payload_type=102]rtp://127.0.0.1:${options.rtp}?rtcpport=${options.rtcp}`,
    ];
  }

  // usb camera
  return [
    '-fflags',
    'nobuffer',
    '-flags',
    'low_delay',
    '-fflags',
    'discardcorrupt',
    '-f',
    'v4l2',
    '-i',
    url,
    '-threads',
    '1',
    '-map',
    '0:v:0',
    '-c:v',
    'libvpx',
    '-deadline',
    'realtime',
    '-cpu-used',
    '1',
    '-f',
    'tee',
    `[select=v:f=rtp:ssrc=${ssrc}:payload_type=102]rtp://127.0.0.1:${options.rtp}?rtcpport=${options.rtcp}`,
  ];
};

export const getProducer = (key) => {
  if (key === 'audio') {
    return AudioProducer;
  } else {
    return FFmpegProducer;
  }
};

//hw:1,0
export const getAudioCommand = (url, options: { rtp: number; rtcp: number }) => {
  if (url.includes('rtsp')) {
    return [
      '-fflags',
      'nobuffer',
      '-flags',
      'low_delay',
      '-fflags',
      'discardcorrupt',
      '-rtsp_transport ',
      'tcp',
      '-i',
      url,
      '-map',
      '0:a:0',
      '-acodec',
      'libopus',
      '-ab',
      '128k',
      '-ac',
      '2',
      '-ar',
      '48000',
      '-af',
      'highpass=200,lowpass=3000,afftdn',
      '-f',
      'tee',
      `[select=a:f=rtp:ssrc=${exports.audioSsrc}:payload_type=101]rtp://127.0.0.1:${options.rtp}?rtcpport=${options.rtcp}`,
    ];
  }
  return [
    '-ac',
    '2',
    '-f',
    'alsa',
    '-i',
    url,
    '-map',
    '0:a:0',
    '-acodec',
    'libopus',
    '-ab',
    '128k',
    '-ac',
    '2',
    '-ar',
    '48000',
    '-af',
    'highpass=200,lowpass=3000,afftdn',
    '-f',
    'tee',
    `[select=a:f=rtp:ssrc=${audioSsrc}:payload_type=101]rtp://127.0.0.1:${options.rtp}?rtcpport=${options.rtcp}`,
  ];
};
