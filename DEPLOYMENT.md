# MinePlugins Panel - Deployment Guide

## Option 1: Deploy to Vercel (Recommended)

### Prerequisites

- GitHub account
- Vercel account (free)
- Neon database account (free)
- Blob storage (Cloudflare R2 or AWS S3)

### Step 1: Fork or Upload to GitHub

```bash
# Clone the repository
git clone https://github.com/PabloB07/mineplugins-panel.git
cd mineplugins-panel

# Push to your own GitHub repository
# (Use GitHub Desktop or git commands)
```

### Step 2: Set Up Neon Database

1. Go to [https://neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string:

```
postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Step 3: Set Up Blob Storage (Cloudflare R2)

1. Go to Cloudflare Dashboard > R2
2. Create a bucket (e.g., "mineplugins-jars")
3. Get credentials:
  - Access Key ID
  - Secret Access Key
4. Note your R2 endpoint URL

### Step 4: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=https://your-domain.vercel.app

# Payment Gateways (optional)
PAYKU_API_TOKEN=...
PAYKU_SECRET_KEY=...
TEBEX_STORE_ID=...
TEBEX_SECRET_KEY=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# License System
PAPER_LICENSE_SECRET=your-hmac-secret
LICENSE_SYSTEM_USER_EMAIL=admin@yourdomain.com

# Blob Storage
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ENDPOINT_URL=...
```

1. Click Deploy

### Step 5: Configure Database

```bash
# After first deploy, run Prisma migrations
# In Vercel Dashboard: Go to Deployments > Latest > Logs

# Or locally:
npx prisma generate
npx prisma db push
```

### Step 6: Create Admin User

```bash
# Add your email as admin in database
# Or use the admin panel after first login
```

---

## Option 2: Deploy to VPS

### Prerequisites

- VPS with Ubuntu 22.04+
- Node.js 20+
- PostgreSQL 15+
- Nginx (for reverse proxy)
- Domain with DNS configured

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Should show v20.x.x
```

### Step 3: Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib

# Configure PostgreSQL
sudo -u postgres createuser --interactive yourusername
sudo -u postgres createdb mineplugins

# Set password
sudo -u postgres psql
ALTER USER yourusername WITH PASSWORD 'yourpassword';
\q
```

### Step 4: Install PM2 and Nginx

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Install PM2 globally
sudo npm install -g pm2
```

### Step 5: Upload Code

```bash
# Clone repository
git clone https://github.com/PabloB07/mineplugins-panel.git
cd mineplugins-panel

# Install dependencies
npm install

# Build the project
npm run build
```

### Step 6: Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://user:pass@localhost:5432/mineplugins"
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Payment Gateways
PAYKU_API_TOKEN=""
PAYKU_SECRET_KEY=""

# License System
PAPER_LICENSE_SECRET="hmac-secret"
LICENSE_SYSTEM_USER_EMAIL="admin@domain.com"
EOF
```

### Step 7: Run Database Migrations

```bash
npx prisma generate
npx prisma db push
```

### Step 8: Configure PM2

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mineplugins-panel',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/mineplugins-panel',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/mineplugins-error.log',
    out_file: '/var/log/pm2/mineplugins-out.log'
  }]
}
EOF

# Start the app
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

### Step 9: Configure Nginx

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/mineplugins
```

```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/mineplugins /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 10: Set Up SSL

```bash
sudo certbot --nginx -d your-domain.com
```

---

## Required Environment Variables


| Variable                    | Description                  | Required |
| --------------------------- | ---------------------------- | -------- |
| `DATABASE_URL`              | PostgreSQL connection string | Yes      |
| `NEXTAUTH_SECRET`           | Secret for NextAuth          | Yes      |
| `NEXTAUTH_URL`              | Your domain URL              | Yes      |
| `PAYKU_API_TOKEN`           | Payku API token              | No       |
| `PAYKU_SECRET_KEY`          | Payku secret key             | No       |
| `TEBEX_STORE_ID`            | Tebex store ID               | No       |
| `TEBEX_SECRET_KEY`          | Tebex secret key             | No       |
| `PAYPAL_CLIENT_ID`          | PayPal client ID             | No       |
| `PAYPAL_CLIENT_SECRET`      | PayPal secret                | No       |
| `PAPER_LICENSE_SECRET`      | HMAC secret for licenses     | Yes      |
| `LICENSE_SYSTEM_USER_EMAIL` | Fallback user email          | Yes      |
| `R2_ACCESS_KEY_ID`          | Cloudflare R2 access key     | No       |
| `R2_SECRET_ACCESS_KEY`      | Cloudflare R2 secret         | No       |
| `R2_BUCKET_NAME`            | R2 bucket name               | No       |
| `R2_ENDPOINT_URL`           | R2 endpoint URL              | No       |


---

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U username -d database_name -h localhost
```

### PM2 Logs

```bash
pm2 logs mineplugins-panel
pm2 restart mineplugins-panel
```

### Build Errors

```bash
# Clear node_modules and rebuild
rm -rf node_modules
npm install
npm run build
```

### SSL Certificate Issues

```bash
sudo certbot renew --dry-run
```

---

## Quick Commands Reference

```bash
# Start application
pm2 start mineplugins-panel

# Stop application
pm2 stop mineplugins-panel

# View logs
pm2 logs mineplugins-panel

# Restart after code update
git pull
npm install
npm run build
pm2 restart mineplugins-panel

# Check status
pm2 status
```

