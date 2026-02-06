import crypto from "crypto";

const SECRET = process.env.ATTENDANCE_JWT_SECRET;

if (!SECRET) {
  console.warn("ATTENDANCE_JWT_SECRET is not set. Attendance tokens will not work without it.");
}

export function generateAttendanceToken(activity_id) {
  if (!SECRET) throw new Error("ATTENDANCE_JWT_SECRET is not configured");
  // Create a short token: activity_id.signature (format: "123.abc123def456")
  // Signature is first 12 chars of HMAC-SHA256 in base64url
  const signature = crypto.createHmac("sha256", SECRET).update(activity_id.toString()).digest("hex").slice(0, 12);
  return `${activity_id}h${signature}`;
}

export function verifyAttendanceToken(token) {
  if (!SECRET) throw new Error("ATTENDANCE_JWT_SECRET is not configured");
  try {
    // Parse token format: activity_id.signature
    const parts = token.split("h");
    if (parts.length !== 2) throw new Error("Invalid token format");

    const activity_id = parseInt(parts[0], 10);
    const providedSignature = parts[1];

    if (isNaN(activity_id)) throw new Error("Invalid activity_id in token");

    // Verify signature
    const expectedSignature = crypto.createHmac("sha256", SECRET).update(activity_id.toString()).digest("hex").slice(0, 12);

    if (providedSignature !== expectedSignature) {
      throw new Error("Invalid token signature");
    }

    return { activity_id };
  } catch (err) {
    const e = new Error("Invalid or malformed attendance token");
    e.cause = err;
    throw e;
  }
}
