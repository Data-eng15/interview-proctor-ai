/** Lightweight voice-activity meter built on the Web Audio API. */
export class VoiceMeter {
  private ctx: AudioContext;
  private analyser: AnalyserNode;
  private data: Uint8Array;
  private source: MediaStreamAudioSourceNode;

  constructor(stream: MediaStream) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.ctx = new AudioCtx();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.7;
    this.source = this.ctx.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
    this.data = new Uint8Array(this.analyser.frequencyBinCount);
  }

  /** Root-mean-square level, normalized to 0..1. */
  level(): number {
    this.analyser.getByteFrequencyData(this.data);
    let sum = 0;
    for (let i = 0; i < this.data.length; i++) {
      const v = this.data[i] / 255;
      sum += v * v;
    }
    return Math.sqrt(sum / this.data.length);
  }

  async resume() {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  close() {
    try {
      this.source.disconnect();
      void this.ctx.close();
    } catch {
      /* already closed */
    }
  }
}

// Raised from 0.06 so fans/typing/room hum don't register as "speech".
export const VOICE_THRESHOLD = 0.14;
