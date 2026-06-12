# Sistema de reservaciones Blackout

Aplicacion web para reservaciones, panel administrativo, usuarios RP y reportes internos de Blackout.

## Scripts

```bash
npm install
npm run dev
npm run dev:backend
npm run build
npm run server
```

## Variables de entorno

Copia `.env.example` como `.env` para desarrollo local.

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/blackout
JWT_SECRET=cambia-esto-por-una-clave-larga-y-secreta
ADMIN_USERNAME=admin
ADMIN_PASSWORD=BlackoutAdmin2026!
ADMIN_NAME=Administrador Blackout
ADMIN_RECOVERY_EMAIL=admin@blackout.local
PORT=4000
PGSSL=false
NODE_ENV=development
```

## Render

El repo incluye `render.yaml` para desplegar como un solo Web Service con PostgreSQL.

Opcion con Blueprint:

1. En Render, elige `New` -> `Blueprint`.
2. Conecta el repo `Sistema-reservaciones-blackout`.
3. Render detectara `render.yaml`.
4. Define los valores secretos que pide Render:
   - `JWT_SECRET`
   - `ADMIN_PASSWORD`
   - `ADMIN_RECOVERY_EMAIL`
5. Deploy.

Opcion manual:

- Tipo: `Web Service`
- Runtime: `Node`
- Build Command: `npm ci && npm run build`
- Start Command: `npm run server`
- Health Check Path: `/api/health`

Variables en Render:

```env
NODE_ENV=production
DATABASE_URL=la_url_de_postgres
JWT_SECRET=clave-larga-y-segura
ADMIN_USERNAME=admin
ADMIN_PASSWORD=clave-segura
ADMIN_NAME=Administrador Blackout
ADMIN_RECOVERY_EMAIL=correo-del-admin
```

En Render no necesitas `VITE_API_URL` si subes frontend y backend juntos, porque la app llama a `/api` en el mismo dominio.
