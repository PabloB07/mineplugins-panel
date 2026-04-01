# MinePlugins License System

**Secure Licensing Solution for Your Minecraft Plugins**

Protect your hard-earned plugin code with enterprise-grade license validation. MinePlugins License System provides hardware-based license binding to prevent unauthorized sharing—all powered by your own panel.

---

## Why Choose MinePlugins?

### 🔐 Hardware-Based License Binding

Each license is tied to the server's unique hardware fingerprint. This prevents users from sharing your plugin across multiple servers or with friends. If they try to run your plugin on a different machine, validation fails automatically.

### 📊 Complete Control Panel

Manage licenses, track activations, view analytics, and control everything from a beautiful dashboard. See who's using your plugin, where, and when.

### 💳 Multiple Payment Gateways

Built-in support for Payku, Tebex, PayPal, and more. Accept payments seamlessly and automatically generate licenses upon purchase.

### 🌐 Public Server Status

Display live server status on your website. Players can see online players, TPS, MOTD, and server version—in real-time.

### ⚡ Fast & Reliable

Validates licenses in milliseconds. Async processing ensures your server starts fast, even under load.

---

## Features

| Feature | Description |
|---------|-------------|
| **Hardware Binding** | Licenses tied to server hardware (MAC, OS, user info) |
| **Multi-Server Support** | Configure `maxActivations` per license (1, 2, 5, unlimited) |
| **Heartbeat Monitoring** | Track server metrics: players, TPS, memory |
| **License Transfers** | Allow users to transfer licenses between accounts |
| **Admin Logs** | Track all admin actions for security |
| **Analytics Dashboard** | Revenue, licenses, validations at a glance |
| **Public Server Status** | Display live server status on your store |
| **API Access** | Full REST API for custom integrations |

---

## How It Works

```
1. Player purchases your plugin
2. System automatically generates a license key
3. Player installs MinePluginsLicenseCheck on their server
4. Plugin validates on startup
5. Hardware is linked to the license
6. Server runs if valid, shuts down if invalid
```

---

## What's Included

### License Panel (This Product)
- Next.js dashboard
- PostgreSQL database
- License management
- User management
- Order processing
- Analytics
- Payment gateway configuration

### License Client (Free)
- Standalone plugin for server validation
- Embeddable library for your own plugins
- Source code included

### Documentation
- Full setup guide
- API reference
- Integration tutorials

---

## Technical Requirements

- Node.js 20+
- **Neon** (Serverless PostgreSQL) - Free tier available
- **Blob Storage** (R2/S3) - Store plugin JAR files
- Minecraft server 1.16.5+ (Paper/Spigot)

---

## Easy Integration

### Server Side (Player)
```bash
# Environment variables
export MINEPLUGINS_PANEL_BASE_URL="https://yourpanel.com"
export MINEPLUGINS_PANEL_API_TOKEN="your-token"
export MINEPLUGINS_LICENSE_KEY="MP-XXXX-XXXX"
export MINEPLUGINS_PANEL_SERVER_ID="survival-1"

# That's it! Validation happens automatically
```

### Plugin Integration (Developer)
```java
LicenseClientService licenseService = new LicenseClientService(
    this, new Gson(), panelUrl, apiToken, serverId, licenseKey
);

ValidationResult result = licenseService.validate("my-plugin");
if (result.isValid()) {
    // License valid - plugin runs
} else {
    // License invalid - disable plugin
}
```

---

## Protect Your Revenue

- ❌ Prevent license sharing
- ❌ Stop unauthorized servers
- ❌ Block code piracy

- ✅ Only paying customers can use your plugin
- ✅ Hardware binding is uncircumventable
- ✅ Full control over activations

---

## Get Started

1. Deploy the panel to Vercel
2. Set up **Neon** PostgreSQL database (free tier)
3. Configure **Blob Storage** for plugin JARs
4. Configure payment gateways
5. Add your products
6. Upload your plugin
7. Start selling!

> **Recommended Hosting:** Deploy to **Vercel** (free tier available) for best performance and zero configuration.

Full setup guide included in the documentation.

---

## Open Source Resources

### License Client Library
- **GitHub:** [https://github.com/PabloB07/mineplugins-license](https://github.com/PabloB07/mineplugins-license)
- Java library for embedding license validation in your plugins

### Documentation (Wiki)
- **GitHub:** [https://github.com/PabloB07/mineplugins-wiki](https://github.com/PabloB07/mineplugins-wiki)
- Full integration guides and API reference

---

## Support

- Full documentation included
- Discord support available
- Regular updates

---

## License

This product includes the complete license system source code. Use it for your own plugins or to build a SaaS licensing service.

**Note:** This is a self-hosted solution. You need your own server/VPS for the panel deployment.

---

**Tags:** Minecraft, Paper, Plugin License, License System, Security, Monetization
