import { UserInteractionTracker } from "../utils/user-interaction-tracker";

export interface WidgetPanelOptions {
  containerId: string;
  buttonText: string;
  agentName: string;
  position: string;
}

export interface WidgetPanelCallbacks {
  onVoiceButtonClick: () => void;
}

export class WidgetPanel {
  private container: HTMLElement;
  private options: WidgetPanelOptions;
  private callbacks: WidgetPanelCallbacks;
  private isOpen = false;

  constructor(options: WidgetPanelOptions, callbacks: WidgetPanelCallbacks) {
    this.options = options;
    this.callbacks = callbacks;
    this.container = this.createWidget();
    this.attachToPage();
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  openPanel(): void {
    this.isOpen = true;
    const panel = this.container.querySelector("#vh-faq-panel") as HTMLElement;
    panel.style.display = "flex";
    panel.classList.add("vh-panel-open");
  }

  closePanel(): void {
    this.isOpen = false;
    const panel = this.container.querySelector("#vh-faq-panel") as HTMLElement;
    panel.classList.remove("vh-panel-open");
    setTimeout(() => {
      panel.style.display = "none";
    }, 300);
  }

  togglePanel(): void {
    UserInteractionTracker.recordWidgetInteraction();

    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  updateStatus(message: string, type: string): void {
    const statusEl = this.container.querySelector(
      "#vh-status .vh-status-text"
    ) as HTMLElement;
    const statusContainer = this.container.querySelector(
      "#vh-status"
    ) as HTMLElement;

    if (statusEl && statusContainer) {
      statusEl.textContent = message;
      statusContainer.className = `vh-status vh-status-${type}`;
    }
  }

  updateVoiceButton(
    text: string,
    disabled: boolean,
    isConnected = false
  ): void {
    const voiceBtn = this.container.querySelector(
      "#vh-faq-voice-btn"
    ) as HTMLButtonElement;

    if (voiceBtn) {
      const icon = isConnected
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>`;

      voiceBtn.innerHTML = `
        <div class="vh-btn-content">
          ${icon}
          <span>${text}</span>
        </div>
      `;
      voiceBtn.disabled = disabled;

      if (isConnected) {
        voiceBtn.classList.add("vh-voice-btn-connected");
      } else {
        voiceBtn.classList.remove("vh-voice-btn-connected");
      }
    }
  }

  enableVoiceButton(): void {
    const voiceBtn = this.container.querySelector(
      "#vh-faq-voice-btn"
    ) as HTMLButtonElement;
    if (voiceBtn) {
      voiceBtn.disabled = false;
      voiceBtn.style.opacity = "1";
      voiceBtn.style.cursor = "pointer";
    }
  }

  enableTriggerAttention(): void {
    const trigger = this.container.querySelector("#vh-trigger") as HTMLElement;
    if (trigger) {
      trigger.classList.add("vh-trigger-attention");
    }
  }

  disableTriggerAttention(): void {
    const trigger = this.container.querySelector("#vh-trigger") as HTMLElement;
    if (trigger) {
      trigger.classList.remove("vh-trigger-attention");
    }
  }

  destroy(): void {
    this.container.remove();
  }

  private createWidget(): HTMLElement {
    const widget = document.createElement("div");
    widget.id = this.options.containerId;
    widget.className = `vh-widget vh-widget-${this.options.position}`;

    widget.innerHTML = this.getHTML();
    this.attachEventListeners(widget);

    return widget;
  }

  private getHTML(): string {
    return `
      <div class="vh-trigger" id="vh-trigger">
        <div class="vh-trigger-content">
          <div class="vh-trigger-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
          <span class="vh-trigger-text">${this.options.buttonText}</span>
        </div>
        <div class="vh-trigger-pulse"></div>
      </div>
      
      <div class="vh-panel" id="vh-faq-panel">
        <div class="vh-panel-header">
          <div class="vh-agent-info">
            <div class="vh-agent-avatar">
              <div class="vh-avatar-inner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
            <div class="vh-agent-details">
              <h3 class="vh-agent-name">${this.options.agentName}</h3>
              <p class="vh-agent-role">AI Assistant</p>
            </div>
          </div>
          <button class="vh-panel-close" id="vh-panel-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div class="vh-panel-content">
          <div class="vh-status" id="vh-status">
            <div class="vh-status-indicator"></div>
            <div class="vh-status-text">Ready to help you with VoiceHire</div>
          </div>
          
          <div class="vh-controls">
            <button class="vh-voice-btn" id="vh-faq-voice-btn" disabled>
              <div class="vh-btn-content">
                Start Voice Chat
              </div>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(widget: HTMLElement): void {
    const triggerBtn = widget.querySelector("#vh-trigger") as HTMLElement;
    const closeBtn = widget.querySelector("#vh-panel-close") as HTMLElement;
    const voiceBtn = widget.querySelector("#vh-faq-voice-btn") as HTMLElement;

    triggerBtn?.addEventListener("click", () => this.togglePanel());
    closeBtn?.addEventListener("click", () => this.closePanel());
    voiceBtn?.addEventListener("click", () =>
      this.callbacks.onVoiceButtonClick()
    );
  }

  private attachToPage(): void {
    document.body.appendChild(this.container);
  }
}
