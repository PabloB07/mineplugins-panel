#!/bin/bash

# Payku API Test Script
# This script tests different payload formats to find the correct one

API_URL="https://des.payku.cl"
API_TOKEN="${PAYKU_API_TOKEN:-test_token_here}"

if [ -z "$API_TOKEN" ]; then
    echo "❌ ERROR: PAYKU_API_TOKEN environment variable not set"
    echo "Please set it with: export PAYKU_API_TOKEN=your_token"
    exit 1
fi

echo "🧪 Testing Payku API..."
echo "🔗 API URL: $API_URL"
echo "🔑 Token: ${API_TOKEN:0:20}..."
echo ""

# Test 1: Spanish field names
echo "Test 1: Spanish field names (orden, concepto, monto)"
curl -X POST "$API_URL/api/transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "orden": "TEST-'$(date +%s)",
    "concepto": "Test payment from TownyFaiths",
    "monto": 1000,
    "email": "test@example.com",
    "url_retorno": "https://townyfaiths.test/success",
    "url_webhook": "https://townyfaiths.test/webhook"
  }' \
  -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}\nResponse:\n%{response_data}\n\n" \
  -o test1_response.json

echo "Test 2: English field names (order, subject, amount)"
curl -X POST "$API_URL/api/transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "order": "TEST-' + date +%s",
    "subject": "Test payment from TownyFaiths",
    "amount": 1000,
    "email": "test@example.com",
    "payment_url": "https://townyfaiths.test/success",
    "webhook": "https://townyfaiths.test/webhook"
  }' \
  -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}\nResponse:\n%{response_data}\n\n" \
  -o test2_response.json

echo "Test 3: Minimal payload (orden, concepto, monto, email)"
curl -X POST "$API_URL/api/transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d "{
    \"orden\": \"TEST-$(date +%s)\",
    \"concepto\": \"Test payment from TownyFaiths\",
    \"monto\": 1000,
    \"email\": \"test@example.com\",
    \"url_retorno\": \"https://townyfaiths.test/success\",
    \"url_webhook\": \"https://townyfaiths.test/webhook\"
  }" \
  -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}\nResponse:\n%{response_data}\n\n" \
  -o test3_response.json

echo "Test 4: Check GET endpoint"
curl -X GET "$API_URL/api/transaction/TEST123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}\nResponse:\n%{response_data}\n\n" \
  -o test_get_response.json

echo "✅ Tests completed!"
echo "📁 Responses saved to test*_response.json"
echo ""
echo "💡 Check the response files:"
echo "  - cat test1_response.json | jq ."
echo "  - cat test2_response.json | jq ."
echo "  - cat test3_response.json | jq ."
echo "  - cat test_get_response.json | jq ."
echo ""
echo "🎯 Look for payment URL fields like:"
echo "  - url_pago, url_redireccion, payment_url, url"
echo "  - Check for any error messages in the response"