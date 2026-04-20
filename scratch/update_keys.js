const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating Payku settings in database (PaymentGatewayConfig)...');
  
  let settings = await prisma.paymentGatewayConfig.findFirst();
  
  const data = {
    paykuApiToken: "tkpu0ca029109c71eee0ff6e0971e6bd",
    paykuSecretKey: "tkpic2c69ad1af833a15da39dbaa0ef2",
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
