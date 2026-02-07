import { VoiceClient } from "./voice-client";
import { FAQWidget } from "./faq-widget";
import { UserInteractionTracker } from "./utils/user-interaction-tracker";
import { SoundManager } from "./utils/sound-manager";

export { VoiceClient } from "./voice-client";
export { FAQWidget } from "./faq-widget";
export { UserInteractionTracker } from "./utils/user-interaction-tracker";
export { SoundManager } from "./utils/sound-manager";
export type {
  VoiceConfig,
  ConnectionState,
  VoiceCallbacks,
  FAQPluginOptions,
  AudioDeviceInfo,
  AutoIncomingCallConfig,
} from "./types";
export type { UserInteractionData } from "./utils/user-interaction-tracker";
export type { SoundConfig } from "./utils/sound-manager";

// Main plugin initialization function
export function createVoiceHireFAQPlugin(
  options: import("./types").FAQPluginOptions = {}
) {
  return new FAQWidget(options);
}

// Global initialization for UMD builds
if (typeof window !== "undefined") {
  (window as any).VoiceHireFAQ = {
    VoiceClient,
    FAQWidget,
    UserInteractionTracker,
    SoundManager,
    createPlugin: createVoiceHireFAQPlugin,
  };
}
