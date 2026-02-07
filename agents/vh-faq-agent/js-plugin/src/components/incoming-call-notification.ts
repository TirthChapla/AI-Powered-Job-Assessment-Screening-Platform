import { AutoIncomingCallConfig } from "../types";
import { UserInteractionTracker } from "../utils/user-interaction-tracker";
import { SoundManager } from "../utils/sound-manager";

export class IncomingCallNotification {
  private container: HTMLElement | null = null;
  private autoCallTimer: NodeJS.Timeout | null = null;
  private timeoutTimer: NodeJS.Timeout | null = null;
  private config: AutoIncomingCallConfig;
  private agentName: string;
  private onAccept: () => void;
  private onDecline: () => void;

  constructor(
    config: AutoIncomingCallConfig,
    agentName: string,
    onAccept: () => void,
    onDecline: () => void
  ) {
    this.config = config;
    this.agentName = agentName;
    this.onAccept = onAccept;
    this.onDecline = onDecline;
  }

  start(): void {
    if (!this.config.enabled) return;

    const shouldShow = UserInteractionTracker.shouldShowNotification({
      respectUserChoice: this.config.respectUserChoice ?? true,
      cooldownMs: this.config.cooldownMs ?? 30 * 60 * 1000,
      maxNotificationsPerSession: this.config.maxNotificationsPerSession ?? 2,
      resetAfterDays: this.config.resetAfterDays ?? 7,
      developerMode: this.config.developerMode ?? false,
    });

    if (!shouldShow) {
      console.log(
        "VH FAQ: Incoming call notification skipped based on user interaction history"
      );
      return;
    }

    this.autoCallTimer = setTimeout(() => {
      this.show();
    }, this.config.delayMs);
  }

  show(): void {
    if (this.container) return;

    UserInteractionTracker.recordNotificationShown();

    this.container = document.createElement("div");
    const position = this.config.position || "bottom-center";
    this.container.className = `vh-incoming-call vh-incoming-call-${position}`;
    this.container.innerHTML = this.getHTML();

    document.body.appendChild(this.container);
    this.attachEventListeners();

    setTimeout(() => {
      this.container?.classList.add("vh-call-show");
      this.startRepeatingNotificationSound();
    }, 100);

    if (this.config.timeoutMs > 0) {
      this.timeoutTimer = setTimeout(() => {
        this.hide();
        UserInteractionTracker.recordUserDeclined();
        this.onDecline();
      }, this.config.timeoutMs);
    }
  }

  hide(): void {
    this.clearTimeout();
    SoundManager.stopRepeatingNotification();
    if (this.container) {
      this.container.classList.remove("vh-call-show");
      setTimeout(() => {
        if (this.container) {
          document.body.removeChild(this.container);
          this.container = null;
        }
      }, 300);
    }
  }

  destroy(): void {
    this.clearAutoCallTimer();
    this.hide();
    SoundManager.cleanup();
  }

  private startRepeatingNotificationSound(): void {
    const soundConfig = {
      enabled: this.config.sound?.enabled ?? true,
      volume: this.config.sound?.volume ?? 0.2,
      respectSystemVolume: this.config.sound?.respectSystemVolume ?? true,
      maxDurationMs: this.config.sound?.maxDurationMs ?? 2000,
      repeatIntervalMs: this.config.sound?.repeatIntervalMs ?? 5000,
    };

    try {
      SoundManager.startRepeatingNotification(soundConfig);
    } catch (error) {
      console.warn(
        "VH FAQ: Could not start repeating notification sound:",
        error
      );
    }
  }

  private getHTML(): string {
    return `
      <div class="vh-call-notification">
        <div class="vh-call-header">
          <div class="vh-call-avatar">
            <div class="vh-avatar-inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </div>
          <div class="vh-call-info">
            <div class="vh-call-name">${this.agentName}</div>
            <div class="vh-call-subtitle">AI Voice Assistant • VoiceHire</div>
          </div>
          <button class="vh-call-close" id="vh-call-decline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div class="vh-call-content">
          <p class="vh-call-message">Hi! I'm here to help you with any questions about VoiceHire. Would you like to start a voice conversation?</p>
          
          <div class="vh-call-actions">
            <button class="vh-call-btn vh-call-btn-secondary" id="vh-call-decline-alt">
              Maybe Later
            </button>
            <button class="vh-call-btn vh-call-btn-primary" id="vh-call-accept">
              Start Voice Chat
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    if (!this.container) return;

    const acceptBtn = this.container.querySelector("#vh-call-accept");
    const declineBtn = this.container.querySelector("#vh-call-decline");
    const declineAltBtn = this.container.querySelector("#vh-call-decline-alt");

    acceptBtn?.addEventListener("click", () => {
      UserInteractionTracker.recordUserAccepted();
      this.hide();
      this.onAccept();
    });

    declineBtn?.addEventListener("click", () => {
      UserInteractionTracker.recordUserDeclined();
      this.hide();
      this.onDecline();
    });

    declineAltBtn?.addEventListener("click", () => {
      UserInteractionTracker.recordUserDeclined();
      this.hide();
      this.onDecline();
    });
  }

  private clearTimeout(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  private clearAutoCallTimer(): void {
    if (this.autoCallTimer) {
      clearTimeout(this.autoCallTimer);
      this.autoCallTimer = null;
    }
  }
}
