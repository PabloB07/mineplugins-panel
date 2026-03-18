const IS_PRODUCTION = process.env.NODE_ENV === "production";

interface SecretOptions {
  minLength?: number;
  devFallback?: string;
}

interface EnvOptions {
  allowEmptyInDev?: boolean;
}

export function getRequiredEnv(name: string, options: EnvOptions = {}): string {
  const value = (process.env[name] || "").trim();
  if (value) {
    return value;
  }

  if (options.allowEmptyInDev && !IS_PRODUCTION) {
    return "";
  }

  throw new Error(`${name} environment variable is required`);
}

export function getSecuritySecret(name: string, options: SecretOptions = {}): string {
  const minLength = options.minLength ?? 32;
  const envValue = (process.env[name] || "").trim();

  if (envValue.length >= minLength) {
    return envValue;
  }

  if (IS_PRODUCTION) {
    throw new Error(
      `${name} must be configured and at least ${minLength} characters long in production`
    );
  }

  const fallback = (options.devFallback || `dev-${name.toLowerCase()}-change-me`).trim();
  if (fallback.length < minLength) {
    return fallback.padEnd(minLength, "0");
  }

  return fallback;
}

export function toSafeInt(
  value: unknown,
  config: { defaultValue: number; min: number; max: number }
): number {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return config.defaultValue;
  }

  const floored = Math.floor(parsed);
  if (floored < config.min) {
    return config.min;
  }

  if (floored > config.max) {
    return config.max;
  }

  return floored;
}

export function toOptionalTrimmedString(value: unknown, maxLength = 255): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function sanitizeJarFilename(fileName: string): string {
  const baseName = fileName.split(/[\\/]/).pop() || "plugin.jar";
  const sanitized = baseName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 120);

  const finalName = sanitized || "plugin.jar";
  if (!finalName.toLowerCase().endsWith(".jar")) {
    return `${finalName}.jar`;
  }

  return finalName;
}
