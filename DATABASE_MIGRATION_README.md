-- Instructions for database admin:
-- Run this as postgres superuser to update pricing system
-- This migrates from cents-based to USD/CLP dual currency system

-- Connect as postgres and run:
-- sudo -u postgres psql -d mineplugins -f pricing_migration_full.sql

-- Then update Prisma schema and regenerate client:
-- npx prisma generate