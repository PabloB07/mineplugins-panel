import { prisma } from "@/lib/prisma";

export type GatewayEnvironment = "SANDBOX" | "PRODUCTION";

const SETTINGS_ID = "default";

function envToGateway(value: string | undefined, fallback: GatewayEnvironment): GatewayEnvironment {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "production") return "PRODUCTION";
  if (normalized === "sandbox") return "SANDBOX";
  return fallback;
}

function toOptional(value: string | null | undefined): string | undefined {
  const trimmed = (value || "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export interface GatewaySettingsResolved {
  payku: {
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

export async function getGatewaySettings(): Promise<GatewaySettingsResolved> {
  const dbSettings = await (
    prisma as unknown as {
      paymentGatewayConfig: {
        findUnique: (args: { where: { id: string } }) => Promise<{
          paykuApiToken: string | null;
          paykuSecretKey: string | null;
          paykuEnvironment: GatewayEnvironment;
          tebexStoreId: string | null;
          tebexSecretKey: string | null;
          tebexEnvironment: GatewayEnvironment;
          paypalClientId: string | null;
          paypalClientSecret: string | null;
          paypalWebhookId: string | null;
          paypalEnvironment: GatewayEnvironment;
        } | null>;
      };
    }
  ).paymentGatewayConfig.findUnique({
    where: { id: SETTINGS_ID },
  });

  return {
    payku: {
      apiToken: toOptional(dbSettings?.paykuApiToken) || toOptional(process.env.PAYKU_API_TOKEN),
      secretKey: toOptional(dbSettings?.paykuSecretKey) || toOptional(process.env.PAYKU_SECRET_KEY),
      environment:
        dbSettings?.paykuEnvironment ||
        envToGateway(process.env.PAYKU_ENV, process.env.NODE_ENV === "production" ? "PRODUCTION" : "SANDBOX"),
    },
    paypal: {
      clientId: toOptional(dbSettings?.paypalClientId) || toOptional(process.env.PAYPAL_CLIENT_ID),
      clientSecret:
        toOptional(dbSettings?.paypalClientSecret) || toOptional(process.env.PAYPAL_CLIENT_SECRET),
      webhookId: toOptional(dbSettings?.paypalWebhookId) || toOptional(process.env.PAYPAL_WEBHOOK_ID),
      environment:
        dbSettings?.paypalEnvironment ||
        envToGateway(process.env.PAYPAL_ENV, process.env.NODE_ENV === "production" ? "PRODUCTION" : "SANDBOX"),
    },
    tebex: {
      storeId: toOptional(dbSettings?.tebexStoreId) || toOptional(process.env.TEBEX_STORE_ID),
      secretKey: toOptional(dbSettings?.tebexSecretKey) || toOptional(process.env.TEBEX_SECRET_KEY),
      environment:
        dbSettings?.tebexEnvironment ||
        envToGateway(process.env.TEBEX_ENV, "PRODUCTION"),
    },
  };
}

export async function upsertGatewaySettings(input: {
  paykuApiToken?: string;
  paykuSecretKey?: string;
  paykuEnvironment: GatewayEnvironment;
  tebexStoreId?: string;
  tebexSecretKey?: string;
  tebexEnvironment: GatewayEnvironment;
  paypalClientId?: string;
  paypalClientSecret?: string;
  paypalWebhookId?: string;
  paypalEnvironment: GatewayEnvironment;
}) {
  return (prisma as unknown as { paymentGatewayConfig: { upsert: (args: unknown) => Promise<unknown> } }).paymentGatewayConfig.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      paykuApiToken: input.paykuApiToken || null,
      paykuSecretKey: input.paykuSecretKey || null,
      paykuEnvironment: input.paykuEnvironment,
      tebexStoreId: input.tebexStoreId || null,
      tebexSecretKey: input.tebexSecretKey || null,
      tebexEnvironment: input.tebexEnvironment,
      paypalClientId: input.paypalClientId || null,
      paypalClientSecret: input.paypalClientSecret || null,
      paypalWebhookId: input.paypalWebhookId || null,
      paypalEnvironment: input.paypalEnvironment,
    },
    update: {
      paykuApiToken: input.paykuApiToken || null,
      paykuSecretKey: input.paykuSecretKey || null,
      paykuEnvironment: input.paykuEnvironment,
      tebexStoreId: input.tebexStoreId || null,
      tebexSecretKey: input.tebexSecretKey || null,
      tebexEnvironment: input.tebexEnvironment,
      paypalClientId: input.paypalClientId || null,
      paypalClientSecret: input.paypalClientSecret || null,
      paypalWebhookId: input.paypalWebhookId || null,
      paypalEnvironment: input.paypalEnvironment,
    },
  });
}

export function maskSecret(value?: string): string {
  if (!value) return "";
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}${"*".repeat(Math.max(4, value.length - 8))}${value.slice(-4)}`;
}

