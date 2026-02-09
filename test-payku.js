/**
 * Test script to validate Payku API implementation
 */

import { createPaykuPayment, generatePaykuOrderNumber } from '../src/lib/payku';

async function testPaykuAPI() {
  try {
    const orderNumber = generatePaykuOrderNumber();
    
    const paymentData = {
      order: orderNumber,
      subject: 'Test payment from MinePlugins',
      amount: 1000,
      email: 'test@example.com',
      payment_url: 'https://mineplugins.test/success',
      webhook: 'https://mineplugins.test/webhook',
    };

    console.log('Testing Payku API with:', paymentData);

    const result = await createPaykuPayment(paymentData);
    
    console.log('✅ Payku payment created successfully:', result);
    
  } catch (error) {
    console.error('❌ Payku API test failed:', error.message);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  testPaykuAPI();
}