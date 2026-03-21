-- CreateEnum
CREATE TYPE "GatewayEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');

-- CreateTable
CREATE TABLE "PaymentGatewayConfig" (
  "id" TEXT NOT NULL,
  "paykuApiToken" TEXT,
  "paykuSecretKey" TEXT,
  "paykuEnvironment" "GatewayEnvironment" NOT NULL DEFAULT 'SANDBOX',
  "tebexStoreId" TEXT,
  "tebexSecretKey" TEXT,
  "tebexEnvironment" "GatewayEnvironment" NOT NULL DEFAULT 'PRODUCTION',
  "paypalClientId" TEXT,
  "paypalClientSecret" TEXT,
  "paypalWebhookId" TEXT,
  "paypalEnvironment" "GatewayEnvironment" NOT NULL DEFAULT 'SANDBOX',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);

