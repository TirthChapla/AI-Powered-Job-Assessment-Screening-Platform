export interface VoiceConfig {
  livekitUrl: string;
  token?: string;
  tokenApiUrl?: string;
  roomName?: string;
  participantName?: string;
  enableEchoCancellation?: boolean;
  enableNoiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: Error;
}

export interface VoiceCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onParticipantConnected?: (participantName: string) => void;
  onParticipantDisconnected?: (participantName: string) => void;
  onMicrophonePermissionGranted?: () => void;
}

export interface AutoIncomingCallConfig {
  enabled: boolean;
  delayMs: number;
  timeoutMs: number;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "bottom-center";
  respectUserChoice?: boolean;
  cooldownMs?: number;
  maxNotificationsPerSession?: number;
  resetAfterDays?: number;
  developerMode?: boolean;
  sound?: {
    enabled?: boolean;
    volume?: number;
    respectSystemVolume?: boolean;
    maxDurationMs?: number;
    repeatIntervalMs?: number;
  };
}

export interface FAQPluginOptions {
  containerId?: string;
  buttonText?: string;
  agentName?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  autoIncomingCall?: Partial<AutoIncomingCallConfig>;
}

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: "audioinput" | "audiooutput";
}
