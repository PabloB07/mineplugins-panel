-- MinePlugins License Panel - Database Migration
-- Complete schema for MinePlugins licensing system

-- Enums
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('FLOW_CL', 'PAYKU', 'TEBEX', 'PAYPAL', 'FREE_LICENSE', 'ADMIN_GRANT');
CREATE TYPE "GatewayEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');

-- Users
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "User_email_idx" ON "User"("email");

-- OAuth Accounts
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT
);
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- Sessions
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- Verification Tokens
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- Products
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "image" TEXT,
    "price" INTEGER NOT NULL,
    "salePrice" INTEGER,
    "defaultDurationDays" INTEGER NOT NULL DEFAULT 365,
    "maxActivations" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "priceUSD" DOUBLE PRECISION NOT NULL,
    "priceCLP" DOUBLE PRECISION NOT NULL,
    "salePriceUSD" DOUBLE PRECISION,
    "salePriceCLP" DOUBLE PRECISION,
    "apiToken" TEXT UNIQUE
);
CREATE INDEX "Product_slug_idx" ON "Product"("slug");
CREATE INDEX "Product_apiToken_idx" ON "Product"("apiToken");

-- Plugin Versions
CREATE TABLE "PluginVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelog" TEXT,
    "downloadUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER NOT NULL,
    "minJavaVersion" TEXT,
    "minMcVersion" TEXT,
    "isBeta" BOOLEAN NOT NULL DEFAULT false,
    "isLatest" BOOLEAN NOT NULL DEFAULT false,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "PluginVersion_productId_version_key" ON "PluginVersion"("productId", "version");
CREATE INDEX "PluginVersion_productId_isLatest_idx" ON "PluginVersion"("productId", "isLatest");

-- Licenses
CREATE TABLE "License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licenseKey" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastValidatedAt" TIMESTAMP(3),
    "maxActivations" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT
);
CREATE INDEX "License_licenseKey_idx" ON "License"("licenseKey");
CREATE INDEX "License_userId_idx" ON "License"("userId");
CREATE INDEX "License_status_expiresAt_idx" ON "License"("status", "expiresAt");

-- License Activations
CREATE TABLE "LicenseActivation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licenseId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "macAddress" TEXT,
    "hardwareHash" TEXT,
    "networkSignature" TEXT,
    "serverIp" TEXT,
    "serverVersion" TEXT,
    "minecraftVersion" TEXT,
    "serverName" TEXT,
    "serverPort" INTEGER,
    "motd" TEXT,
    "onlineMode" BOOLEAN,
    "maxPlayers" INTEGER,
    "onlinePlayers" INTEGER,
    "tps" DOUBLE PRECISION,
    "memoryUsage" INTEGER,
    "plugins" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validationCount" INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX "LicenseActivation_licenseId_serverId_key" ON "LicenseActivation"("licenseId", "serverId");
CREATE INDEX "LicenseActivation_serverId_idx" ON "LicenseActivation"("serverId");
CREATE INDEX "LicenseActivation_licenseId_isActive_idx" ON "LicenseActivation"("licenseId", "isActive");

-- Orders
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'FLOW_CL',
    "subtotal" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "flowToken" TEXT UNIQUE,
    "flowOrderNumber" TEXT,
    "flowPaymentUrl" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CLP',
    "subtotalUSD" DOUBLE PRECISION,
    "subtotalCLP" DOUBLE PRECISION NOT NULL,
    "discountUSD" DOUBLE PRECISION DEFAULT 0,
    "discountCLP" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUSD" DOUBLE PRECISION,
    "totalCLP" DOUBLE PRECISION NOT NULL
);
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");
CREATE INDEX "Order_flowToken_idx" ON "Order"("flowToken");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- Order Items
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "licenseId" TEXT UNIQUE,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "durationDays" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CLP',
    "unitPriceUSD" DOUBLE PRECISION,
    "unitPriceCLP" DOUBLE PRECISION NOT NULL
);

-- Downloads
CREATE TABLE "Download" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Download_userId_idx" ON "Download"("userId");
CREATE INDEX "Download_versionId_idx" ON "Download"("versionId");
CREATE INDEX "Download_downloadedAt_idx" ON "Download"("downloadedAt");

-- Validation Logs
CREATE TABLE "ValidationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licenseKey" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "serverVersion" TEXT,
    "isValid" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ValidationLog_licenseKey_idx" ON "ValidationLog"("licenseKey");
CREATE INDEX "ValidationLog_createdAt_idx" ON "ValidationLog"("createdAt");

-- Analytics Summary
CREATE TABLE "AnalyticsSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATE NOT NULL UNIQUE,
    "totalLicenses" INTEGER NOT NULL DEFAULT 0,
    "activeLicenses" INTEGER NOT NULL DEFAULT 0,
    "newLicenses" INTEGER NOT NULL DEFAULT 0,
    "expiredLicenses" INTEGER NOT NULL DEFAULT 0,
    "totalActivations" INTEGER NOT NULL DEFAULT 0,
    "uniqueServers" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "newOrders" INTEGER NOT NULL DEFAULT 0,
    "totalValidations" INTEGER NOT NULL DEFAULT 0,
    "successfulValidations" INTEGER NOT NULL DEFAULT 0,
    "failedValidations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalRevenueUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRevenueCLP" DOUBLE PRECISION NOT NULL DEFAULT 0
);
CREATE INDEX "AnalyticsSummary_date_idx" ON "AnalyticsSummary"("date");

-- License Transfers
CREATE TABLE "license_transfers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalLicenseId" TEXT NOT NULL,
    "newLicenseId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Admin Activity Logs
CREATE TABLE "admin_activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "targetUserId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payment Gateway Config
CREATE TABLE "PaymentGatewayConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Server Status (for public server status display)
CREATE TABLE "ServerStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ip" TEXT NOT NULL UNIQUE,
    "port" INTEGER NOT NULL DEFAULT 25565,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "lastChecked" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Foreign Keys
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PluginVersion" ADD CONSTRAINT "PluginVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "License" ADD CONSTRAINT "License_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "License" ADD CONSTRAINT "License_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LicenseActivation" ADD CONSTRAINT "LicenseActivation_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Download" ADD CONSTRAINT "Download_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Download" ADD CONSTRAINT "Download_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PluginVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "license_transfers" ADD CONSTRAINT "TransferFrom_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "license_transfers" ADD CONSTRAINT "TransferTo_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "AdminActivityAdmin_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
