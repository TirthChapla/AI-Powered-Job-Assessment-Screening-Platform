import { VoiceClient } from "./voice-client";
import { FAQPluginOptions, VoiceConfig, AutoIncomingCallConfig } from "./types";
import {
  IncomingCallNotification,
  WidgetPanel,
  WidgetStyles,
} from "./components";
import type { WidgetPanelOptions, WidgetPanelCallbacks } from "./components";
import {
  UserInteractionTracker,
  UserInteractionData,
} from "./utils/user-interaction-tracker";
import { SoundManager } from "./utils/sound-manager";

interface RequiredFAQPluginOptions
  extends Omit<Required<FAQPluginOptions>, "autoIncomingCall"> {
  autoIncomingCall: Required<AutoIncomingCallConfig>;
}

export class FAQWidget {
  private voiceClient: VoiceClient | null = null;
  private options: RequiredFAQPluginOptions;
  private incomingCallNotification!: IncomingCallNotification;
  private widgetPanel!: WidgetPanel;

  constructor(options: FAQPluginOptions = {}) {
    this.options = {
      containerId: options.containerId || "vh-faq-widget",
      buttonText: options.buttonText || "Ask Veeaa",
      agentName: options.agentName || "Veeaa",
      position: options.position || "bottom-right",
      autoIncomingCall: {
        enabled: options.autoIncomingCall?.enabled ?? true,
        delayMs: options.autoIncomingCall?.delayMs ?? 5000,
        timeoutMs: options.autoIncomingCall?.timeoutMs ?? 20000,
        position: options.autoIncomingCall?.position ?? "bottom-center",
        respectUserChoice: options.autoIncomingCall?.respectUserChoice ?? true,
        cooldownMs: options.autoIncomingCall?.cooldownMs ?? 30 * 60 * 1000,
        maxNotificationsPerSession:
          options.autoIncomingCall?.maxNotificationsPerSession ?? 2,
        resetAfterDays: options.autoIncomingCall?.resetAfterDays ?? 7,
        developerMode: options.autoIncomingCall?.developerMode ?? false,
        sound: {
          enabled: options.autoIncomingCall?.sound?.enabled ?? true,
          volume: options.autoIncomingCall?.sound?.volume ?? 0.2,
          respectSystemVolume:
            options.autoIncomingCall?.sound?.respectSystemVolume ?? true,
          maxDurationMs: options.autoIncomingCall?.sound?.maxDurationMs ?? 2000,
          repeatIntervalMs:
            options.autoIncomingCall?.sound?.repeatIntervalMs ?? 5000,
        },
      },
    };

    this.initializeComponents();
  }

  async initialize(voiceConfig: VoiceConfig): Promise<void> {
    this.voiceClient = new VoiceClient(voiceConfig, {
      onConnected: () => this.onVoiceConnected(),
      onDisconnected: () => this.onVoiceDisconnected(),
      onError: (error) => this.onVoiceError(error),
      onParticipantConnected: (name) => this.onAgentJoined(name),
      onParticipantDisconnected: (name) => this.onAgentLeft(name),
      onMicrophonePermissionGranted: () => this.onMicrophonePermissionGranted(),
    });

    this.widgetPanel.enableVoiceButton();
  }

  destroy(): void {
    this.incomingCallNotification.destroy();
    this.widgetPanel.destroy();
    WidgetStyles.removeStyles();
    SoundManager.cleanup();

    if (this.voiceClient) {
      this.voiceClient.disconnect();
    }
  }

  resetUserPreferences(): void {
    UserInteractionTracker.resetUserData();
  }

  getUserStats(): UserInteractionData {
    return UserInteractionTracker.getUserStats();
  }

  async testNotificationSound(): Promise<boolean> {
    const soundConfig = {
      enabled: this.options.autoIncomingCall.sound.enabled ?? true,
      volume: this.options.autoIncomingCall.sound.volume ?? 0.2,
      respectSystemVolume:
        this.options.autoIncomingCall.sound.respectSystemVolume ?? true,
      maxDurationMs: this.options.autoIncomingCall.sound.maxDurationMs ?? 2000,
      repeatIntervalMs:
        this.options.autoIncomingCall.sound.repeatIntervalMs ?? 5000,
    };

    return await SoundManager.testSound(soundConfig);
  }

  private initializeComponents(): void {
    WidgetStyles.addStyles();

    const panelOptions: WidgetPanelOptions = {
      containerId: this.options.containerId,
      buttonText: this.options.buttonText,
      agentName: this.options.agentName,
      position: this.options.position,
    };

    const panelCallbacks: WidgetPanelCallbacks = {
      onVoiceButtonClick: () => this.toggleVoiceChat(),
    };

    this.widgetPanel = new WidgetPanel(panelOptions, panelCallbacks);

    this.incomingCallNotification = new IncomingCallNotification(
      this.options.autoIncomingCall,
      this.options.agentName,
      () => this.acceptIncomingCall(),
      () => this.declineIncomingCall()
    );

    if (this.options.autoIncomingCall.enabled) {
      this.incomingCallNotification.start();
    }
  }

  private async acceptIncomingCall(): Promise<void> {
    this.widgetPanel.disableTriggerAttention();
    this.widgetPanel.openPanel();

    if (this.voiceClient) {
      try {
        const hasPermission =
          await this.voiceClient.checkMicrophonePermission();
        if (!hasPermission) {
          this.widgetPanel.updateStatus(
            "Requesting microphone permission...",
            "connecting"
          );
        } else {
          this.widgetPanel.updateStatus(
            "Connecting to voice agent...",
            "connecting"
          );
        }
        await this.voiceClient.connect();
      } catch (error) {
        console.error("Voice chat error:", error);
        this.widgetPanel.updateStatus(
          `Error: ${(error as Error).message}`,
          "error"
        );
      }
    } else {
      this.widgetPanel.updateStatus("Voice client not initialized", "error");
    }
  }

  private declineIncomingCall(): void {
    this.widgetPanel.enableTriggerAttention();
  }

  private async toggleVoiceChat(): Promise<void> {
    this.widgetPanel.disableTriggerAttention();

    if (!this.voiceClient) {
      this.widgetPanel.updateStatus("Voice client not initialized", "error");
      return;
    }

    const state = this.voiceClient.getConnectionState();

    try {
      if (!state.isConnected) {
        this.incomingCallNotification.hide();

        const hasPermission =
          await this.voiceClient.checkMicrophonePermission();
        if (!hasPermission) {
          this.widgetPanel.updateStatus(
            "Requesting microphone permission...",
            "connecting"
          );
          this.widgetPanel.updateVoiceButton("Requesting Permission...", true);
        } else {
          this.widgetPanel.updateStatus(
            "Connecting to voice agent...",
            "connecting"
          );
          this.widgetPanel.updateVoiceButton("Connecting...", true);
        }

        await this.voiceClient.connect();
      } else {
        this.widgetPanel.updateStatus("Disconnecting...", "disconnecting");
        await this.voiceClient.disconnect();
      }
    } catch (error) {
      console.error("Voice chat error:", error);
      this.widgetPanel.updateStatus(
        `Error: ${(error as Error).message}`,
        "error"
      );
      this.resetVoiceButton();
    }
  }

  private onVoiceConnected(): void {
    this.incomingCallNotification.hide();
    this.widgetPanel.updateStatus(
      `Connected! You can now talk to ${this.options.agentName}`,
      "connected"
    );
    this.widgetPanel.updateVoiceButton("End Voice Chat", false, true);
  }

  private onVoiceDisconnected(): void {
    this.widgetPanel.updateStatus(
      `Disconnected from ${this.options.agentName}`,
      "disconnected"
    );
    this.resetVoiceButton();
  }

  private onVoiceError(error: Error): void {
    this.widgetPanel.updateStatus(
      `Connection error: ${error.message}`,
      "error"
    );
    this.resetVoiceButton();
  }

  private onAgentJoined(_name: string): void {
    this.widgetPanel.updateStatus(
      `${this.options.agentName} joined the conversation`,
      "agent-joined"
    );
  }

  private onAgentLeft(_name: string): void {
    this.widgetPanel.updateStatus(
      `${this.options.agentName} left the conversation`,
      "agent-left"
    );
  }

  private resetVoiceButton(): void {
    this.widgetPanel.updateVoiceButton("Start Voice Chat", false, false);
  }

  private onMicrophonePermissionGranted(): void {
    this.widgetPanel.updateStatus("Connecting to voice agent...", "connecting");
    this.widgetPanel.updateVoiceButton("Connecting...", true);
  }
}
