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
    source: GatewayConfigSource;
    apiToken?: string;
    secretKey?: string;
    environment: GatewayEnvironment;
  };
  paypal: {
    clientId?: string;
    clientSecret?: string;
    webhookId?: string;
    environment: GatewayEnvironment;
  };
  tebex: {
    storeId?: string;
    secretKey?: string;
    environment: GatewayEnvironment;
  };
}

interface PaymentGatewayConfigRecord {
  paykuApiToken: string | null;
  paykuSecretKey: string | null;
  paykuConfigSource: GatewayConfigSource;
  paykuEnvironment: GatewayEnvironment;
  tebexStoreId: string | null;
  tebexSecretKey: string | null;
  tebexEnvironment: GatewayEnvironment;
  paypalClientId: string | null;
  paypalClientSecret: string | null;
  paypalWebhookId: string | null;
  paypalEnvironment: GatewayEnvironment;
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

  return {
    payku: {
      source: paykuSource,
      apiToken:
        paykuSource === "PANEL"
          ? toOptional(dbSettings?.paykuApiToken)
          : toOptional(process.env.PAYKU_API_TOKEN),
      secretKey:
        paykuSource === "PANEL"
          ? toOptional(dbSettings?.paykuSecretKey)
          : toOptional(process.env.PAYKU_SECRET_KEY),
      environment: paykuSource === "PANEL" ? dbSettings?.paykuEnvironment || "SANDBOX" : paykuEnvFromProcess,
    },
    paypal: {
      clientId: toOptional(dbSettings?.paypalClientId) || toOptional(process.env.PAYPAL_CLIENT_ID),
      clientSecret:
        toOptional(dbSettings?.paypalClientSecret) || toOptional(process.env.PAYPAL_CLIENT_SECRET),
      webhookId: toOptional(dbSettings?.paypalWebhookId) || toOptional(process.env.PAYPAL_WEBHOOK_ID),
      environment:
        dbSettings?.paypalEnvironment ||
        parseGatewayEnvironment(
          process.env.PAYPAL_ENV,
          process.env.NODE_ENV === "production" ? "PRODUCTION" : "SANDBOX"
        ),
    },
    tebex: {
      storeId: toOptional(dbSettings?.tebexStoreId) || toOptional(process.env.TEBEX_STORE_ID),
      secretKey: toOptional(dbSettings?.tebexSecretKey) || toOptional(process.env.TEBEX_SECRET_KEY),
      environment:
        dbSettings?.tebexEnvironment ||
        parseGatewayEnvironment(process.env.TEBEX_ENV, "PRODUCTION"),
    },
  };
}

export async function upsertGatewaySettings(input: {
  paykuConfigSource: GatewayConfigSource;
  paykuApiToken?: string | null;
  paykuSecretKey?: string | null;
  paykuEnvironment: GatewayEnvironment;
  tebexStoreId?: string | null;
  tebexSecretKey?: string | null;
  tebexEnvironment: GatewayEnvironment;
  paypalClientId?: string | null;
  paypalClientSecret?: string | null;
  paypalWebhookId?: string | null;
  paypalEnvironment: GatewayEnvironment;
}) {
  const existing = await getPaymentGatewayConfigRecord();

  function resolveOptionalField(
    nextValue: string | null | undefined,
    currentValue: string | null | undefined
  ): string | null {
    if (nextValue === undefined) {
      return currentValue ?? null;
    }

    return nextValue;
  }

  const gatewayPayload = {
    paykuConfigSource: input.paykuConfigSource,
    paykuApiToken: resolveOptionalField(input.paykuApiToken, existing?.paykuApiToken),
    paykuSecretKey: resolveOptionalField(input.paykuSecretKey, existing?.paykuSecretKey),
    paykuEnvironment: input.paykuEnvironment,
    tebexStoreId: resolveOptionalField(input.tebexStoreId, existing?.tebexStoreId),
    tebexSecretKey: resolveOptionalField(input.tebexSecretKey, existing?.tebexSecretKey),
    tebexEnvironment: input.tebexEnvironment,
    paypalClientId: resolveOptionalField(input.paypalClientId, existing?.paypalClientId),
    paypalClientSecret: resolveOptionalField(input.paypalClientSecret, existing?.paypalClientSecret),
    paypalWebhookId: resolveOptionalField(input.paypalWebhookId, existing?.paypalWebhookId),
    paypalEnvironment: input.paypalEnvironment,
  };

  return (prisma as unknown as { paymentGatewayConfig: { upsert: (args: unknown) => Promise<unknown> } }).paymentGatewayConfig.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      ...gatewayPayload,
    },
    update: gatewayPayload,
  });
}

export function maskSecret(value?: string): string {
  if (!value) return "";
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}${"*".repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`;
}
