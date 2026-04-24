# MinePlugins Panel

Minecraft Paper 1.21+ plugin store and licensing system with hardware-based license binding.

## Features

- 📦 **Product Management** - Upload and manage plugin versions
- 🔐 **License System** - Hardware-bound licenses per server
- 💳 **Payment Gateways** - Tebex and PayPal integration
- 📊 **Analytics** - Track licenses, revenue, and validations
- 🌐 **Public Server Status** - Display live server status on your store
- 🔄 **Heartbeat** - Real-time server monitoring

## Requirements

- Node.js 20+
- PostgreSQL database ([Neon](https://neon.tech) recommended)
- Next.js 14/15
- TypeScript

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon connection string (pooled) | ✅ |
| `DIRECT_URL`   | Neon direct connection string (for migrations) | ✅ |
| `NEXTAUTH_SECRET` | Auth secret (generate with `openssl rand -base64 32`) | ✅ |
| `NEXTAUTH_URL` | Your application base URL | ✅ |
| `DISCORD_CLIENT_ID` | Discord OAuth App ID | ✅ |
| `DISCORD_CLIENT_SECRET` | Discord OAuth App Secret | ✅ |
| `PAPER_LICENSE_SECRET` | HMAC secret for license keys | ✅ |
| `TEBEX_STORE_ID` | Tebex store identifier | ❌ |
| `TEBEX_SECRET_KEY` | Tebex secret key for validation | ❌ |
| `PAYPAL_CLIENT_ID` | PayPal client ID | ✅ |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret | ✅ |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook ID for payment confirmation | ✅ |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | ✅ |

## Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev

# 5. Start development
npm run dev
```

Open `http://localhost:3000` to access the panel.

Use `DATABASE_URL` with the Neon pooler for the app runtime, and `DIRECT_URL` for Prisma CLI commands such as `migrate`, `db push`, `db pull`, and `generate`.

## Payment Gateway Configuration

The panel supports multiple payment gateways that can be configured in `Admin -> Payment Settings`:

- **Tebex**: Global payment processor with support for hundreds of local methods.
- **PayPal**: Direct integration for secure checkouts.

Settings can be managed via the administration dashboard, allowing you to toggle gateways and switch between Sandbox and Production modes.

### Deployment (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PabloB07/mineplugins-panel)

1. **One-Click Deploy**: Use the button above to clone and deploy.
2. **Build Configuration**:
   - Framework Preset: Next.js
   - Run `npx prisma migrate deploy` after the first deployment.
3. **OAuth Setup**: Configure your Discord redirect URL to `https://your-domain.vercel.app/api/auth/callback/discord`.

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # Lint code
```

## Database Schema

The database includes:

- **Users** - Customer and admin accounts
- **Products** - Plugin products with pricing
- **PluginVersions** - Version management
- **Licenses** - License keys with hardware binding
- **LicenseActivation** - Server activations with hardware hash
- **Orders** - Order management
- **ValidationLog** - Validation history
- **ServerStatus** - Public server status

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Minecraft  │────▶│   License   │────▶│   Panel     │
│   Server    │◀────│   Client    │◀────│   (API)     │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Related Projects

- [mineplugins-license](https://github.com/PabloB07/mineplugins-license) - License client library
- [mineplugins-wiki](https://github.com/PabloB07/mineplugins-wiki) - Documentation

## License

MIT License - © 2026 MinePlugins
