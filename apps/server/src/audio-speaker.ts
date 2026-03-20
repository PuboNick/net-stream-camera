import { SyncQueue, WatchDog } from 'pubo-utils';
import { Reader } from 'wav';
import * as SparkMd5 from 'spark-md5';

interface AudioFormat {
  audioFormat?: number;
  numChannels?: number;
  sampleRate?: number;
  byteRate?: number;
  blockAlign?: number;
  bitsPerSample?: number;
}

/**
 * 二阶带通滤波器（Biquad Bandpass Filter）
 * 人声频率范围: 300Hz - 3400Hz
 */
class BandpassFilter {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  private readonly b0: number;
  private readonly b1: number;
  private readonly b2: number;
  private readonly a1: number;
  private readonly a2: number;

  constructor(sampleRate: number, lowFreq: number, highFreq: number, Q = 0.7) {
    // 中心频率和带宽
    const centerFreq = Math.sqrt(lowFreq * highFreq);

    // Biquad 带通滤波器系数计算
    const omega = (2 * Math.PI * centerFreq) / sampleRate;
    const sinOmega = Math.sin(omega);
    const cosOmega = Math.cos(omega);
    const alpha = sinOmega / (2 * Q);

    const b0 = alpha;
    const b1 = 0;
    const b2 = -alpha;
    const a0 = 1 + alpha;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha;

    // 归一化
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
  }

  /** 处理单个采样点 */
  process(x0: number): number {
    const y0 = this.b0 * x0 + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x0;
    this.y2 = this.y1;
    this.y1 = y0;
    return y0;
  }

  /** 重置滤波器状态 */
  reset(): void {
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
  }
}

/** 多通道带通滤波器 */
class MultiChannelFilter {
  private filters: BandpassFilter[];
  private readonly numChannels: number;

  constructor(numChannels: number, sampleRate: number, lowFreq = 300, highFreq = 3400) {
    this.numChannels = numChannels;
    this.filters = Array.from({ length: numChannels }, () => new BandpassFilter(sampleRate, lowFreq, highFreq));
  }

  /** 处理 PCM 音频数据 */
  process(chunk: Buffer, bitsPerSample: number): Buffer {
    const result = Buffer.alloc(chunk.length);
    const bytesPerSample = bitsPerSample / 8;
    const isFloat = bitsPerSample === 32;

    for (let i = 0; i < chunk.length; i += bytesPerSample) {
      const channelIndex = Math.floor(i / bytesPerSample) % this.numChannels;

      let sample: number;
      if (isFloat) {
        sample = chunk.readFloatLE(i);
      } else if (bitsPerSample === 8) {
        sample = chunk.readUInt8(i) - 128;
      } else if (bitsPerSample === 16) {
        sample = chunk.readInt16LE(i);
      } else if (bitsPerSample === 32) {
        sample = chunk.readInt32LE(i);
      } else {
        sample = chunk.readIntLE(i, bytesPerSample);
      }

      // 归一化到 [-1, 1]
      const maxVal = isFloat ? 1 : Math.pow(2, bitsPerSample - 1);
      const normalizedSample = sample / maxVal;

      // 滤波处理
      const filteredSample = this.filters[channelIndex].process(normalizedSample);

      // 限幅防止溢出
      const clampedSample = Math.max(-1, Math.min(1, filteredSample));

      // 转换回原始格式
      const outputSample = isFloat ? clampedSample : Math.round(clampedSample * maxVal);

      if (isFloat) {
        result.writeFloatLE(outputSample as number, i);
      } else if (bitsPerSample === 8) {
        result.writeUInt8((outputSample as number) + 128, i);
      } else if (bitsPerSample === 16) {
        result.writeInt16LE(outputSample as number, i);
      } else if (bitsPerSample === 24) {
        result.writeIntLE(outputSample as number, i, 3);
      } else {
        result.writeIntLE(outputSample as number, i, bytesPerSample);
      }
    }

    return result;
  }

  reset(): void {
    this.filters.forEach((f) => f.reset());
  }
}

export class YKAudioSpeaker {
  private static _instance: YKAudioSpeaker | null = null;
  public static get instance(): YKAudioSpeaker {
    if (!this._instance) {
      this._instance = new YKAudioSpeaker();
    }
    return this._instance;
  }

  private formatMd5 = '';
  private currentFormat: AudioFormat | null = null;
  private filter: MultiChannelFilter | null = null;

  /** 是否启用滤波器（过滤杂音，保留人声） */
  public enableFilter = true;
  /** 人声频率下限 */
  public lowFreq = 300;
  /** 人声频率上限 */
  public highFreq = 3400;

  private speaker: any = null;
  private readonly dog = new WatchDog({
    limit: 10,
    onTimeout: () => {
      this.destroySpeaker();
    },
  });
  private readonly queue = new SyncQueue();

  /** 销毁当前 Speaker 实例 */
  private destroySpeaker(): void {
    if (this.speaker) {
      this.speaker.destroy();
      this.speaker = null;
    }
    this.filter = null;
    this.currentFormat = null;
  }

  /** 根据音频格式创建滤波器 */
  private createFilter(format: AudioFormat): void {
    if (format.sampleRate && format.numChannels) {
      this.filter = new MultiChannelFilter(format.numChannels, format.sampleRate, this.lowFreq, this.highFreq);
    }
  }

  private async _play(buffer: Buffer): Promise<void> {
    this.dog.feed();
    const reader = new Reader();

    try {
      await new Promise((resolve, reject) => {
        reader.on('data', (chunk: Buffer) => {
          if (!this.speaker) {
            const Speaker = require('speaker');
            this.speaker = new Speaker(this.currentFormat);
          }
          const processedChunk =
            this.filter && this.currentFormat?.bitsPerSample
              ? this.filter.process(chunk, this.currentFormat.bitsPerSample)
              : chunk;

          this.speaker?.write(processedChunk, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(null);
            }
          });
        });
        reader.on('format', (format: AudioFormat) => {
          try {
            const md5 = SparkMd5.hash(JSON.stringify(format));
            if (this.formatMd5 !== md5) {
              console.log(format);
              this.destroySpeaker();
              this.formatMd5 = md5;
              this.currentFormat = format;

              if (this.enableFilter && format.sampleRate && format.numChannels && format.bitsPerSample) {
                this.createFilter(format);
              }
            }
          } catch (err) {
            reject(err);
          }
        });
        reader.write(buffer);
      });
    } catch (err) {
      console.log(err);
    }
  }

  /** 播放音频（支持 WAV 格式） */
  async play(buffer: Buffer): Promise<void> {
    await this.queue.push(() => this._play(buffer));
  }

  /** 停止播放并清理资源 */
  stop(): void {
    this.destroySpeaker();
    this.filter?.reset();
  }
}
