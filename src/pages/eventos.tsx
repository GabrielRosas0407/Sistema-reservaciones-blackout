import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ChevronRight,
  Music4,
  MoonStar,
  Sparkles,
} from 'lucide-react'
import Header from '../components/header'

type EventCard = {
  id: number
  dayName: string
  dayNumber: string
  month: string
  label: string
  labelType: 'pink' | 'cyan'
  icon: 'music' | 'sparkles' | 'moon'
  image: string
  titleTop: string
  titleBottom: string
  description: string
  details: string
}

const events: EventCard[] = [
  {
    id: 1,
    dayName: 'Viernes',
    dayNumber: '26',
    month: 'Abr',
    label: 'Blackout',
    labelType: 'pink',
    icon: 'music',
    image: '/ESC3.png',
    titleTop: 'BLACKOUT',
    titleBottom: 'FRIDAY',
    description: 'La mejor previa del fin de semana.',
    details: 'DJ SET • LUCES BLACKOUT • COCTELES',
  },
  {
    id: 2,
    dayName: 'Sábado',
    dayNumber: '27',
    month: 'Abr',
    label: 'Especial',
    labelType: 'cyan',
    icon: 'sparkles',
    image: '/ESC4.png',
    titleTop: 'NEON',
    titleBottom: 'NIGHT',
    description: 'Edición especial.',
    details: 'INVITADOS • VISUALES • SORPRESAS',
  },
  {
    id: 3,
    dayName: 'Domingo',
    dayNumber: '28',
    month: 'Abr',
    label: 'Blackout',
    labelType: 'pink',
    icon: 'moon',
    image: '/ESC5.png',
    titleTop: 'FULL',
    titleBottom: 'BLACK',
    description: 'Toda la noche en modo blackout.',
    details: 'MÚSICA • OSCURIDAD • CONEXIÓN',
  },
]

const neonButton =
  'rounded-xl border border-pink-500 bg-black/70 px-10 py-4 text-lg font-extrabold uppercase tracking-wide text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-pink-400 hover:text-white hover:shadow-[0_0_28px_rgba(236,72,153,0.95)] active:scale-[0.98]'

function renderLabelIcon(icon: EventCard['icon']) {
  if (icon === 'music') return <Music4 size={18} />
  if (icon === 'sparkles') return <Sparkles size={18} />
  return <MoonStar size={18} />
}

function Eventos() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />

      <section className="px-6 pb-20 pt-10 md:px-10 md:pt-16 xl:px-14">
        <div className="mx-auto max-w-[1700px]">
          <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.34em] text-pink-400 md:tracking-[0.45em]">
                Eventos
              </p>

              <h1 className="leading-[0.9]">
                <span className="block text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
                  Próximos
                </span>

                <span className="reservation-neon-title block text-5xl font-black uppercase tracking-tight md:text-7xl">
                  Eventos
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-lg text-white/80 md:text-2xl">
                Noches únicas. Música, luces y la energía blackout que solo{' '}
                <span className="font-extrabold text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.75)]">
                  ON
                </span>{' '}
                puede darte.
              </p>
            </div>

            <div className="flex justify-start lg:justify-end">
              <button
                className={`${neonButton} inline-flex w-full items-center justify-center gap-3 px-6 py-4 text-base sm:w-auto md:px-10 md:text-lg`}
              >
                Ver calendario
                <CalendarDays size={22} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.id}
                className="event-rgb-card group relative min-h-[560px] overflow-hidden rounded-[26px] border border-white/10 bg-zinc-950 shadow-[0_0_35px_rgba(236,72,153,0.08)] transition-all duration-500 hover:-translate-y-3 hover:scale-[1.025] hover:border-transparent hover:shadow-[0_0_55px_rgba(236,72,153,0.35)] active:scale-[0.99] md:min-h-[680px] xl:min-h-[760px] xl:rounded-[34px]"
              >
                <div className="absolute left-0 top-10 z-20 h-[2px] w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-90" />

                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.04]"
                  style={{ backgroundImage: `url(${event.image})` }}
                />

                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.18),rgba(0,0,0,0.54),rgba(0,0,0,0.97))]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(236,72,153,0.13),transparent_32%)]" />

                <div className="relative z-30 flex min-h-[560px] flex-col px-5 pb-7 pt-6 md:min-h-[680px] md:px-7 md:pb-10 md:pt-8 xl:min-h-[760px]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-[20px] border border-white/10 bg-black/85 px-5 py-4 text-center shadow-[0_0_20px_rgba(0,0,0,0.45)] backdrop-blur-md md:rounded-[24px] md:px-7 md:py-5">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-pink-400 md:text-base">
                        {event.dayName}
                      </p>

                      <p className="mt-2 text-5xl font-black uppercase leading-none text-white md:text-7xl">
                        {event.dayNumber}
                      </p>

                      <p className="mt-2 text-2xl font-black uppercase leading-none text-white md:text-3xl">
                        {event.month}
                      </p>
                    </div>

                    <div
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-extrabold uppercase tracking-[0.12em] backdrop-blur-md md:gap-3 md:px-6 md:text-lg md:tracking-[0.14em] ${
                        event.labelType === 'cyan'
                          ? 'border-cyan-400 bg-black/70 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.22)]'
                          : 'border-pink-500 bg-black/70 text-pink-200 shadow-[0_0_20px_rgba(236,72,153,0.22)]'
                      }`}
                    >
                      {renderLabelIcon(event.icon)}
                      {event.label}
                    </div>
                  </div>

                  <div className="mt-8 flex flex-1 items-center md:mt-12">
                    <div className="mx-auto max-w-full text-center md:max-w-[88%]">
                      <h2 className="font-['Bebas_Neue'] leading-[0.86]">
                        <span className="block text-6xl font-black uppercase tracking-tight text-pink-300 drop-shadow-[0_0_18px_rgba(236,72,153,0.45)] md:text-[5.5rem]">
                          {event.titleTop}
                        </span>

                        <span className="block text-6xl font-black uppercase tracking-tight text-white/95 drop-shadow-[0_0_12px_rgba(255,255,255,0.18)] md:text-[5.2rem]">
                          {event.titleBottom}
                        </span>
                      </h2>

                      <p className="mt-6 text-lg text-white/92 md:mt-8 md:text-2xl">
                        {event.description}
                      </p>

                      <p className="mt-6 text-base font-bold uppercase leading-relaxed tracking-[0.12em] text-pink-200 md:mt-8 md:text-xl md:tracking-[0.14em]">
                        {event.details}
                      </p>
                    </div>
                  </div>

                  <div className="pt-8">
                    <Link
                      to="/reservaciones"
                      className={`${neonButton} relative z-50 block w-full text-center`}
                    >
                      Reserva tu mesa
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <button
              className={`${neonButton} inline-flex w-full items-center justify-center gap-4 px-8 py-5 sm:w-auto md:px-14`}
            >
              Ver más eventos
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Eventos
