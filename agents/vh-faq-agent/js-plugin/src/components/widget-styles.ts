export class WidgetStyles {
  private static stylesId = "vh-widget-styles";

  static addStyles(): void {
    if (document.getElementById(this.stylesId)) return;

    const styles = document.createElement("style");
    styles.id = this.stylesId;
    styles.textContent = this.getCSS();
    document.head.appendChild(styles);
  }

  static removeStyles(): void {
    const styles = document.getElementById(this.stylesId);
    if (styles) {
      styles.remove();
    }
  }

  private static getCSS(): string {
    return `
      /* VoiceHire Widget - Dark Theme */
      .vh-widget {
        position: fixed;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }

      /* Positioning */
      .vh-widget-bottom-right {
        bottom: 24px;
        right: 24px;
      }

      .vh-widget-bottom-left {
        bottom: 24px;
        left: 24px;
      }

      .vh-widget-top-right {
        top: 24px;
        right: 24px;
      }

      .vh-widget-top-left {
        top: 24px;
        left: 24px;
      }

      /* Trigger Button */
      .vh-trigger {
        position: relative;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: white;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .vh-trigger:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 40px rgba(99, 102, 241, 0.4), 0 8px 24px rgba(0, 0, 0, 0.15);
      }

      /* Trigger Light Effects - Applied after call notification is dismissed */
      .vh-trigger-attention {
        animation: vh-trigger-glow 4s ease-in-out infinite, vh-trigger-shake 45s ease-in-out infinite;
      }

      .vh-trigger-attention::before {
        content: '';
        position: absolute;
        top: -3px;
        left: -3px;
        right: -3px;
        bottom: -3px;
        background: linear-gradient(45deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.15));
        border-radius: 19px;
        z-index: -1;
        animation: vh-trigger-border-shine 3s linear infinite;
        opacity: 0;
      }

      .vh-trigger-attention .vh-trigger-pulse {
        animation: vh-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        border-color: rgba(255, 255, 255, 0.4);
        border-width: 3px;
      }

      .vh-trigger-attention .vh-trigger-icon {
        animation: vh-icon-glow 3s ease-in-out infinite alternate;
      }

      @keyframes vh-trigger-glow {
        0%, 100% { 
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        50% { 
          box-shadow: 0 12px 40px rgba(99, 102, 241, 0.6), 0 6px 24px rgba(0, 0, 0, 0.15), 0 0 40px rgba(99, 102, 241, 0.3);
        }
      }

      @keyframes vh-trigger-border-shine {
        0% { 
          opacity: 0;
        }
        50% { 
          opacity: 0.8;
        }
        100% { 
          opacity: 0;
        }
      }

      @keyframes vh-icon-glow {
        0% { 
          filter: brightness(1) drop-shadow(0 0 0px rgba(255, 255, 255, 0));
        }
        100% { 
          filter: brightness(1.3) drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
        }
      }

      @keyframes vh-trigger-shake {
        0%, 98%, 100% { 
          transform: translateX(0);
        }
        98.5% { 
          transform: translateX(-3px);
        }
        99% { 
          transform: translateX(3px);
        }
        99.2% { 
          transform: translateX(-2px);
        }
        99.4% { 
          transform: translateX(2px);
        }
        99.6% { 
          transform: translateX(-1px);
        }
        99.8% { 
          transform: translateX(1px);
        }
      }

      .vh-trigger-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
        position: relative;
        z-index: 2;
      }

      .vh-trigger-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vh-trigger-text {
        font-weight: 600;
        font-size: 14px;
        letter-spacing: -0.025em;
      }

      .vh-trigger-pulse {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        animation: vh-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      @keyframes vh-pulse {
        0% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1.3);
          opacity: 0;
        }
      }

      /* Panel */
      .vh-panel {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 400px;
        background: #0f172a;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2);
        display: none;
        flex-direction: column;
        opacity: 0;
        transform: translateY(20px) scale(0.95);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(20px);
        overflow: hidden;
      }

      .vh-panel-open {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      /* Panel Header */
      .vh-panel-header {
        padding: 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      }

      .vh-agent-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .vh-agent-avatar {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        position: relative;
      }

      .vh-avatar-inner {
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vh-agent-details {
        flex: 1;
      }

      .vh-agent-name {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 700;
        color: #f8fafc;
        letter-spacing: -0.025em;
      }

      .vh-agent-role {
        margin: 0;
        font-size: 13px;
        color: #94a3b8;
        font-weight: 500;
      }

      .vh-panel-close {
        background: rgba(255, 255, 255, 0.08);
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 10px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        transition: all 0.2s ease;
      }

      .vh-panel-close:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #cbd5e1;
      }

      /* Panel Content */
      .vh-panel-content {
        padding: 24px;
        background: #0f172a;
      }

      /* Status */
      .vh-status {
        margin-bottom: 24px;
        padding: 16px 20px;
        border-radius: 14px;
        background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
        border: 1px solid rgba(59, 130, 246, 0.2);
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .vh-status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #3b82f6;
        animation: vh-status-pulse 2s ease-in-out infinite;
        flex-shrink: 0;
      }

      @keyframes vh-status-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .vh-status-text {
        font-size: 14px;
        color: #e2e8f0;
        font-weight: 500;
        line-height: 1.4;
        margin: 0;
      }

      /* Status States */
      .vh-status-connecting {
        background: linear-gradient(135deg, #d97706 0%, #ea580c 100%);
        border-color: rgba(251, 146, 60, 0.3);
      }

      .vh-status-connecting .vh-status-indicator {
        background: #fb923c;
        animation: vh-status-connecting 1s ease-in-out infinite;
      }

      @keyframes vh-status-connecting {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }

      .vh-status-connected {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        border-color: rgba(16, 185, 129, 0.3);
      }

      .vh-status-connected .vh-status-indicator {
        background: #10b981;
      }

      .vh-status-error {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        border-color: rgba(239, 68, 68, 0.3);
      }

      .vh-status-error .vh-status-indicator {
        background: #ef4444;
      }

      .vh-status-disconnected {
        background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
        border-color: rgba(59, 130, 246, 0.2);
      }

      .vh-status-disconnected .vh-status-indicator {
        background: #3b82f6;
      }

      /* Voice Button */
      .vh-voice-btn {
        width: 100%;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border: none;
        border-radius: 14px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
        font-weight: 600;
        font-size: 14px;
        letter-spacing: -0.025em;
        position: relative;
        overflow: hidden;
      }

      .vh-voice-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 24px rgba(16, 185, 129, 0.4);
      }

      .vh-voice-btn:disabled {
        background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
        cursor: not-allowed;
        transform: none;
        box-shadow: 0 2px 8px rgba(75, 85, 99, 0.2);
        opacity: 0.7;
      }

      .vh-voice-btn-connected {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);
      }

      .vh-voice-btn-connected:hover:not(:disabled) {
        box-shadow: 0 6px 24px rgba(220, 38, 38, 0.4);
      }

      .vh-btn-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 18px 24px;
      }

      /* Spinner */
      .vh-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: vh-spin 1s linear infinite;
      }

      @keyframes vh-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Incoming Call Notification */
      .vh-incoming-call {
        position: fixed;
        z-index: 10001;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes vh-call-attention {
        0%, 100% { 
          filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
        }
        50% { 
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
        }
      }



      /* Incoming Call Positioning */
      .vh-incoming-call-top-right {
        top: 24px;
        right: 24px;
        transform: translateX(100%);
      }

      .vh-incoming-call-top-left {
        top: 24px;
        left: 24px;
        transform: translateX(-100%);
      }

      .vh-incoming-call-bottom-right {
        bottom: 24px;
        right: 24px;
        transform: translateX(100%);
      }

      .vh-incoming-call-bottom-left {
        bottom: 24px;
        left: 24px;
        transform: translateX(-100%);
      }

      .vh-incoming-call-bottom-center {
        bottom: 24px;
        left: 50%;
        transform: translate(-50%, 100%);
      }

      .vh-incoming-call.vh-call-show {
        opacity: 1;
      }

      .vh-incoming-call-top-right.vh-call-show,
      .vh-incoming-call-bottom-right.vh-call-show {
        transform: translateX(0);
        animation: vh-call-attention 3s ease-in-out infinite, vh-call-shake-right 4s ease-in-out infinite;
      }

      .vh-incoming-call-top-left.vh-call-show,
      .vh-incoming-call-bottom-left.vh-call-show {
        transform: translateX(0);
        animation: vh-call-attention 3s ease-in-out infinite, vh-call-shake-left 4s ease-in-out infinite;
      }

      .vh-incoming-call-bottom-center.vh-call-show {
        transform: translate(-50%, 0);
        animation: vh-call-attention 3s ease-in-out infinite, vh-call-shake-center 4s ease-in-out infinite;
      }

      @keyframes vh-call-shake-right {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
      }

      @keyframes vh-call-shake-left {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
      }

      @keyframes vh-call-shake-center {
        0%, 100% { transform: translate(-50%, 0); }
        10%, 30%, 50%, 70%, 90% { transform: translate(-50%, -2px); }
        20%, 40%, 60%, 80% { transform: translate(-50%, 2px); }
      }

      .vh-call-notification {
        background: #0f172a;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2);
        width: 380px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(20px);
        overflow: hidden;
        position: relative;
        animation: vh-notification-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      @keyframes vh-notification-bounce {
        0% {
          transform: scale(0.3) rotate(-10deg);
          opacity: 0;
        }
        50% {
          transform: scale(1.05) rotate(2deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
      }

      .vh-call-notification::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1));
        border-radius: 22px;
        z-index: -1;
        animation: vh-border-glow 2s linear infinite;
        opacity: 0.7;
      }

      @keyframes vh-border-glow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      .vh-call-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px 24px 0;
        position: relative;
      }

      .vh-call-avatar {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: vh-call-pulse 1.5s ease-in-out infinite, vh-avatar-glow 2s ease-in-out infinite alternate;
        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
        position: relative;
      }

      .vh-call-avatar::before {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        background: linear-gradient(45deg, rgba(99, 102, 241, 0.3), rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.3));
        border-radius: 20px;
        z-index: -1;
        animation: vh-avatar-ring 3s linear infinite;
        opacity: 0.6;
      }

      @keyframes vh-call-pulse {
        0%, 100% { 
          transform: scale(1);
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
        }
        50% { 
          transform: scale(1.1);
          box-shadow: 0 16px 48px rgba(99, 102, 241, 0.7);
        }
      }

      @keyframes vh-avatar-glow {
        0% { 
          filter: brightness(1) saturate(1);
        }
        100% { 
          filter: brightness(1.2) saturate(1.3);
        }
      }

      @keyframes vh-avatar-ring {
        0% { 
          transform: rotate(0deg) scale(1);
          opacity: 0.6;
        }
        50% { 
          transform: rotate(180deg) scale(1.05);
          opacity: 0.8;
        }
        100% { 
          transform: rotate(360deg) scale(1);
          opacity: 0.6;
        }
      }

      .vh-call-info {
        flex: 1;
      }

      .vh-call-name {
        font-size: 18px;
        font-weight: 700;
        color: #f8fafc;
        margin-bottom: 4px;
        letter-spacing: -0.025em;
        animation: vh-text-glow 2s ease-in-out infinite alternate;
      }

      @keyframes vh-text-glow {
        0% { 
          text-shadow: 0 0 5px rgba(248, 250, 252, 0.3);
        }
        100% { 
          text-shadow: 0 0 15px rgba(248, 250, 252, 0.6), 0 0 25px rgba(248, 250, 252, 0.3);
        }
      }

      .vh-call-subtitle {
        font-size: 13px;
        color: #94a3b8;
        font-weight: 500;
      }

      .vh-call-close {
        background: rgba(255, 255, 255, 0.08);
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 8px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: all 0.2s ease;
      }

      .vh-call-close:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #cbd5e1;
      }

      .vh-call-content {
        padding: 20px 24px 24px;
      }

      .vh-call-message {
        margin: 0 0 20px 0;
        font-size: 14px;
        color: #cbd5e1;
        line-height: 1.5;
      }

      .vh-call-actions {
        display: flex;
        gap: 12px;
      }

      .vh-call-btn {
        flex: 1;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 20px;
        letter-spacing: -0.025em;
      }

      .vh-call-btn-secondary {
        background: rgba(255, 255, 255, 0.08);
        color: #cbd5e1;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .vh-call-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #f1f5f9;
      }

      .vh-call-btn-primary {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
        animation: vh-button-pulse 2s ease-in-out infinite;
        position: relative;
        overflow: hidden;
      }

      .vh-call-btn-primary::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        animation: vh-button-shine 3s ease-in-out infinite;
      }

      .vh-call-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 24px rgba(16, 185, 129, 0.4);
        animation: vh-button-pulse 1s ease-in-out infinite;
      }

      @keyframes vh-button-pulse {
        0%, 100% { 
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
        }
        50% { 
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5), 0 0 30px rgba(16, 185, 129, 0.2);
        }
      }

      @keyframes vh-button-shine {
        0% { left: -100%; }
        50% { left: 100%; }
        100% { left: 100%; }
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        /* Widget Panel Mobile Styles - Centered */
        .vh-panel {
          position: fixed !important;
          width: calc(100vw - 32px);
          max-width: 380px;
          left: 50% !important;
          right: auto !important;
          top: auto !important;
          bottom: 90px !important;
          transform: translateX(-50%);
          z-index: 10001;
        }

        .vh-panel-open {
          transform: translateX(-50%) translateY(0) scale(1);
        }

        /* Specific positioning for different widget positions */
        .vh-widget-top-right .vh-panel,
        .vh-widget-top-left .vh-panel {
          top: 90px !important;
          bottom: auto !important;
        }

        /* Keep trigger button in original position on mobile */
        .vh-widget-bottom-right {
          bottom: 24px;
          right: 16px;
          left: auto;
          transform: none;
        }

        .vh-widget-bottom-left {
          bottom: 24px;
          left: 16px;
          right: auto;
          transform: none;
        }

        .vh-widget-top-right {
          top: 24px;
          right: 16px;
          left: auto;
          transform: none;
        }

        .vh-widget-top-left {
          top: 24px;
          left: 16px;
          right: auto;
          transform: none;
        }

        /* Incoming Call Notification Mobile Styles */
        .vh-call-notification {
          width: calc(100vw - 32px);
          max-width: 360px;
        }

        /* Reset all positioning for mobile - center everything */
        .vh-incoming-call-top-right,
        .vh-incoming-call-top-left,
        .vh-incoming-call-bottom-right,
        .vh-incoming-call-bottom-left,
        .vh-incoming-call-bottom-center {
          left: 50% !important;
          right: auto !important;
          top: 50% !important;
          bottom: auto !important;
          transform: translate(-50%, -50%) scale(0.9);
          opacity: 0;
        }

        /* Show state for mobile - center with scale animation */
        .vh-incoming-call-top-right.vh-call-show,
        .vh-incoming-call-top-left.vh-call-show,
        .vh-incoming-call-bottom-right.vh-call-show,
        .vh-incoming-call-bottom-left.vh-call-show,
        .vh-incoming-call-bottom-center.vh-call-show {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
          animation: vh-call-attention-mobile 3s ease-in-out infinite;
        }

        @keyframes vh-call-attention-mobile {
          0%, 100% { 
            filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
            transform: translate(-50%, -50%) scale(1.02);
          }
        }

        /* Trigger button mobile adjustments */
        .vh-trigger-text {
          display: none;
        }

        .vh-trigger {
          min-width: 56px;
          min-height: 56px;
        }

        /* Mobile-specific call notification adjustments */
        .vh-call-header {
          padding: 20px 20px 0;
        }

        .vh-call-content {
          padding: 16px 20px 20px;
        }

        .vh-call-avatar {
          width: 48px;
          height: 48px;
        }

        .vh-call-name {
          font-size: 16px;
        }

        .vh-call-actions {
          flex-direction: column;
          gap: 8px;
        }

        .vh-call-btn {
          padding: 12px 16px;
          font-size: 14px;
        }

        /* Panel mobile adjustments */
        .vh-panel-header {
          padding: 20px;
        }

        .vh-panel-content {
          padding: 20px;
        }

        .vh-agent-name {
          font-size: 16px;
        }

        .vh-btn-content {
          padding: 16px 20px;
        }
      }

      /* Extra small screens */
      @media (max-width: 480px) {
        .vh-call-notification {
          width: calc(100vw - 24px);
          max-width: none;
        }

        .vh-panel {
          width: calc(100vw - 24px);
          max-width: none;
        }

        .vh-call-header {
          padding: 16px 16px 0;
        }

        .vh-call-content {
          padding: 12px 16px 16px;
        }

        .vh-panel-header {
          padding: 16px;
        }

        .vh-panel-content {
          padding: 16px;
        }
      }
    `;
  }
}
