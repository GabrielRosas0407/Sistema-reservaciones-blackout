import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ChevronRight,
  Headphones,
  Images,
  Music2,
  Sparkles,
} from 'lucide-react'
import Header from '../components/header'

const galleryFilters = [
  { id: 'todas', label: 'Todas', icon: Images },
  { id: 'fiesta', label: 'Fiesta', icon: Music2 },
  { id: 'dj-set', label: 'DJ Set', icon: Headphones },
  { id: 'especiales', label: 'Especiales', icon: Sparkles },
] as const

type GalleryFilter = (typeof galleryFilters)[number]['id']
type GalleryCategory = Exclude<GalleryFilter, 'todas'>

type GalleryItem = {
  id: string
  title: string
  category: GalleryCategory
  date: string
  image: string
  alt: string
  featured?: boolean
}

type ValidatedGalleryItem = GalleryItem & {
  categoryLabel: string
}

const galleryItems: GalleryItem[] = [
  {
    id: 'blackout-crowd',
    title: 'Noche Blackout',
    category: 'fiesta',
    date: 'Viernes',
    image: '/ESCENARIO.png',
    alt: 'Pista de baile con luces neon durante una noche Blackout',
    featured: true,
  },
  {
    id: 'dj-neon',
    title: 'DJ Set Neon',
    category: 'dj-set',
    date: 'Sábado',
    image: '/ESC3.png',
    alt: 'DJ tocando durante un set con luces de colores',
  },
  {
    id: 'pink-night',
    title: 'Fiesta ON',
    category: 'fiesta',
    date: 'Viernes',
    image: '/VIERNES.png',
    alt: 'Escenario rosa con público en una fiesta ON',
  },
  {
    id: 'special-show',
    title: 'Show Especial',
    category: 'especiales',
    date: 'Evento especial',
    image: '/SABADO.png',
    alt: 'Show especial con luces violetas y láser',
  },
  {
    id: 'full-black',
    title: 'Full Black',
    category: 'fiesta',
    date: 'Domingo',
    image: '/DOMINGO.png',
    alt: 'Noche Full Black con visuales neon',
  },
  {
    id: 'laser-stage',
    title: 'Laser Moment',
    category: 'especiales',
    date: 'Especial',
    image: '/ESC4.png',
    alt: 'Momento especial con láser sobre el escenario',
  },
  {
    id: 'late-session',
    title: 'Late Session',
    category: 'dj-set',
    date: 'DJ invitado',
    image: '/ESC5.png',
    alt: 'Sesión de DJ en ambiente oscuro con luces neon',
  },
  {
    id: 'private-blackout',
    title: 'Blackout privado',
    category: 'especiales',
    date: 'Privado',
    image: '/ESCENARIO2.png',
    alt: 'Escenario de evento privado Blackout',
  },
]

const neonButton =
  'rounded-xl border border-pink-500 bg-black/70 px-8 py-4 text-base font-extrabold uppercase tracking-wide text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-pink-400 hover:text-white hover:shadow-[0_0_28px_rgba(236,72,153,0.95)] active:scale-[0.98]'

function isGalleryFilter(value: string): value is GalleryFilter {
  return galleryFilters.some((filter) => filter.id === value)
}

function isGalleryCategory(value: string): value is GalleryCategory {
  return value === 'fiesta' || value === 'dj-set' || value === 'especiales'
}

function getCategoryLabel(category: GalleryCategory) {
  return (
    galleryFilters.find((filter) => filter.id === category)?.label ??
    'Especiales'
  )
}

function validateGalleryItem(item: GalleryItem): ValidatedGalleryItem | null {
  const id = item.id.trim()
  const title = item.title.trim()
  const image = item.image.trim()
  const alt = item.alt.trim() || title
  const date = item.date.trim() || 'Fecha por anunciar'

  if (!id || !title || !isGalleryCategory(item.category)) {
    return null
  }

  return {
    ...item,
    id,
    title,
    image,
    alt,
    date,
    categoryLabel: getCategoryLabel(item.category),
  }
}

function Galeria() {
  const [activeFilter, setActiveFilter] = useState<GalleryFilter>('todas')

  const validatedGalleryItems = useMemo(
    () =>
      galleryItems
        .map(validateGalleryItem)
        .filter((item): item is ValidatedGalleryItem => Boolean(item)),
    []
  )

  const visibleGalleryItems = useMemo(() => {
    if (!isGalleryFilter(activeFilter) || activeFilter === 'todas') {
      return validatedGalleryItems
    }

    return validatedGalleryItems.filter(
      (item) => item.category === activeFilter
    )
  }, [activeFilter, validatedGalleryItems])

  function handleFilterChange(nextFilter: GalleryFilter) {
    if (!isGalleryFilter(nextFilter)) return
    setActiveFilter(nextFilter)
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-black text-white">
      <Header />

      <section className="relative overflow-hidden border-b border-white/10">
        <img
          src="/ESCENARIO.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-45"
        />

        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.72)_44%,rgba(0,0,0,0.30)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_30%,rgba(236,72,153,0.24),transparent_22%),radial-gradient(circle_at_70%_42%,rgba(34,211,238,0.14),transparent_20%)]" />

        <div className="laser laser-pink top-[22%] left-[52%] w-[38%] rotate-[13deg]" />
        <div className="laser laser-blue top-[38%] right-[-6%] w-[34%] rotate-[-18deg]" />

        <div className="relative mx-auto grid min-h-[360px] max-w-[1700px] grid-cols-1 items-center gap-8 px-6 py-14 md:px-10 xl:grid-cols-[1.2fr_0.8fr] xl:px-14">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.48em] text-pink-400">
              Galería
            </p>

            <h1 className="leading-[0.9]">
              <span className="block text-5xl font-black uppercase tracking-tight text-white md:text-7xl">
                Momentos
              </span>

              {' '}

              <span className="reservation-neon-title block text-5xl font-black uppercase tracking-tight md:text-7xl">
                Blackout
              </span>
            </h1>

            <p className="mt-5 max-w-3xl text-lg text-white/78 md:text-2xl">
              Así se vive la experiencia{' '}
              <span className="font-extrabold text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.75)]">
                ON
              </span>
              .
            </p>
          </div>

          <div className="hidden items-center justify-end xl:flex">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-pink-500/30 bg-black/40 shadow-[0_0_42px_rgba(236,72,153,0.22)] backdrop-blur-sm">
              <div className="absolute inset-6 rounded-full border border-cyan-400/25 shadow-[0_0_28px_rgba(34,211,238,0.14)]" />
              <img
                src="/CONEJO_NUEVO.png"
                alt="Logo ON"
                className="relative z-10 w-36 drop-shadow-[0_0_28px_rgba(236,72,153,0.95)] transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 pt-10 md:px-10 xl:px-14">
        <div className="mx-auto max-w-[1700px]">
          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div
              role="tablist"
              aria-label="Filtros de galeria"
              className="grid overflow-hidden rounded-xl border border-white/10 bg-zinc-950/70 shadow-[0_0_28px_rgba(0,0,0,0.65)] backdrop-blur-md sm:grid-cols-2 xl:grid-cols-4"
            >
              {galleryFilters.map((filter) => {
                const Icon = filter.icon
                const isActive = activeFilter === filter.id

                return (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleFilterChange(filter.id)}
                    className={`group inline-flex min-h-14 items-center justify-center gap-3 border-b border-white/10 px-6 py-4 text-sm font-extrabold uppercase tracking-wide outline-none transition-all duration-300 last:border-b-0 sm:border-r sm:last:border-r-0 xl:border-b-0 ${
                      isActive
                        ? 'border-pink-500 bg-pink-500/12 text-pink-200 shadow-[0_0_22px_rgba(236,72,153,0.34)]'
                        : 'text-white/62 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.9}
                      className={`transition-all duration-300 group-hover:scale-110 ${
                        isActive
                          ? 'text-pink-300 drop-shadow-[0_0_10px_rgba(236,72,153,0.9)]'
                          : 'text-white/55'
                      }`}
                    />
                    {filter.label}
                  </button>
                )
              })}
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.28em] text-white/45">
              {visibleGalleryItems.length}{' '}
              {visibleGalleryItems.length === 1 ? 'momento' : 'momentos'}
            </p>
          </div>

          {visibleGalleryItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {visibleGalleryItems.map((item, index) => (
                <GalleryCard key={item.id} item={item} index={index} />
              ))}
            </div>
          ) : (
            <EmptyGalleryState />
          )}

          <div className="mt-8 rounded-[18px] border border-pink-500/55 bg-[linear-gradient(90deg,rgba(12,12,16,0.96),rgba(22,8,22,0.9),rgba(10,10,14,0.96))] px-6 py-6 shadow-[0_0_28px_rgba(236,72,153,0.16)] md:flex md:items-center md:justify-between md:px-8">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-pink-500 text-pink-300 shadow-[0_0_18px_rgba(236,72,153,0.55)]">
                <CalendarDays size={30} strokeWidth={1.8} />
              </div>

              <div>
                <h2 className="text-2xl font-black uppercase tracking-wide text-pink-300 md:text-3xl">
                  ¿Listo para tu noche?
                </h2>

                <p className="mt-1 text-white/70">
                  Reserva tu mesa y vive la experiencia Blackout.
                </p>
              </div>
            </div>

            <Link
              to="/reservaciones"
              className={`${neonButton} mt-6 inline-flex w-full items-center justify-center gap-3 md:mt-0 md:w-auto md:px-12`}
            >
              Reserva tu mesa
              <ChevronRight size={22} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function GalleryCard({
  item,
  index,
}: {
  item: ValidatedGalleryItem
  index: number
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(item.image) && !imageFailed
  const isTall = item.featured || index % 5 === 0

  return (
    <article
      className={`gallery-card-neon group relative overflow-hidden rounded-[18px] border border-white/10 bg-zinc-950 shadow-[0_0_24px_rgba(0,0,0,0.72)] transition-all duration-500 hover:-translate-y-2 hover:border-transparent hover:shadow-[0_0_42px_rgba(236,72,153,0.32)] active:scale-[0.99] ${
        isTall ? 'md:row-span-2' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          isTall ? 'min-h-[420px]' : 'min-h-[230px]'
        }`}
      >
        {showImage ? (
          <img
            src={item.image}
            alt={item.alt}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-center brightness-90 contrast-110 saturate-125 transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_38%,rgba(236,72,153,0.20),transparent_28%),linear-gradient(135deg,rgba(8,8,12,1),rgba(20,8,22,1))] px-8 text-center">
            <img
              src="/CONEJO_NUEVO.png"
              alt=""
              className="mb-5 w-24 opacity-80 drop-shadow-[0_0_24px_rgba(236,72,153,0.8)]"
            />
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/45">
              Imagen pendiente
            </p>
          </div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.02),rgba(0,0,0,0.26)_42%,rgba(0,0,0,0.90)_100%)]" />
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:bg-[radial-gradient(circle_at_50%_42%,rgba(236,72,153,0.15),transparent_28%)]" />

        <div className="absolute left-4 top-4 rounded-full border border-pink-500/50 bg-black/68 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.28)] backdrop-blur-md">
          {item.categoryLabel}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-white/55">
            {item.date}
          </p>

          <h3 className="text-2xl font-black uppercase leading-tight text-white drop-shadow-[0_0_14px_rgba(0,0,0,0.95)] md:text-3xl">
            {item.title}
          </h3>
        </div>
      </div>
    </article>
  )
}

function EmptyGalleryState() {
  return (
    <div className="rounded-[22px] border border-white/10 bg-zinc-950/78 px-8 py-14 text-center shadow-[0_0_28px_rgba(0,0,0,0.65)]">
      <Images
        size={54}
        strokeWidth={1.5}
        className="mx-auto text-pink-300 drop-shadow-[0_0_18px_rgba(236,72,153,0.8)]"
      />

      <h2 className="mt-5 text-3xl font-black uppercase tracking-wide text-white">
        No hay momentos todavía
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-white/58">
        Cuando el panel de administrador cargue imágenes para esta categoría,
        aparecerán aquí automáticamente.
      </p>
    </div>
  )
}

export default Galeria
