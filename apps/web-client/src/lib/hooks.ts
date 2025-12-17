import { waitFor } from 'pubo-utils';
import { useCallback, useEffect, useMemo } from 'react';

import { WebRTCClientConn } from './connection';

class Recorder {
  private rtc: WebRTCClientConn | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recording = false;

  async start(rtc: WebRTCClientConn) {
    if (this.recording) {
      this.destroy();
    }
    this.rtc = rtc;
    waitFor(() => this.rtc?.stream);
    this.mediaRecorder = new MediaRecorder(this.rtc.stream);
    this.mediaRecorder.start();
    this.recording = true;
  }

  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.recording || this.mediaRecorder.state === 'inactive') {
        this.recording = false;
        return resolve(null);
      }
      this.recording = false;
      const onEnd = (event: any) => {
        resolve(event.data);
        this.mediaRecorder?.removeEventListener('dataavailable', onEnd);
        this.mediaRecorder = null;
      };
      this.mediaRecorder.addEventListener('dataavailable', onEnd);
      this.mediaRecorder.stop();
      return false;
    });
  }

  destroy() {
    if (this.recording) {
      this.mediaRecorder?.stop();
    }
  }
}

export interface WebRtcProps {
  url: string;
  el: any;
  baseURI: string;
  paused: boolean;
  type?: 'video' | 'audio';
}

interface RecorderProps {
  recording?: boolean;
  onRecord: (blob: Blob) => void | Promise<void>;
  rtc: any;
}

export const useRecorder = ({ recording, onRecord, rtc }: RecorderProps) => {
  const cache = useMemo<{ recorder: Recorder | null; instance: any }>(
    () => ({ recorder: new Recorder(), instance: null }),
    [],
  );
  useEffect(() => {
    if (recording && cache.recorder && rtc) {
      cache.recorder.start(rtc);
    } else if (cache.recorder && rtc) {
      cache.recorder.stop().then((blob) => blob && onRecord(blob));
    }
  }, [recording, rtc]);
};

export const useWebrtc = ({ url, el, baseURI, paused, type = 'video' }: WebRtcProps) => {
  const cache = useMemo<{ rtc: WebRTCClientConn | null; instance: any }>(() => ({ rtc: null, instance: null }), []);

  const createDom = useCallback(() => {
    el.current.innerHTML = '';
    cache.instance = document.createElement(type);
    cache.instance.style.width = '100%';
    cache.instance.style.height = '100%';
    cache.instance.control = false;
    cache.instance.muted = type === 'video';
    cache.instance.autoplay = true;
    el.current.appendChild(cache.instance);
  }, [el]);

  const init = useCallback(async () => {
    if (cache.rtc) {
      cache.rtc.close();
      cache.instance = null;
    }
    await waitFor(() => el.current, { checkTime: 100 });
    createDom();
    cache.rtc = new WebRTCClientConn({ url, el: cache.instance, baseURI, type });
  }, [url, el]);

  useEffect(() => {
    if (url) {
      init();
    }

    return () => {
      if (cache.rtc) {
        cache.rtc.close();
        cache.instance = null;
      }
    };
  }, [url, el]);

  useEffect(() => {
    if (!cache.instance) {
      return;
    }
    if (paused) {
      cache.instance.pause();
    } else {
      cache.instance.play();
    }
  }, [paused]);

  return cache;
};
