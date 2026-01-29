-- Run this as postgres superuser:
-- sudo -u postgres psql -d townyfaiths -f fix-db-permissions.sql

-- Grant ownership of all tables to faithadmin
ALTER TABLE "Product" OWNER TO faithadmin;
ALTER TABLE "Session" OWNER TO faithadmin;
ALTER TABLE "ValidationLog" OWNER TO faithadmin;
ALTER TABLE "Account" OWNER TO faithadmin;
ALTER TABLE "Download" OWNER TO faithadmin;
ALTER TABLE "PluginVersion" OWNER TO faithadmin;
ALTER TABLE "VerificationToken" OWNER TO faithadmin;
ALTER TABLE "License" OWNER TO faithadmin;
ALTER TABLE "LicenseActivation" OWNER TO faithadmin;
ALTER TABLE "User" OWNER TO faithadmin;
ALTER TABLE "AnalyticsSummary" OWNER TO faithadmin;
ALTER TABLE "Order" OWNER TO faithadmin;
ALTER TABLE "OrderItem" OWNER TO faithadmin;

-- Grant all privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO faithadmin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO faithadmin;
GRANT ALL PRIVILEGES ON SCHEMA public TO faithadmin;

-- Also grant on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO faithadmin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO faithadmin;
