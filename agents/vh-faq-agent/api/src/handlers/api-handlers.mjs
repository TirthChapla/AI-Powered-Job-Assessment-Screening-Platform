import { generateToken } from "../services/token-service.mjs";
import { storeTranscription } from "../services/transcription-service.mjs";
import { checkUserUsage } from "../services/usage-service.mjs";
import { DAILY_LIMIT_MINUTES } from "../config/constants.mjs";

export async function handleGenerateToken(body, event) {
  return await generateToken(body, event);
}

export async function handleStoreTranscription(body) {
  return await storeTranscription(body);
}

export async function handleCheckUsage(body) {
  const userIdentifier = body.userIdentifier;

  if (!userIdentifier) {
    const error = new Error("userIdentifier is required");
    error.statusCode = 400;
    throw error;
  }

  try {
    const usageData = await checkUserUsage(userIdentifier);

    return {
      success: true,
      data: {
        userIdentifier,
        usedMinutes: usageData.usedMinutes,
        remainingMinutes: DAILY_LIMIT_MINUTES - usageData.usedMinutes,
        dailyLimit: DAILY_LIMIT_MINUTES,
        allowed: usageData.allowed,
        resetTime: usageData.resetTime,
      },
      message: "Usage data retrieved successfully",
    };
  } catch (error) {
    console.error("Error checking usage:", error);
    throw new Error("Failed to check usage");
  }
}
