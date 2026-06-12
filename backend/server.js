import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { dirname, extname, normalize, resolve, sep } from 'node:path'
import { URL, fileURLToPath } from 'node:url'
import { randomInt } from 'node:crypto'
import './env.js'
import { createToken, getUserFromRequest, requireRole } from './auth.js'
import { initializeDatabase, query, hashPassword, verifyPassword } from './db.js'
import {
  sendAdminReservationEmail,
  sendPasswordRecoveryEmail,
  sendReservationReceivedEmail,
  sendUserVerificationEmail,
} from './mail.js'

const port = Number(process.env.PORT || 4000)
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(rootDir, 'dist')
const allowedPeopleCounts = new Set([2, 3, 4, 5, 7, 10])
const allowedReservationTimes = new Set(['21:00', '22:00', '23:00'])
const allowedTableTypes = new Set(['Acceso general', 'Mesa estandar', 'Mesa VIP'])
const allowedEvents = new Set(['Evento privado'])
const allowedReservationStatuses = new Set(['pending', 'confirmed', 'cancelled'])
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  })
  response.end(JSON.stringify(payload))
}

function ok(response, payload = {}) {
  sendJson(response, 200, payload)
}

function created(response, payload = {}) {
  sendJson(response, 201, payload)
}

function sendText(response, status, message) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
  })
  response.end(message)
}

function badRequest(response, message, details = undefined) {
  sendJson(response, 400, { error: message, details })
}

function unauthorized(response) {
  sendJson(response, 401, { error: 'No autorizado' })
}

function forbidden(response) {
  sendJson(response, 403, { error: 'Acceso denegado' })
}

async function readJson(request) {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw)
}

function streamFile(response, filePath, method = 'GET') {
  const extension = extname(filePath).toLowerCase()
  const isIndex = filePath.endsWith(`${sep}index.html`)

  response.writeHead(200, {
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Cache-Control': isIndex ? 'no-cache' : 'public, max-age=31536000, immutable',
  })

  if (method === 'HEAD') {
    response.end()
    return
  }

  createReadStream(filePath).pipe(response)
}

function serveFrontend(request, response, pathname) {
  const method = request.method || 'GET'

  if (!['GET', 'HEAD'].includes(method)) {
    sendText(response, 404, 'Ruta no encontrada')
    return true
  }

  if (!existsSync(distDir)) {
    sendText(
      response,
      404,
      'Frontend no construido. Ejecuta npm run build antes de iniciar el servidor.'
    )
    return true
  }

  let decodedPath = '/'

  try {
    decodedPath = decodeURIComponent(pathname)
  } catch {
    decodedPath = '/'
  }

  const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, '')
  const requestedPath = normalizedPath === sep ? 'index.html' : `.${normalizedPath}`
  const staticFilePath = resolve(distDir, requestedPath)
  const allowedPrefix = `${distDir}${sep}`

  if (staticFilePath !== distDir && !staticFilePath.startsWith(allowedPrefix)) {
    sendText(response, 403, 'Acceso denegado')
    return true
  }

  if (existsSync(staticFilePath) && statSync(staticFilePath).isFile()) {
    streamFile(response, staticFilePath, method)
    return true
  }

  const indexPath = resolve(distDir, 'index.html')

  if (existsSync(indexPath)) {
    streamFile(response, indexPath, method)
    return true
  }

  sendText(response, 404, 'Frontend no encontrado')
  return true
}

function cleanText(value) {
  return String(value ?? '').trim()
}

function cleanEmail(value) {
  return cleanText(value).toLowerCase()
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function maskEmail(email) {
  const [name = '', domain = ''] = String(email || '').split('@')
  const visibleName = name.length <= 2 ? name : `${name.slice(0, 2)}***`
  return domain ? `${visibleName}@${domain}` : email
}

function toPositiveInt(value, fallback = 1) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 1) return fallback
  return number
}

function toLocalDateInput(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toStoredDateInput(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
  return toLocalDateInput(new Date(value))
}

function parseDateInput(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const [, rawYear, rawMonth, rawDay] = match
  const year = Number(rawYear)
  const month = Number(rawMonth)
  const day = Number(rawDay)
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

function validateReservationDate(value, { allowPast = false } = {}) {
  const date = parseDateInput(value)
  if (!date) return 'Fecha requerida.'

  const today = parseDateInput(toLocalDateInput())
  if (!allowPast && today && date < today) return 'La fecha no puede ser anterior a hoy.'

  const day = date.getDay()
  if (![5, 6, 0].includes(day)) {
    return 'Solo se permiten reservaciones en viernes, sabado o domingo.'
  }

  return ''
}

async function sendReservationEmails(reservation) {
  const jobs = []
  const adminEmail = cleanEmail(
    process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_RECOVERY_EMAIL
  )

  if (isEmail(reservation.customer_email)) {
    jobs.push(
      sendReservationReceivedEmail({
        to: reservation.customer_email,
        name: reservation.customer_name,
        reservation,
      })
    )
  }

  if (String(reservation.notes || '').startsWith('[WEB]') && isEmail(adminEmail)) {
    jobs.push(sendAdminReservationEmail({ to: adminEmail, reservation }))
  }

  if (jobs.length === 0) return

  const results = await Promise.allSettled(jobs)

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[backend] Error enviando correo:', result.reason?.message || result.reason)
    }
  }
}

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    active: row.active,
    email: row.email || null,
    createdAt: row.created_at,
  }
}

function publicRecoveryAdmin(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    emailLabel: maskEmail(row.email),
  }
}

function nextAllowedReservationDate(date, offset = 0) {
  const next = new Date(date)
  let found = -1

  while (found < offset) {
    const day = next.getDay()
    if ([5, 6, 0].includes(day)) found += 1
    if (found === offset) return toLocalDateInput(next)
    next.setDate(next.getDate() + 1)
  }

  return toLocalDateInput(next)
}

async function ensureDemoRp(username, displayName, currentUser) {
  const existing = await query('SELECT id FROM users WHERE username = $1', [
    username,
  ])

  if (existing.rowCount > 0) {
    await query(
      `UPDATE users
       SET display_name = $1, role = 'rp', active = TRUE, updated_at = NOW()
       WHERE username = $2`,
      [displayName, username]
    )
    return existing.rows[0].id
  }

  const { hash, salt } = hashPassword('BlackoutRP2026!')
  const result = await query(
    `INSERT INTO users
      (username, display_name, role, password_hash, password_salt, created_by)
     VALUES ($1, $2, 'rp', $3, $4, $5)
     RETURNING id`,
    [username, displayName, hash, salt, currentUser.id]
  )

  return result.rows[0].id
}

async function handleSeedDemoData(response, currentUser) {
  const today = new Date()
  const rpIds = {
    luna: await ensureDemoRp('rp_luna', 'Luna Martinez', currentUser),
    max: await ensureDemoRp('rp_max', 'Max Hernandez', currentUser),
    sofia: await ensureDemoRp('rp_sofia', 'Sofia Torres', currentUser),
  }

  await query(`DELETE FROM reservations WHERE notes LIKE '[DEMO]%'`)

  const demoReservations = [
    {
      rpUserId: rpIds.luna,
      customerName: 'Carlos Ramirez',
      phone: '2941112233',
      email: 'carlos.demo@mail.com',
      event: 'Blackout Friday',
      date: nextAllowedReservationDate(today, 0),
      time: '22:00',
      table: 'Mesa VIP',
      people: 7,
      credits: 2,
      status: 'confirmed',
    },
    {
      rpUserId: rpIds.luna,
      customerName: 'Mariana Cruz',
      phone: '2942223344',
      email: 'mariana.demo@mail.com',
      event: 'Neon Night',
      date: nextAllowedReservationDate(today, 1),
      time: '23:00',
      table: 'Acceso general',
      people: 4,
      credits: 1,
      status: 'pending',
    },
    {
      rpUserId: rpIds.max,
      customerName: 'Diego Salas',
      phone: '2943334455',
      email: 'diego.demo@mail.com',
      event: 'Full Black',
      date: nextAllowedReservationDate(today, 2),
      time: '21:00',
      table: 'Mesa estandar',
      people: 7,
      credits: 3,
      status: 'confirmed',
    },
    {
      rpUserId: rpIds.max,
      customerName: 'Fernanda Lopez',
      phone: '2944445566',
      email: 'fer.demo@mail.com',
      event: 'DJ Set Especial',
      date: nextAllowedReservationDate(today, 3),
      time: '22:00',
      table: 'Mesa VIP',
      people: 10,
      credits: 4,
      status: 'pending',
    },
    {
      rpUserId: rpIds.sofia,
      customerName: 'Andrea Molina',
      phone: '2945556677',
      email: 'andrea.demo@mail.com',
      event: 'Blackout Friday',
      date: nextAllowedReservationDate(today, 0),
      time: '22:00',
      table: 'Acceso general',
      people: 3,
      credits: 1,
      status: 'confirmed',
    },
    {
      rpUserId: rpIds.sofia,
      customerName: 'Jorge Medina',
      phone: '2946667788',
      email: 'jorge.demo@mail.com',
      event: 'Neon Night',
      date: nextAllowedReservationDate(today, 1),
      time: '23:00',
      table: 'Mesa estandar',
      people: 5,
      credits: 2,
      status: 'confirmed',
    },
  ]

  for (const item of demoReservations) {
    await query(
      `INSERT INTO reservations
        (created_by, rp_user_id, customer_name, customer_phone, customer_email,
         event_name, reservation_date, reservation_time, table_type,
         people_count, reservation_count, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        currentUser.id,
        item.rpUserId,
        item.customerName,
        item.phone,
        item.email,
        item.event,
        item.date,
        item.time,
        item.table,
        item.people,
        item.credits,
        '[DEMO] Reservacion de prueba para validar reportes RP.',
        item.status,
      ]
    )
  }

  created(response, {
    success: true,
    rpUsers: Object.keys(rpIds).length,
    reservations: demoReservations.length,
    rpPassword: 'BlackoutRP2026!',
  })
}

async function handleLogin(response, body) {
  const username = cleanText(body.username).toLowerCase()
  const password = String(body.password ?? '')

  if (!username || !password) {
    return badRequest(response, 'Usuario y password son obligatorios.')
  }

  const result = await query('SELECT * FROM users WHERE username = $1', [
    username,
  ])
  const user = result.rows[0]

  if (
    !user ||
    !user.active ||
    !verifyPassword(password, user.password_salt, user.password_hash)
  ) {
    return unauthorized(response)
  }

  ok(response, {
    token: createToken(user),
    user: publicUser(user),
  })
}

async function listRecoveryAdmins() {
  const result = await query(
    `SELECT id, username, display_name, email
     FROM users
     WHERE role = 'admin'
       AND active = TRUE
       AND email_verified = TRUE
       AND email IS NOT NULL
     ORDER BY display_name ASC`
  )

  return result.rows
}

async function findVerifiedAdminById(adminId) {
  const result = await query(
    `SELECT *
     FROM users
     WHERE id = $1
       AND role = 'admin'
       AND active = TRUE
       AND email_verified = TRUE
       AND email IS NOT NULL
     LIMIT 1`,
    [adminId]
  )

  return result.rows[0] || null
}

async function handleRequestPasswordRecovery(response, body) {
  const adminId = Number(body.adminId)

  if (!Number.isInteger(adminId) || adminId < 1) {
    return badRequest(response, 'Selecciona un administrador.', {
      adminId: 'Selecciona un administrador.',
    })
  }

  const user = await findVerifiedAdminById(adminId)

  if (!user) {
    return badRequest(response, 'Ese administrador no existe o no tiene correo verificado.', {
      adminId: 'Ese administrador no existe o no tiene correo verificado.',
    })
  }

  const resetCode = String(randomInt(100000, 1000000))
  const { hash, salt } = hashPassword(resetCode)

  await query(
    `UPDATE users
     SET reset_code_hash = $1,
         reset_code_salt = $2,
         reset_code_expires_at = NOW() + INTERVAL '15 minutes',
         updated_at = NOW()
     WHERE id = $3`,
    [hash, salt, user.id]
  )

  console.warn(
    `[backend] Codigo de recuperacion admin para ${user.email}: ${resetCode}`
  )

  try {
    await sendPasswordRecoveryEmail({
      to: user.email,
      name: user.display_name,
      code: resetCode,
    })
  } catch (error) {
    const message = error?.message || 'No se pudo enviar el codigo por correo.'
    console.error(
      '[backend] Error enviando recuperacion:',
      message
    )
    return sendJson(response, 502, { error: message })
  }

  ok(response, {
    success: true,
    message: 'Correo verificado. Revisa el codigo de recuperacion.',
    resetCode: process.env.NODE_ENV === 'production' ? undefined : resetCode,
  })
}

async function handleConfirmPasswordRecovery(response, body) {
  const adminId = Number(body.adminId)
  const code = cleanText(body.code)
  const password = String(body.password ?? '')
  const errors = {}

  if (!Number.isInteger(adminId) || adminId < 1) {
    errors.adminId = 'Selecciona un administrador.'
  }
  if (!/^\d{6}$/.test(code)) errors.code = 'El codigo debe tener 6 digitos.'
  if (password.length < 8) errors.password = 'Minimo 8 caracteres.'

  if (Object.keys(errors).length > 0) {
    return badRequest(response, 'Revisa los datos de recuperacion.', errors)
  }

  const user = await findVerifiedAdminById(adminId)

  if (
    !user ||
    !user.reset_code_hash ||
    !user.reset_code_salt ||
    !user.reset_code_expires_at
  ) {
    return badRequest(response, 'Solicita un codigo nuevo.', {
      code: 'Solicita un codigo nuevo.',
    })
  }

  if (new Date(user.reset_code_expires_at) < new Date()) {
    return badRequest(response, 'El codigo ya expiro.', {
      code: 'El codigo ya expiro. Solicita uno nuevo.',
    })
  }

  if (!verifyPassword(code, user.reset_code_salt, user.reset_code_hash)) {
    return badRequest(response, 'Codigo incorrecto.', {
      code: 'Codigo incorrecto.',
    })
  }

  const { hash, salt } = hashPassword(password)

  await query(
    `UPDATE users
     SET password_hash = $1,
         password_salt = $2,
         reset_code_hash = NULL,
         reset_code_salt = NULL,
         reset_code_expires_at = NULL,
         updated_at = NOW()
     WHERE id = $3`,
    [hash, salt, user.id]
  )

  ok(response, {
    success: true,
    message: 'Password actualizado. Ya puedes iniciar sesion.',
  })
}

async function validateCreateUserInput(body, options = {}) {
  const username = cleanText(body.username).toLowerCase()
  const displayName = cleanText(body.displayName)
  const role = cleanText(body.role)
  const email = cleanEmail(body.email)
  const password = String(body.password ?? '')
  const verificationCode = cleanText(body.verificationCode)

  const errors = {}

  if (username.length < 3) errors.username = 'Minimo 3 caracteres.'
  if (displayName.length < 3) errors.displayName = 'Minimo 3 caracteres.'
  if (!['admin', 'rp'].includes(role)) errors.role = 'Rol invalido.'
  if (!isEmail(email)) errors.email = 'Escribe un correo valido.'
  if (options.requirePassword && password.length < 8) {
    errors.password = 'Minimo 8 caracteres.'
  }
  if (options.requireCode && !/^\d{6}$/.test(verificationCode)) {
    errors.verificationCode = 'El codigo debe tener 6 digitos.'
  }

  if (username.length >= 3) {
    const duplicateUsername = await query(
      `SELECT id
       FROM users
       WHERE LOWER(username) = LOWER($1)
       LIMIT 1`,
      [username]
    )

    if (duplicateUsername.rowCount > 0) {
      errors.username = 'Ese usuario ya existe.'
    }
  }

  if (isEmail(email)) {
    const duplicateEmail = await query(
      `SELECT id
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    )

    if (duplicateEmail.rowCount > 0) {
      errors.email = 'Ese correo ya esta en uso.'
    }
  }

  if (role === 'rp' && displayName.length >= 3) {
    const duplicateRpName = await query(
      `SELECT id
       FROM users
       WHERE role = 'rp'
         AND active = TRUE
         AND LOWER(display_name) = LOWER($1)
       LIMIT 1`,
      [displayName]
    )

    if (duplicateRpName.rowCount > 0) {
      errors.displayName = 'Ya existe un RP con ese nombre.'
    }
  }

  return {
    username,
    displayName,
    role,
    email,
    password,
    verificationCode,
    errors,
  }
}

async function handleRequestUserVerificationCode(response, body, currentUser) {
  const payload = await validateCreateUserInput(body, {
    requirePassword: false,
    requireCode: false,
  })
  const { username, displayName, role, email, errors } = payload

  if (Object.keys(errors).length > 0) {
    return badRequest(response, 'Revisa los datos del usuario.', errors)
  }

  const verificationCode = String(randomInt(100000, 1000000))
  const { hash, salt } = hashPassword(verificationCode)

  await query(
    `UPDATE user_create_codes
     SET used_at = NOW()
     WHERE used_at IS NULL
       AND (LOWER(email) = LOWER($1) OR LOWER(target_username) = LOWER($2))`,
    [email, username]
  )

  await query(
    `INSERT INTO user_create_codes
      (email, code_hash, code_salt, target_username, target_role, requested_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '10 minutes')`,
    [email, hash, salt, username, role, currentUser.id]
  )

  console.warn(`[backend] Codigo de alta para ${email}: ${verificationCode}`)

  try {
    await sendUserVerificationEmail({
      to: email,
      name: displayName,
      code: verificationCode,
      role,
    })
  } catch (error) {
    const message = error?.message || 'No se pudo enviar el codigo por correo.'
    console.error(
      '[backend] Error enviando codigo de alta:',
      message
    )
    return sendJson(response, 502, {
      error: message,
    })
  }

  return ok(response, {
    success: true,
    message: 'Codigo enviado al correo del usuario.',
    verificationCode:
      process.env.NODE_ENV === 'production' ? undefined : verificationCode,
  })
}

async function handleCreateUser(response, body, currentUser) {
  const payload = await validateCreateUserInput(body, {
    requirePassword: true,
    requireCode: true,
  })
  const { username, displayName, role, email, password, verificationCode, errors } =
    payload

  if (Object.keys(errors).length > 0) {
    return badRequest(response, 'Revisa los datos del usuario.', errors)
  }

  const codeResult = await query(
    `SELECT *
     FROM user_create_codes
     WHERE used_at IS NULL
       AND LOWER(email) = LOWER($1)
       AND LOWER(target_username) = LOWER($2)
       AND target_role = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, username, role]
  )

  const codeRow = codeResult.rows[0]

  if (!codeRow) {
    return badRequest(response, 'Solicita un codigo de validacion.', {
      verificationCode: 'Solicita un codigo para este correo y usuario.',
    })
  }

  if (new Date(codeRow.expires_at) < new Date()) {
    return badRequest(response, 'El codigo ya expiro.', {
      verificationCode: 'El codigo ya expiro. Solicita uno nuevo.',
    })
  }

  if (Number(codeRow.attempts) >= 5) {
    return badRequest(response, 'Solicita un codigo nuevo.', {
      verificationCode: 'Demasiados intentos. Solicita un codigo nuevo.',
    })
  }

  if (!verifyPassword(verificationCode, codeRow.code_salt, codeRow.code_hash)) {
    await query(
      `UPDATE user_create_codes
       SET attempts = attempts + 1
       WHERE id = $1`,
      [codeRow.id]
    )
    return badRequest(response, 'Codigo incorrecto.', {
      verificationCode: 'Codigo incorrecto.',
    })
  }

  const { hash, salt } = hashPassword(password)

  try {
    const result = await query(
      `INSERT INTO users
        (username, display_name, role, password_hash, password_salt,
         email, email_verified, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
       RETURNING id, username, display_name, role, active, email, created_at`,
      [username, displayName, role, hash, salt, email, currentUser.id]
    )

    await query(
      `UPDATE user_create_codes
       SET used_at = NOW()
       WHERE id = $1`,
      [codeRow.id]
    )

    created(response, { user: publicUser(result.rows[0]) })
  } catch (error) {
    if (error.code === '23505') {
      return badRequest(response, 'Ese usuario o correo ya existe.', {
        username: 'Ese usuario ya existe.',
        email: 'Ese correo ya esta en uso.',
      })
    }
    throw error
  }
}

async function handleUpdateUser(response, id, body, currentUser) {
  const displayName = cleanText(body.displayName)
  const role = cleanText(body.role)
  const active = Boolean(body.active)
  const password = String(body.password ?? '')

  if (Number(id) === currentUser.id && !active) {
    return badRequest(response, 'No puedes desactivar tu propia cuenta.')
  }

  if (displayName.length < 3 || !['admin', 'rp'].includes(role)) {
    return badRequest(response, 'Datos invalidos para actualizar usuario.')
  }

  if (role === 'rp') {
    const duplicateRpName = await query(
      `SELECT id
       FROM users
       WHERE role = 'rp'
         AND active = TRUE
         AND id <> $2
         AND LOWER(display_name) = LOWER($1)
       LIMIT 1`,
      [displayName, id]
    )

    if (duplicateRpName.rowCount > 0) {
      return badRequest(response, 'Ya existe un RP con ese nombre.', {
        displayName: 'Ya existe un RP con ese nombre.',
      })
    }
  }

  if (password) {
    if (password.length < 8) {
      return badRequest(response, 'El password debe tener minimo 8 caracteres.')
    }
    const { hash, salt } = hashPassword(password)
    await query(
      `UPDATE users
       SET display_name = $1, role = $2, active = $3,
           password_hash = $4, password_salt = $5, updated_at = NOW()
       WHERE id = $6`,
      [displayName, role, active, hash, salt, id]
    )
  } else {
    await query(
      `UPDATE users
       SET display_name = $1, role = $2, active = $3, updated_at = NOW()
       WHERE id = $4`,
      [displayName, role, active, id]
    )
  }

  ok(response, { success: true })
}

async function handleDeleteUser(response, id, currentUser) {
  if (Number(id) === currentUser.id) {
    return badRequest(response, 'No puedes eliminar tu propia cuenta.')
  }

  const result = await query(
    `UPDATE users
     SET active = FALSE, updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  )

  if (result.rowCount === 0) return badRequest(response, 'Usuario no encontrado.')
  ok(response, { success: true })
}

function validateReservation(body, options = {}) {
  const reservation = {
    customerName: cleanText(body.customerName),
    customerPhone: cleanText(body.customerPhone),
    customerEmail: cleanText(body.customerEmail),
    eventName: cleanText(body.eventName) || 'Evento privado',
    reservationDate: cleanText(body.reservationDate),
    reservationTime: cleanText(body.reservationTime),
    tableType: cleanText(body.tableType) || 'Acceso general',
    peopleCount: toPositiveInt(body.peopleCount),
    reservationCount: toPositiveInt(body.reservationCount),
    notes: cleanText(body.notes),
    status: cleanText(body.status) || 'pending',
  }

  const errors = {}

  if (reservation.customerName.length < 3) errors.customerName = 'Nombre requerido.'
  if (!/^\d{10}$/.test(reservation.customerPhone.replace(/\D/g, ''))) {
    errors.customerPhone = 'El telefono debe tener exactamente 10 digitos.'
  }
  const dateError = validateReservationDate(reservation.reservationDate, {
    allowPast: Boolean(options.allowPastDate),
  })
  if (dateError) errors.reservationDate = dateError
  if (!allowedEvents.has(reservation.eventName)) {
    errors.eventName = 'Evento invalido.'
  }
  if (!allowedReservationTimes.has(reservation.reservationTime)) {
    errors.reservationTime = 'Hora invalida.'
  }
  if (!allowedPeopleCounts.has(reservation.peopleCount)) {
    errors.peopleCount = 'Selecciona 2, 3, 4, 5, 7 o 10 personas.'
  }
  if (!allowedTableTypes.has(reservation.tableType)) {
    errors.tableType = 'Tipo de mesa invalido.'
  }
  if (reservation.reservationCount > 100) {
    errors.reservationCount = 'Maximo 100 reservaciones por captura.'
  }
  if (!allowedReservationStatuses.has(reservation.status)) {
    errors.status = 'Estado invalido.'
  }

  return { reservation, errors }
}

async function handleCreateReservation(response, body, currentUser) {
  const { reservation, errors } = validateReservation(body)

  if (Object.keys(errors).length > 0) {
    return badRequest(response, 'Revisa los datos de la reservacion.', errors)
  }

  const duplicateResult = await query(
    `SELECT id
     FROM reservations
     WHERE LOWER(customer_name) = LOWER($1)
       AND status <> 'cancelled'
     LIMIT 1`,
    [reservation.customerName]
  )

  if (duplicateResult.rowCount > 0) {
    return badRequest(response, 'Ese nombre ya tiene una reservacion registrada.', {
      customerName: 'Ese nombre ya tiene una reservacion registrada.',
    })
  }

  let rpUserId = null

  if (currentUser.role === 'rp') {
    rpUserId = currentUser.id
  } else if (body.rpUserId) {
    const rpResult = await query(
      `SELECT id FROM users WHERE id = $1 AND role = 'rp' AND active = TRUE`,
      [body.rpUserId]
    )
    if (rpResult.rowCount === 0) {
      return badRequest(response, 'El RP seleccionado no existe o esta inactivo.')
    }
    rpUserId = Number(body.rpUserId)
  }

  const result = await query(
    `INSERT INTO reservations
      (created_by, rp_user_id, customer_name, customer_phone, customer_email,
       event_name, reservation_date, reservation_time, table_type,
       people_count, reservation_count, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      currentUser.id,
      rpUserId,
      reservation.customerName,
      reservation.customerPhone.replace(/\D/g, ''),
      reservation.customerEmail || null,
      reservation.eventName,
      reservation.reservationDate,
      reservation.reservationTime,
      reservation.tableType,
      reservation.peopleCount,
      reservation.reservationCount,
      reservation.notes || null,
      reservation.status,
    ]
  )

  const savedReservation = result.rows[0]

  await sendReservationEmails(savedReservation)

  created(response, { reservation: savedReservation })
}

async function handleCreatePublicReservation(response, body) {
  const adminResult = await query(
    `SELECT id, role
     FROM users
     WHERE role = 'admin' AND active = TRUE
     ORDER BY id ASC
     LIMIT 1`
  )

  if (adminResult.rowCount === 0) {
    return sendJson(response, 500, {
      error: 'No hay administrador activo para registrar la reservacion.',
    })
  }

  return handleCreateReservation(
    response,
    {
      ...body,
      rpUserId: null,
      status: 'pending',
      notes: cleanText(body.notes)
        ? `[WEB] ${cleanText(body.notes)}`
        : '[WEB] Reserva enviada por cliente.',
    },
    adminResult.rows[0]
  )
}

async function handleUpdateReservation(response, id, body, currentUser) {
  const existingResult = await query(
    `SELECT *
     FROM reservations
     WHERE id = $1
       AND ($2::text = 'admin' OR created_by = $3 OR rp_user_id = $3)
     LIMIT 1`,
    [id, currentUser.role, currentUser.id]
  )

  if (existingResult.rowCount === 0) return forbidden(response)

  const existing = existingResult.rows[0]
  const onlyStatus =
    Object.keys(body).length === 1 &&
    Object.prototype.hasOwnProperty.call(body, 'status')

  if (onlyStatus) {
    const status = cleanText(body.status)

    if (!allowedReservationStatuses.has(status)) {
      return badRequest(response, 'Estado invalido.')
    }

    const result = await query(
      `UPDATE reservations
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    )

    return ok(response, { reservation: result.rows[0] })
  }

  const { reservation, errors } = validateReservation(
    {
      customerName: body.customerName ?? existing.customer_name,
      customerPhone: body.customerPhone ?? existing.customer_phone,
      customerEmail: body.customerEmail ?? existing.customer_email ?? '',
      eventName: body.eventName ?? existing.event_name,
      reservationDate:
        body.reservationDate ?? toStoredDateInput(existing.reservation_date),
      reservationTime: body.reservationTime ?? existing.reservation_time,
      tableType: body.tableType ?? existing.table_type,
      peopleCount: body.peopleCount ?? existing.people_count,
      reservationCount: body.reservationCount ?? existing.reservation_count,
      notes: body.notes ?? existing.notes ?? '',
      status: body.status ?? existing.status,
    },
    { allowPastDate: true }
  )

  if (Object.keys(errors).length > 0) {
    return badRequest(response, 'Revisa los datos de la reservacion.', errors)
  }

  const duplicateResult = await query(
    `SELECT id
     FROM reservations
     WHERE id <> $1
       AND LOWER(customer_name) = LOWER($2)
       AND status <> 'cancelled'
     LIMIT 1`,
    [id, reservation.customerName]
  )

  if (duplicateResult.rowCount > 0 && reservation.status !== 'cancelled') {
    return badRequest(response, 'Ese nombre ya tiene una reservacion registrada.', {
      customerName: 'Ese nombre ya tiene una reservacion registrada.',
    })
  }

  let rpUserId = existing.rp_user_id

  if (currentUser.role === 'admin') {
    if (Object.prototype.hasOwnProperty.call(body, 'rpUserId')) {
      if (body.rpUserId) {
        const rpResult = await query(
          `SELECT id FROM users WHERE id = $1 AND role = 'rp' AND active = TRUE`,
          [body.rpUserId]
        )

        if (rpResult.rowCount === 0) {
          return badRequest(response, 'El RP seleccionado no existe o esta inactivo.')
        }

        rpUserId = Number(body.rpUserId)
      } else {
        rpUserId = null
      }
    }
  } else if (existing.rp_user_id === null) {
    rpUserId = currentUser.id
  }

  const result = await query(
    `UPDATE reservations
     SET rp_user_id = $1,
         customer_name = $2,
         customer_phone = $3,
         customer_email = $4,
         event_name = $5,
         reservation_date = $6,
         reservation_time = $7,
         table_type = $8,
         people_count = $9,
         reservation_count = $10,
         notes = $11,
         status = $12,
         updated_at = NOW()
     WHERE id = $13
     RETURNING *`,
    [
      rpUserId,
      reservation.customerName,
      reservation.customerPhone.replace(/\D/g, ''),
      reservation.customerEmail || existing.customer_email || null,
      reservation.eventName,
      reservation.reservationDate,
      reservation.reservationTime,
      reservation.tableType,
      reservation.peopleCount,
      reservation.reservationCount,
      reservation.notes || null,
      reservation.status,
      id,
    ]
  )

  ok(response, { reservation: result.rows[0] })
}

async function handleDeleteAllReservations(response) {
  const result = await query('DELETE FROM reservations RETURNING id')
  ok(response, { success: true, deleted: result.rowCount })
}

async function handleDeleteReservation(response, id) {
  const result = await query('DELETE FROM reservations WHERE id = $1 RETURNING id', [
    id,
  ])

  if (result.rowCount === 0) return badRequest(response, 'Reservacion no encontrada.')
  ok(response, { success: true })
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`)
  const pathname = url.pathname
  const method = request.method || 'GET'

  if (!pathname.startsWith('/api')) {
    return serveFrontend(request, response, pathname)
  }

  if (method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    })
    response.end()
    return
  }

  if (pathname === '/api/health') {
    return ok(response, { ok: true, service: 'blackout-api' })
  }

  const body = ['POST', 'PUT', 'PATCH'].includes(method)
    ? await readJson(request)
    : {}

  if (pathname === '/api/auth/login' && method === 'POST') {
    return handleLogin(response, body)
  }

  if (pathname === '/api/auth/recovery/admins' && method === 'GET') {
    const admins = await listRecoveryAdmins()
    return ok(response, { admins: admins.map(publicRecoveryAdmin) })
  }

  if (pathname === '/api/auth/recovery/request' && method === 'POST') {
    return handleRequestPasswordRecovery(response, body)
  }

  if (pathname === '/api/auth/recovery/confirm' && method === 'POST') {
    return handleConfirmPasswordRecovery(response, body)
  }

  if (pathname === '/api/public/reservations' && method === 'POST') {
    return handleCreatePublicReservation(response, body)
  }

  const currentUser = await getUserFromRequest(request)

  if (pathname === '/api/auth/me' && method === 'GET') {
    if (!currentUser) return unauthorized(response)
    return ok(response, { user: publicUser(currentUser) })
  }

  if (pathname === '/api/content' && method === 'GET') {
    const result = await query(
      `SELECT section_key, title, payload, updated_at
       FROM content_sections
       ORDER BY section_key`
    )
    return ok(response, { sections: result.rows })
  }

  const contentMatch = pathname.match(/^\/api\/content\/([\w-]+)$/)
  if (contentMatch && method === 'GET') {
    const result = await query(
      `SELECT section_key, title, payload, updated_at
       FROM content_sections
       WHERE section_key = $1`,
      [contentMatch[1]]
    )
    return ok(response, { section: result.rows[0] || null })
  }

  if (!currentUser) return unauthorized(response)

  if (pathname === '/api/users' && method === 'GET') {
    if (!requireRole(currentUser, ['admin'])) return forbidden(response)
    const result = await query(
      `SELECT id, username, display_name, role, active, email, created_at
       FROM users
       WHERE active = TRUE
       ORDER BY created_at DESC`
    )
    return ok(response, { users: result.rows.map(publicUser) })
  }

  if (pathname === '/api/users' && method === 'POST') {
    if (!requireRole(currentUser, ['admin'])) return forbidden(response)
    return handleCreateUser(response, body, currentUser)
  }

  if (pathname === '/api/users/verification-code' && method === 'POST') {
    if (!requireRole(currentUser, ['admin'])) return forbidden(response)
    return handleRequestUserVerificationCode(response, body, currentUser)
  }

  const userMatch = pathname.match(/^\/api\/users\/(\d+)$/)
  if (userMatch && method === 'PATCH') {
    if (!requireRole(currentUser, ['admin'])) return forbidden(response)
    return handleUpdateUser(response, userMatch[1], body, currentUser)
  }

  if (userMatch && method === 'DELETE') {
    if (!requireRole(currentUser, ['admin'])) return forbidden(response)
    return handleDeleteUser(response, userMatch[1], currentUser)
  }

  if (pathname === '/api/rps' && method === 'GET') {
    if (!requireRole(currentUser, ['admin'])) return forbidden(response)
    const result = await query(
      `SELECT id, username, display_name, role, active, email, created_at
       FROM users
       WHERE role = 'rp' AND active = TRUE
       ORDER BY display_name`
    )
    return ok(response, { rps: result.rows.map(publicUser) })
  }

  if (pathname === '/api/reservations' && method === 'GET') {
    const isAdmin = currentUser.role === 'admin'
    const result = await query(
      `SELECT r.*,
              creator.display_name AS created_by_name,
              rp.display_name AS rp_name
       FROM reservations r
       JOIN users creator ON creator.id = r.created_by
       LEFT JOIN users rp ON rp.id = r.rp_user_id
       WHERE ($1::boolean = TRUE OR r.created_by = $2 OR r.rp_user_id = $2)
       ORDER BY r.created_at DESC`,
      [isAdmin, currentUser.id]
    )
    return ok(response, { reservations: result.rows })
  }

  if (pathname === '/api/reservations' && method === 'POST') {
    return handleCreateReservation(response, body, currentUser)
  }

  if (pathname === '/api/reservations' && method === 'DELETE') {
    if (!requireRole(currentUser, ['admin'])) return forbidden(response)
    return handleDeleteAllReservations(response)
  }

  const reservationMatch = pathname.match(/^\/api\/reservations\/(\d+)$/)
  if (reservationMatch && method === 'PATCH') {
    return handleUpdateReservation(response, reservationMatch[1], body, currentUser)
  }

  if (reservationMatch && method === 'DELETE') {
    if (!requireRole(currentUser, ['admin'])) return forbidden(response)
    return handleDeleteReservation(response, reservationMatch[1])
  }

  if (pathname === '/api/reports/rp-reservations' && method === 'GET') {
    if (!requireRole(currentUser, ['admin'])) return forbidden(response)
    const result = await query(`
      SELECT u.id,
             u.display_name,
             u.username,
             COUNT(r.id)::int AS reservation_records,
             COALESCE(SUM(r.reservation_count), 0)::int AS total_reservations,
             COALESCE(SUM(r.people_count), 0)::int AS total_people,
             MAX(r.created_at) AS last_reservation_at
      FROM users u
      LEFT JOIN reservations r ON r.rp_user_id = u.id
      WHERE u.role = 'rp' AND u.active = TRUE
      GROUP BY u.id
      ORDER BY total_reservations DESC, u.display_name ASC
    `)
    return ok(response, { report: result.rows })
  }

  if (pathname === '/api/admin/demo-data' && method === 'POST') {
    if (!requireRole(currentUser, ['admin'])) return forbidden(response)
    return handleSeedDemoData(response, currentUser)
  }

  const adminContentMatch = pathname.match(/^\/api\/admin\/content\/([\w-]+)$/)
  if (adminContentMatch && method === 'PUT') {
    if (!requireRole(currentUser, ['admin'])) return forbidden(response)

    const title = cleanText(body.title) || adminContentMatch[1]
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {}

    const result = await query(
      `INSERT INTO content_sections (section_key, title, payload, updated_by, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, NOW())
       ON CONFLICT (section_key)
       DO UPDATE SET title = EXCLUDED.title,
                     payload = EXCLUDED.payload,
                     updated_by = EXCLUDED.updated_by,
                     updated_at = NOW()
       RETURNING section_key, title, payload, updated_at`,
      [adminContentMatch[1], title, JSON.stringify(payload), currentUser.id]
    )
    return ok(response, { section: result.rows[0] })
  }

  sendJson(response, 404, { error: 'Ruta no encontrada' })
}

await initializeDatabase()

createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error)
    sendJson(response, 500, { error: 'Error interno del servidor' })
  })
}).listen(port, () => {
  console.log(`[backend] Blackout API escuchando en http://localhost:${port}`)
})
