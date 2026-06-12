import './env.js'

function assertMailConfig() {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('Falta BREVO_API_KEY')
  }

  if (!process.env.BREVO_SENDER_EMAIL) {
    throw new Error('Falta BREVO_SENDER_EMAIL')
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function codeBox(code) {
  return `
    <div style="margin:18px 0;padding:18px;border-radius:14px;background:#111827;color:#f9a8d4;font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;">
      ${escapeHtml(code)}
    </div>
  `
}

function reservationDetails(reservation) {
  return `
    <div style="margin:16px 0;padding:14px;border:1px solid #2f2f46;border-radius:14px;background:#0f0f18;">
      <p><strong>Cliente:</strong> ${escapeHtml(reservation.customer_name)}</p>
      <p><strong>Telefono:</strong> ${escapeHtml(reservation.customer_phone)}</p>
      <p><strong>Evento:</strong> ${escapeHtml(reservation.event_name)}</p>
      <p><strong>Fecha:</strong> ${escapeHtml(reservation.reservation_date)}</p>
      <p><strong>Hora:</strong> ${escapeHtml(reservation.reservation_time)}</p>
      <p><strong>Mesa:</strong> ${escapeHtml(reservation.table_type)}</p>
      <p><strong>Personas:</strong> ${escapeHtml(reservation.people_count)}</p>
      <p><strong>Reservaciones:</strong> ${escapeHtml(reservation.reservation_count)}</p>
    </div>
  `
}

async function sendBrevoEmail({ to, name, subject, htmlContent }) {
  assertMailConfig()

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME || 'Blackout Reservaciones',
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to, name: name || to }],
      subject,
      htmlContent,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Brevo error ${response.status}: ${text || response.statusText}`)
  }
}

export async function sendPasswordRecoveryEmail({ to, name, code }) {
  await sendBrevoEmail({
    to,
    name,
    subject: 'Codigo de recuperacion - Blackout Reservaciones',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:22px;background:#08080c;color:#f8fafc;">
        <h2 style="color:#f9a8d4;">Recuperacion de acceso</h2>
        <p>Hola ${escapeHtml(name || 'admin')}, usa este codigo para cambiar tu password.</p>
        ${codeBox(code)}
        <p>Este codigo vence en <strong>15 minutos</strong>.</p>
        <p style="color:#94a3b8;font-size:13px;">Si no solicitaste este cambio, ignora este correo.</p>
      </div>
    `,
  })
}

export async function sendUserVerificationEmail({ to, name, code, role }) {
  await sendBrevoEmail({
    to,
    name,
    subject: 'Codigo de validacion de acceso - Blackout',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:22px;background:#08080c;color:#f8fafc;">
        <h2 style="color:#f9a8d4;">Validacion de acceso</h2>
        <p>Hola ${escapeHtml(name || to)}, usa este codigo para terminar de crear tu acceso ${escapeHtml(String(role || '').toUpperCase())}.</p>
        ${codeBox(code)}
        <p>Este codigo vence en <strong>10 minutos</strong>.</p>
        <p style="color:#94a3b8;font-size:13px;">Si no esperabas este acceso, ignora este correo.</p>
      </div>
    `,
  })
}

export async function sendReservationReceivedEmail({ to, name, reservation }) {
  await sendBrevoEmail({
    to,
    name,
    subject: 'Recibimos tu reservacion - Blackout',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:22px;background:#08080c;color:#f8fafc;">
        <h2 style="color:#f9a8d4;">Reservacion recibida</h2>
        <p>Hola ${escapeHtml(name || reservation.customer_name)}, recibimos tu solicitud. Nuestro equipo la revisara y confirmara el estado.</p>
        ${reservationDetails(reservation)}
        <p style="color:#94a3b8;font-size:13px;">Gracias por elegir Blackout.</p>
      </div>
    `,
  })
}

export async function sendAdminReservationEmail({ to, reservation }) {
  await sendBrevoEmail({
    to,
    name: 'Administrador Blackout',
    subject: 'Nueva reservacion web - Blackout',
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:22px;background:#08080c;color:#f8fafc;">
        <h2 style="color:#f9a8d4;">Nueva reservacion web</h2>
        <p>Entro una nueva reservacion desde la pagina.</p>
        ${reservationDetails(reservation)}
      </div>
    `,
  })
}
