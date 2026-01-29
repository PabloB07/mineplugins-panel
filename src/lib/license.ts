import crypto from "crypto";

const LICENSE_SECRET =
  process.env.LICENSE_SECRET_KEY || "TF_LIC_2024_XGAMERS_SECURE_KEY";

interface LicensePayload {
  productId: string;
  email: string;
  durationDays: number;
  serverId?: string;
}

interface DecodedLicense {
  productId: string;
  serverId: string;
  createdAt: number;
  expiresAt: number;
  email: string;
}

/**
 * Generates a license key with HMAC-SHA256 signature
 * Format: Base64(productId|serverId|createdAt|expiresAt|email)-signature
 */
export function generateLicenseKey(payload: LicensePayload): string {
  const createdAt = Math.floor(Date.now() / 1000);
  const expiresAt = createdAt + payload.durationDays * 24 * 60 * 60;
  const serverId = payload.serverId || "*";

  // Create payload string: productId|serverId|createdAt|expiresAt|email
  const payloadString = `${payload.productId}|${serverId}|${createdAt}|${expiresAt}|${payload.email}`;

  // Encode to Base64
  const encodedPayload = Buffer.from(payloadString).toString("base64");

  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", LICENSE_SECRET)
    .update(encodedPayload)
    .digest("base64")
    .substring(0, 8)
    .replace(/\//g, "_")
    .replace(/\+/g, "-");

  return `${encodedPayload}-${signature}`;
}

/**
 * Verifies the HMAC signature of a license key
 */
export function verifyLicenseSignature(licenseKey: string): boolean {
  try {
    const parts = licenseKey.split("-");
    if (parts.length < 2) return false;

    const signature = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join("-");

    const expectedSignature = crypto
      .createHmac("sha256", LICENSE_SECRET)
      .update(payload)
      .digest("base64")
      .substring(0, 8)
      .replace(/\//g, "_")
      .replace(/\+/g, "-");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Decodes a license key payload (after signature verification)
 */
export function decodeLicensePayload(
  licenseKey: string
): DecodedLicense | null {
  try {
    const parts = licenseKey.split("-");
    if (parts.length < 2) return null;

    const encodedPayload = parts.slice(0, -1).join("-");
    const decoded = Buffer.from(encodedPayload, "base64").toString("utf-8");
    const [productId, serverId, createdAtStr, expiresAtStr, email] =
      decoded.split("|");

    if (!productId || !serverId || !createdAtStr || !expiresAtStr || !email) {
      return null;
    }

    return {
      productId,
      serverId,
      createdAt: parseInt(createdAtStr, 10),
      expiresAt: parseInt(expiresAtStr, 10),
      email,
    };
  } catch {
    return null;
  }
}

/**
 * Checks if a decoded license is expired
 */
export function isLicenseExpired(decoded: DecodedLicense): boolean {
  return Date.now() / 1000 > decoded.expiresAt;
}

/**
 * Generates a signed response for the plugin
 */
export function generateResponseSignature(data: object): string {
  const payload = JSON.stringify(data);
  return crypto
    .createHmac("sha256", LICENSE_SECRET)
    .update(payload)
    .digest("base64")
    .substring(0, 16);
}

/**
 * Hash a value for privacy (e.g., IP addresses, MAC addresses)
 */
export function hashForPrivacy(value: string): string {
  return crypto
    .createHash("sha256")
    .update(value + LICENSE_SECRET)
    .digest("hex")
    .substring(0, 16);
}
