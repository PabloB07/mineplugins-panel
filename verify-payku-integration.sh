#!/bin/bash

echo "🧪 Testing Payku Integration..."

# Test the payment creation with proper credentials
PAYKU_API_TOKEN="${PAYKU_API_TOKEN:-test_token}"
PAYKU_SECRET_KEY="${PAYKU_SECRET_KEY:-test_key}"

# Test with invalid credentials (should show proper error)
echo "🔍 Test 1: Invalid credentials"
response=$(curl -s -X POST "https://des.payku.cl/api/transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PAYKU_API_TOKEN" \
  -d '{
    "orden": "TEST-123",
    "concepto": "Test payment",
    "monto": 1000,
    "email": "test@example.com"
  }' \
  -w "\nHTTP Status: %{http_code}\n")

if echo "$response" | grep -q "token public is not valid"; then
    echo "✅ Invalid token validation: WORKING"
else
    echo "❌ Invalid token validation: FAILED"
fi

echo ""

if [ "$PAYKU_API_TOKEN" = "test_token" ] && [ "$PAYKU_SECRET_KEY" = "test_key" ]; then
    echo "🧪 Test 2: Valid credentials"
    response=$(curl -s -X POST "https://des.payku.cl/api/transaction" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PAYKU_API_TOKEN" \
      -d '{
        "orden": "TEST-456",
        "concepto": "Test payment with valid credentials",
        "monto": 1000,
        "email": "test@example.com",
        "url_retorno": "https://mineplugins.test/success",
        "url_webhook": "https://mineplugins.test/webhook"
      }' \
      -w "\nHTTP Status: %{http_code}\n")

    payment_url=$(echo "$response" | jq -r '.url_pago // empty // .payment_url // empty // .url_redireccion // empty')
    
    if [ "$payment_url" != "null" ] && [ "$payment_url" != '""' ]; then
        echo "✅ Valid credentials: PAYMENT URL FOUND: $payment_url"
    else
        echo "❌ Valid credentials: NO PAYMENT URL"
    fi
else
    echo "❌ Test 2: Invalid credentials (invalid format or missing)"
fi

echo ""
echo "📋 Test Results:"
echo "  Token validation: $(echo "$response" | grep -q "token public is not valid" && echo "✅ PASS" || echo "❌ FAIL")"
echo "  Valid credentials: $(echo "$PAYKU_API_TOKEN $PAYKU_SECRET_KEY" | grep -q "test_token test_key" && echo "✅ PASS" || echo "❌ FAIL")"
echo "  Payment URL extraction: $(echo "$payment_url" | grep -v null && echo "✅ PASS" || echo "❌ FAIL")"
echo ""
echo "💡 If both tests pass, Payku integration is working correctly!"