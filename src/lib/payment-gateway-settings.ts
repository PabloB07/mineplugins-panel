import { prisma } from "@/lib/prisma";

export type GatewayEnvironment = "SANDBOX" | "PRODUCTION";
export type GatewayConfigSource = "ENV" | "PANEL";

const SETTINGS_ID = "default";

export function parseGatewayEnvironment(
  value: string | undefined | null,
  fallback: GatewayEnvironment
): GatewayEnvironment {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "production") return "PRODUCTION";
  if (normalized === "sandbox") return "SANDBOX";
  return fallback;
}

export function parseGatewayConfigSource(
  value: string | undefined | null,
  fallback: GatewayConfigSource
): GatewayConfigSource {
  const normalized = (value || "").trim().toUpperCase();
  if (normalized === "ENV") return "ENV";
  if (normalized === "PANEL") return "PANEL";
  return fallback;
}

function toOptional(value: string | null | undefined): string | undefined {
  const trimmed = (value || "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export interface GatewaySettingsResolved {
  payku: {
    enabled: boolean;
    source: GatewayConfigSource;
    apiToken?: string;      // public token  → create transactions
    privateToken?: string;  // private token → query/verify transactions
    environment: GatewayEnvironment;
    apiUrl?: string;
  };
  paypal: {
    enabled: boolean;
    source: GatewayConfigSource;
    clientId?: string;
    clientSecret?: string;
    webhookId?: string;
    environment: GatewayEnvironment;
    apiUrl?: string;
  };
  tebex: {
    enabled: boolean;
    storeId?: string;
    secretKey?: string;
    environment: GatewayEnvironment;
  };
}

interface PaymentGatewayConfigRecord {
  paykuEnabled: boolean;
  paykuApiToken: string | null;
  paykuPrivateToken: string | null;
  paykuSecretKey: string | null;
  paykuConfigSource: GatewayConfigSource;
  paykuEnvironment: GatewayEnvironment;
  paykuApiUrl: string | null;
  tebexEnabled: boolean;
  tebexStoreId: string | null;
  tebexSecretKey: string | null;
  tebexEnvironment: GatewayEnvironment;
  paypalEnabled: boolean;
  paypalClientId: string | null;
  paypalClientSecret: string | null;
  paypalConfigSource: GatewayConfigSource;
  paypalEnvironment: GatewayEnvironment;
  paypalApiUrl: string | null;
  paypalWebhookId: string | null;
}

async function getPaymentGatewayConfigRecord(): Promise<PaymentGatewayConfigRecord | null> {
  return (
    prisma as unknown as {
      paymentGatewayConfig: {
        findUnique: (args: { where: { id: string } }) => Promise<PaymentGatewayConfigRecord | null>;
      };
    }
  ).paymentGatewayConfig.findUnique({
    where: { id: SETTINGS_ID },
  });
}

export async function getGatewaySettings(): Promise<GatewaySettingsResolved> {
  const dbSettings = await getPaymentGatewayConfigRecord();

  const paykuSource = parseGatewayConfigSource(dbSettings?.paykuConfigSource, "ENV");
  const paykuEnvFromProcess = parseGatewayEnvironment(
    process.env.PAYKU_ENV,
    process.env.NODE_ENV === "production" ? "PRODUCTION" : "SANDBOX"
  );

  const paypalSource = parseGatewayConfigSource(dbSettings?.paypalConfigSource, "ENV");
  const paypalEnvFromProcess = parseGatewayEnvironment(
    process.env.PAYPAL_ENV,
    process.env.NODE_ENV === "production" ? "PRODUCTION" : "SANDBOX"
  );

  const paykuConfig = {
    enabled: dbSettings?.paykuEnabled ?? true,
    source: paykuSource,
    apiToken:
      paykuSource === "PANEL"
        ? toOptional(dbSettings?.paykuApiToken)
        : toOptional(process.env.PAYKU_PUBLIC_TOKEN ?? process.env.PAYKU_API_TOKEN),
    privateToken:
      paykuSource === "PANEL"
        ? toOptional(dbSettings?.paykuPrivateToken)
        : toOptional(process.env.PAYKU_PRIVATE_TOKEN),
    environment:
      paykuSource === "PANEL"
        ? dbSettings?.paykuEnvironment ?? "SANDBOX"
        : paykuEnvFromProcess,
    apiUrl: dbSettings?.paykuApiUrl || toOptional(process.env.PAYKU_API_URL),
  };

  console.log("[GatewaySettings] Payku config source:", paykuSource);
  console.log("[GatewaySettings] Payku environment:", paykuConfig.environment);
  console.log("[GatewaySettings] Payku apiUrl:", paykuConfig.apiUrl);
  console.log("[GatewaySettings] Payku publicToken set:", !!paykuConfig.apiToken);
  console.log("[GatewaySettings] Payku privateToken set:", !!paykuConfig.privateToken);

  return {
    payku: paykuConfig,
    paypal: {
      enabled: dbSettings?.paypalEnabled ?? true,
      source: paypalSource,
      clientId:
        paypalSource === "PANEL"
          ? toOptional(dbSettings?.paypalClientId)
          : toOptional(process.env.PAYPAL_CLIENT_ID),
      clientSecret:
        paypalSource === "PANEL"
          ? toOptional(dbSettings?.paypalClientSecret)
          : toOptional(process.env.PAYPAL_CLIENT_SECRET),
      webhookId:
        toOptional(dbSettings?.paypalWebhookId) ||
        toOptional(process.env.PAYPAL_WEBHOOK_ID),
      environment:
        paypalSource === "PANEL"
          ? dbSettings?.paypalEnvironment ?? "SANDBOX"
          : paypalEnvFromProcess,
      apiUrl: dbSettings?.paypalApiUrl || toOptional(process.env.PAYPAL_API_URL),
    },
    tebex: {
      enabled: dbSettings?.tebexEnabled ?? true,
      storeId:
        toOptional(dbSettings?.tebexStoreId) ||
        toOptional(process.env.TEBEX_STORE_ID),
      secretKey:
        toOptional(dbSettings?.tebexSecretKey) ||
        toOptional(process.env.TEBEX_SECRET_KEY),
      environment:
        dbSettings?.tebexEnvironment ||
        parseGatewayEnvironment(process.env.TEBEX_ENV, "PRODUCTION"),
    },
  };
}

export async function upsertGatewaySettings(input: {
  paykuEnabled?: boolean;
  paykuConfigSource?: GatewayConfigSource;
  paykuApiToken?: string | null;
  paykuEnvironment?: GatewayEnvironment;
  tebexEnabled?: boolean;
  tebexStoreId?: string | null;
  tebexSecretKey?: string | null;
  tebexEnvironment?: GatewayEnvironment;
  paypalEnabled?: boolean;
  paypalConfigSource?: GatewayConfigSource;
  paypalClientId?: string | null;
  paypalClientSecret?: string | null;
  paypalEnvironment?: GatewayEnvironment;
  paypalApiUrl?: string | null;
  paypalWebhookId?: string | null;
}) {
  const existing = await getPaymentGatewayConfigRecord();

  function resolveOptionalField(
    nextValue: string | null | undefined,
    currentValue: string | null | undefined
  ): string | null {
    if (nextValue === undefined) return currentValue ?? null;
    return nextValue;
  }

  const gatewayPayload = {
    paykuEnabled: input.paykuEnabled ?? existing?.paykuEnabled ?? true,
    paykuConfigSource: input.paykuConfigSource ?? existing?.paykuConfigSource ?? "ENV",
    paykuApiToken: resolveOptionalField(input.paykuApiToken, existing?.paykuApiToken),
    paykuEnvironment: input.paykuEnvironment ?? existing?.paykuEnvironment ?? "SANDBOX",
    paykuPrivateToken: existing?.paykuPrivateToken ?? null,
    paykuSecretKey: existing?.paykuSecretKey ?? null,
    paykuApiUrl: existing?.paykuApiUrl ?? null,
    tebexEnabled: input.tebexEnabled ?? existing?.tebexEnabled ?? true,
    tebexStoreId: resolveOptionalField(input.tebexStoreId, existing?.tebexStoreId),
    tebexSecretKey: resolveOptionalField(input.tebexSecretKey, existing?.tebexSecretKey),
    tebexEnvironment: input.tebexEnvironment ?? existing?.tebexEnvironment ?? "PRODUCTION",
    paypalEnabled: input.paypalEnabled ?? existing?.paypalEnabled ?? true,
    paypalConfigSource: input.paypalConfigSource ?? existing?.paypalConfigSource ?? "ENV",
    paypalClientId: resolveOptionalField(input.paypalClientId, existing?.paypalClientId),
    paypalClientSecret: resolveOptionalField(input.paypalClientSecret, existing?.paypalClientSecret),
    paypalEnvironment: input.paypalEnvironment ?? existing?.paypalEnvironment ?? "SANDBOX",
    paypalApiUrl: resolveOptionalField(input.paypalApiUrl, existing?.paypalApiUrl),
    paypalWebhookId: resolveOptionalField(input.paypalWebhookId, existing?.paypalWebhookId),
  };

  return (
    prisma as unknown as {
      paymentGatewayConfig: {
        upsert: (args: unknown) => Promise<unknown>;
      };
    }
  ).paymentGatewayConfig.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...gatewayPayload },
    update: gatewayPayload,
  });
}

export function maskSecret(value?: string): string {
  if (!value) return "";
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}${"*".repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`;
}
