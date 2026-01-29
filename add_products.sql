-- Insert TownyFaiths product
INSERT INTO "Product" (
  id, 
  name, 
  slug, 
  description, 
  price, 
  "defaultDurationDays", 
  "maxActivations", 
  "isActive", 
  "createdAt", 
  "updatedAt"
) VALUES (
  'townyfaiths-product-1',
  'TownyFaiths Premium',
  'townyfaiths',
  'Premium Minecraft plugin for Towny servers with comprehensive religious system support',
  199900, -- $1,999.00 CLP (approx $2 USD)
  365,
  1,
  true,
  NOW(),
  NOW()
);

-- Insert latest version
INSERT INTO "PluginVersion" (
  id,
  "productId",
  version,
  changelog,
  "downloadUrl",
  "fileSize",
  "minJavaVersion",
  "minMcVersion",
  "isBeta",
  "isLatest",
  "isMandatory",
  "publishedAt",
  "createdAt"
) VALUES (
  'townyfaiths-version-1',
  'townyfaiths-product-1',
  '1.2.0',
  'Added new prayer commands, improved performance, and fixed compatibility issues with latest Towny version',
  'https://your-cdn.com/townyfaiths-1.2.0.jar',
  2048000, -- ~2MB
  '17',
  '1.20.1',
  false,
  true,
  false,
  NOW(),
  NOW()
);

-- Add a previous version
INSERT INTO "PluginVersion" (
  id,
  "productId",
  version,
  changelog,
  "downloadUrl",
  "fileSize",
  "minJavaVersion",
  "minMcVersion",
  "isBeta",
  "isLatest",
  "isMandatory",
  "publishedAt",
  "createdAt"
) VALUES (
  'townyfaiths-version-2',
  'townyfaiths-product-1',
  '1.1.5',
  'Stable release with core features and bug fixes',
  'https://your-cdn.com/townyfaiths-1.1.5.jar',
  1984000, -- ~1.9MB
  '17',
  '1.19.4',
  false,
  false,
  false,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days'
);