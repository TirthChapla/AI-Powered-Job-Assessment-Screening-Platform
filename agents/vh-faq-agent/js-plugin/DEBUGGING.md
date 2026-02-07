# VH FAQ Plugin - Debugging Guide

## 🐛 Troubleshooting Notification Issues

### **Issue: Production Mode Notifications Not Showing**

If you're testing production mode and notifications aren't appearing, here's how to debug:

#### **Step 1: Check Console Logs**

Open browser console (F12) and look for these messages:

- `"VH FAQ: Developer mode enabled - showing notification"` ✅ (Developer mode)
- `"VH FAQ: User previously declined, respecting choice"` ❌ (User declined before)
- `"VH FAQ: User previously accepted, not showing notification"` ❌ (User accepted before)
- `"VH FAQ: Cooldown active, X minutes remaining"` ❌ (Cooldown period)
- `"VH FAQ: Max notifications per session reached (X/Y)"` ❌ (Session limit)
- `"VH FAQ: All checks passed, showing notification"` ✅ (Should show)

#### **Step 2: Check User Interaction Data**

```javascript
// In browser console:
const stats = widget.getUserStats();
console.log(stats);

// Or use the UserInteractionTracker directly:
import { UserInteractionTracker } from "./dist/vh-faq-plugin.es.js";
console.log(UserInteractionTracker.getUserStats());
```

#### **Step 3: Reset User Data**

If you have previous test data:

```javascript
// Reset all user interaction data
widget.resetUserPreferences();

// Or directly:
UserInteractionTracker.resetUserData();
```

#### **Step 4: Check Configuration**

Verify your configuration:

```javascript
const widget = new FAQWidget({
  autoIncomingCall: {
    enabled: true, // Must be true
    developerMode: false, // Should be false for production testing
    respectUserChoice: true, // Check if this is causing issues
    cooldownMs: 10000, // 10 seconds for testing
    maxNotificationsPerSession: 2, // Check if limit reached
    delayMs: 2000, // Delay before showing
  },
});
```

### **Common Issues and Solutions**

#### **1. User Previously Accepted/Declined**

**Problem:** `userAccepted: true` or `userDeclined: true` in localStorage
**Solution:** Reset user data or set `respectUserChoice: false`

#### **2. Cooldown Period Active**

**Problem:** Recent notification shown, cooldown still active
**Solution:** Wait for cooldown or reset user data

#### **3. Session Limit Reached**

**Problem:** `notificationCount >= maxNotificationsPerSession`
**Solution:** Reset user data or increase session limit

#### **4. Developer Mode Confusion**

**Problem:** `developerMode: true` when testing production logic
**Solution:** Set `developerMode: false` for production testing

### **Quick Debug Commands**

```javascript
// Check current user stats
console.log("User Stats:", widget.getUserStats());

// Reset everything
widget.resetUserPreferences();

// Simulate user actions
UserInteractionTracker.recordUserAccepted();
UserInteractionTracker.recordUserDeclined();

// Check localStorage directly
console.log(
  "Raw localStorage:",
  localStorage.getItem("vh-faq-user-interactions")
);
```

### **Test Scenarios**

#### **Fresh User Test**

1. Reset user data: `widget.resetUserPreferences()`
2. Create widget with production config
3. Should see notification after delay

#### **Returning User Test**

1. Don't reset user data
2. Create widget with production config
3. Check console for reason if no notification

#### **Developer Mode Test**

1. Set `developerMode: true`
2. Should always see notification regardless of history

### **Expected Behaviors**

| Scenario                                        | Should Show Notification? | Console Message                                      |
| ----------------------------------------------- | ------------------------- | ---------------------------------------------------- |
| Fresh user, production mode                     | ✅ Yes                    | "All checks passed, showing notification"            |
| User declined before (respectUserChoice: true)  | ❌ No                     | "User previously declined, respecting choice"        |
| User accepted before (respectUserChoice: true)  | ❌ No                     | "User previously accepted, not showing notification" |
| User declined before (respectUserChoice: false) | ✅ Yes                    | "Aggressive mode - ignoring previous user choice"    |
| User accepted before (respectUserChoice: false) | ✅ Yes                    | "Aggressive mode - ignoring previous user choice"    |
| Cooldown active                                 | ❌ No                     | "Cooldown active, X minutes remaining"               |
| Session limit reached                           | ❌ No                     | "Max notifications per session reached"              |
| Developer mode                                  | ✅ Always                 | "Developer mode enabled - showing notification"      |

### **File Locations**

- **Main demo:** `index.html` (has `developerMode: true`)
- **Test scenarios:** `test-scenarios.html` (comprehensive testing)
- **User tracker:** `src/utils/user-interaction-tracker.ts`
- **Notification logic:** `src/components/incoming-call-notification.ts`

### **Quick Fixes**

1. **For immediate testing:** Use "Reset & Test Production" button in test-scenarios.html
2. **For development:** Keep `developerMode: true` in index.html
3. **For production testing:** Use test-scenarios.html with production mode
4. **Clear everything:** `localStorage.removeItem('vh-faq-user-interactions')`
