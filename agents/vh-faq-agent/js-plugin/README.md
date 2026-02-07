# VoiceHire FAQ Plugin

A TypeScript library for integrating voice-based FAQ assistance into websites using LiveKit and AI voice agents.

## Features

- 🎤 **Voice-First Interface**: Natural voice conversations with AI agent "Veeaa"
- 🔧 **Easy Integration**: Simple JavaScript/TypeScript API
- 🎨 **Customizable UI**: Configurable themes, positions, and styling
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔊 **Audio Management**: Built-in microphone controls and device selection
- ⚡ **Real-time Communication**: Powered by LiveKit for low-latency voice
- 🔐 **Smart Permission Handling**: Requests microphone permission before connecting to prevent AI agent from speaking during permission prompts

## Microphone Permission Handling

The plugin automatically handles microphone permissions to provide the best user experience:

1. **Permission Check**: Before connecting to LiveKit, the plugin checks if microphone permission is already granted
2. **Permission Request**: If not granted, it requests permission first and shows appropriate status messages
3. **Graceful Fallback**: If permission is denied, it shows clear error messages explaining what the user needs to do
4. **No Interruption**: The AI agent won't start speaking while the user is dealing with permission prompts

### Pre-requesting Permission (Optional)

For even better UX, you can pre-request microphone permission early in your user flow:

```typescript
import { VoiceClient } from "@voicehire/faq-plugin";

// Create voice client
const voiceClient = new VoiceClient(config);

// Pre-request permission (e.g., on page load or user interaction)
const hasPermission = await voiceClient.preRequestMicrophonePermission();

if (hasPermission) {
  console.log("Microphone permission granted - ready for voice chat!");
} else {
  console.log("Microphone permission denied or unavailable");
}
```

## Development Workflow

### Optimal Setup (Recommended)

For the best development experience with automatic rebuilding and page refresh:

1. **Terminal 1**: Run the build watcher

   ```bash
   pnpm run dev:build
   ```

   This will automatically rebuild the library whenever you change TypeScript source files.

2. **Terminal 2**: Run live-server for auto-refresh
   ```bash
   live-server --port=8080
   ```
   This will automatically refresh the browser when `index.html` or built files change.

### Alternative Development Options

- **Basic development server**: `pnpm dev` (slower, may have caching issues)
- **One-time build**: `pnpm build`
- **Type checking**: `pnpm type-check`

### Why This Setup Works Best

- `pnpm run dev:build` watches TypeScript files and rebuilds instantly
- `live-server` detects changes to built files and refreshes the browser
- No caching issues or slow refresh times
- Clean separation of concerns

## Scripts

- `dev:build` - Build in watch mode (auto-rebuilds on source changes)
- `build` - One-time production build
- `dev` - Development server (alternative, may be slower)
- `type-check` - TypeScript type checking without emit
- `clean` - Remove dist folder

## Installation

### Using npm/pnpm

```bash
npm install @voicehire/faq-plugin
# or
pnpm add @voicehire/faq-plugin
```

### Using CDN

```html
<!-- ES Module -->
<script type="module">
  import { FAQWidget } from "https://unpkg.com/@voicehire/faq-plugin/dist/vh-faq-plugin.es.js";
</script>

<!-- UMD (Global) -->
<script src="https://unpkg.com/@voicehire/faq-plugin/dist/vh-faq-plugin.umd.js"></script>
```

## Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Website</title>
  </head>
  <body>
    <!-- Your website content -->

    <script type="module">
      import { FAQWidget } from "@voicehire/faq-plugin";

      // Create the widget
      const faqWidget = new FAQWidget({
        agentName: "Veeaa",
        position: "bottom-right",
        theme: "light",
      });

      // Initialize with LiveKit configuration
      await faqWidget.initialize({
        livekitUrl: "wss://your-livekit-server.com",
        tokenApiUrl: "https://your-api.com/api/token", // API endpoint for token generation
        participantName: "Web User", // Optional: defaults to "Web User"
        // roomName: "custom-room", // Optional: auto-generated if not provided
      });
    </script>
  </body>
</html>
```

### Advanced Configuration

```typescript
import { FAQWidget, VoiceClient } from "@voicehire/faq-plugin";

// Create widget with custom options
const widget = new FAQWidget({
  containerId: "my-faq-widget",
  buttonText: "Ask Our AI Assistant",
  agentName: "Veeaa",
  theme: "dark",
  position: "bottom-left",
});

// Initialize with voice configuration
await widget.initialize({
  livekitUrl: "wss://your-livekit-server.com",
  tokenApiUrl: "https://your-api.com/api/token", // API endpoint for token generation
  participantName: "Customer", // Optional: defaults to "Web User"
  // roomName: "support-room", // Optional: auto-generated if not provided
  enableEchoCancellation: true,
  enableNoiseSuppression: true,
  autoGainControl: true,
});
```

## API Reference

### FAQWidget

#### Constructor Options

```typescript
interface FAQPluginOptions {
  containerId?: string; // DOM element ID (default: 'vh-faq-widget')
  buttonText?: string; // Button text (default: 'Ask Veeaa')
  agentName?: string; // Agent name (default: 'Veeaa')
  theme?: "light" | "dark"; // UI theme (default: 'light')
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"; // Position (default: 'bottom-right')
}
```

#### Methods

- `initialize(config: VoiceConfig): Promise<void>` - Initialize the voice client
- `destroy(): void` - Clean up and remove the widget

### VoiceClient

#### Configuration

```typescript
interface VoiceConfig {
  livekitUrl: string; // LiveKit server URL
  token?: string; // JWT token for authentication (optional if using tokenApiUrl)
  tokenApiUrl?: string; // API endpoint to generate tokens dynamically
  roomName?: string; // Room name to join (auto-generated if not provided)
  participantName?: string; // Participant display name (defaults to "Web User")
  enableEchoCancellation?: boolean; // Enable echo cancellation (default: true)
  enableNoiseSuppression?: boolean; // Enable noise suppression (default: true)
  autoGainControl?: boolean; // Enable auto gain control (default: true)
}
```

#### Methods

- `connect(): Promise<void>` - Connect to the voice room (automatically handles microphone permission)
- `disconnect(): Promise<void>` - Disconnect from the voice room
- `checkMicrophonePermission(): Promise<boolean>` - Check if microphone permission is already granted
- `requestMicrophonePermission(): Promise<void>` - Request microphone permission from user
- `preRequestMicrophonePermission(): Promise<boolean>` - Pre-request microphone permission (returns true if granted)
- `enableMicrophone(): Promise<void>` - Enable microphone
- `disableMicrophone(): Promise<void>` - Disable microphone
- `toggleMicrophone(): Promise<boolean>` - Toggle microphone state
- `isMicrophoneEnabled(): boolean` - Check if microphone is enabled
- `getConnectionState(): ConnectionState` - Get current connection state
- `getAudioDevices(): Promise<AudioDeviceInfo[]>` - Get available audio devices

#### Events

```typescript
interface VoiceCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onParticipantConnected?: (participantName: string) => void;
  onParticipantDisconnected?: (participantName: string) => void;
  onMicrophonePermissionGranted?: () => void; // Called when microphone permission is granted
}
```

## Styling

The plugin includes default styles, but you can customize the appearance:

```css
/* Override default styles */
.vh-faq-widget {
  /* Custom widget styles */
}

.vh-faq-button {
  background: #your-brand-color !important;
}

.vh-faq-panel {
  /* Custom panel styles */
}
```

## Token Generation

The plugin supports two methods for token generation:

### Method 1: API-Based Token Generation (Recommended)

Configure the plugin to automatically generate tokens by calling your API:

```typescript
await widget.initialize({
  livekitUrl: "wss://your-livekit-server.com",
  tokenApiUrl: "https://your-api.com/api/token", // Your token generation endpoint
  participantName: "Web User", // Optional: defaults to "Web User"
  // roomName: "custom-room", // Optional: auto-generated if not provided
});
```

The plugin will automatically:

- Generate a random room name (format: `demo-{timestamp}-{randomId}-{uuid}`)
- Use the provided participant name or default to "Web User"
- Call your API with `POST` request containing `{ roomName, participantName }`
- Handle the token response (supports both plain token strings and JSON objects)

### Method 2: Pre-generated Tokens

Alternatively, you can provide a pre-generated token:

```typescript
await widget.initialize({
  livekitUrl: "wss://your-livekit-server.com",
  token: "your-pre-generated-jwt-token",
  roomName: "specific-room",
  participantName: "specific-user",
});
```

## Backend Integration

You'll need a backend service to generate LiveKit tokens. Here's an example:

```javascript
// Node.js example with LiveKit server SDK
import { AccessToken } from "livekit-server-sdk";

app.post("/api/token", (req, res) => {
  const { roomName, participantName } = req.body;

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantName,
      name: participantName,
    }
  );

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  res.json({ token: token.toJwt() });
});
```

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/voicehire/voice-hire.git
cd voice-hire/agents/vh-faq-agent/js-plugin

# Install dependencies
pnpm install

# Build the project
pnpm build

# Start development server
pnpm dev
```

### Project Structure

```
src/
├── types.ts          # TypeScript type definitions
├── voice-client.ts   # LiveKit voice client implementation
├── faq-widget.ts     # Main widget component
└── index.ts          # Main entry point

dist/                 # Built files
├── vh-faq-plugin.es.js    # ES module build
├── vh-faq-plugin.umd.js   # UMD build
└── *.d.ts                 # TypeScript declarations
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:

- 📧 Email: support@voicehireats.com
- 📖 Documentation: https://docs.voicehireats.com

## Configuration Options

### Basic Options

- `containerId` (string): DOM element ID for the widget container
- `buttonText` (string): Text displayed on the main button
- `agentName` (string): Name of the AI agent
- `theme` ("light" | "dark"): Widget theme
- `position` ("bottom-right" | "bottom-left" | "top-right" | "top-left"): Widget position

### Auto Incoming Call Configuration

The widget supports smart automatic incoming call notifications that respect user preferences and prevent notification fatigue:

```javascript
const widget = createVoiceHireFAQPlugin({
  autoIncomingCall: {
    enabled: true, // Enable/disable auto incoming calls (default: true)
    delayMs: 10000, // Delay before showing notification in ms (default: 5000)
    timeoutMs: 30000, // Auto-hide notification after timeout in ms (default: 20000, 0 = no timeout)
    position: "bottom-center", // Position of incoming call notification (default: "bottom-center")

    // Smart notification options (NEW)
    respectUserChoice: true, // Don't show again if user declined (default: true)
    cooldownMs: 1800000, // Minimum time between notifications in ms (default: 30 minutes)
    maxNotificationsPerSession: 2, // Maximum notifications per browsing session (default: 2)
    resetAfterDays: 7, // Reset user preferences after X days (default: 7)
    developerMode: false, // Always show notifications for testing (default: false)
  },
});
```

#### Auto Incoming Call Options

**Basic Options:**

- `enabled` (boolean): Whether to show automatic incoming call notifications

  - Default: `true`
  - Set to `false` to disable auto incoming calls completely

- `delayMs` (number): Time in milliseconds to wait before showing the incoming call notification

  - Default: `5000` (5 seconds)
  - Minimum: `1000` (1 second)

- `timeoutMs` (number): Time in milliseconds after which the incoming call notification will automatically disappear if not answered

  - Default: `20000` (20 seconds)
  - Set to `0` to disable auto-timeout (notification stays until user action)

- `position` ("top-right" | "top-left" | "bottom-right" | "bottom-left" | "bottom-center"): Position where the incoming call notification appears
  - Default: `"bottom-center"`
  - Choose from 5 available positions to best fit your website layout

**Smart Notification Options (NEW):**

- `respectUserChoice` (boolean): Whether to remember and respect user's decline choice

  - Default: `true`
  - If user declines, they won't see notifications again until they interact with the widget or preferences reset

- `cooldownMs` (number): Minimum time between notifications in milliseconds

  - Default: `1800000` (30 minutes)
  - Prevents notification spam during navigation

- `maxNotificationsPerSession` (number): Maximum number of notifications to show per browsing session

  - Default: `2`
  - Limits interruptions during a single visit

- `resetAfterDays` (number): Number of days after which user preferences are reset

  - Default: `7` (1 week)
  - Allows re-engagement with users who previously declined

- `developerMode` (boolean): **IMPORTANT FOR DEVELOPMENT** - Bypasses all smart logic and always shows notifications
  - Default: `false`
  - Set to `true` during development and testing to see notifications on every page load

## Examples

### Development Mode (Recommended for Testing)

```javascript
const widget = createVoiceHireFAQPlugin({
  agentName: "Test Agent",
  autoIncomingCall: {
    enabled: true,
    developerMode: true, // Always show notifications for testing
    delayMs: 3000, // Shorter delay for faster testing
  },
});
```

### Production Mode (Smart Notifications)

```javascript
const widget = createVoiceHireFAQPlugin({
  agentName: "Support Bot",
  autoIncomingCall: {
    enabled: true,
    respectUserChoice: true, // Respect user preferences
    cooldownMs: 30 * 60 * 1000, // 30 minutes between notifications
    maxNotificationsPerSession: 2, // Max 2 per session
    resetAfterDays: 7, // Reset weekly
  },
});
```

### Disable Auto Incoming Calls

```javascript
const widget = createVoiceHireFAQPlugin({
  agentName: "Support Bot",
  autoIncomingCall: {
    enabled: false,
  },
});
```

### Aggressive Notifications (High-Priority Sites)

```javascript
const widget = createVoiceHireFAQPlugin({
  agentName: "Sales Assistant",
  autoIncomingCall: {
    enabled: true,
    respectUserChoice: false, // Show even if user declined before
    cooldownMs: 10 * 60 * 1000, // 10 minutes between notifications
    maxNotificationsPerSession: 3, // Up to 3 per session
    resetAfterDays: 1, // Reset daily
  },
});
```

### Conservative Notifications (Minimal Interruption)

```javascript
const widget = createVoiceHireFAQPlugin({
  agentName: "Customer Service",
  autoIncomingCall: {
    enabled: true,
    respectUserChoice: true,
    cooldownMs: 60 * 60 * 1000, // 1 hour between notifications
    maxNotificationsPerSession: 1, // Only once per session
    resetAfterDays: 30, // Reset monthly
    delayMs: 30000, // Wait 30 seconds before first show
  },
});
```

### Custom Position

```javascript
const widget = createVoiceHireFAQPlugin({
  agentName: "Support Agent",
  autoIncomingCall: {
    enabled: true,
    position: "top-right", // Show in top-right corner
  },
});
```

## API Methods

### Widget Methods

- `initialize(voiceConfig)`: Initialize the voice client
- `destroy()`: Clean up the widget and remove from DOM
- `resetUserPreferences()`: Reset user interaction data (useful for testing)
- `getUserStats()`: Get current user interaction statistics

### Developer Utilities

```javascript
// Reset user preferences (for testing)
widget.resetUserPreferences();

// Get user interaction stats
const stats = widget.getUserStats();
console.log(stats);
// Output: {
//   lastNotificationShown: 1234567890,
//   notificationCount: 2,
//   userDeclined: false,
//   userAccepted: true,
//   sessionStart: 1234567890,
//   lastInteraction: 1234567890
// }

// Access UserInteractionTracker directly (advanced)
import { UserInteractionTracker } from "@voicehire/faq-plugin";
UserInteractionTracker.resetUserData();
```

## Voice Configuration

```javascript
const voiceConfig = {
  livekitUrl: "wss://your-livekit-server.com",
  tokenApiUrl: "https://your-api.com/token",
  roomName: "optional-room-name",
  participantName: "User Name",
  enableEchoCancellation: true,
  enableNoiseSuppression: true,
  autoGainControl: true,
};
```
