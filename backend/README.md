# Backend Blackout

API Node + PostgreSQL para el panel Admin/RP.

## Variables

Copia `.env.example` y define las variables en tu entorno:

```txt
DATABASE_URL=postgres://usuario:password@host:5432/blackout
JWT_SECRET=clave-larga
ADMIN_USERNAME=admin
ADMIN_PASSWORD=BlackoutAdmin2026!
```

## Arranque

En una terminal:

```powershell
npm run dev:backend
```

En otra terminal:

```powershell
npm run dev:frontend
```

La primera vez que la API conecte con PostgreSQL creara las tablas y el admin inicial.

## Roles

- `admin`: administra usuarios, contenido, reservas y reporte de RPs.
- `rp`: solo registra y consulta sus reservaciones.

## Endpoints principales

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST /api/users` admin
- `GET /api/rps` admin
- `GET/POST /api/reservations`
- `PATCH /api/reservations/:id`
- `GET /api/reports/rp-reservations` admin
- `GET /api/content`
- `PUT /api/admin/content/:key` admin
