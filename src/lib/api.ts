export type UserRole = 'admin' | 'rp'

export type AuthUser = {
  id: number
  username: string
  displayName: string
  role: UserRole
  active: boolean
  createdAt?: string
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'

export type Reservation = {
  id: number
  created_by: number
  rp_user_id: number | null
  customer_name: string
  customer_phone: string
  customer_email: string | null
  event_name: string
  reservation_date: string
  reservation_time: string
  table_type: string
  people_count: number
  reservation_count: number
  notes: string | null
  status: ReservationStatus
  created_at: string
  created_by_name?: string
  rp_name?: string | null
}

export type RpReport = {
  id: number
  display_name: string
  username: string
  reservation_records: number
  total_reservations: number
  total_people: number
  last_reservation_at: string | null
}

export type ContentSection = {
  section_key: string
  title: string
  payload: Record<string, unknown>
  updated_at: string
}

export class ApiError extends Error {
  details?: Record<string, string>

  constructor(message: string, details?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.details = details
  }
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new ApiError(data.error || 'Error de conexion con el servidor.', data.details)
  }

  return data
}

export const api = {
  login(username: string, password: string) {
    return apiRequest<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },
  requestAdminPasswordRecovery(email: string) {
    return apiRequest<{ success: true; message: string; resetCode?: string }>(
      '/auth/recovery/request',
      { method: 'POST', body: JSON.stringify({ email }) }
    )
  },
  confirmAdminPasswordRecovery(
    email: string,
    code: string,
    password: string
  ) {
    return apiRequest<{ success: true; message: string }>(
      '/auth/recovery/confirm',
      { method: 'POST', body: JSON.stringify({ email, code, password }) }
    )
  },
  me(token: string) {
    return apiRequest<{ user: AuthUser }>('/auth/me', {}, token)
  },
  users(token: string) {
    return apiRequest<{ users: AuthUser[] }>('/users', {}, token)
  },
  createUser(
    token: string,
    payload: {
      username: string
      displayName: string
      role: UserRole
      password: string
    }
  ) {
    return apiRequest<{ user: AuthUser }>(
      '/users',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    )
  },
  updateUser(
    token: string,
    userId: number,
    payload: {
      displayName: string
      role: UserRole
      active: boolean
      password?: string
    }
  ) {
    return apiRequest<{ success: true }>(
      `/users/${userId}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      token
    )
  },
  deleteUser(token: string, userId: number) {
    return apiRequest<{ success: true }>(
      `/users/${userId}`,
      { method: 'DELETE' },
      token
    )
  },
  rps(token: string) {
    return apiRequest<{ rps: AuthUser[] }>('/rps', {}, token)
  },
  reservations(token: string) {
    return apiRequest<{ reservations: Reservation[] }>('/reservations', {}, token)
  },
  createReservation(
    token: string,
    payload: {
      customerName: string
      customerPhone: string
      customerEmail?: string
      eventName: string
      reservationDate: string
      reservationTime: string
      tableType: string
      peopleCount: number
      reservationCount: number
      notes: string
      rpUserId?: number
    }
  ) {
    return apiRequest<{ reservation: Reservation }>(
      '/reservations',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    )
  },
  createPublicReservation(payload: {
    customerName: string
    customerPhone: string
    customerEmail?: string
    eventName: string
    reservationDate: string
    reservationTime: string
    tableType: string
    peopleCount: number
    reservationCount: number
    notes: string
  }) {
    return apiRequest<{ reservation: Reservation }>(
      '/public/reservations',
      { method: 'POST', body: JSON.stringify(payload) }
    )
  },
  updateReservationStatus(
    token: string,
    reservationId: number,
    status: ReservationStatus
  ) {
    return apiRequest<{ reservation: Reservation }>(
      `/reservations/${reservationId}`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token
    )
  },
  deleteReservation(token: string, reservationId: number) {
    return apiRequest<{ success: true }>(
      `/reservations/${reservationId}`,
      { method: 'DELETE' },
      token
    )
  },
  rpReport(token: string) {
    return apiRequest<{ report: RpReport[] }>(
      '/reports/rp-reservations',
      {},
      token
    )
  },
  seedDemoData(token: string) {
    return apiRequest<{
      success: boolean
      rpUsers: number
      reservations: number
      rpPassword: string
    }>(
      '/admin/demo-data',
      { method: 'POST', body: JSON.stringify({}) },
      token
    )
  },
  content(token: string) {
    return apiRequest<{ sections: ContentSection[] }>('/content', {}, token)
  },
  saveContent(token: string, key: string, title: string, payload: object) {
    return apiRequest<{ section: ContentSection }>(
      `/admin/content/${key}`,
      { method: 'PUT', body: JSON.stringify({ title, payload }) },
      token
    )
  },
}
