import { createHmac, timingSafeEqual } from 'node:crypto'
import { query } from './db.js'

const tokenSecret =
  process.env.JWT_SECRET || 'blackout-dev-secret-change-in-production'

if (!process.env.JWT_SECRET) {
  console.warn('[backend] JWT_SECRET no esta configurado. Usa uno propio en produccion.')
}

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function sign(payload) {
  return createHmac('sha256', tokenSecret).update(payload).digest('base64url')
}

export function createToken(user) {
  const payload = base64Url({
    sub: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  })

  return `${payload}.${sign(payload)}`
}

export function readToken(token) {
  if (!token || !token.includes('.')) return null

  const [payload, signature] = token.split('.')
  const expected = sign(payload)
  const received = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (
    received.length !== expectedBuffer.length ||
    !timingSafeEqual(received, expectedBuffer)
  ) {
    return null
  }

  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))

  if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) {
    return null
  }

  return data
}

export async function getUserFromRequest(request) {
  const header = request.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const payload = readToken(token)

  if (!payload?.sub) return null

  const result = await query(
    `SELECT id, username, display_name, role, active, created_at
     FROM users
     WHERE id = $1 AND active = TRUE`,
    [payload.sub]
  )

  return result.rows[0] || null
}

export function requireRole(user, roles) {
  return Boolean(user && roles.includes(user.role))
}
