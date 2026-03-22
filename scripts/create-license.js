const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const PAPER_LICENSE_SECRET = 'cd0cdc00144a369818fa2f1fbb918107';

function toBase64Url(data) {
  return data.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generatePaperLicenseKey(pluginId) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const nonceLength = 20;
  let nonce = '';
  for (let i = 0; i < nonceLength; i++) {
    nonce += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  const payload = pluginId.toLowerCase() + ':' + nonce;
  const digest = crypto.createHmac('sha256', PAPER_LICENSE_SECRET)
    .update(payload, 'utf8')
    .digest()
    .subarray(0, 16);
  return nonce + '.' + toBase64Url(digest);
}

async function createLicense(productSlug, userId, validDays = 365) {
  const key = generatePaperLicenseKey(productSlug);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validDays);

  const license = await prisma.license.create({
    data: {
      licenseKey: key,
      userId: userId,
      productId: undefined,
      status: 'ACTIVE',
      expiresAt: expiresAt,
      maxActivations: 1,
    },
  });

  console.log('License created:', license);
  return license;
}

async function main() {
  const productSlug = process.argv[2] || 'playernpc';
  
  const product = await prisma.product.findFirst({
    where: { slug: productSlug },
  });
  
  if (!product) {
    console.error(`Product '${productSlug}' not found`);
    process.exit(1);
  }
  
  const user = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });
  
  if (!user) {
    console.error('No SUPER_ADMIN user found');
    process.exit(1);
  }
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 365);
  
  const key = generatePaperLicenseKey(productSlug);
  
  const license = await prisma.license.create({
    data: {
      licenseKey: key,
      userId: user.id,
      productId: product.id,
      status: 'ACTIVE',
      expiresAt: expiresAt,
      maxActivations: 1,
    },
  });
  
  console.log('===========================================');
  console.log('LICENSE KEY FOR:', productSlug);
  console.log('===========================================');
  console.log(key);
  console.log('===========================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
