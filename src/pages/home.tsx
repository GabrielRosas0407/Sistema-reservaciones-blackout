import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Crown, Martini, Music2 } from 'lucide-react'
import Header from '../components/header'
import {
  eventOptions,
  getReservationDateError,
  peopleOptions,
  tableOptions,
  timeOptions,
  toDateInputValue,
} from '../lib/reservationOptions'

const neonButton =
  'border border-pink-500 rounded-md uppercase font-black text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.8)] transition-all duration-300 hover:scale-105 hover:bg-pink-500/10 hover:text-white hover:shadow-[0_0_28px_rgba(236,72,153,1)] active:scale-95'

const minReservationDate = toDateInputValue()

function Home() {
  return (
    <main className="min-h-screen w-full bg-black text-white overflow-x-hidden">
      <Header />
      <Hero />
      <Features />
      <HomeReservation />
      <HomeEventsPreview />
    </main>
  )
}

function Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-7rem)] w-full items-center overflow-hidden px-6 py-14 md:px-10 xl:px-16 xl:py-0">
      <img
        src="/ESCENARIO.png"
        alt="Fondo antro blackout"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
      />

      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.18),rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_34%,rgba(236,72,153,0.22),transparent_30%),radial-gradient(circle_at_30%_55%,rgba(236,72,153,0.10),transparent_26%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.58)_34%,rgba(0,0,0,0.18)_68%,rgba(0,0,0,0.12)_100%)]" />

      <div className="relative grid w-full grid-cols-1 items-center gap-10 xl:grid-cols-2">
        <div className="mx-auto max-w-xl text-center xl:mx-0 xl:max-w-none xl:pl-10 xl:text-left">
          <p className="mb-5 text-base uppercase tracking-[0.35em] text-white/80 sm:tracking-[0.55em] md:text-xl xl:mb-8">
            Bienvenido a
          </p>

          <h1 className="hero-blackout-title font-['Bebas_Neue'] text-6xl uppercase leading-none tracking-wide sm:text-7xl md:text-8xl xl:text-9xl 2xl:text-[11rem]">
            Blackout
          </h1>

          <p className="mt-6 text-lg uppercase tracking-[0.38em] text-white sm:tracking-[0.55em] md:text-2xl xl:mt-10">
            Enciende la noche
          </p>

          <Link
            to="/reservaciones"
            className={`${neonButton} mt-8 inline-flex w-full max-w-[260px] justify-center px-6 py-4 text-center md:px-10 md:py-5 xl:mt-12 xl:w-auto xl:max-w-none`}
          >
            Reserva tu mesa
          </Link>
        </div>

        <div className="hidden -translate-y-16 items-center justify-center xl:flex">
          <img
            src="/CONEJO_NUEVO.png"
            alt="Logo ON grande"
            className="max-h-[560px] w-[440px] object-contain drop-shadow-[0_0_35px_rgba(236,72,153,0.95)] transition-transform duration-500 hover:scale-105 active:scale-95"
          />
        </div>
      </div>
    </section>
  )
}

function Features() {
  const items = [
    {
      icon: <Music2 size={58} strokeWidth={1.8} />,
      title: 'Música',
      text: 'Los mejores DJs todas las noches',
      color: 'text-cyan-400',
      hover: 'hover:bg-cyan-500/10 hover:border-cyan-400/50',
      glow: 'drop-shadow-[0_0_16px_rgba(34,211,238,1)]',
    },
    {
      icon: <Martini size={58} strokeWidth={1.8} />,
      title: 'Cocteles',
      text: 'Firma exclusiva y mixología',
      color: 'text-fuchsia-400',
      hover: 'hover:bg-fuchsia-500/10 hover:border-fuchsia-400/50',
      glow: 'drop-shadow-[0_0_16px_rgba(217,70,239,1)]',
    },
    {
      icon: <Crown size={58} strokeWidth={1.8} />,
      title: 'VIP',
      text: 'Experiencia blackout',
      color: 'text-yellow-300',
      hover: 'hover:bg-yellow-400/10 hover:border-yellow-300/50',
      glow: 'drop-shadow-[0_0_16px_rgba(253,224,71,1)]',
    },
    {
      icon: <CalendarDays size={58} strokeWidth={1.8} />,
      title: 'Eventos',
      text: 'Cartelera actualizada',
      color: 'text-emerald-400',
      hover: 'hover:bg-emerald-500/10 hover:border-emerald-400/50',
      glow: 'drop-shadow-[0_0_16px_rgba(52,211,153,1)]',
    },
  ]

  return (
    <section className="relative z-20 -mt-8 px-6 pb-8 md:-mt-14 md:px-10 xl:-mt-28 xl:px-28">
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className={`group border-b border-r border-white/10 p-5 text-center transition-all duration-300 even:border-r-0 hover:-translate-y-2 md:p-7 xl:border-b-0 xl:even:border-r xl:last:border-r-0 ${item.hover}`}
          >
            <div
              className={`mb-4 flex justify-center transition-all duration-300 group-hover:scale-110 md:mb-5 ${item.color} ${item.glow}`}
            >
              {item.icon}
            </div>

            <h3 className="mb-2 text-base font-black uppercase tracking-wider transition-colors duration-300 group-hover:text-white md:mb-3 md:text-xl">
              {item.title}
            </h3>

            <p className="text-xs uppercase leading-relaxed text-white/60 md:text-sm">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function HomeReservation() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    evento: eventOptions[0]?.value || '',
    fecha: '',
    personas: '2',
    hora: '',
    tipoMesa: tableOptions[0]?.value || '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>(
    {}
  )

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({
      ...current,
      [name]: name === 'fecha' ? getReservationDateError(value) : '',
    }))
  }

  function continueReservation() {
    const nextErrors: Partial<Record<keyof typeof form, string>> = {}

    if (!eventOptions.some((option) => option.value === form.evento)) {
      nextErrors.evento = 'Selecciona un evento valido.'
    }

    const dateError = getReservationDateError(form.fecha)
    if (dateError) nextErrors.fecha = dateError

    if (!peopleOptions.includes(form.personas)) {
      nextErrors.personas = 'Selecciona una cantidad valida.'
    }

    if (!timeOptions.some((option) => option.value === form.hora)) {
      nextErrors.hora = 'Selecciona una hora.'
    }

    if (!tableOptions.some((option) => option.value === form.tipoMesa)) {
      nextErrors.tipoMesa = 'Selecciona un tipo de mesa.'
    }

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors)
      window.setTimeout(() => {
        document
          .querySelector('[data-home-error="true"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }

    const params = new URLSearchParams({
      evento: form.evento,
      fecha: form.fecha,
      personas: form.personas,
      hora: form.hora,
      tipoMesa: form.tipoMesa,
    })

    navigate(`/reservaciones?${params.toString()}`)
  }

  return (
    <section className="px-6 pb-8 md:px-10 xl:px-28">
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 shadow-[0_0_35px_rgba(0,0,0,0.8)] xl:grid-cols-[1.5fr_0.8fr]">
        <div className="p-6 md:p-8">
          <h2 className="font-['Bebas_Neue'] text-4xl uppercase leading-none tracking-wide text-pink-400 drop-shadow-[0_0_16px_rgba(236,72,153,0.8)] md:text-6xl">
            Reserva tu mesa
          </h2>

          <p className="mt-2 text-base uppercase tracking-wide text-white/75 md:text-xl">
            Vive la experiencia blackout
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:mt-8">
            <HomeSelectField
              label="Evento"
              value={form.evento}
              error={errors.evento}
              onChange={(value) => updateField('evento', value)}
              options={eventOptions}
            />
            <HomeDateField
              label="Fecha"
              value={form.fecha}
              error={errors.fecha}
              onChange={(value) => updateField('fecha', value)}
            />
            <HomeSelectField
              label="Personas"
              value={form.personas}
              error={errors.personas}
              onChange={(value) => updateField('personas', value)}
              options={peopleOptions.map((people) => ({
                label: `${people} Personas`,
                value: people,
              }))}
            />
            <HomeSelectField
              label="Hora"
              value={form.hora}
              error={errors.hora}
              onChange={(value) => updateField('hora', value)}
              options={[
                { label: 'Selecciona una hora', value: '' },
                ...timeOptions,
              ]}
            />
            <div className="md:col-span-2">
              <HomeSelectField
                label="Tipo de mesa"
                value={form.tipoMesa}
                error={errors.tipoMesa}
                onChange={(value) => updateField('tipoMesa', value)}
                options={tableOptions}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={continueReservation}
            className={`${neonButton} mt-7 inline-flex w-full justify-center px-6 py-4 text-center md:w-auto md:min-w-[320px] md:px-12 md:py-5 xl:mt-8`}
          >
            Continuar reserva
          </button>
        </div>

        <div className="flex flex-col items-center justify-center border-t border-white/10 p-6 text-center md:p-8 xl:border-l xl:border-t-0">
          <img
            src="/CONEJO_NUEVO.png"
            alt="Logo ON reserva"
            className="w-28 object-contain drop-shadow-[0_0_25px_rgba(236,72,153,0.9)] transition-transform duration-300 hover:scale-105 md:w-36"
          />

          <div className="mt-3 text-5xl font-black uppercase leading-none text-pink-300 drop-shadow-[0_0_18px_rgba(236,72,153,0.8)] md:mt-4 md:text-6xl">
            on
          </div>

          <h3 className="mt-3 font-['Bebas_Neue'] text-3xl uppercase tracking-wide text-pink-400 md:mt-4 md:text-4xl">
            Blackout
          </h3>

          <p className="mt-3 text-base uppercase leading-relaxed tracking-wide text-white/80 md:text-xl">
            Luz apagada,
            <br />
            sentidos encendidos.
          </p>

          <div className="mt-6 flex gap-4">
            <SocialButton
              label="Instagram"
              className="border-pink-500 text-pink-400 shadow-[0_0_14px_rgba(236,72,153,0.55)] hover:bg-pink-500/10 hover:text-pink-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.95)]"
            >
              <InstagramIcon />
            </SocialButton>

            <SocialButton
              label="TikTok"
              className="border-emerald-400 text-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.55)] hover:bg-emerald-500/10 hover:text-emerald-300 hover:shadow-[0_0_20px_rgba(52,211,153,0.95)]"
            >
              <TikTokIcon />
            </SocialButton>

            <SocialButton
              label="Facebook"
              className="border-sky-400 text-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.55)] hover:bg-sky-500/10 hover:text-sky-300 hover:shadow-[0_0_20px_rgba(56,189,248,0.95)]"
            >
              <FacebookIcon />
            </SocialButton>
          </div>
        </div>
      </div>
    </section>
  )
}

function HomeEventsPreview() {
  const events = [
    {
      titleTop: 'Blackout',
      titleBottom: 'Friday',
      date: 'Viernes 26 Abr',
      image: '/VIERNES.png',
      topClass: 'text-shimmer-pink',
      bottomClass: 'text-shimmer-white',
      imageClass:
        'scale-[1.2] object-cover object-center opacity-100 group-hover:scale-[1.28]',
    },
    {
      titleTop: 'Neon',
      titleBottom: 'Night',
      date: 'Sábado 27 Abr',
      image: '/SABADO.png',
      topClass: 'text-shimmer-pink',
      bottomClass: 'text-shimmer-white',
      imageClass:
        'scale-[1.2] object-cover object-center opacity-100 group-hover:scale-[1.28]',
    },
    {
      titleTop: 'Full',
      titleBottom: 'Black',
      date: 'Domingo 28 Abr',
      image: '/DOMINGO.png',
      topClass: 'text-shimmer-soft',
      bottomClass: 'text-shimmer-white',
      imageClass:
        'scale-[1.2] object-cover object-center opacity-100 group-hover:scale-[1.28]',
    },
  ]

  return (
    <section className="px-6 pb-20 md:px-10 xl:px-28 xl:pb-24">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-['Bebas_Neue'] text-3xl uppercase tracking-wide text-shimmer-pink md:text-4xl">
          Próximos eventos
        </h2>

        <Link
          to="/eventos"
          className="font-['Bebas_Neue'] text-xl uppercase tracking-wide text-shimmer-pink md:text-2xl"
        >
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <article
            key={`${event.titleTop}-${event.titleBottom}`}
            className="event-card-neon group relative min-h-[210px] overflow-hidden rounded-xl border border-white/10 bg-black transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:shadow-[0_0_35px_rgba(236,72,153,0.35)] md:min-h-[190px]"
          >
            <img
              src={event.image}
              alt={`${event.titleTop} ${event.titleBottom}`}
              className={`absolute inset-0 h-full w-full brightness-110 contrast-110 saturate-110 transition-all duration-500 ${event.imageClass}`}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/35 to-black/0" />

            <div className="relative z-10 p-5 md:p-6">
              <h3 className="font-['Bebas_Neue'] text-4xl uppercase leading-[0.9] tracking-wide md:text-5xl">
                <span className={`block w-fit ${event.topClass}`}>
                  {event.titleTop}
                </span>

                <span className={`block w-fit ${event.bottomClass}`}>
                  {event.titleBottom}
                </span>
              </h3>

              <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-white/80">
                {event.date}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function HomeSelectField({
  label,
  value,
  error,
  options,
  onChange,
}: {
  label: string
  value: string
  error?: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label data-home-error={error ? 'true' : undefined}>
      <span className="mb-2 block text-sm uppercase tracking-wide text-white/65">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-md border bg-zinc-950 px-5 py-4 text-white outline-none transition-all duration-300 hover:border-pink-500/70 hover:bg-pink-500/10 focus:border-pink-500/70 focus:bg-pink-500/10 focus:shadow-[0_0_18px_rgba(236,72,153,0.35)] ${
          error
            ? 'border-red-400 text-red-100 shadow-[0_0_14px_rgba(248,113,113,0.34)]'
            : 'border-white/10'
        }`}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <HomeFieldError message={error} />
    </label>
  )
}

function HomeDateField({
  label,
  value,
  error,
  onChange,
}: {
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <label data-home-error={error ? 'true' : undefined}>
      <span className="mb-2 block text-sm uppercase tracking-wide text-white/65">
        {label}
      </span>

      <input
        type="date"
        min={minReservationDate}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-md border bg-zinc-950 px-5 py-4 text-white outline-none transition-all duration-300 hover:border-pink-500/70 hover:bg-pink-500/10 focus:border-pink-500/70 focus:bg-pink-500/10 focus:shadow-[0_0_18px_rgba(236,72,153,0.35)] ${
          error
            ? 'border-red-400 text-red-100 shadow-[0_0_14px_rgba(248,113,113,0.34)]'
            : 'border-white/10'
        }`}
      />

      <HomeFieldError message={error} />
    </label>
  )
}

function HomeFieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-red-400/35 bg-red-500/10 text-sm text-red-100 shadow-[0_0_16px_rgba(248,113,113,0.2)]">
      <div className="h-1 bg-gradient-to-r from-pink-500 via-cyan-300 to-yellow-300" />
      <p className="px-3 py-2">{message}</p>
    </div>
  )
}

function SocialButton({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <button
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 active:scale-95 ${className}`}
    >
      {children}
    </button>
  )
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M16.7 3c.3 2.4 1.7 4 4.1 4.4v3.2c-1.4 0-2.8-.4-4.1-1.2v5.6c0 3.4-2.4 6-5.8 6-3.1 0-5.6-2.2-5.6-5.2 0-3.2 2.7-5.4 6.1-5.1v3.3c-1.5-.3-2.8.5-2.8 1.8 0 1.1.9 1.9 2.1 1.9 1.4 0 2.4-.9 2.4-2.7V3h3.6z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M14.2 8.4V6.9c0-.8.5-1 1.1-1h1.9V2.7c-.9-.1-1.8-.2-2.7-.2-2.8 0-4.7 1.7-4.7 4.8v1.1H6.8v3.6h3v9h4.4v-9h3l.5-3.6h-3.5z" />
    </svg>
  )
}

export default Home
