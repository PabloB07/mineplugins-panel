import crypto from "crypto";
import jwt from "jsonwebtoken";

const LICENSE_SECRET =
  process.env.LICENSE_SECRET_KEY || "TF_LIC_2024_XGAMERS_SECURE_KEY";
const JWT_SECRET = process.env.JWT_SECRET || LICENSE_SECRET;

interface LicensePayload {
  productId: string;
  email: string;
  durationDays: number;
  serverId?: string;
  maxActivations?: number;
  features?: string[];
}

interface DecodedLicense {
  productId: string;
  serverId: string;
  createdAt: number;
  expiresAt: number;
  email: string;
  maxActivations: number;
  features: string[];
  version: string;
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
      maxActivations: 1,
      features: [],
      version: "1.0",
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
 * Generate a modern JWT-based license key
 */
export function generateModernLicenseKey(payload: LicensePayload): string {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + payload.durationDays * 24 * 60 * 60;
  
  const jwtPayload = {
    sub: payload.email,
    productId: payload.productId,
    serverId: payload.serverId || "*",
    iat: now,
    exp: expiresAt,
    maxActivations: payload.maxActivations || 1,
    features: payload.features || [],
    version: "2.0",
    iss: "mineplugins",
    aud: "mineplugins-plugin"
  };

  return jwt.sign(jwtPayload, JWT_SECRET, { algorithm: 'HS256' });
}

/**
 * Verify and decode a JWT license key
 */
export function verifyModernLicenseKey(licenseKey: string): DecodedLicense | null {
  try {
    const decoded = jwt.verify(licenseKey, JWT_SECRET, { 
      algorithms: ['HS256'],
      issuer: 'mineplugins',
      audience: 'mineplugins-plugin'
    }) as jwt.JwtPayload & {
      productId: string;
      serverId: string;
      iat: number;
      exp: number;
      maxActivations: number;
      features: string[];
      version: string;
    };

    return {
      productId: decoded.productId,
      serverId: decoded.serverId,
      createdAt: decoded.iat || 0,
      expiresAt: decoded.exp || 0,
      email: decoded.sub || '',
      maxActivations: decoded.maxActivations || 1,
      features: decoded.features || [],
      version: decoded.version || '1.0'
    };
  } catch {
    return null;
  }
}

/**
 * Check license validity with grace period
 */
export function checkLicenseValidity(licenseKey: string, gracePeriodDays: number = 7): {
  valid: boolean;
  expired: boolean;
  inGracePeriod: boolean;
  decoded?: DecodedLicense;
} {
  const decoded = verifyModernLicenseKey(licenseKey);
  
  if (!decoded) {
    return { valid: false, expired: false, inGracePeriod: false };
  }

  const now = Math.floor(Date.now() / 1000);
  const expired = now > decoded.expiresAt;
  const gracePeriodEnd = decoded.expiresAt + (gracePeriodDays * 24 * 60 * 60);
  const inGracePeriod = expired && now <= gracePeriodEnd;

  return {
    valid: !expired,
    expired,
    inGracePeriod,
    decoded
  };
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
    exp: now + (24 * 60 * 60), // 24 hour expiry
    purpose: 'activation'
  };

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
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
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload & {
      licenseKey: string;
      serverId: string;
      purpose: string;
    };
    
    if (decoded.purpose !== 'activation') {
      return { valid: false };
    }

    return {
      valid: true,
      licenseKey: decoded.licenseKey,
      serverId: decoded.serverId
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
  const cipher = crypto.createCipheriv('aes-256-gcm', crypto.scryptSync(LICENSE_SECRET, 'salt', 32), iv);
  
  cipher.setAAD(Buffer.from('mineplugins', 'utf8'));
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data with AES-GCM
 */
export function decryptData(encryptedData: string): string | null {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return null;
    
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', crypto.scryptSync(LICENSE_SECRET, 'salt', 32), Buffer.from(parts[0], 'hex'));
    decipher.setAAD(Buffer.from('mineplugins', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch {
    return null;
  }
}
