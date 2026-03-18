import Speaker from 'speaker';
import { SyncQueue, WatchDog } from 'pubo-utils';
import { Reader } from 'wav';
import * as SparkMd5 from 'spark-md5';

export class YKAudioSpeaker {
  private static _instance: YKAudioSpeaker | null = null;
  public static get instance() {
    if (!this._instance) {
      this._instance = new YKAudioSpeaker();
    }
    return this._instance;
  }
  formatMd5 = '';

  speaker: Speaker | null = null;
  dog = new WatchDog({
    limit: 10,
    onTimeout: () => {
      this.speaker?.destroy();
      this.speaker = null;
    },
  });
  queue = new SyncQueue();

  async _play(buffer) {
    this.dog.feed();
    const reader = new Reader();
    reader.on('format', (format) => {
      const md5 = SparkMd5.hash(JSON.stringify(format));
      if (!this.speaker || this.formatMd5 !== md5) {
        this.speaker?.destroy();
        this.speaker = new Speaker(format);
        this.formatMd5 = md5;
      }
      reader.on('data', (chunk) => {
        this.speaker?.write(chunk);
      });
    });

    reader.write(buffer);
  }

  async play(buffer) {
    return this.queue.push(() => this._play(buffer));
  }
}
