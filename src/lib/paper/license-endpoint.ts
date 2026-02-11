import { License, LicenseStatus, Product, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PERPETUAL_EXPIRY = new Date("9999-12-31T00:00:00.000Z");
const FALLBACK_OWNER_EMAIL = process.env.LICENSE_SYSTEM_USER_EMAIL || "licensing@mineplugins.local";

type LicenseWithRelations = License & {
  product: Product;
  user: User;
};

export type PluginValidationResult =
  | "VALID"
  | "NOT_FOUND"
  | "WRONG_PLUGIN"
  | "EXPIRED"
  | "REVOKED"
  | "SIGNATURE_INVALID"
  | "REMOTE_ERROR";

export interface PanelLicenseDto {
  key: string;
  pluginId: string;
  owner: string;
  issuedAt: number;
  expiresAt: number;
  revoked: boolean;
}

export function normalizePluginId(pluginId: string): string {
  return (pluginId || "").trim().toLowerCase();
}

export function isPerpetualExpiry(expiresAt: Date): boolean {
  return expiresAt.getUTCFullYear() >= 9999;
}

export function buildExpiresAt(validDays: number): Date {
  if (!validDays || validDays <= 0) {
    return PERPETUAL_EXPIRY;
  }

  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + validDays);
  return expiresAt;
}

export function toPanelLicenseDto(license: LicenseWithRelations): PanelLicenseDto {
  return {
    key: license.licenseKey,
    pluginId: license.product.slug,
    owner: license.user.email || license.user.name || "unknown",
    issuedAt: Math.floor(license.createdAt.getTime() / 1000),
    expiresAt: isPerpetualExpiry(license.expiresAt)
      ? -1
      : Math.floor(license.expiresAt.getTime() / 1000),
    revoked: license.status === LicenseStatus.REVOKED,
  };
}

export async function findProductForPluginId(pluginId: string): Promise<Product | null> {
  const normalized = normalizePluginId(pluginId);
  if (!normalized) {
    return null;
  }

  const bySlug = await prisma.product.findUnique({ where: { slug: normalized } });
  if (bySlug) {
    return bySlug;
  }

  const byId = await prisma.product.findUnique({ where: { id: pluginId } });
  if (byId) {
    return byId;
  }

  return prisma.product.findFirst({
    where: {
      name: {
        equals: pluginId,
        mode: "insensitive",
      },
    },
  });
}

export async function resolveOwnerUser(owner: string): Promise<User> {
  const trimmedOwner = (owner || "").trim();

  if (trimmedOwner.includes("@")) {
    const byEmail = await prisma.user.findUnique({ where: { email: trimmedOwner } });
    if (byEmail) {
      return byEmail;
    }

    return prisma.user.create({
      data: {
        email: trimmedOwner,
        name: trimmedOwner.split("@")[0],
      },
    });
  }

  if (trimmedOwner) {
    const byName = await prisma.user.findFirst({
      where: {
        name: {
          equals: trimmedOwner,
          mode: "insensitive",
        },
      },
    });

    if (byName) {
      return byName;
    }
  }

  const fallback = await prisma.user.findUnique({ where: { email: FALLBACK_OWNER_EMAIL } });
  if (fallback) {
    return fallback;
  }

  return prisma.user.create({
    data: {
      email: FALLBACK_OWNER_EMAIL,
      name: trimmedOwner || "Plugin Licensing",
    },
  });
}

export function mapStatusToValidationResult(status: LicenseStatus): PluginValidationResult {
  if (status === LicenseStatus.REVOKED || status === LicenseStatus.SUSPENDED) {
    return "REVOKED";
  }
  if (status === LicenseStatus.EXPIRED) {
    return "EXPIRED";
  }
  if (status === LicenseStatus.ACTIVE) {
    return "VALID";
  }
  return "REMOTE_ERROR";
}

export async function markExpiredIfNeeded(license: License): Promise<boolean> {
  if (license.status !== LicenseStatus.ACTIVE) {
    return false;
  }

  if (isPerpetualExpiry(license.expiresAt)) {
    return false;
  }

  const now = new Date();
  if (now <= license.expiresAt) {
    return false;
  }

  await prisma.license.update({
    where: { id: license.id },
    data: { status: LicenseStatus.EXPIRED },
  });

  return true;
}
