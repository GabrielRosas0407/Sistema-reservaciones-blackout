import type { ElementType, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import Header from '../components/header'

type InfoCardData = {
  id: string
  icon: ElementType
  title: string
  value: string
  detail: string
  accent: 'pink' | 'cyan' | 'emerald' | 'yellow'
}

type SocialLink = {
  id: string
  label: string
  value: string
  href: string
  icon: ElementType
}

const locationText = 'San Andrés Tuxtla, Veracruz'

const infoCards: InfoCardData[] = [
  {
    id: 'location',
    icon: MapPin,
    title: 'Ubicación',
    value: locationText,
    detail: 'La dirección exacta se comparte al confirmar tu reservación.',
    accent: 'pink',
  },
  {
    id: 'hours',
    icon: Clock3,
    title: 'Horarios',
    value: 'Viernes a domingo',
    detail: 'Apertura nocturna. Horarios sujetos a evento y disponibilidad.',
    accent: 'cyan',
  },
  {
    id: 'reservations',
    icon: CalendarDays,
    title: 'Reservaciones',
    value: 'Mesa con confirmación',
    detail: 'Reserva con anticipación para asegurar lugar y zona.',
    accent: 'emerald',
  },
  {
    id: 'experience',
    icon: Music2,
    title: 'Experiencia',
    value: 'DJ Set + Fiesta',
    detail: 'Luces neon, música, ambiente blackout y noches especiales.',
    accent: 'yellow',
  },
]

const socialLinks: SocialLink[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    value: 'Reservas y dudas',
    href: 'https://wa.me/',
    icon: MessageCircle,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    value: '@blackout',
    href: 'https://www.instagram.com/',
    icon: Camera,
  },
  {
    id: 'mail',
    label: 'Correo',
    value: 'contacto@blackout.com',
    href: 'mailto:contacto@blackout.com',
    icon: Mail,
  },
]

const neonButton =
  'rounded-xl border border-pink-500 bg-black/70 px-7 py-4 text-sm font-extrabold uppercase tracking-wide text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-pink-400 hover:text-white hover:shadow-[0_0_28px_rgba(236,72,153,0.95)] active:scale-[0.98]'

function hasValidText(value: string) {
  return value.trim().length > 0
}

function getValidInfoCards(cards: InfoCardData[]) {
  return cards.filter(
    (card) =>
      hasValidText(card.id) &&
      hasValidText(card.title) &&
      hasValidText(card.value) &&
      hasValidText(card.detail)
  )
}

function getValidSocialLinks(links: SocialLink[]) {
  return links.filter(
    (link) =>
      hasValidText(link.id) &&
      hasValidText(link.label) &&
      hasValidText(link.value) &&
      (link.href.startsWith('http') || link.href.startsWith('mailto:'))
  )
}

function Info() {
  const validInfoCards = getValidInfoCards(infoCards)
  const validSocialLinks = getValidSocialLinks(socialLinks)

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />

      <section className="relative overflow-hidden border-b border-white/10">
        <img
          src="/ESCENARIO2.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-38"
        />

        <div className="absolute inset-0 bg-black/68" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.75)_48%,rgba(0,0,0,0.30)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_34%,rgba(236,72,153,0.24),transparent_22%),radial-gradient(circle_at_68%_48%,rgba(34,211,238,0.13),transparent_18%)]" />

        <div className="laser laser-pink top-[24%] left-[50%] w-[38%] rotate-[14deg]" />
        <div className="laser laser-blue bottom-[26%] right-[-8%] w-[34%] rotate-[-20deg]" />

        <div className="relative mx-auto grid min-h-[360px] max-w-[1700px] grid-cols-1 items-center gap-8 px-6 py-14 md:px-10 xl:grid-cols-[1.15fr_0.85fr] xl:px-14">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.48em] text-pink-400">
              Información
            </p>

            <h1 className="leading-[0.9]">
              <span className="block text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
                Blackout
              </span>

              {' '}

              <span className="reservation-neon-title block text-5xl font-black uppercase tracking-tight md:text-7xl">
                Info
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-lg text-white/80 md:text-2xl">
              Ubicación, horarios, contacto y detalles para vivir la experiencia{' '}
              <span className="font-extrabold text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.75)]">
                ON
              </span>
              .
            </p>
          </div>

          <div className="hidden justify-end xl:flex">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-pink-500/35 bg-black/52 p-7 shadow-[0_0_42px_rgba(236,72,153,0.18)] backdrop-blur-md">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(236,72,153,0.18),transparent_28%)]" />

              <div className="relative flex items-center gap-5">
                <img
                  src="/CONEJO_NUEVO.png"
                  alt="Logo ON"
                  className="w-24 drop-shadow-[0_0_24px_rgba(236,72,153,0.92)]"
                />

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/48">
                    Estamos en
                  </p>

                  <p className="mt-2 text-3xl font-black uppercase leading-tight text-pink-200">
                    San Andrés Tuxtla
                  </p>

                  <p className="text-xl font-bold uppercase text-white/76">
                    Veracruz
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 pt-10 md:px-10 xl:px-14">
        <div className="mx-auto max-w-[1700px]">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {validInfoCards.map((card) => (
              <InfoHighlightCard key={card.id} card={card} />
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <LocationPanel />

            <aside className="space-y-6">
              <ContactPanel socialLinks={validSocialLinks} />
              <RulesPanel />
            </aside>
          </div>

          <div className="mt-8 rounded-[18px] border border-pink-500/55 bg-[linear-gradient(90deg,rgba(12,12,16,0.96),rgba(22,8,22,0.9),rgba(10,10,14,0.96))] px-6 py-6 shadow-[0_0_28px_rgba(236,72,153,0.16)] md:flex md:items-center md:justify-between md:px-8">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-pink-500 text-pink-300 shadow-[0_0_18px_rgba(236,72,153,0.55)]">
                <Sparkles size={30} strokeWidth={1.8} />
              </div>

              <div>
                <h2 className="text-2xl font-black uppercase tracking-wide text-pink-300 md:text-3xl">
                  ¿Planeando tu noche?
                </h2>

                <p className="mt-1 text-white/70">
                  Reserva tu mesa y recibe la ubicación final al confirmar.
                </p>
              </div>
            </div>

            <Link
              to="/reservaciones"
              className={`${neonButton} mt-6 inline-flex w-full items-center justify-center gap-3 md:mt-0 md:w-auto md:px-12`}
            >
              Reservar ahora
              <ChevronRight size={22} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function InfoHighlightCard({ card }: { card: InfoCardData }) {
  const Icon = card.icon
  const accentClass = getAccentClass(card.accent)

  return (
    <article className="gallery-card-neon group relative overflow-hidden rounded-[20px] border border-white/10 bg-zinc-950/82 p-6 shadow-[0_0_24px_rgba(0,0,0,0.7)] transition-all duration-300 hover:-translate-y-2 hover:border-transparent hover:bg-zinc-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.12),transparent_28%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative">
        <div
          className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border ${accentClass}`}
        >
          <Icon size={28} strokeWidth={1.8} />
        </div>

        <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/42">
          {card.title}
        </p>

        <h2 className="mt-2 text-2xl font-black uppercase leading-tight text-white">
          {card.value}
        </h2>

        <p className="mt-3 leading-relaxed text-white/62">{card.detail}</p>
      </div>
    </article>
  )
}

function LocationPanel() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950/82 p-6 shadow-[0_0_32px_rgba(0,0,0,0.72)] md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(236,72,153,0.14),transparent_24%),radial-gradient(circle_at_22%_80%,rgba(34,211,238,0.12),transparent_24%)]" />

      <div className="relative grid gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-pink-400">
            Ubicación
          </p>

          <h2 className="mt-3 text-4xl font-black uppercase leading-none text-white md:text-5xl">
            San Andrés Tuxtla
          </h2>

          <p className="mt-2 text-2xl font-extrabold uppercase text-pink-300">
            Veracruz
          </p>

          <p className="mt-5 leading-relaxed text-white/68 md:text-lg">
            Blackout ON se encuentra en San Andrés Tuxtla, Veracruz. Por
            seguridad y control de acceso, la ubicación exacta se comparte al
            confirmar tu reservación.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://www.google.com/maps/search/?api=1&query=San%20Andres%20Tuxtla%2C%20Veracruz"
              target="_blank"
              rel="noreferrer"
              className={`${neonButton} inline-flex items-center justify-center gap-3`}
            >
              Ver zona
              <MapPin size={20} />
            </a>

            <Link
              to="/reservaciones"
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-7 py-4 text-sm font-extrabold uppercase tracking-wide text-white/72 transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/60 hover:bg-pink-500/10 hover:text-white"
            >
              Reservar
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>

        <div className="relative min-h-[280px] overflow-hidden rounded-[24px] border border-pink-500/35 bg-black/68 shadow-[0_0_28px_rgba(236,72,153,0.14)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(236,72,153,0.16),transparent_34%),linear-gradient(45deg,rgba(34,211,238,0.08)_0_1px,transparent_1px_22px),linear-gradient(-45deg,rgba(255,255,255,0.055)_0_1px,transparent_1px_22px)]" />
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-pink-500/40 shadow-[0_0_36px_rgba(236,72,153,0.22)]" />
          <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-pink-500 bg-black text-pink-300 shadow-[0_0_26px_rgba(236,72,153,0.65)]">
            <MapPin size={34} strokeWidth={1.8} />
          </div>

          <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-black/75 p-4 backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">
              Zona
            </p>

            <p className="mt-1 text-xl font-black uppercase text-white">
              {locationText}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactPanel({ socialLinks }: { socialLinks: SocialLink[] }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-zinc-950/82 p-6 shadow-[0_0_32px_rgba(0,0,0,0.72)] md:p-7">
      <h2 className="text-3xl font-black uppercase tracking-wide text-pink-300">
        Contacto
      </h2>

      <p className="mt-2 leading-relaxed text-white/62">
        Usa estos canales para dudas, reservaciones y eventos especiales.
      </p>

      <div className="mt-5 grid gap-3">
        {socialLinks.map((link) => (
          <ContactLink key={link.id} link={link} />
        ))}
      </div>
    </section>
  )
}

function ContactLink({ link }: { link: SocialLink }) {
  const Icon = link.icon

  return (
    <a
      href={link.href}
      target={link.href.startsWith('http') ? '_blank' : undefined}
      rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/55 hover:bg-pink-500/10"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-pink-500/45 text-pink-300 shadow-[0_0_16px_rgba(236,72,153,0.22)] transition-transform duration-300 group-hover:scale-105">
        <Icon size={24} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-black uppercase tracking-wide text-white">
          {link.label}
        </p>

        <p className="truncate text-sm text-white/55">{link.value}</p>
      </div>

      <ChevronRight
        size={20}
        className="text-white/35 transition-all duration-300 group-hover:translate-x-1 group-hover:text-pink-300"
      />
    </a>
  )
}

function RulesPanel() {
  return (
    <section className="rounded-[28px] border border-white/10 bg-zinc-950/82 p-6 shadow-[0_0_32px_rgba(0,0,0,0.72)] md:p-7">
      <h2 className="text-3xl font-black uppercase tracking-wide text-pink-300">
        Antes de llegar
      </h2>

      <div className="mt-5 grid gap-4">
        <InfoRow
          icon={<ShieldCheck size={24} strokeWidth={1.8} />}
          title="Acceso con confirmación"
          text="Tu mesa y ubicación final se validan por mensaje."
        />

        <InfoRow
          icon={<Phone size={24} strokeWidth={1.8} />}
          title="Contacto activo"
          text="Mantén tu teléfono disponible para confirmar detalles."
        />

        <InfoRow
          icon={<Sparkles size={24} strokeWidth={1.8} />}
          title="Eventos especiales"
          text="Las noches especiales pueden tener reglas y horarios propios."
        />
      </div>
    </section>
  )
}

function InfoRow({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mt-1 text-pink-300 drop-shadow-[0_0_10px_rgba(236,72,153,0.65)]">
        {icon}
      </div>

      <div>
        <h3 className="font-black uppercase tracking-wide text-white">
          {title}
        </h3>

        <p className="mt-1 leading-relaxed text-white/58">{text}</p>
      </div>
    </div>
  )
}

function getAccentClass(accent: InfoCardData['accent']) {
  const classes: Record<InfoCardData['accent'], string> = {
    pink: 'border-pink-500/55 text-pink-300 shadow-[0_0_18px_rgba(236,72,153,0.28)]',
    cyan: 'border-cyan-400/50 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.22)]',
    emerald:
      'border-emerald-400/50 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.22)]',
    yellow:
      'border-yellow-300/50 text-yellow-200 shadow-[0_0_18px_rgba(253,224,71,0.18)]',
  }

  return classes[accent]
}

export default Info
