import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRecorder, useWebrtc, WebRtcProps } from './lib';
import RecordRTC from 'recordrtc';
import axios from 'axios';
import { downloadFile } from 'pubo-web';

const baseURI = `ws://127.0.0.1:8080/webrtc?host=127.0.0.1`;

export const WebrtcAudio = ({ url }: any) => {
  const remoteAudioRef: any = useRef();
  const [audioPause, setAudioPause] = React.useState(true);
  const options = useMemo<WebRtcProps>(() => {
    return { url, el: remoteAudioRef, paused: audioPause, type: 'audio', baseURI };
  }, [url, audioPause]);

  useWebrtc(options);

  return (
    <>
      <div
        style={{
          width: '20px',
          height: '20px',
          visibility: 'hidden',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: -1,
        }}
        ref={remoteAudioRef}
      />
      <button
        onClick={() => {
          setAudioPause((o) => !o);
        }}
      >
        {audioPause ? '播放' : '暂停'}
      </button>
    </>
  );
};

export function WebrtcVideo() {
  const remoteVideoRef: any = useRef();
  const [recording, setRecording] = useState<boolean>(false);

  const webrtc = useWebrtc({
    url: 'rtsp://admin:yikun606@192.168.2.252:554/h264/ch1/sub/av_stream',
    el: remoteVideoRef,
    paused: false,
    baseURI,
  });

  useRecorder({
    recording,
    rtc: webrtc.rtc,
    onRecord: (blob) => {
      downloadFile(URL.createObjectURL(blob), 'test.webm');
    },
  });

  return (
    <>
      <div style={{ width: '900px', height: '600px', backgroundColor: '#000' }} ref={remoteVideoRef} />
      <button
        onClick={() => {
          setRecording((o) => !o);
        }}
      >
        {recording ? '停止录制' : '录制视频'}
      </button>
    </>
  );
}

export function Speaker() {
  const cache = useMemo<{ recorder: RecordRTC | null; stream: null | MediaStream }>(
    () => ({ ws: null, recorder: null, stream: null }),
    [],
  );

  const record = useCallback(async () => {
    if (!cache.stream) {
      cache.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
    if (cache.recorder) {
      cache.recorder.destroy();
    }
    const recorder = new RecordRTC(cache.stream, {
      mimeType: 'audio/wav',
      type: 'audio',
      recorderType: RecordRTC.StereoAudioRecorder,
      timeSlice: 12000,
    });
    recorder.startRecording();
    cache.recorder = recorder;
  }, []);

  const stop = useCallback(async () => {
    if (!cache.recorder) {
      return;
    }
    cache.recorder.stopRecording(async () => {
      if (!cache.recorder) {
        return;
      }
      const blob = cache.recorder.getBlob();
      const file = new File([blob], 'track.wav');
      const form = new FormData();
      form.append('file', file);
      await axios.post('http://localhost:8080/wav/play', form);
    });
  }, []);

  useEffect(() => {
    return () => {
      cache.recorder?.destroy();
      cache.stream?.getTracks().forEach((track) => track.stop());
      cache.stream = null;
    };
  });

  return (
    <button onMouseDown={record} onMouseUp={stop}>
      按下说话
    </button>
  );
}

export function App() {
  return (
    <div className="App">
      <WebrtcVideo />
      <WebrtcAudio url="rtsp://admin:yikun606@192.168.2.252:554/h264/ch1/main/av_stream" />
      <Speaker />
    </div>
  );
}
