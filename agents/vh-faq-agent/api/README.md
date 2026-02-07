# VH FAQ Agent API

This Lambda function provides API operations for the vh-faq-agent system, including token generation, usage tracking, and transcription storage.

## Features

- **Token Generation**: Creates LiveKit tokens with usage validation and agent identification
- **Usage Tracking**: Monitors daily usage per user with 20-minute daily limit
- **Transcription Storage**: Stores conversation transcripts in S3
- **Agent Validation**: Ensures only vh-faq-agent can accept connections
- **TTL Management**: Automatically resets usage after 16 hours

## API Endpoints

### 1. Generate Token

**POST** `/generate-token`

Generates a LiveKit token for connecting to the voice agent.

**Request Body:**

```json
{
  "roomName": "string",
  "participantName": "string"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "tokenIdentifier": "unique_token_id",
    "agentIdentifier": "vh-faq-agent",
    "remainingMinutes": 18
  },
  "message": "Token generated successfully"
}
```

**Error Responses:**

- `400`: Missing required parameters
- `429`: Daily usage limit exceeded (20 minutes)

### 2. Store Transcription

**POST** `/store-transcription`

Stores conversation transcription in S3 and updates usage tracking.

**Request Body:**

```json
{
  "transcription": "conversation text",
  "roomName": "string",
  "participantName": "string",
  "userIdentifier": "user_hash",
  "tokenIdentifier": "token_id",
  "duration": 120,
  "timestamp": 1234567890
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transcriptionKey": "s3/path/to/transcription.json",
    "storedAt": 1234567890
  },
  "message": "Transcription stored successfully"
}
```

### 3. Check Usage

**POST** `/check-usage`

Checks current usage status for a user.

**Request Body:**

```json
{
  "userIdentifier": "optional_user_hash"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userIdentifier": "user_hash",
    "usedMinutes": 5,
    "remainingMinutes": 15,
    "dailyLimit": 20,
    "allowed": true,
    "resetTime": 1234567890
  },
  "message": "Usage data retrieved successfully"
}
```

## Infrastructure Requirements

### AWS Resources

#### 1. DynamoDB Table

**Table Name:** `vh-faq-agent-usage`

**Schema:**

```
Primary Key: usage_key (String) - Format: "{userIdentifier}#{date}"
```

**Attributes:**

- `usage_key` (String) - Primary key
- `user_identifier` (String) - Hashed user identifier
- `date` (String) - Date in YYYY-MM-DD format
- `used_minutes` (Number) - Minutes used today
- `last_token` (String) - Last generated token ID
- `last_room` (String) - Last room name
- `created_at` (Number) - Creation timestamp
- `updated_at` (Number) - Last update timestamp
- `expires_at` (Number) - TTL timestamp (16 hours from creation)

**TTL Configuration:**

- TTL Attribute: `expires_at`
- TTL Value: Current timestamp + 16 hours (57,600 seconds)

#### 2. S3 Bucket

**Bucket Name:** `vh-faq-agent-transcriptions`

**Folder Structure:**

```
transcriptions/
├── {userIdentifier}/
│   ├── {roomName}/
│   │   ├── {tokenIdentifier}/
│   │   │   ├── {timestamp}.json
```

**Object Metadata:**

- `userIdentifier`: Hashed user identifier
- `tokenIdentifier`: Unique token ID
- `roomName`: LiveKit room name
- `duration`: Conversation duration in seconds

#### 3. Lambda Function

**Function Name:** `vh-faq-agent-api`
**Runtime:** Node.js 20.x
**Memory:** 512 MB
**Timeout:** 30 seconds

**Environment Variables:**

- `LIVEKIT_API_KEY`: LiveKit API key
- `LIVEKIT_API_SECRET`: LiveKit API secret

**IAM Permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/vh-faq-agent-usage"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::vh-faq-agent-transcriptions/*"
    }
  ]
}
```

#### 4. API Gateway

**API Type:** REST API
**Stage:** prod

**Resources:**

- `/generate-token` (POST)
- `/store-transcription` (POST)
- `/check-usage` (POST, GET)

**CORS Configuration:**

- Access-Control-Allow-Origin: \*
- Access-Control-Allow-Headers: Content-Type, Authorization
- Access-Control-Allow-Methods: OPTIONS, POST, GET

## User Identification

Users are identified by a SHA-256 hash of:

- Client IP address
- User Agent string
- Origin/Referer header

This creates a unique identifier while maintaining privacy.

## Usage Limits

- **Daily Limit:** 20 minutes per user per day
- **Reset Time:** 16 hours after first usage
- **Token TTL:** 60 minutes
- **Agent Identifier:** `vh-faq-agent` (prevents cross-agent usage)

## Token Metadata

Each generated token includes:

```json
{
  "userIdentifier": "hashed_user_id",
  "tokenIdentifier": "unique_token_id",
  "agentIdentifier": "vh-faq-agent",
  "timestamp": 1234567890
}
```

## Deployment

1. Install dependencies:

```bash
pnpm install
```

2. Create deployment package:

```powershell
./upload-function.ps1
```

3. Set up AWS infrastructure:

   - Create DynamoDB table with TTL
   - Create S3 bucket
   - Configure Lambda function
   - Set up API Gateway

4. Configure environment variables in Lambda

## Security Features

- **Rate Limiting:** 20 minutes per user per day
- **Agent Validation:** Only vh-faq-agent can accept tokens
- **User Privacy:** Hashed user identifiers
- **Token Expiration:** 60-minute token TTL
- **Usage Reset:** Automatic 16-hour TTL

## Monitoring

The function logs:

- Token generation events
- Usage updates
- Error conditions
- Performance metrics

Monitor CloudWatch logs for:

- Usage patterns
- Error rates
- Performance issues
- Security events
