import { CORS_HEADERS } from "./src/config/constants.mjs";
import { parseMultipartFormData } from "./src/utils/helpers.mjs";
import {
  handleGenerateToken,
  handleStoreTranscription,
  handleCheckUsage,
} from "./src/handlers/api-handlers.mjs";

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  try {
    const path = event.path.split("/").pop();
    let body = {};

    if (event.body) {
      if (event.headers["Content-Type"]?.includes("multipart/form-data")) {
        body = parseMultipartFormData(
          event.body,
          event.headers["Content-Type"]
        );
      } else {
        body = JSON.parse(event.body);
      }
    }

    let response = {};

    switch (path) {
      case "generate-token":
        response = await handleGenerateToken(body, event);
        break;
      case "store-transcription":
        response = await handleStoreTranscription(body);
        break;
      case "check-usage":
        response = await handleCheckUsage(body);
        break;
      default:
        throw new Error(`Invalid path: ${path}`);
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Error in handler:", error);

    return {
      statusCode: error.statusCode || 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
        code: error.statusCode || 500,
      }),
    };
  }
};
