export interface PanelLicenseDto {
  licenseKey: string;
  productId: string;
  productSlug: string;
  productName: string;
  userId: string;
  userEmail: string;
  expiresAt: number;
  status: string;
  isActive: boolean;
  maxActivations: number;
  activationCount: number;
  lastValidatedAt: number | null;
  createdAt: number;
}

export function toPanelLicenseDto(license: {
  licenseKey: string;
  productId: string;
  product: { slug: string; name: string };
  userId: string;
  user: { email: string };
  expiresAt: Date;
  status: string;
  maxActivations: number;
  lastValidatedAt: Date | null;
  createdAt: Date;
  activations?: { isActive: boolean }[];
  _count?: { activations: number };
}): PanelLicenseDto {
  const activations = license.activations || [];
  const activeCount = activations.filter((a) => a.isActive).length;
  
  return {
    licenseKey: license.licenseKey,
    productId: license.productId,
    productSlug: license.product.slug,
    productName: license.product.name,
    userId: license.userId,
    userEmail: license.user.email,
    expiresAt: new Date(license.expiresAt).getTime(),
    status: license.status,
    isActive: license.status === "ACTIVE",
    maxActivations: license.maxActivations,
    activationCount: license._count?.activations ?? activeCount,
    lastValidatedAt: license.lastValidatedAt
      ? new Date(license.lastValidatedAt).getTime()
      : null,
    createdAt: new Date(license.createdAt).getTime(),
  };
}

export function normalizePluginId(pluginId: string): string {
  return (pluginId || "").trim().toLowerCase().replace(/\s+/g, "-");
}

export function buildExpiresAt(validDays: number): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (validDays || 365));
  return expiresAt;
}

export function mapStatusToValidationResult(
  status: string
): "VALID" | "EXPIRED" | "SUSPENDED" | "REVOKED" | "NOT_FOUND" {
  switch (status) {
    case "ACTIVE":
      return "VALID";
    case "EXPIRED":
      return "EXPIRED";
    case "SUSPENDED":
      return "SUSPENDED";
    case "REVOKED":
      return "REVOKED";
    default:
      return "NOT_FOUND";
  }
}
