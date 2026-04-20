const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating Payku settings in database (PaymentGatewayConfig)...');
  
  let settings = await prisma.paymentGatewayConfig.findFirst();
  
  const data = {
    paykuApiToken: "tkpu9d1ed6dd1c54bf739c474c4e2d2f",
    paykuSecretKey: "tkpiaffe06b6a3534f9e09c672671f6e",
    paykuEnabled: true,
    paykuEnvironment: "SANDBOX",
    paykuConfigSource: "PANEL" // Correct enum value
  };

  if (settings) {
    await prisma.paymentGatewayConfig.update({
      where: { id: settings.id },
      data: data
    });
    console.log('Successfully updated existing PaymentGatewayConfig.');
  } else {
    await prisma.paymentGatewayConfig.create({
      data: {
        id: "default",
        ...data
      }
    });
    console.log('Successfully created new PaymentGatewayConfig.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
