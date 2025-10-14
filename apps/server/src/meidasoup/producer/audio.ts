import { WatchDog } from 'pubo-utils';
import * as mediasoup from 'mediasoup';
import { spawn } from 'child_process';
import { audioSsrc, FFmpegLib, getAudioCommand, debug } from '../configure';
import { ProducerState, getRouter } from '../state';
import { SIGKILL } from 'pubo-node';

export class AudioProducer {
  public url: string;
  public producer: mediasoup.types.Producer;
  public transport: mediasoup.types.PlainTransport;
  public options: any = {};
  public destroyed = false;
  public loading = false;

  private child: any;
  private readonly dog = new WatchDog({ limit: 60, onTimeout: this.destroy.bind(this) });

  constructor({ url }) {
    this.url = url;
  }

  async createProducer() {
    this.loading = true;
    const router = await getRouter();
    this.transport = await router.createPlainTransport({ listenIp: '127.0.0.1', rtcpMux: false, comedia: true });
    this.producer = await this.transport.produce({
      kind: 'audio',
      rtpParameters: {
        codecs: [
          {
            mimeType: 'audio/opus',
            clockRate: 48000,
            payloadType: 101,
            rtcpFeedback: [],
            channels: 2,
            parameters: { 'sprop-stereo': 1 },
          },
        ],
        encodings: [{ ssrc: audioSsrc }],
      },
    });
    this.createInstance();
    this.loading = false;
  }

  private createInstance() {
    this.options = getAudioCommand(this.url, {
      rtp: this.transport.tuple.localPort,
      rtcp: this.transport.rtcpTuple.localPort,
    });

    if (debug) {
      console.log(this.options.join(' '));
    }
    this.child = spawn(FFmpegLib, this.options, { detached: true, shell: true });
    this.dog?.feed();
    this.child.stderr.on('data', (buf) => {
      if (debug) {
        console.log(buf.toString());
      }
      this.dog?.feed();
    });
  }

  async kill() {
    this.dog?.stop();
    (this as any).dog = null;
    await SIGKILL(this.child.pid);
  }

  async destroy() {
    if (this.destroyed) {
      return false;
    }

    ProducerState.remove(this.url);
    this.destroyed = true;
    this.producer.close();
    this.transport.close();
    this.producer = null;
    this.transport = null;
    await this.kill();
    return true;
  }
}
