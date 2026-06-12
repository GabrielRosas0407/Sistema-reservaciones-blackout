export const peopleOptions = ['2', '3', '4', '5', '7', '10']

export const timeOptions = [
  { label: '9:00 PM', value: '21:00' },
  { label: '10:00 PM', value: '22:00' },
  { label: '11:00 PM', value: '23:00' },
]

export const tableOptions = [
  { label: 'Acceso general', value: 'Acceso general' },
  { label: 'Mesa estandar', value: 'Mesa estandar' },
  { label: 'Mesa VIP', value: 'Mesa VIP' },
]

export const eventOptions = [{ label: 'Evento privado', value: 'Evento privado' }]

export function toDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null

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

export function isAllowedReservationDate(value: string) {
  const date = parseDateInput(value)
  if (!date) return false

  const today = parseDateInput(toDateInputValue())
  if (today && date < today) return false

  const day = date.getDay()
  return day === 5 || day === 6 || day === 0
}

export function getReservationDateError(value: string) {
  if (!value) return 'Selecciona una fecha.'
  const date = parseDateInput(value)
  if (!date) return 'Selecciona una fecha valida.'

  const today = parseDateInput(toDateInputValue())
  if (today && date < today) return 'La fecha no puede ser anterior a hoy.'

  if (!isAllowedReservationDate(value)) {
    return 'Solo se permiten reservaciones en viernes, sabado o domingo.'
  }

  return ''
}

export function formatReservationDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha'

  const rawDate = String(value).slice(0, 10)
  const date = parseDateInput(rawDate)
  if (!date) return String(value)

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatReservationTime(value: string | null | undefined) {
  if (!value) return 'Sin hora'

  const time = timeOptions.find((option) => option.value === value)
  if (time) return time.label

  const [rawHour, rawMinute = '00'] = String(value).split(':')
  const hour = Number(rawHour)
  if (Number.isNaN(hour)) return String(value)

  const period = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${rawMinute.padStart(2, '0')} ${period}`
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 10)
}
