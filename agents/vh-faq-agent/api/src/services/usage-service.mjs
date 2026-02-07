import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  USAGE_TABLE,
  DAILY_LIMIT_MINUTES,
  TTL_HOURS,
} from "../config/constants.mjs";
import { getResetTime } from "../utils/helpers.mjs";

const dynamoClient = new DynamoDBClient({ region: "us-east-1" });

export async function checkUserUsage(userIdentifier) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const usageKey = `${userIdentifier}#${today}`;

    const getCommand = new GetItemCommand({
      TableName: USAGE_TABLE,
      Key: marshall({
        usage_key: usageKey,
      }),
    });

    const result = await dynamoClient.send(getCommand);

    if (!result.Item) {
      return {
        usedMinutes: 0,
        allowed: true,
        resetTime: getResetTime(),
      };
    }

    const usageData = unmarshall(result.Item);
    const usedMinutes = usageData.used_minutes || 0;

    return {
      usedMinutes,
      allowed: usedMinutes < DAILY_LIMIT_MINUTES,
      resetTime: getResetTime(),
    };
  } catch (error) {
    console.error("Error checking user usage:", error);
    return {
      usedMinutes: 0,
      allowed: true,
      resetTime: getResetTime(),
    };
  }
}

export async function updateUserUsage(userIdentifier, minutesUsed) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const usageKey = `${userIdentifier}#${today}`;
    const ttl = Math.floor(Date.now() / 1000) + TTL_HOURS * 3600;

    const updateCommand = new UpdateItemCommand({
      TableName: USAGE_TABLE,
      Key: marshall({
        usage_key: usageKey,
      }),
      UpdateExpression:
        "ADD used_minutes :minutes SET updated_at = :timestamp, expires_at = :ttl",
      ExpressionAttributeValues: marshall({
        ":minutes": minutesUsed,
        ":timestamp": Date.now(),
        ":ttl": ttl,
      }),
      ReturnValues: "ALL_NEW",
    });

    const result = await dynamoClient.send(updateCommand);
    console.log(`Updated usage for ${userIdentifier}: +${minutesUsed} minutes`);

    return unmarshall(result.Attributes);
  } catch (error) {
    console.error("Error updating user usage:", error);
    throw error;
  }
}

export async function recordTokenGeneration(
  userIdentifier,
  tokenIdentifier,
  roomName
) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const usageKey = `${userIdentifier}#${today}`;
    const ttl = Math.floor(Date.now() / 1000) + TTL_HOURS * 3600;

    const putCommand = new PutItemCommand({
      TableName: USAGE_TABLE,
      Item: marshall({
        usage_key: usageKey,
        user_identifier: userIdentifier,
        date: today,
        used_minutes: 0,
        last_token: tokenIdentifier,
        last_room: roomName,
        created_at: Date.now(),
        updated_at: Date.now(),
        expires_at: ttl,
      }),
      ConditionExpression: "attribute_not_exists(usage_key)",
    });

    try {
      await dynamoClient.send(putCommand);
      console.log(`Created new usage record for ${userIdentifier}`);
    } catch (error) {
      if (error.name !== "ConditionalCheckFailedException") {
        throw error;
      }
      console.log(`Usage record already exists for ${userIdentifier}`);
    }
  } catch (error) {
    console.error("Error recording token generation:", error);
  }
}
