import { AccessToken } from "livekit-server-sdk";
import { AGENT_IDENTIFIER, DAILY_LIMIT_MINUTES } from "../config/constants.mjs";
import {
  generateUserIdentifier,
  generateTokenIdentifier,
} from "../utils/helpers.mjs";
import { checkUserUsage, recordTokenGeneration } from "./usage-service.mjs";

export async function generateToken(body, event) {
  const { roomName, participantName } = body;

  if (!roomName || !participantName) {
    const error = new Error(
      "Missing required parameters: roomName and participantName"
    );
    error.statusCode = 400;
    throw error;
  }

  const userIdentifier = generateUserIdentifier(event);

  const usageCheck = await checkUserUsage(userIdentifier);
  if (!usageCheck.allowed) {
    const error = new Error(
      `Daily usage limit exceeded. You have used ${usageCheck.usedMinutes} minutes today. Limit: ${DAILY_LIMIT_MINUTES} minutes.`
    );
    error.statusCode = 429;
    throw error;
  }

  try {
    const tokenIdentifier = generateTokenIdentifier();

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: participantName,
        name: participantName,
        metadata: JSON.stringify({
          userIdentifier,
          tokenIdentifier,
          agentIdentifier: AGENT_IDENTIFIER,
          timestamp: Date.now(),
        }),
        ttl: "60m",
      }
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    at.attributes = {
      room: roomName,
      participant: participantName,
      userIdentifier,
      tokenIdentifier,
      agentIdentifier: AGENT_IDENTIFIER,
    };

    const token = await at.toJwt();

    await recordTokenGeneration(userIdentifier, tokenIdentifier, roomName);

    return {
      success: true,
      data: {
        token,
        tokenIdentifier,
        agentIdentifier: AGENT_IDENTIFIER,
        remainingMinutes: DAILY_LIMIT_MINUTES - usageCheck.usedMinutes,
      },
      message: "Token generated successfully",
    };
  } catch (error) {
    console.error("Error generating token:", error);
    throw new Error("Failed to create token");
  }
}
