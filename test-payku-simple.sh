#!/bin/bash

# Simple Payku API Test

API_URL="https://des.payku.cl"

echo "🧪 Testing Payku API..."

# Test with a valid token (this will fail with test token, but shows proper format)
curl -X POST "$API_URL/api/transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_123" \
  -d '{
    "orden": "TEST-123",
    "concepto": "Test payment from MinePlugins",
    "monto": 1000,
    "email": "test@example.com"
  }' \
  -w "\nHTTP Status: %{http_code}\nResponse:\n%s\n"

echo ""
echo "📋 The response above shows:"
echo "1. If you see 'token public is not valid' - you need a real API token"
echo "2. If you see validation errors - the format is correct"
echo "3. If you see a payment URL in the response - success!"
echo ""
echo "💡 Configure with: export PAYKU_API_TOKEN=your_real_token"