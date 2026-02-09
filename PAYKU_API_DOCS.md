# Payku API Documentation - MinePlugins Integration

## Overview
Payku is a Chilean payment processor that accepts multiple payment methods. This documentation is based on reverse engineering the API responses and error patterns.

## API Endpoints

### Base URLs
- **Sandbox**: `https://des.payku.cl`
- **Production**: `https://app.payku.cl`

### Authentication
- **Method**: Bearer Token
- **Header**: `Authorization: Bearer YOUR_API_TOKEN`
- **Token Type**: Public API Token (from Payku merchant dashboard)

### Key Endpoints

#### 1. Create Transaction
- **URL**: `POST /api/transaction`
- **Purpose**: Create a new payment transaction

**Request Payload (Spanish field names preferred):**
```json
{
  "orden": "unique-order-id",
  "concepto": "Payment description",
  "monto": 1000,
  "email": "customer@example.com",
  "url_retorno": "https://yoursite.com/success",
  "url_webhook": "https://yoursite.com/webhook"
}
```

**Response Fields (multiple possible field names):**
```json
{
  "id": "transaction_id",
  "transaccion_id": "transaction_id",
  "orden": "order_id", 
  "url_pago": "https://payku.cl/redirect/123",
  "url_redireccion": "https://payku.cl/redirect/123",
  "url": "https://payku.cl/redirect/123",
  "estado": "pending",
  "status": "pending"
}
```

#### 2. Get Transaction Status
- **URL**: `GET /api/transaction/{order_id}`
- **Purpose**: Get transaction status and details

**Response:**
```json
{
  "transaccion_id": "transaction_id",
  "orden": "order_id",
  "estado": "success|pending|failed",
  "monto": 1000,
  "email": "customer@example.com"
}
```

#### 3. Cancel Transaction
- **URL**: `POST /api/transaction/{order_id}/cancel`
- **Purpose**: Cancel a pending transaction

#### 4. Refund Transaction
- **URL**: `POST /api/transaction/{order_id}/refund`
- **Purpose**: Refund a completed transaction

**Request Payload:**
```json
{
  "amount": 1000
}
```

## Payment States

| Spanish Field | English Field | Description |
|-------------|--------------|-------------|
| `success` | `success` | Payment completed successfully |
| `pending` | `pending` | Payment awaiting confirmation |
| `failed` | `failed` | Payment failed or rejected |
| `cancelled` | `cancelled` | Payment cancelled by user |

## Webhook Integration

### Signature Verification
Payku uses HMAC-SHA256 for webhook signature verification.

**Headers:**
- `x-payku-signature` or `x-payku-signature`: HMAC signature
- Payload is raw JSON string

**Verification Process:**
1. Get signature from header
2. Create HMAC-SHA256 hash of JSON payload with secret key
3. Use `crypto.timingSafeEqual()` for secure comparison

### Webhook Events

| Spanish Event | English Event | Description |
|---------------|----------------|-------------|
| `pago.aprobado` | `payment.success` | Payment successful |
| `pago.rechazado` | `payment.failed` | Payment failed |

## Common Error Messages

| Error Field | Description | Solution |
|-------------|-------------|---------|
| `message_error` | "token public is not valid" | Check API token or use production token |
| `message` | General error message | Check request format |
| `error` | Alternative error field | Check request format |

## Implementation Notes

### Error Handling
Always check multiple possible error field names:
```javascript
const errorMessage = response.message || response.message_error || response.error || "Unknown error";
```

### Payment URL Extraction
Check multiple possible URL field names:
```javascript
const paymentUrl = response.url_pago || response.payment_url || response.url_redireccion;
```

### Testing
Use sandbox environment with test credentials:
- Endpoint: `https://des.payku.cl`
- Test card numbers available in Payku merchant dashboard
- Test amounts: CLP 1,000+ (integer, no cents)

## Integration Checklist

- [ ] API token configured and working
- [ ] Sandbox vs Production URLs correct
- [ ] Webhook endpoint accessible
- [ ] Signature verification implemented
- [ ] Error handling covers all response formats
- [ ] Field name mapping (Spanish/English) handled
- [ ] Amount validation (CLP, integer, min 1,000)
- [ ] Proper order number generation
- [ ] Webhook event processing
- [ ] Database order updates working

## Troubleshooting

### "No payment URL received"
1. Check API token is valid and active
2. Verify request payload format
3. Check all possible payment URL field names
4. Verify API response structure
5. Check for error messages in response

### "Token public is not valid"
1. Verify API token matches environment
2. Check if token is active in Payku dashboard
3. Use correct endpoint (sandbox vs production)

### Webhook Issues
1. Verify signature calculation method
2. Check if raw JSON payload is used (not parsed)
3. Verify secret key matches Payku dashboard
4. Check webhook endpoint is publicly accessible