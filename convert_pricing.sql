-- Migration script to update pricing from cents to USD/CLP floats
-- This will migrate from the old cent-based system to the new dual-currency system

-- First, backup the old data by creating new columns
ALTER TABLE "Product" ADD COLUMN "priceUSD" FLOAT;
ALTER TABLE "Product" ADD COLUMN "priceCLP" FLOAT;
ALTER TABLE "Product" ADD COLUMN "salePriceUSD" FLOAT;
ALTER TABLE "Product" ADD COLUMN "salePriceCLP" FLOAT;

ALTER TABLE "Order" ADD COLUMN "currency" VARCHAR(3) DEFAULT 'CLP';
ALTER TABLE "Order" ADD COLUMN "subtotalUSD" FLOAT;
ALTER TABLE "Order" ADD COLUMN "subtotalCLP" FLOAT;
ALTER TABLE "Order" ADD COLUMN "discountUSD" FLOAT DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "discountCLP" FLOAT DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "totalUSD" FLOAT;
ALTER TABLE "Order" ADD COLUMN "totalCLP" FLOAT;

ALTER TABLE "OrderItem" ADD COLUMN "currency" VARCHAR(3) DEFAULT 'CLP';
ALTER TABLE "OrderItem" ADD COLUMN "unitPriceUSD" FLOAT;
ALTER TABLE "OrderItem" ADD COLUMN "unitPriceCLP" FLOAT;

ALTER TABLE "AnalyticsSummary" ADD COLUMN "totalRevenueUSD" FLOAT DEFAULT 0;
ALTER TABLE "AnalyticsSummary" ADD COLUMN "totalRevenueCLP" FLOAT DEFAULT 0;

-- Migrate product prices (convert from cents to CLP pesos, estimate USD)
UPDATE "Product" SET 
  "priceCLP" = "price" / 100.0,
  "priceUSD" = ("price" / 100.0) / 900.0, -- rough CLP to USD conversion
  "salePriceCLP" = CASE WHEN "salePrice" IS NOT NULL THEN "salePrice" / 100.0 ELSE NULL END,
  "salePriceUSD" = CASE WHEN "salePrice" IS NOT NULL THEN ("salePrice" / 100.0) / 900.0 ELSE NULL END;

-- Migrate order totals (convert from cents to CLP pesos)
UPDATE "Order" SET 
  "currency" = 'CLP',
  "subtotalCLP" = "subtotal" / 100.0,
  "discountCLP" = "discount" / 100.0,
  "totalCLP" = "total" / 100.0;

-- Migrate order items
UPDATE "OrderItem" SET 
  "currency" = 'CLP',
  "unitPriceCLP" = "unitPrice" / 100.0;

-- Migrate analytics revenue
UPDATE "AnalyticsSummary" SET 
  "totalRevenueCLP" = "totalRevenue" / 100.0,
  "totalRevenueUSD" = ("totalRevenue" / 100.0) / 900.0;

-- Make new columns NOT NULL after data migration
ALTER TABLE "Product" ALTER COLUMN "priceUSD" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "priceCLP" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "currency" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "subtotalCLP" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "discountCLP" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "totalCLP" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "currency" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "unitPriceCLP" SET NOT NULL;
ALTER TABLE "AnalyticsSummary" ALTER COLUMN "totalRevenueCLP" SET NOT NULL;
ALTER TABLE "AnalyticsSummary" ALTER COLUMN "totalRevenueUSD" SET NOT NULL;