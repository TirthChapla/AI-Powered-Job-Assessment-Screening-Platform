export interface SoundConfig {
  enabled: boolean;
  volume: number;
  respectSystemVolume: boolean;
  maxDurationMs: number;
  repeatIntervalMs?: number;
}

export class SoundManager {
  private static audioContext: AudioContext | null = null;
  private static currentSound: AudioBufferSourceNode | null = null;
  private static repeatTimer: NodeJS.Timeout | null = null;
  private static isRepeating: boolean = false;

  static async playNotificationSound(config: SoundConfig): Promise<void> {
    if (!config.enabled) return;

    try {
      await this.checkAudioPermissions();

      const audioContext = await this.getAudioContext();
      if (!audioContext) return;

      const buffer = await this.createNotificationTone(audioContext);

      this.stopCurrentSound();

      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const volume = config.respectSystemVolume
        ? Math.min(config.volume, await this.getSystemVolume())
        : config.volume;

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

      source.start();

      this.currentSound = source;

      setTimeout(() => {
        if (this.currentSound === source) {
          this.currentSound = null;
        }
      }, config.maxDurationMs);
    } catch (error) {
      console.warn("VH FAQ: Could not play notification sound:", error);
    }
  }

  static startRepeatingNotification(config: SoundConfig): void {
    if (!config.enabled || this.isRepeating) return;

    this.isRepeating = true;

    this.playNotificationSound(config);

    if (config.repeatIntervalMs && config.repeatIntervalMs > 0) {
      this.repeatTimer = setInterval(() => {
        if (this.isRepeating) {
          this.playNotificationSound(config);
        }
      }, config.repeatIntervalMs);
    }
  }

  static stopRepeatingNotification(): void {
    this.isRepeating = false;

    if (this.repeatTimer) {
      clearInterval(this.repeatTimer);
      this.repeatTimer = null;
    }

    this.stopCurrentSound();
  }

  static stopCurrentSound(): void {
    if (this.currentSound) {
      try {
        this.currentSound.stop();
      } catch (error) {
        // Sound might already be stopped
      }
      this.currentSound = null;
    }
  }

  private static async getAudioContext(): Promise<AudioContext | null> {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

        if (this.audioContext.state === "suspended") {
          await this.audioContext.resume();
        }
      } catch (error) {
        console.warn("VH FAQ: Could not create audio context:", error);
        return null;
      }
    }
    return this.audioContext;
  }

  private static async createNotificationTone(
    audioContext: AudioContext
  ): Promise<AudioBuffer> {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.8;
    const buffer = audioContext.createBuffer(
      1,
      sampleRate * duration,
      sampleRate
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;

      const envelope = Math.exp(-t * 3) * (1 - Math.exp(-t * 20));

      const frequency1 = 800;
      const frequency2 = 600;
      const tone1 = Math.sin(2 * Math.PI * frequency1 * t);
      const tone2 = Math.sin(2 * Math.PI * frequency2 * t);

      const combined = (tone1 * 0.6 + tone2 * 0.4) * envelope * 0.15;

      data[i] = combined;
    }

    return buffer;
  }

  private static async checkAudioPermissions(): Promise<boolean> {
    try {
      if (!navigator.permissions) return true;

      const permission = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      return permission.state !== "denied";
    } catch (error) {
      return true;
    }
  }

  private static async getSystemVolume(): Promise<number> {
    try {
      if ("mediaSession" in navigator && navigator.mediaSession) {
        return 0.3;
      }

      const audioContext = await this.getAudioContext();
      if (audioContext && audioContext.outputLatency !== undefined) {
        return Math.min(0.4, 0.2 + audioContext.outputLatency * 10);
      }

      return 0.25;
    } catch (error) {
      return 0.2;
    }
  }

  static async testSound(config: SoundConfig): Promise<boolean> {
    try {
      await this.playNotificationSound(config);
      return true;
    } catch (error) {
      console.warn("VH FAQ: Sound test failed:", error);
      return false;
    }
  }

  static cleanup(): void {
    this.stopRepeatingNotification();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
