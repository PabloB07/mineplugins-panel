# MinePlugins

Panel de ventas y distribucion para plugins de Minecraft Paper 1.21. Incluye gestion de productos, licencias, downloads y actualizaciones.

## Requisitos

- Node.js 20+
- Base de datos PostgreSQL
- Variables de entorno configuradas (por ejemplo `NEXTAUTH_URL`, `DATABASE_URL`, credenciales de Payku)

## Variables de entorno (licencias)

- `PAPER_LICENSE_SECRET`: secreto HMAC para claves de licencia (`<nonce>.<signature>`).
- `PLUGIN_API_KEY`: token para autenticar endpoints plugin (`/api/licenses/*`, `/api/validate*`, `/api/update-check`, `/api/heartbeat`).
- `LICENSE_SYSTEM_USER_EMAIL` (opcional): usuario fallback al emitir licencias por API.

El token del plugin debe coincidir con:
- `TownyFaiths`: `license.panel.api-token`
- `PaperLicensingAPI` library-only: `PAPER_LIC_PANEL_API_TOKEN`

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` para ver la aplicacion.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Notas

- El panel esta orientado a ventas de plugins Paper 1.21 con licenciamiento por servidor.
- Personaliza productos y precios desde el panel de administracion.
