import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getSecuritySecret } from "./security";

const PAPER_LICENSE_SECRET = getSecuritySecret("PAPER_LICENSE_SECRET", {
  devFallback: "dev-paper-license-secret-change-me-now",
});
const LICENSE_SECRET = PAPER_LICENSE_SECRET;
const JWT_SECRET = PAPER_LICENSE_SECRET;
const ENCRYPTION_CONTEXT = "mineplugins-v1";

interface LicensePayload {
  productId: string;
}

function toBase64Url(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function normalizePluginId(pluginId: string): string {
  return (pluginId || "").trim().toLowerCase();
}

/**
 * Backwards-compatible wrapper for old call sites.
 * Uses Paper key format and binds by productId.
 */
export function generateLicenseKey(payload: LicensePayload): string {
  return generatePaperLicenseKey(payload.productId);
}

/**
 * Legacy compatibility helper. Use verifyPaperLicenseKey instead.
 */
export function verifyLicenseSignature(licenseKey: string): boolean {
  const dot = licenseKey.lastIndexOf(".");
  return dot > 0 && dot < licenseKey.length - 1;
}

export function generateSimpleLicenseKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  const length = 26;
  let key = "";
  for (let i = 0; i < length; i++) {
    if (i > 0 && i % 5 === 0) key += "-";
    key += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return key;
}

/**
 * Generate Paper-compatible key: <nonce>.<signature>
 * signature = base64url(HMAC_SHA256(pluginId:nonce))[0..16 bytes]
 */
export function generatePaperLicenseKey(pluginId: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const nonceLength = 20;
  let nonce = "";

  for (let i = 0; i < nonceLength; i++) {
    nonce += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  const payload = `${normalizePluginId(pluginId)}:${nonce}`;
  const digest = crypto
    .createHmac("sha256", PAPER_LICENSE_SECRET)
    .update(payload, "utf8")
    .digest()
    .subarray(0, 16);

  return `${nonce}.${toBase64Url(digest)}`;
}

/**
 * Verify Paper-compatible key for a specific pluginId.
 */
export function verifyPaperLicenseKey(pluginId: string, key: string): boolean {
  try {
    const dot = key.lastIndexOf(".");
    if (dot <= 0 || dot === key.length - 1) {
      return false;
    }

    const nonce = key.substring(0, dot);
    const signature = key.substring(dot + 1);
    const payload = `${normalizePluginId(pluginId)}:${nonce}`;

    const expected = toBase64Url(
      crypto
        .createHmac("sha256", PAPER_LICENSE_SECRET)
        .update(payload, "utf8")
        .digest()
        .subarray(0, 16)
    );

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Generate secure activation token for server verification
 */
export function generateActivationToken(licenseKey: string, serverId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    licenseKey,
    serverId,
    iat: now,
    exp: now + 24 * 60 * 60,
    purpose: "activation",
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256" });
}

/**
 * Verify activation token
 */
export function verifyActivationToken(token: string): {
  valid: boolean;
  licenseKey?: string;
  serverId?: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload & {
      licenseKey: string;
      serverId: string;
      purpose: string;
    };

    if (decoded.purpose !== "activation") {
      return { valid: false };
    }

    return {
      valid: true,
      licenseKey: decoded.licenseKey,
      serverId: decoded.serverId,
    };
  } catch {
    return { valid: false };
  }
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

/**
 * Encrypt sensitive data with AES-GCM
 */
export function encryptData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    crypto.scryptSync(LICENSE_SECRET, ENCRYPTION_CONTEXT, 32),
    iv
  );

  cipher.setAAD(Buffer.from(ENCRYPTION_CONTEXT, "utf8"));

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive data with AES-GCM
 */
export function decryptData(encryptedData: string): string | null {
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) return null;

    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      crypto.scryptSync(LICENSE_SECRET, ENCRYPTION_CONTEXT, 32),
      Buffer.from(parts[0], "hex")
    );

    decipher.setAAD(Buffer.from(ENCRYPTION_CONTEXT, "utf8"));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    return null;
  }
}
