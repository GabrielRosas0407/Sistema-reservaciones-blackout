import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  LogOut,
  Pencil,
  Printer,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import Header from '../components/header'
import { ApiError, api } from '../lib/api'
import {
  eventOptions,
  formatReservationDate,
  formatReservationTime,
  getReservationDateError,
  normalizePhone,
  peopleOptions,
  tableOptions,
  timeOptions,
  toDateInputValue,
} from '../lib/reservationOptions'
import type {
  AuthUser,
  RecoveryAdmin,
  Reservation,
  ReservationStatus,
  RpReport,
  UserRole,
} from '../lib/api'

type AdminTab = 'dashboard' | 'reservations' | 'rps' | 'users'

type ReservationForm = {
  customerName: string
  customerPhone: string
  eventName: string
  reservationDate: string
  reservationTime: string
  tableType: string
  peopleCount: string
  reservationCount: string
  notes: string
  rpUserId: string
}

type ReservationFormErrors = Partial<Record<keyof ReservationForm, string>>
type UserFormErrors = Partial<Record<keyof UserForm, string>>

type UserForm = {
  username: string
  displayName: string
  role: UserRole
  email: string
  password: string
  verificationCode: string
}

const storageKey = 'blackout_admin_session'
const minReservationDate = toDateInputValue()
const alertDurationMs = 4000

const emptyReservationForm: ReservationForm = {
  customerName: '',
  customerPhone: '',
  eventName: 'Evento privado',
  reservationDate: '',
  reservationTime: '',
  tableType: 'Acceso general',
  peopleCount: '2',
  reservationCount: '1',
  notes: '',
  rpUserId: '',
}

const emptyUserForm: UserForm = {
  username: '',
  displayName: '',
  role: 'rp',
  email: '',
  password: '',
  verificationCode: '',
}

const statusLabels: Record<ReservationStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
}

function scrollToFirstAdminError() {
  window.setTimeout(() => {
    document
      .querySelector('[data-error="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 50)
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function useAutoDismissMessage(
  message: string,
  setMessage: Dispatch<SetStateAction<string>>
) {
  useEffect(() => {
    if (!message) return

    const timeoutId = window.setTimeout(() => {
      setMessage('')
    }, alertDurationMs)

    return () => window.clearTimeout(timeoutId)
  }, [message, setMessage])
}

function Admin() {
  const [token, setToken] = useState('')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBooting, setIsBooting] = useState(true)

  useEffect(() => {
    localStorage.removeItem(storageKey)
    const saved = sessionStorage.getItem(storageKey)

    if (!saved) {
      setIsBooting(false)
      return
    }

    const session = JSON.parse(saved) as { token: string; user: AuthUser }
    setToken(session.token)
    setUser(session.user)

    api
      .me(session.token)
      .then((result) => setUser(result.user))
      .catch(() => {
        sessionStorage.removeItem(storageKey)
        setToken('')
        setUser(null)
      })
      .finally(() => setIsBooting(false))
  }, [])

  function handleSession(nextToken: string, nextUser: AuthUser) {
    setToken(nextToken)
    setUser(nextUser)
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ token: nextToken, user: nextUser })
    )
  }

  function logout() {
    sessionStorage.removeItem(storageKey)
    localStorage.removeItem(storageKey)
    setToken('')
    setUser(null)
  }

  if (isBooting) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Header />
        <section className="px-6 py-14 md:px-10 xl:px-14">
          <p className="text-pink-300">Cargando panel...</p>
        </section>
      </main>
    )
  }

  if (!token || !user) {
    return <AdminLogin onLogin={handleSession} />
  }

  return <AdminPanel token={token} user={user} onLogout={logout} />
}

function AdminLogin({
  onLogin,
}: {
  onLogin: (token: string, user: AuthUser) => void
}) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryAdmins, setRecoveryAdmins] = useState<RecoveryAdmin[]>([])
  const [recoveryAdminId, setRecoveryAdminId] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const [recoveryError, setRecoveryError] = useState('')
  const [isRecovering, setIsRecovering] = useState(false)
  const [isLoadingRecoveryAdmins, setIsLoadingRecoveryAdmins] = useState(false)

  useAutoDismissMessage(error, setError)
  useAutoDismissMessage(recoveryMessage, setRecoveryMessage)
  useAutoDismissMessage(recoveryError, setRecoveryError)

  function clearLoginMessages() {
    setError('')
    setRecoveryMessage('')
    setRecoveryError('')
  }

  useEffect(() => {
    if (!showRecovery) return

    let isActive = true
    setIsLoadingRecoveryAdmins(true)
    setRecoveryError('')

    api
      .recoveryAdmins()
      .then((result) => {
        if (!isActive) return
        setRecoveryAdmins(result.admins)
        setRecoveryAdminId((current) => current || String(result.admins[0]?.id || ''))
      })
      .catch((apiError) => {
        if (!isActive) return
        setRecoveryError(
          apiError instanceof Error
            ? apiError.message
            : 'No se pudieron cargar los administradores.'
        )
      })
      .finally(() => {
        if (isActive) setIsLoadingRecoveryAdmins(false)
      })

    return () => {
      isActive = false
    }
  }, [showRecovery])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await api.login(username, password)
      onLogin(result.token, result.user)
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Error al entrar.')
      scrollToFirstAdminError()
    } finally {
      setIsLoading(false)
    }
  }

  async function requestRecovery() {
    setRecoveryError('')
    setRecoveryMessage('')

    const adminId = Number(recoveryAdminId)
    if (!adminId) {
      setRecoveryError('Selecciona un administrador.')
      scrollToFirstAdminError()
      return
    }

    setIsRecovering(true)

    try {
      const result = await api.requestAdminPasswordRecovery(adminId)
      setRecoveryMessage(
        result.resetCode
          ? `Correo verificado. Codigo temporal local: ${result.resetCode}`
          : result.message
      )
    } catch (apiError) {
      setRecoveryError(
        apiError instanceof Error
          ? apiError.message
          : 'No se pudo iniciar la recuperacion.'
      )
      scrollToFirstAdminError()
    } finally {
      setIsRecovering(false)
    }
  }

  async function confirmRecovery() {
    setRecoveryError('')
    setRecoveryMessage('')

    const adminId = Number(recoveryAdminId)
    if (!adminId) {
      setRecoveryError('Selecciona un administrador.')
      scrollToFirstAdminError()
      return
    }

    setIsRecovering(true)

    try {
      const result = await api.confirmAdminPasswordRecovery(
        adminId,
        recoveryCode,
        recoveryPassword
      )
      setRecoveryMessage(result.message)
      setRecoveryCode('')
      setRecoveryPassword('')
      setShowRecovery(false)
    } catch (apiError) {
      setRecoveryError(
        apiError instanceof Error
          ? apiError.message
          : 'No se pudo actualizar el password.'
      )
      scrollToFirstAdminError()
    } finally {
      setIsRecovering(false)
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />

      <section className="relative flex min-h-[calc(100svh-7rem)] items-center justify-center overflow-hidden px-6 py-12">
        <img
          src="/ESCENARIO2.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-38"
        />
        <div className="absolute inset-0 bg-black/72" />

        <form
          onSubmit={submit}
          className="relative w-full max-w-md rounded-[28px] border border-pink-500/40 bg-zinc-950/86 p-6 shadow-[0_0_36px_rgba(236,72,153,0.24)] md:p-8"
        >
          <div className="mb-7 text-center">
            <Shield
              size={44}
              className="mx-auto text-pink-300 drop-shadow-[0_0_16px_rgba(236,72,153,0.8)]"
            />
            <h1 className="mt-4 text-3xl font-black uppercase tracking-wide text-white">
              Panel Blackout
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Acceso para administrador y RP.
            </p>
          </div>

          <Input
            label="Usuario"
            value={username}
            onChange={(value) => {
              setUsername(value)
              clearLoginMessages()
            }}
            autoComplete="username"
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(value) => {
                setPassword(value)
                clearLoginMessages()
              }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'}
              className="absolute right-3 top-9 rounded-lg border border-white/10 bg-black/70 p-2 text-pink-200 transition hover:border-pink-500 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <FieldError message={error} />
          {recoveryMessage && (
            <div className="mt-4 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {recoveryMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-xl border border-pink-500 bg-black/70 px-6 py-4 font-black uppercase tracking-wide text-pink-200 shadow-[0_0_22px_rgba(236,72,153,0.45)] transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Entrando...' : 'Iniciar sesion'}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowRecovery((current) => !current)
              clearLoginMessages()
            }}
            className="mt-4 w-full text-sm font-bold uppercase tracking-wide text-white/55 transition hover:text-pink-200"
          >
            Recuperar password de administrador
          </button>

          {showRecovery && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="text-sm uppercase tracking-wide text-pink-200">
                Solo administrador con correo verificado
              </p>
              <div className="mt-4 grid gap-3">
                <label data-error={recoveryError ? 'true' : undefined}>
                  <span className="mb-2 block text-sm uppercase tracking-wide text-white/55">
                    Administrador
                  </span>
                  <select
                    value={recoveryAdminId}
                    disabled={isLoadingRecoveryAdmins || recoveryAdmins.length === 0}
                    onChange={(event) => {
                      setRecoveryAdminId(event.target.value)
                      clearLoginMessages()
                    }}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {recoveryAdmins.length === 0 && (
                      <option value="">
                        {isLoadingRecoveryAdmins
                          ? 'Cargando administradores...'
                          : 'Sin administradores disponibles'}
                      </option>
                    )}
                    {recoveryAdmins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.displayName} (@{admin.username}) - {admin.emailLabel}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={
                    isRecovering ||
                    isLoadingRecoveryAdmins ||
                    recoveryAdmins.length === 0
                  }
                  onClick={requestRecovery}
                  className="rounded-xl border border-cyan-400/45 bg-cyan-500/10 px-4 py-3 text-sm font-black uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Solicitar codigo
                </button>
                <Input
                  label="Codigo"
                  value={recoveryCode}
                  onChange={(value) => {
                    setRecoveryCode(value)
                    clearLoginMessages()
                  }}
                />
                <div className="relative">
                  <Input
                    label="Nuevo password"
                    type={showRecoveryPassword ? 'text' : 'password'}
                    value={recoveryPassword}
                    onChange={(value) => {
                      setRecoveryPassword(value)
                      clearLoginMessages()
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowRecoveryPassword((current) => !current)
                    }
                    aria-label={
                      showRecoveryPassword
                        ? 'Ocultar nuevo password'
                        : 'Mostrar nuevo password'
                    }
                    className="absolute right-3 top-9 rounded-lg border border-white/10 bg-black/70 p-2 text-pink-200 transition hover:border-pink-500 hover:text-white"
                  >
                    {showRecoveryPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                <FieldError message={recoveryError} />
                <button
                  type="button"
                  disabled={isRecovering}
                  onClick={confirmRecovery}
                  className="rounded-xl border border-pink-500 bg-black/70 px-4 py-3 text-sm font-black uppercase tracking-wide text-pink-200 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Cambiar password
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </main>
  )
}

function AdminPanel({
  token,
  user,
  onLogout,
}: {
  token: string
  user: AuthUser
  onLogout: () => void
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])
  const [rps, setRps] = useState<AuthUser[]>([])
  const [report, setReport] = useState<RpReport[]>([])
  const [message, setMessage] = useState('')

  const isAdmin = user.role === 'admin'

  useAutoDismissMessage(message, setMessage)

  const tabs = useMemo(
    () =>
      [
        { id: 'dashboard', label: 'Resumen', icon: BarChart3, adminOnly: false },
        {
          id: 'reservations',
          label: 'Reservas',
          icon: CalendarDays,
          adminOnly: false,
        },
        { id: 'rps', label: 'RPs', icon: Users, adminOnly: true },
        { id: 'users', label: 'Usuarios', icon: UserPlus, adminOnly: true },
      ].filter((tab) => isAdmin || !tab.adminOnly) as {
        id: AdminTab
        label: string
        icon: typeof BarChart3
        adminOnly: boolean
      }[],
    [isAdmin]
  )

  async function refreshData() {
    const reservationResult = await api.reservations(token)
    setReservations(reservationResult.reservations)

    if (isAdmin) {
      const [usersResult, rpsResult, reportResult] = await Promise.all([
        api.users(token),
        api.rps(token),
        api.rpReport(token),
      ])

      setUsers(usersResult.users)
      setRps(rpsResult.rps)
      setReport(reportResult.report)
    }
  }

  useEffect(() => {
    refreshData().catch((error) =>
      setMessage(error instanceof Error ? error.message : 'Error al cargar.')
    )
  }, [token, isAdmin])

  const totalCredits = reservations.reduce(
    (sum, reservation) => sum + Number(reservation.reservation_count || 0),
    0
  )

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />

      <section className="px-6 py-8 md:px-10 xl:px-14">
        <div className="mx-auto max-w-[1700px]">
          <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.34em] text-pink-400">
                Panel {user.role === 'admin' ? 'Admin' : 'RP'}
              </p>
              <h1 className="mt-2 text-4xl font-black uppercase text-white md:text-6xl">
                Blackout Control
              </h1>
              <p className="mt-2 text-white/62">
                Sesion iniciada como {user.displayName}.
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-4 font-black uppercase tracking-wide text-white/70 transition hover:border-pink-500/55 hover:bg-pink-500/10 hover:text-white sm:w-auto"
            >
              Salir
              <LogOut size={20} />
            </button>
          </div>

          <div className="grid gap-7 xl:grid-cols-[260px_1fr]">
            <aside className="rounded-[24px] border border-white/10 bg-zinc-950/80 p-3 shadow-[0_0_28px_rgba(0,0,0,0.62)]">
              <nav className="grid gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left font-black uppercase tracking-wide transition ${
                        isActive
                          ? 'bg-pink-500/15 text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.18)]'
                          : 'text-white/58 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon size={20} />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </aside>

            <section className="min-w-0">
              {message && (
                <div className="mb-5 rounded-xl border border-pink-500/35 bg-pink-500/10 px-4 py-3 text-pink-100">
                  {message}
                </div>
              )}

              {activeTab === 'dashboard' && (
                <Dashboard
                  user={user}
                  reservations={reservations}
                  totalCredits={totalCredits}
                  report={report}
                />
              )}
              {activeTab === 'reservations' && (
                <ReservationsModule
                  token={token}
                  isAdmin={isAdmin}
                  rps={rps}
                  reservations={reservations}
                  onSaved={() => {
                    setMessage('Reservacion guardada.')
                    refreshData()
                  }}
                />
              )}
              {activeTab === 'rps' && isAdmin && (
                <RpReportModule report={report} reservations={reservations} />
              )}
              {activeTab === 'users' && isAdmin && (
                <UsersModule
                  token={token}
                  users={users}
                  currentUserId={user.id}
                  onSaved={() => {
                    setMessage('Usuario eliminado.')
                    refreshData()
                  }}
                />
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

function Dashboard({
  user,
  reservations,
  totalCredits,
  report,
}: {
  user: AuthUser
  reservations: Reservation[]
  totalCredits: number
  report: RpReport[]
}) {
  const activeReservations = reservations.filter(
    (reservation) => reservation.status !== 'cancelled'
  ).length
  const topRp = report[0]

  return (
    <div className="grid gap-5 md:grid-cols-3">
      <MetricCard title="Capturas" value={reservations.length} />
      <MetricCard title="Reservas acreditadas" value={totalCredits} />
      <MetricCard
        title={user.role === 'admin' ? 'Mejor RP' : 'Tu rol'}
        value={user.role === 'admin' ? topRp?.display_name || 'Sin datos' : 'RP'}
      />
      <div className="rounded-[24px] border border-white/10 bg-zinc-950/80 p-6 md:col-span-3">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mt-2 text-white/62">
              Hay {activeReservations} reservaciones activas registradas en el
              sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-zinc-950/80 p-6 shadow-[0_0_24px_rgba(0,0,0,0.62)]">
      <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/42">
        {title}
      </p>
      <p className="mt-3 text-4xl font-black uppercase text-pink-200">
        {value}
      </p>
    </article>
  )
}

function ReservationsModule({
  token,
  isAdmin,
  rps,
  reservations,
  onSaved,
}: {
  token: string
  isAdmin: boolean
  rps: AuthUser[]
  reservations: Reservation[]
  onSaved: () => void
}) {
  const [form, setForm] = useState<ReservationForm>(emptyReservationForm)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ReservationFormErrors>({})
  const [editingReservationId, setEditingReservationId] = useState<number | null>(
    null
  )
  const isEditing = editingReservationId !== null

  useAutoDismissMessage(error, setError)

  function startEdit(reservation: Reservation) {
    setEditingReservationId(reservation.id)
    setForm({
      customerName: reservation.customer_name,
      customerPhone: normalizePhone(reservation.customer_phone),
      eventName: reservation.event_name,
      reservationDate: String(reservation.reservation_date || '').slice(0, 10),
      reservationTime: reservation.reservation_time,
      tableType: reservation.table_type,
      peopleCount: String(reservation.people_count),
      reservationCount: String(reservation.reservation_count || 1),
      notes: reservation.notes || '',
      rpUserId: reservation.rp_user_id ? String(reservation.rp_user_id) : '',
    })
    setFieldErrors({})
    setError('')
    scrollToFirstAdminError()
  }

  function cancelEdit() {
    setEditingReservationId(null)
    setForm(emptyReservationForm)
    setFieldErrors({})
    setError('')
  }

  function updateField(name: keyof ReservationForm, value: string) {
    const nextValue = name === 'customerPhone' ? normalizePhone(value) : value
    setForm((current) => ({ ...current, [name]: nextValue }))
    setFieldErrors((current) => ({
      ...current,
      [name]:
        name === 'reservationDate' && nextValue
          ? getReservationDateError(nextValue)
          : '',
    }))
    setError('')
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    const nextErrors: ReservationFormErrors = {}

    if (form.customerName.trim().length < 3) {
      nextErrors.customerName = 'Escribe el nombre completo del cliente.'
    } else if (
      reservations.some(
        (reservation) =>
          reservation.id !== editingReservationId &&
          reservation.status !== 'cancelled' &&
          reservation.customer_name.trim().toLowerCase() ===
            form.customerName.trim().toLowerCase()
      )
    ) {
      nextErrors.customerName = 'Ese nombre ya tiene una reservacion registrada.'
    }

    if (form.customerPhone.length !== 10) {
      nextErrors.customerPhone = 'El telefono debe tener exactamente 10 digitos.'
    }

    const dateError = getReservationDateError(form.reservationDate)
    if (dateError) {
      if (!(isEditing && dateError === 'La fecha no puede ser anterior a hoy.')) {
        nextErrors.reservationDate = dateError
      }
    }

    if (!peopleOptions.includes(form.peopleCount)) {
      nextErrors.peopleCount = 'Selecciona 2, 3, 4, 5, 7 o 10 personas.'
    }

    if (!timeOptions.some((option) => option.value === form.reservationTime)) {
      nextErrors.reservationTime = 'Selecciona una hora valida.'
    }

    if (!tableOptions.some((option) => option.value === form.tableType)) {
      nextErrors.tableType = 'Selecciona un tipo de mesa valido.'
    }

    if (Object.values(nextErrors).some(Boolean)) {
      setFieldErrors(nextErrors)
      scrollToFirstAdminError()
      return
    }

    try {
      const payload = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        eventName: form.eventName,
        reservationDate: form.reservationDate,
        reservationTime: form.reservationTime,
        tableType: form.tableType,
        peopleCount: Number(form.peopleCount),
        reservationCount: Number(form.reservationCount || 1),
        notes: form.notes,
        rpUserId: form.rpUserId ? Number(form.rpUserId) : undefined,
      }

      if (isEditing && editingReservationId) {
        await api.updateReservation(token, editingReservationId, payload)
      } else {
        await api.createReservation(token, payload)
      }

      cancelEdit()
      onSaved()
    } catch (apiError) {
      if (apiError instanceof ApiError && apiError.details) {
        setFieldErrors({
          customerName: apiError.details.customerName,
          customerPhone: apiError.details.customerPhone,
          eventName: apiError.details.eventName,
          reservationDate: apiError.details.reservationDate,
          reservationTime: apiError.details.reservationTime,
          tableType: apiError.details.tableType,
          peopleCount: apiError.details.peopleCount,
        })
        scrollToFirstAdminError()
      }
      setError(apiError instanceof Error ? apiError.message : 'Error al guardar.')
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <form
        onSubmit={submit}
        className="rounded-[24px] border border-white/10 bg-zinc-950/82 p-5 shadow-[0_0_28px_rgba(0,0,0,0.62)] md:p-6"
      >
        <h2 className="text-2xl font-black uppercase text-pink-300">
          {isEditing ? 'Editar reservacion' : 'Nueva reservacion'}
        </h2>
        <div className="mt-5 grid gap-4">
          <Input
            label="Nombre cliente"
            value={form.customerName}
            error={fieldErrors.customerName}
            onChange={(value) => updateField('customerName', value)}
          />
          <Input
            label="Telefono"
            value={form.customerPhone}
            error={fieldErrors.customerPhone}
            maxLength={10}
            inputMode="numeric"
            onChange={(value) => updateField('customerPhone', value)}
          />
          <label>
            <span className="mb-2 block text-sm uppercase tracking-wide text-white/55">
              Evento
            </span>
            <select
              value={form.eventName}
              onChange={(event) => updateField('eventName', event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-pink-500"
            >
              {eventOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.eventName} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Fecha"
              type="date"
              min={isEditing ? undefined : minReservationDate}
              value={form.reservationDate}
              onChange={(value) => updateField('reservationDate', value)}
              error={fieldErrors.reservationDate}
            />
            <label>
              <span className="mb-2 block text-sm uppercase tracking-wide text-white/55">
                Hora
              </span>
              <select
                value={form.reservationTime}
                onChange={(event) =>
                  updateField('reservationTime', event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-pink-500"
              >
                <option value="">Selecciona una hora</option>
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError message={fieldErrors.reservationTime} />
            </label>
          </div>
          <div className="grid gap-4">
            <label>
              <span className="mb-2 block text-sm uppercase tracking-wide text-white/55">
                Personas
              </span>
              <select
                value={form.peopleCount}
                onChange={(event) => updateField('peopleCount', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-pink-500"
              >
                {peopleOptions.map((people) => (
                  <option key={people} value={people}>
                    {people} Personas
                  </option>
                ))}
              </select>
              <FieldError message={fieldErrors.peopleCount} />
            </label>
          </div>
          <label>
            <span className="mb-2 block text-sm uppercase tracking-wide text-white/55">
              Tipo de mesa
            </span>
            <select
              value={form.tableType}
              onChange={(event) => updateField('tableType', event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-pink-500"
            >
              {tableOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.tableType} />
          </label>
          {isAdmin && (
            <label>
              <span className="mb-2 block text-sm uppercase tracking-wide text-white/55">
                Acreditar a RP
              </span>
              <select
                value={form.rpUserId}
                onChange={(event) => updateField('rpUserId', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-pink-500"
              >
                <option value="">Reserva directa admin</option>
                {rps.map((rp) => (
                  <option key={rp.id} value={rp.id}>
                    {rp.displayName}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span className="mb-2 block text-sm uppercase tracking-wide text-white/55">
              Notas
            </span>
            <textarea
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-pink-500"
            />
          </label>
        </div>

        <FieldError message={error} />

        <button
          type="submit"
          className="mt-6 w-full rounded-xl border border-pink-500 bg-black/70 px-6 py-4 font-black uppercase tracking-wide text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.35)]"
        >
          {isEditing ? 'Guardar cambios' : 'Guardar reservacion'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={cancelEdit}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-black uppercase tracking-wide text-white/65 transition hover:border-pink-500/55 hover:text-white"
          >
            Cancelar edicion
          </button>
        )}
      </form>

      <ReservationList
        token={token}
        isAdmin={isAdmin}
        reservations={reservations}
        onEdit={startEdit}
        onChanged={onSaved}
      />
    </div>
  )
}

function ReservationList({
  token,
  isAdmin,
  reservations,
  onEdit,
  onChanged,
}: {
  token: string
  isAdmin: boolean
  reservations: Reservation[]
  onEdit: (reservation: Reservation) => void
  onChanged: () => void
}) {
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const visibleReservations = isExpanded ? reservations : reservations.slice(0, 4)

  async function updateStatus(id: number, status: ReservationStatus) {
    setUpdatingId(id)
    try {
      await api.updateReservationStatus(token, id, status)
      onChanged()
    } finally {
      setUpdatingId(null)
    }
  }

  async function deleteReservation(id: number) {
    if (!window.confirm('Eliminar esta reservacion?')) return

    setDeletingId(id)
    try {
      await api.deleteReservation(token, id)
      onChanged()
    } finally {
      setDeletingId(null)
    }
  }

  async function deleteAllReservations() {
    if (!window.confirm('Borrar TODAS las reservaciones del evento?')) return
    if (!window.confirm('Esta accion no se puede deshacer. Confirmas borrar todo?')) {
      return
    }

    setIsDeletingAll(true)
    try {
      await api.deleteAllReservations(token)
      onChanged()
    } finally {
      setIsDeletingAll(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-zinc-950/82 p-5 shadow-[0_0_28px_rgba(0,0,0,0.62)] md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase text-pink-300">
            Reservaciones
          </h2>
          <p className="mt-1 text-sm text-white/45">
            {reservations.length} registros en total.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {isAdmin && reservations.length > 0 && (
            <button
              type="button"
              disabled={isDeletingAll}
              onClick={deleteAllReservations}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-black uppercase tracking-wide text-red-100 transition hover:border-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Trash2 size={18} />
              Borrar todas
            </button>
          )}
          {reservations.length > 4 && (
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-wide text-pink-200 transition hover:border-pink-500/60 hover:bg-pink-500/10"
            >
              {isExpanded ? 'Contraer' : 'Ver todas'}
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>
      </div>
      <div className="mt-5 grid gap-4">
        {visibleReservations.map((reservation) => (
          <article
            key={reservation.id}
            className="rounded-2xl border border-white/10 bg-black/40 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-xl font-black uppercase text-white">
                  {reservation.customer_name}
                </h3>
                <p className="text-white/55">
                  {reservation.event_name} ·{' '}
                  {formatReservationDate(reservation.reservation_date)} ·{' '}
                  {formatReservationTime(reservation.reservation_time)}
                </p>
                <p className="mt-2 text-sm text-pink-200">
                  RP: {reservation.rp_name || 'Sin RP'} · Creditos:{' '}
                  {reservation.reservation_count}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <select
                  value={reservation.status}
                  disabled={updatingId === reservation.id}
                  onChange={(event) =>
                    updateStatus(
                      reservation.id,
                      event.target.value as ReservationStatus
                    )
                  }
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => onEdit(reservation)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white/75 transition hover:border-pink-500/60 hover:bg-pink-500/10 hover:text-white"
                >
                  <Pencil size={16} />
                  Editar
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    disabled={deletingId === reservation.id}
                    onClick={() => deleteReservation(reservation.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-100 transition hover:border-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
        {reservations.length === 0 && (
          <p className="text-white/55">Todavia no hay reservaciones.</p>
        )}
      </div>
    </div>
  )
}

function RpReportModule({
  report,
  reservations,
}: {
  report: RpReport[]
  reservations: Reservation[]
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-zinc-950/82 p-5 shadow-[0_0_28px_rgba(0,0,0,0.62)] md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase text-pink-300">
            Reservaciones por RP
          </h2>
          <p className="mt-1 text-white/55">
            Reporte listo para imprimir o guardar como PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={() => printRpReport(report, reservations)}
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-pink-500 bg-black/70 px-6 py-4 font-black uppercase tracking-wide text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.35)] transition hover:-translate-y-1 hover:text-white md:w-auto"
        >
          <Printer size={20} />
          Generar PDF
        </button>
      </div>
      <div className="mt-5 grid gap-4">
        {report.map((rp) => (
          <article
            key={rp.id}
            className="rounded-2xl border border-white/10 bg-black/40 p-4"
          >
            <h3 className="text-xl font-black uppercase text-white">
              {rp.display_name}
            </h3>
            <p className="text-white/55">@{rp.username}</p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <SmallStat label="Capturas" value={rp.reservation_records} />
              <SmallStat label="Reservas" value={rp.total_reservations} />
              <SmallStat label="Personas" value={rp.total_people} />
            </div>
          </article>
        ))}
        {report.length === 0 && (
          <p className="text-white/55">
            No hay RPs con reservaciones todavia. Carga datos de prueba desde
            Resumen o crea una reservacion.
          </p>
        )}
      </div>
    </div>
  )
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatDateForReport(value: string | null | undefined) {
  return formatReservationDate(value)
}

function printRpReport(report: RpReport[], reservations: Reservation[]) {
  const totalReservationRecords = reservations.length
  const totalReservations = reservations.reduce(
    (sum, reservation) => sum + Number(reservation.reservation_count || 0),
    0
  )
  const totalPeople = reservations.reduce(
    (sum, reservation) => sum + Number(reservation.people_count || 0),
    0
  )
  const printedAt = new Date().toLocaleString('es-MX')
  const rows = report
    .map(
      (rp, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${escapeHtml(rp.display_name)}</strong>
            <span>@${escapeHtml(rp.username)}</span>
          </td>
          <td>${escapeHtml(rp.reservation_records)}</td>
          <td>${escapeHtml(rp.total_reservations)}</td>
          <td>${escapeHtml(rp.total_people)}</td>
          <td>${escapeHtml(
            formatDateForReport(rp.last_reservation_at)
          )}</td>
        </tr>
      `
    )
    .join('')
  const reservationRows = reservations
    .map(
      (reservation, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(formatDateForReport(reservation.reservation_date))}</td>
          <td>${escapeHtml(formatReservationTime(reservation.reservation_time))}</td>
          <td>
            <strong>${escapeHtml(reservation.customer_name)}</strong>
            <span>${escapeHtml(reservation.customer_phone)}</span>
          </td>
          <td>${escapeHtml(reservation.event_name)}</td>
          <td>${escapeHtml(reservation.rp_name || '')}</td>
          <td>${escapeHtml(reservation.people_count)}</td>
          <td>${escapeHtml(reservation.reservation_count)}</td>
          <td>${escapeHtml(statusLabels[reservation.status])}</td>
        </tr>
      `
    )
    .join('')

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Reporte RP Blackout</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            color: #111827;
            font-family: Arial, sans-serif;
          }
          .header {
            align-items: flex-start;
            border-bottom: 3px solid #111827;
            display: flex;
            justify-content: space-between;
            margin-bottom: 26px;
            padding-bottom: 18px;
          }
          h1 {
            font-size: 30px;
            margin: 0;
            text-transform: uppercase;
          }
          .muted { color: #6b7280; font-size: 13px; margin-top: 6px; }
          .brand {
            color: #db2777;
            font-size: 22px;
            font-weight: 900;
            text-align: right;
            text-transform: uppercase;
          }
          .cards {
            display: grid;
            gap: 14px;
            grid-template-columns: repeat(4, 1fr);
            margin-bottom: 22px;
          }
          .card {
            border: 1px solid #d1d5db;
            border-radius: 10px;
            padding: 14px;
          }
          .label {
            color: #6b7280;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .value {
            font-size: 26px;
            font-weight: 900;
            margin-top: 6px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          caption {
            color: #db2777;
            font-size: 16px;
            font-weight: 900;
            margin-bottom: 10px;
            text-align: left;
            text-transform: uppercase;
          }
          .detail-table {
            margin-top: 28px;
          }
          th, td {
            border-bottom: 1px solid #e5e7eb;
            padding: 11px 9px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #111827;
            color: white;
            font-size: 12px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }
          td span {
            color: #6b7280;
            display: block;
            font-size: 12px;
            margin-top: 2px;
          }
          .footer {
            color: #6b7280;
            font-size: 12px;
            margin-top: 24px;
          }
          @media print {
            body { padding: 18mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <section class="header">
          <div>
            <h1>Reporte de Reservaciones por RP</h1>
            <p class="muted">Generado: ${escapeHtml(printedAt)}</p>
          </div>
          <div class="brand">Blackout ON</div>
        </section>

        <section class="cards">
          <div class="card">
            <div class="label">RPs registrados</div>
            <div class="value">${report.length}</div>
          </div>
          <div class="card">
            <div class="label">Capturas registradas</div>
            <div class="value">${totalReservationRecords}</div>
          </div>
          <div class="card">
            <div class="label">Reservas registradas</div>
            <div class="value">${totalReservations}</div>
          </div>
          <div class="card">
            <div class="label">Personas registradas</div>
            <div class="value">${totalPeople}</div>
          </div>
        </section>

        <table>
          <caption>Resumen por RP</caption>
          <thead>
            <tr>
              <th>#</th>
              <th>RP</th>
              <th>Capturas</th>
              <th>Reservas</th>
              <th>Personas</th>
              <th>Ultima reserva</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6">Sin datos para mostrar.</td></tr>'}
          </tbody>
        </table>

        <table class="detail-table">
          <caption>Reservaciones registradas</caption>
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Evento</th>
              <th>RP</th>
              <th>Personas</th>
              <th>Reservas</th>
              <th>Estatus</th>
            </tr>
          </thead>
          <tbody>
            ${
              reservationRows ||
              '<tr><td colspan="9">Sin reservaciones registradas.</td></tr>'
            }
          </tbody>
        </table>

        <p class="footer">
          Este documento sirve para revision interna de comisiones por reservaciones.
        </p>
        <script>
          window.addEventListener('load', () => {
            window.print();
          });
        </script>
      </body>
    </html>
  `

  const reportWindow = window.open(
    '',
    'blackout-rp-report-print',
    'width=980,height=720'
  )

  if (!reportWindow) {
    alert('Permite ventanas emergentes para generar el PDF.')
    return
  }

  reportWindow.document.open()
  reportWindow.document.write(html)
  reportWindow.document.close()
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-white/42">{label}</p>
      <p className="mt-1 text-xl font-black text-pink-200">{value}</p>
    </div>
  )
}

function UsersModule({
  token,
  users,
  currentUserId,
  onSaved,
}: {
  token: string
  users: AuthUser[]
  currentUserId: number
  onSaved: () => void
}) {
  const [form, setForm] = useState<UserForm>(emptyUserForm)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<UserFormErrors>({})
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [codeMessage, setCodeMessage] = useState('')

  useAutoDismissMessage(error, setError)
  useAutoDismissMessage(codeMessage, setCodeMessage)

  function updateField(name: keyof UserForm, value: string) {
    setForm((current) => ({
      ...current,
      [name]:
        name === 'username' || name === 'email'
          ? value.trim().toLowerCase()
          : value,
    }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setError('')
    setCodeMessage('')
  }

  function validateUserForm(options: { includePassword: boolean; includeCode: boolean }) {
    const nextErrors: UserFormErrors = {}

    if (form.username.trim().length < 3) {
      nextErrors.username = 'El usuario debe tener minimo 3 caracteres.'
    } else if (
      users.some(
        (item) =>
          item.username.trim().toLowerCase() === form.username.trim().toLowerCase()
      )
    ) {
      nextErrors.username = 'Ese usuario ya existe.'
    }

    if (form.displayName.trim().length < 3) {
      nextErrors.displayName = 'Escribe el nombre del acceso.'
    } else if (
      form.role === 'rp' &&
      users.some(
        (item) =>
          item.role === 'rp' &&
          item.displayName.trim().toLowerCase() ===
            form.displayName.trim().toLowerCase()
      )
    ) {
      nextErrors.displayName = 'Ya existe un RP con ese nombre.'
    }

    if (!isValidEmail(form.email)) {
      nextErrors.email = 'Escribe un correo valido.'
    } else if (
      users.some((item) => item.email?.toLowerCase() === form.email.trim().toLowerCase())
    ) {
      nextErrors.email = 'Ese correo ya esta en uso.'
    }

    if (!['admin', 'rp'].includes(form.role)) {
      nextErrors.role = 'Selecciona un rol valido.'
    }

    if (options.includePassword && form.password.length < 8) {
      nextErrors.password = 'El password debe tener minimo 8 caracteres.'
    }

    if (options.includeCode && !/^\d{6}$/.test(form.verificationCode.trim())) {
      nextErrors.verificationCode = 'Escribe el codigo de 6 digitos.'
    }

    return nextErrors
  }

  async function requestVerificationCode() {
    setError('')
    setCodeMessage('')
    setFieldErrors({})

    const nextErrors = validateUserForm({
      includePassword: false,
      includeCode: false,
    })

    if (Object.values(nextErrors).some(Boolean)) {
      setFieldErrors(nextErrors)
      scrollToFirstAdminError()
      return
    }

    setIsSendingCode(true)

    try {
      const result = await api.requestUserVerificationCode(token, {
        username: form.username,
        displayName: form.displayName,
        role: form.role,
        email: form.email,
      })
      setCodeMessage(
        result.verificationCode
          ? `${result.message} Codigo temporal local: ${result.verificationCode}`
          : result.message
      )
    } catch (apiError) {
      if (apiError instanceof ApiError && apiError.details) {
        setFieldErrors({
          username: apiError.details.username,
          displayName: apiError.details.displayName,
          role: apiError.details.role,
          email: apiError.details.email,
        })
        scrollToFirstAdminError()
      }
      setError(
        apiError instanceof Error ? apiError.message : 'No se pudo enviar el codigo.'
      )
    } finally {
      setIsSendingCode(false)
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    const nextErrors = validateUserForm({
      includePassword: true,
      includeCode: true,
    })

    if (Object.values(nextErrors).some(Boolean)) {
      setFieldErrors(nextErrors)
      scrollToFirstAdminError()
      return
    }

    try {
      await api.createUser(token, form)
      setForm(emptyUserForm)
      setCodeMessage('')
      onSaved()
    } catch (apiError) {
      if (apiError instanceof ApiError && apiError.details) {
        setFieldErrors({
          username: apiError.details.username,
          displayName: apiError.details.displayName,
          role: apiError.details.role,
          email: apiError.details.email,
          password: apiError.details.password,
          verificationCode: apiError.details.verificationCode,
        })
        scrollToFirstAdminError()
      }
      setError(apiError instanceof Error ? apiError.message : 'Error al guardar.')
    }
  }

  async function deleteUser(userId: number) {
    if (!window.confirm('Eliminar este usuario?')) return

    setDeletingId(userId)
    setError('')
    try {
      await api.deleteUser(token, userId)
      onSaved()
    } catch (apiError) {
      setError(
        apiError instanceof Error ? apiError.message : 'No se pudo eliminar.'
      )
      scrollToFirstAdminError()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <form
        onSubmit={submit}
        className="rounded-[24px] border border-white/10 bg-zinc-950/82 p-5 md:p-6"
      >
        <h2 className="text-2xl font-black uppercase text-pink-300">
          Crear acceso
        </h2>
        <div className="mt-5 grid gap-4">
          <Input
            label="Usuario"
            value={form.username}
            error={fieldErrors.username}
            onChange={(value) => updateField('username', value)}
          />
          <Input
            label="Nombre"
            value={form.displayName}
            error={fieldErrors.displayName}
            onChange={(value) => updateField('displayName', value)}
          />
          <Input
            label="Correo electronico"
            type="email"
            value={form.email}
            error={fieldErrors.email}
            onChange={(value) => updateField('email', value)}
            autoComplete="email"
          />
          <label data-error={fieldErrors.role ? 'true' : undefined}>
            <span className="mb-2 block text-sm uppercase tracking-wide text-white/55">
              Rol
            </span>
            <select
              value={form.role}
              onChange={(event) =>
                updateField('role', event.target.value as UserRole)
              }
              className={`w-full rounded-xl border bg-zinc-950 px-4 py-3 text-white outline-none focus:border-pink-500 ${
                fieldErrors.role
                  ? 'border-red-400 text-red-100 shadow-[0_0_14px_rgba(248,113,113,0.32)]'
                  : 'border-white/10'
              }`}
            >
              <option value="rp">RP</option>
              <option value="admin">Admin</option>
            </select>
            <FieldError message={fieldErrors.role} />
          </label>
          <button
            type="button"
            disabled={isSendingCode}
            onClick={requestVerificationCode}
            className="rounded-xl border border-cyan-400/45 bg-cyan-500/10 px-4 py-3 text-sm font-black uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSendingCode ? 'Enviando codigo...' : 'Enviar codigo al correo'}
          </button>
          {codeMessage && (
            <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {codeMessage}
            </div>
          )}
          <Input
            label="Password"
            type="password"
            value={form.password}
            error={fieldErrors.password}
            onChange={(value) => updateField('password', value)}
          />
          <Input
            label="Codigo de validacion"
            value={form.verificationCode}
            error={fieldErrors.verificationCode}
            onChange={(value) => updateField('verificationCode', value)}
            inputMode="numeric"
            maxLength={6}
          />
        </div>
        <FieldError message={error} />
        <button
          type="submit"
          className="mt-6 w-full rounded-xl border border-pink-500 bg-black/70 px-6 py-4 font-black uppercase tracking-wide text-pink-200"
        >
          Crear usuario
        </button>
      </form>

      <div className="rounded-[24px] border border-white/10 bg-zinc-950/82 p-5 md:p-6">
        <h2 className="text-2xl font-black uppercase text-pink-300">
          Accesos existentes
        </h2>
        <div className="mt-5 grid gap-3">
          {users.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-black uppercase text-white">
                  {item.displayName}
                </p>
                <p className="text-sm text-white/55">
                  @{item.username} · {item.role.toUpperCase()} ·{' '}
                  {item.active ? 'Activo' : 'Inactivo'}
                </p>
                {item.email && (
                  <p className="mt-1 text-xs text-white/42">{item.email}</p>
                )}
              </div>

              {item.id !== currentUserId && (
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => deleteUser(item.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-100 transition hover:border-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  min,
  error,
  maxLength,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  autoComplete?: string
  min?: string
  error?: string
  maxLength?: number
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <label className="block" data-error={error ? 'true' : undefined}>
      <span className="mb-2 block text-sm uppercase tracking-wide text-white/55">
        {label}
      </span>
      <input
        type={type}
        value={value}
        min={min}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white outline-none transition focus:bg-pink-500/10 ${
          error
            ? 'border-red-400 text-red-100 shadow-[0_0_14px_rgba(248,113,113,0.32)]'
            : 'border-white/10 focus:border-pink-500'
        }`}
      />
      <FieldError message={error} />
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <div
      data-error="true"
      className="mt-3 overflow-hidden rounded-lg border border-red-400/35 bg-red-500/10 text-sm text-red-100 shadow-[0_0_16px_rgba(248,113,113,0.22)]"
    >
      <div className="h-1 bg-gradient-to-r from-pink-500 via-cyan-300 to-yellow-300" />
      <p className="px-3 py-2">{message}</p>
    </div>
  )
}

export default Admin
