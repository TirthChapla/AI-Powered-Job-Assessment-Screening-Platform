import crypto from "crypto";

export function generateUserIdentifier(event) {
  const clientIp =
    event.headers["X-Forwarded-For"] ||
    event.headers["CloudFront-Viewer-Address"] ||
    event.requestContext?.identity?.sourceIp ||
    "unknown";

  return crypto
    .createHash("sha256")
    .update(clientIp)
    .digest("hex")
    .substring(0, 32);
}

export function generateTokenIdentifier() {
  return crypto.randomBytes(16).toString("hex");
}

export function getResetTime() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

export function parseMultipartFormData(body, contentType) {
  const boundary = contentType.split("boundary=")[1];
  if (!boundary) {
    throw new Error("Invalid multipart form data");
  }

  const parts = body.split(`--${boundary}`);
  const formData = {};

  for (const part of parts) {
    if (part.includes("Content-Disposition: form-data")) {
      const nameMatch = part.match(/name="([^"]+)"/);
      if (nameMatch) {
        const name = nameMatch[1];
        const valueStart = part.indexOf("\r\n\r\n") + 4;
        const valueEnd = part.lastIndexOf("\r\n");
        const value = part.substring(valueStart, valueEnd);
        formData[name] = value;
      }
    }
  }

  return formData;
}
