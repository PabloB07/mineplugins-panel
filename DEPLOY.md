# Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PabloB07/townyfaith-panel)

## Prerequisites

Before deploying, make sure you have:

1. **Vercel Account** - [Sign up here](https://vercel.com/signup)
2. **PostgreSQL Database** - Use [Neon](https://neon.tech) or [Supabase](https://supabase.com)
3. **Discord Application** - [Create one here](https://discord.com/developers/applications)

## Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | Auth secret (generate with `openssl rand -base64 32`) | ✅ |
| `NEXTAUTH_URL` | Your Vercel deployment URL | ✅ |
| `DISCORD_CLIENT_ID` | Discord OAuth App ID | ✅ |
| `DISCORD_CLIENT_SECRET` | Discord OAuth App Secret | ✅ |
| `FLOW_API_KEY` | Flow payment API key | ✅ |
| `PAPER_LICENSE_SECRET` | HMAC secret for licenses | ✅ |

## Optional Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub OAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_SECRET` | Google OAuth |
| `PAYKU_API_TOKEN` / `PAYKU_SECRET_KEY` | Payku payments |
| `TEBEX_STORE_ID` / `TEBEX_SECRET_KEY` | Tebex payments |
| `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` | PayPal payments |
| `R2_*` | Cloudflare R2 for file storage |

## One-Click Deploy

Click the button above to deploy to Vercel. You'll need to configure the environment variables during the setup process.

## Manual Deploy

```bash
# Clone the repository
git clone https://github.com/PabloB07/townyfaith-panel.git
cd townyfaith-panel

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Push to GitHub and connect to Vercel
git push origin main
```

## After Deployment

1. Run database migrations:
```bash
npx prisma migrate deploy
```

2. Generate Prisma client:
```bash
npx prisma generate
```

3. Configure your OAuth redirect URLs in Discord Developer Portal:
   - `https://your-domain.vercel.app/api/auth/callback/discord`
