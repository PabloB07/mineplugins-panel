#!/bin/bash

# Payku API Validation Test Script

API_URL="https://des.payku.cl"
API_TOKEN="${PAYKU_API_TOKEN:-test_token_here}"

if [ -z "$API_TOKEN" ]; then
    echo "❌ ERROR: PAYKU_API_TOKEN environment variable not set"
    echo "Please set it with: export PAYKU_API_TOKEN=your_token"
    exit 1
fi

echo "🧪 Testing Payku API Validation..."

# Test 1: Empty subject (should fail)
echo ""
echo "Test 1: Testing empty subject validation..."
response=$(curl -s -X POST "$API_URL/api/transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "orden": "TEST-$(date +%s)",
    "concepto": "",
    "monto": 1000,
    "email": "test@example.com"
  }' \
  -w "\nHTTP Status: %{http_code}\nResponse:\n%s\n" \
  -o test_empty_subject.json)

if echo "$response" | grep -q "subject:invalid"; then
    echo "✅ Empty subject validation: WORKING"
else
    echo "❌ Empty subject validation: FAILED"
fi

# Test 2: Empty amount (should fail)
echo ""
echo "Test 2: Testing empty amount validation..."
response=$(curl -s -X POST "$API_URL/api/transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "orden": "TEST-' + date +%s",
    "concepto": "Test payment",
    "monto": 0,
    "email": "test@example.com"
  }' \
  -w "\nHTTP Status: %{http_code}\nResponse:\n%s\n" \
  -o test_empty_amount.json)

if echo "$response" | grep -q "amount:is empty"; then
    echo "✅ Empty amount validation: WORKING"
else
    echo "❌ Empty amount validation: FAILED"
fi

# Test 3: Empty order (should fail)
echo ""
echo "Test 3: Testing empty order validation..."
response=$(curl -s -X POST "$API_URL/api/transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "orden": "",
    "concepto": "Test payment",
    "monto": 1000,
    "email": "test@example.com"
  }' \
  -w "\nHTTP Status: %{http_code}\nResponse:\n%s\n" \
  -o test_empty_order.json)

if echo "$response" | grep -q "order:invalid"; then
    echo "✅ Empty order validation: WORKING"
else
    echo "❌ Empty order validation: FAILED"
fi

# Test 4: Invalid email (should fail)
echo ""
echo "Test 4: Testing invalid email validation..."
response=$(curl -s -X POST "$API_URL/api/transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "orden": "TEST-' + date +%s",
    "concepto": "Test payment",
    "monto": 1000,
    "email": "invalid-email"
  }' \
  -w "\nHTTP Status: %{http_code}\nResponse:\n%s\n" \
  -o test_invalid_email.json)

if echo "$response" | grep -q "email:invalid"; then
    echo "✅ Invalid email validation: WORKING"
else
    echo "❌ Invalid email validation: FAILED"
fi

# Test 5: Minimum amount (should fail)
echo ""
echo "Test 5: Testing minimum amount validation..."
response=$(curl -s -X POST "$API_URL/api/transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "orden": "TEST-' + date +%s",
    "concepto": "Test payment",
    "monto": 500,
    "email": "test@example.com"
  }' \
  -w "\nHTTP Status: %{http_code}\nResponse:\n%s\n" \
  -o test_min_amount.json)

if echo "$response" | grep -q "amount:is empty"; then
    echo "✅ Minimum amount validation: WORKING"
else
    echo "❌ Minimum amount validation: FAILED"
fi

# Test 6: Valid request (should succeed if token is valid)
echo ""
echo "Test 6: Testing valid request..."
response=$(curl -s -X POST "$API_URL/api/transaction" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "orden": "TEST-' + date +%s",
    "concepto": "Test payment from TownyFaiths",
    "monto": 1000,
    "email": "test@example.com",
    "url_retorno": "https://townyfaiths.test/success",
    "url_webhook": "https://townyfaiths.test/webhook"
  }' \
  -w "\nHTTP Status: %{http_code}\nResponse:\n%s\n" \
  -o test_valid_request.json)

echo ""
echo "📋 Response analysis for valid request:"
if echo "$response" | jq .; then
    payment_url=$(echo "$response" | jq -r '.url_pago // empty // .payment_url // empty // .url_redireccion // empty')
    if [ "$payment_url" != "null" ] && [ "$payment_url" != '""' ]; then
        echo "✅ Payment URL found: $payment_url"
    else
        echo "❌ No payment URL in response"
    fi
    
    echo "Response keys: $(echo "$response" | jq -r 'keys[]')"
else
    echo "❌ Invalid JSON response"
fi

echo ""
echo "🎯 Validation Tests Summary:"
echo "  Empty subject: $(echo "$response" | grep -q "subject:invalid" && echo "✅ PASS" || echo "❌ FAIL")"
echo "  Empty amount: $(echo "$response" | grep -q "amount:is empty" && echo "✅ PASS" || echo "❌ FAIL")"
echo "  Empty order: $(echo "$response" | grep -q "order:invalid" && echo "✅ PASS" || echo "❌ FAIL")"
echo "  Invalid email: $(echo "$response" | grep -q "email:invalid" && echo "✅ PASS" || echo "❌ FAIL")"
echo "  Minimum amount: $(echo "$response" | grep -q "amount:is empty" && echo "✅ PASS" || echo "❌ FAIL")"
echo "  Valid request: $(echo "$response" | jq . >/dev/null 2>&1 && echo "✅ PASS" || echo "❌ FAIL")"

echo ""
echo "💡 If all validation tests pass but valid request fails, check:"
echo "  1. API token validity and permissions"
echo "  2. Token status in Payku merchant dashboard"
echo "  3. Network connectivity to Payku servers"