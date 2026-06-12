import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LockKeyhole, Menu, X } from 'lucide-react'

const neonButton =
  'border border-pink-500 rounded-md uppercase font-black text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.8)] transition-all duration-300 hover:scale-105 hover:bg-pink-500/10 hover:text-white hover:shadow-[0_0_28px_rgba(236,72,153,1)] active:scale-95'

function Header() {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const links = [
    { label: 'Inicio', path: '/' },
    { label: 'Eventos', path: '/eventos' },
    { label: 'Reservaciones', path: '/reservaciones' },
    { label: 'Galería', path: '/galeria' },
    { label: 'Info', path: '/info' },
  ]

  function closeMenu() {
    setIsMenuOpen(false)
  }

  return (
    <header className="relative z-50 flex h-28 w-full items-center justify-between border-b border-white/10 bg-black px-6 md:px-10 xl:px-16">
      <Link to="/" onClick={closeMenu}>
        <img
          src="/CONEJO_NUEVO.png"
          alt="Logo ON"
          className="w-16 object-contain drop-shadow-[0_0_18px_rgba(236,72,153,1)] transition-transform duration-300 hover:scale-110 active:scale-95"
        />
      </Link>

      <nav className="hidden gap-10 text-sm uppercase tracking-[0.28em] text-white/65 xl:flex">
        {links.map((link) => {
          const isActive = location.pathname === link.path

          return (
            <Link
              key={link.label}
              to={link.path}
              onClick={closeMenu}
              className={`group relative py-2 transition-all duration-300 hover:text-pink-300 hover:drop-shadow-[0_0_10px_rgba(236,72,153,1)] ${
                isActive ? 'text-pink-400' : ''
              }`}
            >
              {link.label}

              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,1)] transition-all duration-300 group-hover:w-full" />

              {isActive && (
                <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,1)]" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="hidden items-center gap-4 xl:flex">
        <Link
          to="/admin"
          onClick={closeMenu}
          className="inline-flex h-[58px] w-[58px] items-center justify-center rounded-md border border-white/10 text-white/55 transition-all duration-300 hover:border-pink-500/70 hover:bg-pink-500/10 hover:text-pink-200 hover:shadow-[0_0_20px_rgba(236,72,153,0.45)]"
          aria-label="Iniciar sesion admin"
          title="Admin"
        >
          <LockKeyhole size={22} />
        </Link>

        <Link
          to="/reservaciones"
          onClick={closeMenu}
          className={`${neonButton} px-8 py-4`}
        >
          Reserva
        </Link>
      </div>

      <button
        type="button"
        aria-label={isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
        className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-pink-500/70 text-pink-200 shadow-[0_0_16px_rgba(236,72,153,0.45)] transition-all duration-300 hover:bg-pink-500/10 hover:text-white hover:shadow-[0_0_24px_rgba(236,72,153,0.8)] active:scale-95 xl:hidden"
      >
        {isMenuOpen ? <X size={28} /> : <Menu size={30} />}
      </button>

      {isMenuOpen && (
        <div className="absolute left-4 right-4 top-[calc(100%+0.75rem)] rounded-2xl border border-pink-500/35 bg-black/95 p-4 shadow-[0_0_35px_rgba(236,72,153,0.28)] backdrop-blur-xl xl:hidden">
          <nav className="grid gap-2 text-sm uppercase tracking-[0.22em] text-white/70">
            {links.map((link) => {
              const isActive = location.pathname === link.path

              return (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={closeMenu}
                  className={`rounded-lg px-4 py-3 transition-all duration-300 hover:bg-pink-500/10 hover:text-white ${
                    isActive
                      ? 'bg-pink-500/15 text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.18)]'
                      : ''
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <Link
            to="/reservaciones"
            onClick={closeMenu}
            className={`${neonButton} mt-4 block px-6 py-4 text-center`}
          >
            Reserva
          </Link>

          <Link
            to="/admin"
            onClick={closeMenu}
            className="mt-3 flex items-center justify-center gap-3 rounded-md border border-white/10 px-6 py-4 text-center font-black uppercase tracking-wide text-white/70 transition-all duration-300 hover:border-pink-500/70 hover:bg-pink-500/10 hover:text-pink-200"
          >
            <LockKeyhole size={18} />
            Admin / RP
          </Link>
        </div>
      )}
    </header>
  )
}

export default Header
