# VoiceHire Platform Agent

A LiveKit-based AI interview agent for the VoiceHire platform.

## Features

### AI Interview Mode

- Conducts structured professional interviews
- Asks relevant questions across different categories (experience, technical, behavioral)
- Provides natural conversation flow with follow-up questions
- Automatically manages interview stages and progression
- Records and transcribes interview sessions
- Stores stage-wise and full interview transcripts

## Architecture

### Core Components

- **`agent.py`** - Main agent entrypoint and orchestrator
- **`workflow_dispatcher.py`** - Routes sessions to AI interview handler
- **`interview_agent.py`** - AI interviewer implementation
- **`session_manager.py`** - Manages session lifecycle and timeouts
- **`transcript_manager.py`** - Handles stage-wise and full interview transcript storage
- **`s3_transcript_storage.py`** - S3 storage adapter for future cloud storage

### Session Configuration

The agent automatically detects AI interview sessions from room metadata:

```json
{
  "sessionType": "ai_interview",
  "maxDuration": 1800,
  "enableTranscription": true,
  "enableRecording": false,
  "interviewRole": "Software Engineer",
  "interviewType": "technical"
}
```

## Setup

### Requirements

- Python 3.9+
- LiveKit server instance
- Required API keys (OpenAI, Deepgram)

### Installation

1. Install dependencies:

```bash
uv sync
```

2. Download model files:

```bash
uv run src/agent.py download-files
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables

```bash
# LiveKit Configuration (required)
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-livekit-url.com

# OpenAI Configuration (required)
OPENAI_API_KEY=your_openai_api_key

# Deepgram Configuration (required for STT)
DEEPGRAM_API_KEY=your_deepgram_api_key

# VoiceHire API Configuration (required for interview validation)
VH_API_BASE_URL=https://localhost:7063
VH_M2M_CLIENT_ID=lambda-client
VH_M2M_CLIENT_SECRET=your-secure-client-secret-for-lambda-function

# Agent Configuration
AGENT_SESSION_TIMEOUT=600
AGENT_NAME="VoiceHire Assistant"
AGENT_IDENTITY="voicehire-agent"
```

## Usage

### Development Mode

Run the agent in development mode to connect to LiveKit:

```bash
uv run src/agent.py dev
```

### Console Mode (Testing)

Test the agent locally in your terminal:

```bash
uv run src/agent.py console
```

### Production Mode

Run the agent in production:

```bash
uv run src/agent.py start
```

## Authentication

The agent uses Machine-to-Machine (M2M) authentication to securely communicate with the VoiceHire API:

### M2M Flow

1. Agent generates JWT token using client credentials (`VH_M2M_CLIENT_ID` and `VH_M2M_CLIENT_SECRET`)
2. Token is automatically renewed before expiration (5-minute buffer)
3. API calls include `Authorization: Bearer <token>` header
4. If authentication fails (401), token is invalidated and regenerated

### Authentication Features

- **Automatic Token Management**: No manual token handling required
- **Token Caching**: Reuses valid tokens to minimize API calls
- **Expiry Handling**: Proactively renews tokens before expiration
- **Error Recovery**: Automatically retries on authentication failures
- **Thread-Safe**: Concurrent requests safely share the same token

## Integration with Platform-Web

The agent is designed to work seamlessly with the platform-web React application:

### AI Interview Integration

1. Platform-web creates room with `sessionType: "ai_interview"`
2. Agent joins as interviewer
3. Candidate connects via web interface
4. Real-time transcription sent via data channels
5. Interview progress tracked and stored

### Data Channels

The agent communicates with platform-web via LiveKit data channels:

**Transcription Channel** (`transcription`):

```json
{
  "type": "transcription",
  "participantId": "user123",
  "participantName": "John Doe",
  "message": "Hello, this is my response",
  "timestamp": 1641234567890,
  "isAI": false
}
```

## Configuration

### Interview Questions

Questions are organized by category in `interview_agent.py`:

- **Opening**: Introduction and background
- **Experience**: Work history and accomplishments
- **Technical**: Technical skills and problem-solving
- **Behavioral**: Teamwork and conflict resolution
- **Closing**: Questions and wrap-up

### Session Limits

Configure session limits via environment variables or room metadata:

- `MAX_INTERVIEW_DURATION`: Default 30 minutes
- `MAX_PARTICIPANTS`: Default 2 (AI + candidate)

## Transcript Storage

The interview agent automatically stores transcripts at two levels:

### Stage-wise Transcripts

- Individual transcript file for each interview stage
- **Non-blocking storage**: Queued immediately when stage completes (doesn't block agent)
- **Fire-and-forget**: Local storage happens asynchronously in background
- Includes stage metadata, timing, and conversation
- File format: `interview_{id}_stage_{name}_{timestamp}.json`

### Full Interview Transcripts

- Complete transcript containing all stages
- **Blocking storage with retry**: Stored when interview ends (agent waits for completion)
- **Reliable delivery**: Automatic retry with 2-second delays (up to 3 attempts)
- **Pending flush**: Any pending stage transcripts are also stored with retry
- Includes session summary and all stage transcripts
- File format: `interview_{id}_full_{timestamp}.json`

### Local Storage

- Files saved to `transcripts/` directory (created automatically)
- JSON format with structured conversation data
- Includes participant info, timing, and metadata
- Example transcript structure:

```json
{
  "sessionInfo": {
    "interviewId": 12345,
    "participantName": "John Doe",
    "durationSeconds": 1800,
    "totalStages": 4,
    "endReason": "completed"
  },
  "stages": [...],
  "fullConversation": [...],
  "metadata": {
    "storedAt": 1640995200,
    "version": "1.0"
  }
}
```

### S3 Storage (Future)

- Set `TRANSCRIPT_BUCKET` environment variable to enable
- **Stage transcripts**: Attempted upload but failures don't block agent
- **Final transcripts**: Uploaded with retry logic during interview end
- Supports presigned URLs for secure access
- Ready for implementation with boto3/aiobotocore

### Testing Transcript Storage

Run the test script to verify functionality:

```bash
python src/test_transcript_manager.py
```

This will create sample transcripts and demonstrate the storage system.

### Storage Architecture

The transcript storage system uses a **two-phase approach**:

#### Phase 1: Non-blocking Stage Storage

- When each stage completes, transcript data is immediately queued
- Local file storage happens asynchronously (fire-and-forget)
- S3 upload attempted but failures don't block the interview
- Agent continues immediately to next stage

#### Phase 2: Reliable Final Storage

- When interview ends, agent waits for all storage to complete
- Any failed stage transcripts are retried with exponential backoff
- Full interview transcript stored with retry logic
- S3 uploads retried up to 3 times with 2-second delays
- Only proceeds to cleanup after successful storage

This ensures **optimal interview performance** (no blocking during stages) while guaranteeing **reliable transcript delivery** (retry logic at the end).

## Logging

Comprehensive logging is provided:

- Console output for real-time monitoring
- File logging to `platform_agent.log`
- Debug level logging for development
- Structured log format with timestamps

## Deployment

The agent can be deployed using:

1. **Docker** - Containerized deployment (Dockerfile needed)
2. **AWS/GCP** - Cloud VM deployment
3. **Kubernetes** - Scalable container orchestration
4. **LiveKit Cloud** - Managed agent hosting

## Contributing

1. Follow existing code patterns and structure
2. Add comprehensive logging for debugging
3. Test AI interview functionality thoroughly
4. Update documentation for any configuration changes
5. Ensure proper error handling and graceful degradation

## License

Part of the VoiceHire platform - proprietary software.
