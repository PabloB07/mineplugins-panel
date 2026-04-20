-- AlterTable
ALTER TABLE "PaymentGatewayConfig" ADD COLUMN     "paykuApiUrl" TEXT,
ADD COLUMN     "paykuEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "paykuPrivateToken" TEXT,
ADD COLUMN     "paypalApiUrl" TEXT,
ADD COLUMN     "paypalConfigSource" "GatewayConfigSource" NOT NULL DEFAULT 'ENV',
ADD COLUMN     "paypalEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tebexEnabled" BOOLEAN NOT NULL DEFAULT true;
