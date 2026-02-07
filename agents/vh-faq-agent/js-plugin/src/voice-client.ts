import {
  Room,
  RoomEvent,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  Track,
  createLocalAudioTrack,
} from "livekit-client";
import {
  VoiceConfig,
  ConnectionState,
  VoiceCallbacks,
  AudioDeviceInfo,
} from "./types";

export class VoiceClient {
  private room: Room | null = null;
  private config: VoiceConfig;
  private callbacks: VoiceCallbacks;
  private state: ConnectionState = {
    isConnected: false,
    isConnecting: false,
  };

  constructor(config: VoiceConfig, callbacks: VoiceCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Checks if microphone permission is already granted
   * @returns Promise<boolean> - true if permission is granted, false otherwise
   */
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.permissions) {
        return false;
      }

      const permission = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      return permission.state === "granted";
    } catch (error) {
      return false;
    }
  }

  /**
   * Requests microphone permission from the user
   * This method will show the browser's permission dialog if permission hasn't been granted
   * @throws Error if permission is denied or microphone is not available
   */
  async requestMicrophonePermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.config.enableEchoCancellation ?? true,
          noiseSuppression: this.config.enableNoiseSuppression ?? true,
          autoGainControl: this.config.autoGainControl ?? true,
        },
      });

      stream.getTracks().forEach((track) => track.stop());

      this.callbacks.onMicrophonePermissionGranted?.();
    } catch (error) {
      const err = error as Error;
      if (err.name === "NotAllowedError") {
        throw new Error(
          "Microphone permission denied. Please allow microphone access to use voice chat."
        );
      } else if (err.name === "NotFoundError") {
        throw new Error(
          "No microphone found. Please connect a microphone to use voice chat."
        );
      } else {
        throw new Error(`Microphone access error: ${err.message}`);
      }
    }
  }

  /**
   * Connects to the LiveKit room
   * This method will automatically request microphone permission if not already granted
   * @throws Error if connection fails or microphone permission is denied
   */
  async connect(): Promise<void> {
    if (this.state.isConnecting || this.state.isConnected) {
      return;
    }

    try {
      this.setState({ isConnecting: true, error: undefined });

      const hasPermission = await this.checkMicrophonePermission();
      if (!hasPermission) {
        await this.requestMicrophonePermission();
      } else {
        this.callbacks.onMicrophonePermissionGranted?.();
      }

      this.room = new Room();
      this.setupRoomEventListeners();

      const token = this.config.token || (await this.generateToken());

      await this.room.connect(this.config.livekitUrl, token);

      await this.enableMicrophone();

      this.setState({ isConnected: true, isConnecting: false });
      this.callbacks.onConnected?.();
    } catch (error) {
      const err = error as Error;
      this.setState({ isConnected: false, isConnecting: false, error: err });
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }
    this.setState({ isConnected: false, isConnecting: false });
    this.callbacks.onDisconnected?.();
  }

  async enableMicrophone(): Promise<void> {
    if (!this.room) {
      throw new Error("Not connected to room");
    }

    try {
      const audioTrack = await createLocalAudioTrack({
        echoCancellation: this.config.enableEchoCancellation ?? true,
        noiseSuppression: this.config.enableNoiseSuppression ?? true,
        autoGainControl: this.config.autoGainControl ?? true,
      });

      await this.room.localParticipant.publishTrack(audioTrack);
    } catch (error) {
      console.error("Failed to enable microphone:", error);
      throw error;
    }
  }

  async disableMicrophone(): Promise<void> {
    if (!this.room) return;

    const audioTracks = this.room.localParticipant.audioTrackPublications;
    for (const publication of audioTracks.values()) {
      if (publication.track) {
        await this.room.localParticipant.unpublishTrack(publication.track);
      }
    }
  }

  isMicrophoneEnabled(): boolean {
    if (!this.room) return false;

    for (const publication of this.room.localParticipant.audioTrackPublications.values()) {
      if (publication.track && !publication.track.isMuted) {
        return true;
      }
    }
    return false;
  }

  async toggleMicrophone(): Promise<boolean> {
    const isEnabled = this.isMicrophoneEnabled();
    if (isEnabled) {
      await this.disableMicrophone();
    } else {
      await this.enableMicrophone();
    }
    return !isEnabled;
  }

  getConnectionState(): ConnectionState {
    return { ...this.state };
  }

  async getAudioDevices(): Promise<AudioDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(
          (device) =>
            device.kind === "audioinput" || device.kind === "audiooutput"
        )
        .map((device) => ({
          deviceId: device.deviceId,
          label:
            device.label || `${device.kind} ${device.deviceId.substring(0, 8)}`,
          kind: device.kind as "audioinput" | "audiooutput",
        }));
    } catch (error) {
      console.error("Failed to get audio devices:", error);
      return [];
    }
  }

  private setupRoomEventListeners(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      console.log("Connected to room");
    });

    this.room.on(RoomEvent.Disconnected, () => {
      console.log("Disconnected from room");
      this.setState({ isConnected: false, isConnecting: false });
      this.callbacks.onDisconnected?.();
    });

    this.room.on(
      RoomEvent.ParticipantConnected,
      (participant: RemoteParticipant) => {
        console.log("Participant connected:", participant.identity);
        this.callbacks.onParticipantConnected?.(participant.identity);
      }
    );

    this.room.on(
      RoomEvent.ParticipantDisconnected,
      (participant: RemoteParticipant) => {
        console.log("Participant disconnected:", participant.identity);
        this.callbacks.onParticipantDisconnected?.(participant.identity);
      }
    );

    this.room.on(
      RoomEvent.TrackSubscribed,
      (
        track: RemoteTrack,
        _publication: RemoteTrackPublication,
        _participant: RemoteParticipant
      ) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
        }
      }
    );

    this.room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
      track.detach().forEach((element) => element.remove());
    });
  }

  private setState(newState: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...newState };
  }

  private async generateToken(): Promise<string> {
    if (!this.config.tokenApiUrl) {
      throw new Error(
        "Token API URL is required. Please provide tokenApiUrl in the configuration."
      );
    }

    try {
      // Generate random room name if not provided
      const roomName = this.config.roomName || this.generateRandomRoomName();

      // Use meaningful participant name or default to "Web User"
      const participantName = this.config.participantName || "Web User";

      const response = await fetch(this.config.tokenApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          roomName: roomName,
          participantName: participantName,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Token API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.text();

      // The API might return just the token string or a JSON object
      // Try to parse as JSON first, if it fails, assume it's a plain token
      try {
        const jsonData = JSON.parse(data);
        return jsonData.data.token;
      } catch {
        // If parsing fails, assume the response is the token itself
        return data;
      }
    } catch (error) {
      console.error("Failed to generate token:", error);
      throw new Error(`Token generation failed: ${(error as Error).message}`);
    }
  }

  private generateRandomRoomName(): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
    return `demo-${timestamp}-${randomId}-${uuid}`;
  }

  /**
   * Pre-requests microphone permission without connecting to LiveKit
   * This can be called early to get permission out of the way for better UX
   * @returns Promise<boolean> - true if permission was granted, false if denied or failed
   */
  async preRequestMicrophonePermission(): Promise<boolean> {
    try {
      const hasPermission = await this.checkMicrophonePermission();
      if (!hasPermission) {
        await this.requestMicrophonePermission();
      }
      return true;
    } catch (error) {
      console.warn("Failed to pre-request microphone permission:", error);
      return false;
    }
  }
}
