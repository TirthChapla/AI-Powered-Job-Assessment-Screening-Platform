class CallNotification {
  constructor() {
    console.log("Initializing CallNotification...");
    this.notificationContainer = null;
    this.liveKit = null;
    this.loadLiveKitSDK()
      .then(() => {
        console.log("LiveKit SDK loaded, initializing notification...");
        this.initialize();
      })
      .catch((error) => {
        console.error("Failed to load LiveKit SDK:", error);
      });
  }

  async loadLiveKitSDK() {
    return new Promise((resolve, reject) => {
      console.log("Starting LiveKit SDK loading...");
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js";

      script.onload = () => {
        console.log("LiveKit script loaded, checking for LiveKit object...");
        // Give browser a moment to process the script
        setTimeout(() => {
          if (window.LivekitClient) {
            console.log("LiveKit SDK loaded successfully");
            this.liveKit = window.LivekitClient;
            resolve();
          } else {
            console.error("LiveKit object not found in window");
            reject(new Error("LiveKit failed to initialize"));
          }
        }, 100);
      };

      script.onerror = (error) => {
        console.error("Error loading LiveKit SDK:", error);
        reject(error);
      };

      document.head.appendChild(script);
      console.log("LiveKit script tag added to document");
    });
  }

  async handleAcceptCall() {
    try {
      // Request microphone access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Create LiveKit room connection
      console.log("Creating LiveKit room with config...");
      const room = new this.liveKit.Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio playback handling
      room.on("audioPlaybackStatusChanged", () => {
        if (!room.canPlaybackAudio) {
          console.log(
            "Audio playback requires user interaction, attempting to start..."
          );
          room.startAudio().catch(console.error);
        }
      });

      // Pre-warm connection
      room.prepareConnection("wss://my-test-app-7nxxb6id.livekit.cloud");

      // Connect to the room
      await room.connect(
        "wss://my-test-app-7nxxb6id.livekit.cloud",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDg4ODA2NzUsImlzcyI6IkFQSUhNcE53QlQyWDZabSIsIm5hbWUiOiJ3ZWJhZ2VudCIsIm5iZiI6MTc0ODg4MDM3NSwic3ViIjoid2ViYWdlbnQiLCJ2aWRlbyI6eyJjYW5VcGRhdGVPd25NZXRhZGF0YSI6dHJ1ZSwicm9vbSI6InRlc3Ryb29tMjM0NTY3OCIsInJvb21BZG1pbiI6dHJ1ZSwicm9vbUNyZWF0ZSI6dHJ1ZSwicm9vbUpvaW4iOnRydWUsInJvb21MaXN0Ijp0cnVlLCJyb29tUmVjb3JkIjp0cnVlfX0.YMEO6XTNpj4QWZhaF-HW_X4hq5_1HknWDl6uOikjG3Y"
      );

      // Set up room events after connection
      room.on("participantConnected", (participant) => {
        console.log("Participant connected:", participant.identity);
        this.handleParticipantConnected(participant);
      });

      room.on("participantDisconnected", (participant) => {
        console.log("Participant disconnected:", participant.identity);
      });

      if (room.participants) {
        // Handle existing participants
        console.log(
          "Current participants in room:",
          Array.from(room.participants.values()).length
        );
        Array.from(room.participants.values()).forEach((participant) => {
          this.handleParticipantConnected(participant);
        });
      }

      // Publish local audio track
      const localTrack = await room.localParticipant.publishTrack(
        mediaStream.getAudioTracks()[0],
        {
          name: "microphone",
          source: this.liveKit.Track.Source.Microphone,
          stopMicTrackOnMute: false,
        }
      );

      console.log("Connected to LiveKit room and published local track");
      // Keep notification visible while in call
      // this.hideNotification();
    } catch (error) {
      if (error.name === "NotAllowedError") {
        console.log("Microphone access denied");
      } else {
        console.error("Error connecting to LiveKit:", error);
      }
      this.hideNotification();
    }
  }
  async handleParticipantConnected(participant) {
    console.log("Setting up new participant:", participant.identity);

    // Subscribe to all audio tracks automatically
    participant.on("trackSubscribed", (track, publication) => {
      console.log("Track subscribed:", track.sid);
      if (track.kind === "audio") {
        const element = track.attach();
        element.volume = 1.0;
        document.body.appendChild(element);
      }
    });

    participant.on("trackUnsubscribed", (track) => {
      console.log("Track unsubscribed:", track.sid);
      track.detach();
    });

    // Subscribe to existing tracks
    participant.trackPublications.forEach((publication) => {
      if (publication.kind === "audio" && !publication.isSubscribed) {
        console.log("Found audio track, subscribing:", publication.trackSid);
        publication.setSubscribed(true);
      }
    });
  }

  async handleTrackPublication(publication) {
    if (publication.kind === "audio") {
      console.log("New audio track published:", publication.trackSid);
      if (!publication.isSubscribed) {
        await publication.setSubscribed(true);
      }
    }
  }

  initialize() {
    // Create notification container
    this.notificationContainer = document.createElement("div");
    this.notificationContainer.style.display = "none";
    const styles = `
            @keyframes slideUp {
                from { transform: translate(-50%, 100%); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            .notification-animate {
                animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .pulse-animation {
                animation: pulse 2s infinite;
            }
        `;
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    this.notificationContainer.innerHTML = `
            <div class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl z-50 w-[420px] notification-animate">
                <div class="relative">
                    <div class="absolute -top-14 left-1/2 -translate-x-1/2">
                        <div class="w-24 h-24 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-xl pulse-animation">
                            <div class="w-20 h-20 bg-black/90 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div class="text-center mt-10 mb-8">
                        <h4 class="text-2xl font-medium text-white tracking-tight mb-2">Incoming Call</h4>
                        <p class="text-gray-400 text-lg">AI Agent Viva</p>
                    </div>
                    <div class="flex justify-center items-center space-x-6">
                        <button id="reject-call" class="group flex flex-col items-center transition-transform duration-200 hover:-translate-y-1">
                            <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-2 border border-red-500/30 backdrop-blur-sm group-hover:bg-red-500/30">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <span class="text-red-500 font-medium">Decline</span>
                        </button>
                        <button id="accept-call" class="group flex flex-col items-center transition-transform duration-200 hover:-translate-y-1">
                            <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2 border border-green-500/30 backdrop-blur-sm group-hover:bg-green-500/30">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span class="text-green-400 font-medium">Accept</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    document.body.appendChild(this.notificationContainer);

    // Add event listeners
    document
      .getElementById("accept-call")
      .addEventListener("click", async () => {
        console.log("accepted");
        await this.handleAcceptCall();
      });

    document.getElementById("reject-call").addEventListener("click", () => {
      console.log("rejected");
      this.hideNotification();
    });

    // Show notification after 5 seconds
    setTimeout(() => this.showNotification(), 5000);
  }

  showNotification() {
    this.notificationContainer.style.display = "block";
  }

  hideNotification() {
    this.notificationContainer.style.display = "none";
  }
}

// Initialize the notification
new CallNotification();
