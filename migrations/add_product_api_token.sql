-- Migration: Add apiToken to Product model
-- Date: 2026-03-21

ALTER TABLE "Product" ADD COLUMN "apiToken" TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS "Product_apiToken_idx" ON "Product"("apiToken");
