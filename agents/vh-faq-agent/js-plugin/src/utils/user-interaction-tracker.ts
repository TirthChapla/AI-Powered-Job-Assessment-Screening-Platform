export interface UserInteractionData {
  lastNotificationShown: number;
  notificationCount: number;
  userDeclined: boolean;
  userAccepted: boolean;
  sessionStart: number;
  lastInteraction: number;
}

export class UserInteractionTracker {
  private static readonly STORAGE_KEY = "vh-faq-user-interactions";
  private static readonly DEFAULT_DATA: UserInteractionData = {
    lastNotificationShown: 0,
    notificationCount: 0,
    userDeclined: false,
    userAccepted: false,
    sessionStart: Date.now(),
    lastInteraction: 0,
  };

  static shouldShowNotification(config: {
    respectUserChoice?: boolean;
    cooldownMs?: number;
    maxNotificationsPerSession?: number;
    resetAfterDays?: number;
    developerMode?: boolean;
  }): boolean {
    if (config.developerMode) {
      console.log("VH FAQ: Developer mode enabled - showing notification");
      return true;
    }

    const data = this.getUserData();
    const now = Date.now();

    if (
      config.resetAfterDays &&
      now - data.lastInteraction > config.resetAfterDays * 24 * 60 * 60 * 1000
    ) {
      console.log(
        "VH FAQ: User data expired, resetting and showing notification"
      );
      this.resetUserData();
      return true;
    }

    if (config.respectUserChoice && data.userDeclined && !data.userAccepted) {
      console.log("VH FAQ: User previously declined, respecting choice");
      return false;
    }

    if (config.respectUserChoice && data.userAccepted) {
      console.log("VH FAQ: User previously accepted, not showing notification");
      return false;
    }

    // Log when aggressive mode is ignoring user choices
    if (!config.respectUserChoice && (data.userDeclined || data.userAccepted)) {
      console.log(
        `VH FAQ: Aggressive mode - ignoring previous user choice (declined: ${data.userDeclined}, accepted: ${data.userAccepted})`
      );
    }

    if (
      config.cooldownMs &&
      now - data.lastNotificationShown < config.cooldownMs
    ) {
      const remainingMs =
        config.cooldownMs - (now - data.lastNotificationShown);
      console.log(
        `VH FAQ: Cooldown active, ${Math.round(
          remainingMs / 1000 / 60
        )} minutes remaining`
      );
      return false;
    }

    if (
      config.maxNotificationsPerSession &&
      data.notificationCount >= config.maxNotificationsPerSession
    ) {
      console.log(
        `VH FAQ: Max notifications per session reached (${data.notificationCount}/${config.maxNotificationsPerSession})`
      );
      return false;
    }

    console.log("VH FAQ: All checks passed, showing notification");
    return true;
  }

  static recordNotificationShown(): void {
    const data = this.getUserData();
    data.lastNotificationShown = Date.now();
    data.notificationCount += 1;
    data.lastInteraction = Date.now();
    this.saveUserData(data);
    console.log(
      `VH FAQ: Notification shown (count: ${data.notificationCount})`
    );
  }

  static recordUserAccepted(): void {
    const data = this.getUserData();
    data.userAccepted = true;
    data.userDeclined = false;
    data.lastInteraction = Date.now();
    this.saveUserData(data);
    console.log("VH FAQ: User accepted incoming call");
  }

  static recordUserDeclined(): void {
    const data = this.getUserData();
    data.userDeclined = true;
    data.lastInteraction = Date.now();
    this.saveUserData(data);
    console.log("VH FAQ: User declined incoming call");
  }

  static recordWidgetInteraction(): void {
    const data = this.getUserData();
    data.lastInteraction = Date.now();
    this.saveUserData(data);
    console.log("VH FAQ: User interacted with widget");
  }

  static resetUserData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to reset user data:", error);
    }
  }

  static getUserStats(): UserInteractionData {
    return this.getUserData();
  }

  private static getUserData(): UserInteractionData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.DEFAULT_DATA, ...parsed };
      }
    } catch (error) {
      console.warn("Failed to read user data from localStorage:", error);
    }
    return { ...this.DEFAULT_DATA };
  }

  private static saveUserData(data: UserInteractionData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save user data to localStorage:", error);
    }
  }
}
