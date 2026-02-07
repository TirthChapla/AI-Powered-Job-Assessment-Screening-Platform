import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { TRANSCRIPTION_BUCKET } from "../config/constants.mjs";
import { updateUserUsage } from "./usage-service.mjs";

const s3Client = new S3Client({ region: "us-east-1" });

export async function storeTranscription(body) {
  const {
    transcription,
    roomName,
    participantName,
    userIdentifier,
    tokenIdentifier,
    duration,
    timestamp,
  } = body;

  if (!transcription || !roomName || !userIdentifier || !tokenIdentifier) {
    const error = new Error(
      "Missing required parameters for transcription storage"
    );
    error.statusCode = 400;
    throw error;
  }

  try {
    const transcriptionKey = `transcriptions/${userIdentifier}/${roomName}/${tokenIdentifier}.json`;

    // Check if transcription is already a structured object (new format) or string (legacy format)
    let finalTranscriptionData;

    if (typeof transcription === "object" && transcription !== null) {
      // New JSON format - enhance with additional metadata
      const messageCount = transcription.sessionInfo?.totalMessages || 0;
      console.log(
        `Storing structured transcription with ${messageCount} messages for user ${userIdentifier}`
      );

      finalTranscriptionData = {
        ...transcription,
        apiMetadata: {
          roomName,
          participantName,
          userIdentifier,
          tokenIdentifier,
          duration: duration || 0,
          timestamp: timestamp || Date.now(),
          storedAt: Date.now(),
          version: "2.0",
        },
      };
    } else {
      // Legacy string format - wrap in old structure for backward compatibility
      console.log(
        `Storing legacy text transcription for user ${userIdentifier}`
      );

      finalTranscriptionData = {
        transcription,
        roomName,
        participantName,
        userIdentifier,
        tokenIdentifier,
        duration: duration || 0,
        timestamp: timestamp || Date.now(),
        storedAt: Date.now(),
        version: "1.0",
      };
    }

    const putCommand = new PutObjectCommand({
      Bucket: TRANSCRIPTION_BUCKET,
      Key: transcriptionKey,
      Body: JSON.stringify(finalTranscriptionData, null, 2),
      ContentType: "application/json",
      Metadata: {
        userIdentifier,
        tokenIdentifier,
        roomName,
        duration: String(duration || 0),
        messageCount: String(transcription?.sessionInfo?.totalMessages || 0),
        version: finalTranscriptionData.version || "1.0",
      },
    });

    await s3Client.send(putCommand);

    if (duration && duration > 0) {
      await updateUserUsage(userIdentifier, Math.ceil(duration / 60));
    }

    return {
      success: true,
      data: {
        transcriptionKey,
        storedAt: Date.now(),
      },
      message: "Transcription stored successfully",
    };
  } catch (error) {
    console.error("Error storing transcription:", error);
    throw new Error("Failed to store transcription");
  }
}
