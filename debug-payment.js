/**
 * Debug script to test the payment flow
 */

async function testPaymentFlow() {
  try {
    console.log("Testing payment flow...");
    
    // Test 1: Create payment order
    console.log("1. Creating payment order...");
    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productSlug: 'townyfaiths-basic', // Use slug instead of ID
        paymentMethod: 'PAYKU'
      })
    });

    const data = await response.json();
    console.log('Payment creation response:', {
      status: response.status,
      ok: response.ok,
      data
    });

    if (!response.ok) {
      console.error('Payment creation failed:', data);
      return;
    }

    if (data.paymentUrl) {
      console.log('✅ Payment URL received:', data.paymentUrl);
      console.log('✅ Order number:', data.orderNumber);
      console.log('✅ Order ID:', data.orderId);
    } else {
      console.error('❌ No payment URL in response');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if we're in browser
if (typeof window !== 'undefined') {
  testPaymentFlow();
}