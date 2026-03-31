# MinePlugins Panel

Minecraft Paper 1.21+ plugin store and licensing system with hardware-based license binding.

## Features

- 📦 **Product Management** - Upload and manage plugin versions
- 🔐 **License System** - Hardware-bound licenses per server
- 💳 **Payment Gateways** - Payku, Tebex, PayPal integration
- 📊 **Analytics** - Track licenses, revenue, and validations
- 🌐 **Public Server Status** - Display live server status on your store
- 🔄 **Heartbeat** - Real-time server monitoring

## Requirements

- Node.js 20+
- PostgreSQL database
- PostgreSQL

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/mineplugins"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Payment Gateways
PAYKU_API_TOKEN=""
PAYKU_SECRET_KEY=""
TEBEX_STORE_ID=""
TEBEX_SECRET_KEY=""
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""

# License System
PAPER_LICENSE_SECRET="hmac-secret-for-license-keys"
LICENSE_SYSTEM_USER_EMAIL="fallback@email.com"
```

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push
# Or: psql -f migration.sql

# Start development
npm run dev
```

Open `http://localhost:3000` to access the panel.

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
