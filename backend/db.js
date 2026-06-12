import pg from 'pg'
import { createHash, randomBytes, pbkdf2Sync } from 'node:crypto'
import './env.js'

const { Pool } = pg

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn(
    '[backend] DATABASE_URL no esta configurado. El servidor iniciara, pero la conexion a PostgreSQL fallara hasta definirla.'
  )
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl:
    process.env.PGSSL === 'true'
      ? {
          rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false',
        }
      : undefined,
})

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex')
  return { hash, salt }
}

export function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt)
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(expectedHash, 'hex')

  if (a.length !== b.length) return false
  return createHash('sha256').update(a).digest('hex') === createHash('sha256').update(b).digest('hex')
}

export async function query(text, params = []) {
  return pool.query(text, params)
}

export async function initializeDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'rp')),
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      rp_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      event_name TEXT NOT NULL,
      reservation_date DATE NOT NULL,
      reservation_time TEXT NOT NULL,
      table_type TEXT NOT NULL,
      people_count INTEGER NOT NULL CHECK (people_count > 0 AND people_count <= 100),
      reservation_count INTEGER NOT NULL DEFAULT 1 CHECK (reservation_count > 0 AND reservation_count <= 100),
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content_sections (
      id SERIAL PRIMARY KEY,
      section_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_reservations_created_by ON reservations(created_by);
    CREATE INDEX IF NOT EXISTS idx_reservations_rp_user_id ON reservations(rp_user_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);

    ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_hash TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_salt TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires_at TIMESTAMPTZ;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
      ON users (LOWER(email))
      WHERE email IS NOT NULL;

    CREATE TABLE IF NOT EXISTS user_create_codes (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      code_salt TEXT NOT NULL,
      target_username TEXT NOT NULL,
      target_role TEXT NOT NULL CHECK (target_role IN ('admin', 'rp')),
      requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_user_create_codes_lookup
      ON user_create_codes (LOWER(email), LOWER(target_username), target_role, expires_at DESC)
      WHERE used_at IS NULL;
  `)

  await seedAdmin()
  await seedContentSections()
}

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'BlackoutAdmin2026!'
  const displayName = process.env.ADMIN_NAME || 'Administrador Blackout'
  const email = process.env.ADMIN_RECOVERY_EMAIL || 'admin@blackout.local'

  const existing = await query('SELECT id, email FROM users WHERE username = $1', [
    username,
  ])

  if (existing.rowCount > 0) {
    await query(
      `UPDATE users
       SET email = COALESCE(email, $2),
           email_verified = CASE
             WHEN email IS NULL OR LOWER(email) = LOWER($2) THEN TRUE
             ELSE email_verified
           END
       WHERE username = $1 AND role = 'admin'`,
      [username, email]
    )
    return
  }

  const { hash, salt } = hashPassword(password)

  await query(
    `INSERT INTO users
      (username, display_name, role, password_hash, password_salt, email, email_verified)
     VALUES ($1, $2, 'admin', $3, $4, $5, TRUE)`,
    [username, displayName, hash, salt, email]
  )

  console.warn(
    `[backend] Admin inicial creado: usuario="${username}" password="${password}". Cambialo despues desde el panel.`
  )
}

async function seedContentSections() {
  const sections = [
    {
      key: 'home',
      title: 'Inicio',
      payload: {
        heroEyebrow: 'Bienvenido a',
        heroTitle: 'Blackout',
        heroSubtitle: 'Enciende la noche',
        reservationTitle: 'Reserva tu mesa',
      },
    },
    {
      key: 'events',
      title: 'Eventos',
      payload: {
        title: 'Proximos eventos',
        subtitle: 'Noches unicas. Musica, luces y energia blackout.',
      },
    },
    {
      key: 'gallery',
      title: 'Galeria',
      payload: {
        title: 'Momentos Blackout',
        subtitle: 'Asi se vive la experiencia ON.',
      },
    },
    {
      key: 'info',
      title: 'Info',
      payload: {
        location: 'San Andres Tuxtla, Veracruz',
        hours: 'Viernes a domingo',
        contactEmail: 'contacto@blackout.com',
        instagram: '@blackout',
      },
    },
  ]

  for (const section of sections) {
    await query(
      `INSERT INTO content_sections (section_key, title, payload)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (section_key) DO NOTHING`,
      [section.key, section.title, JSON.stringify(section.payload)]
    )
  }
}
