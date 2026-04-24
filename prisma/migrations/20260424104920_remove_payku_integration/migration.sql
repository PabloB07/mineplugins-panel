-- First, update any existing orders that use the soon-to-be-removed payment methods
-- We'll map them to PAYPAL as a fallback so the migration doesn't fail
UPDATE "Order" SET "paymentMethod" = 'PAYPAL' WHERE "paymentMethod" IN ('PAYKU', 'FLOW_CL');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('TEBEX', 'PAYPAL', 'FREE_LICENSE', 'ADMIN_GRANT');
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" SET DEFAULT 'PAYPAL';
COMMIT;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" SET DEFAULT 'PAYPAL';

-- AlterTable
ALTER TABLE "PaymentGatewayConfig" DROP COLUMN "paykuApiToken",
DROP COLUMN "paykuApiUrl",
DROP COLUMN "paykuConfigSource",
DROP COLUMN "paykuEnabled",
DROP COLUMN "paykuEnvironment",
DROP COLUMN "paykuPrivateToken",
DROP COLUMN "paykuSecretKey";
