import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import SebarisLogo from './SebarisLogo'
import { IconSearch, IconMenu, IconClose, IconSun, IconMoon } from './Icons'
import { useAuth, useUserAuth } from '../auth/AuthProvider'
import { useTheme } from '../context/ThemeProvider'
import UserAuthModal from './UserAuthModal'

export default function PublicHeader({ searchQuery = '', onSearchChange, onOpenCheckVote }) {
  const { token } = useAuth()
  const { user, userReady } = useUserAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [headerSearch, setHeaderSearch] = useState(searchQuery)
  const [isScrolled, setIsScrolled] = useState(false)

  // Track window scroll
  useEffect(() => {
    function handleScroll() {
      // Transition to solid glass when scrolled past 60px
      setIsScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Header is floating over dark hero section when at top of homepage
  const isHomePage = location.pathname === '/'
  const isOverHero = isHomePage && !isScrolled

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (onSearchChange) {
      onSearchChange(headerSearch)
    }
    const target = document.getElementById('voting-section')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  function handleCheckVoteClick(e) {
    e.preventDefault()
    if (onOpenCheckVote) {
      onOpenCheckVote()
    } else {
      const el = document.getElementById('cek-vote-box')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        const input = el.querySelector('input')
        if (input) input.focus()
      }
    }
    setMobileMenuOpen(false)
  }

  function handleVoteClick(e) {
    if (window.location.pathname === '/') {
      e.preventDefault()
      const target = document.getElementById('voting-section')
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 sm:top-3 z-50 w-full px-2.5 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto pointer-events-auto h-16 sm:h-18 px-4 sm:px-6 lg:px-8 rounded-full flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300 ${
          isOverHero
            ? 'backdrop-blur-xl bg-black/35 border border-white/20 text-white shadow-lg'
            : theme === 'dark'
            ? 'backdrop-blur-2xl bg-[#121612]/90 border border-[#2C3529] text-white shadow-2xl shadow-black/40'
            : 'backdrop-blur-2xl bg-white/90 border border-[#E5EADF] text-gray-800 shadow-xl shadow-gray-200/50'
        }`}
      >
        
        {/* 1. LOGO KIRI SENDIRI */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0 group focus:outline-none"
          aria-label="Sebaris.id Beranda"
        >
          <SebarisLogo
            size="md"
            variant={isOverHero || theme === 'dark' ? 'white' : 'default'}
          />
        </Link>

        {/* 2. NAVBAR TENGAH OVAL / CAPSULE TANPA BULATAN DI MENU */}
        <nav
          aria-label="Navigasi Utama"
          className={`hidden md:inline-flex items-center gap-1 sm:gap-2 px-4 py-1.5 rounded-full backdrop-blur-md transition-all ${
            isOverHero || theme === 'dark'
              ? 'bg-white/10 border border-white/15 text-white'
              : 'bg-black/5 border border-black/10 text-gray-800'
          }`}
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1 text-xs lg:text-sm transition-colors ${
                isActive
                  ? 'text-[#70B325] dark:text-[#8FE032] font-extrabold'
                  : isOverHero || theme === 'dark'
                  ? 'text-white/80 hover:text-white font-medium'
                  : 'text-gray-600 hover:text-[#70B325] font-medium'
              }`
            }
          >
            Beranda
          </NavLink>

          <a
            href="/#voting-section"
            onClick={handleVoteClick}
            className={`px-3 py-1 text-xs lg:text-sm font-medium transition-colors ${
              isOverHero || theme === 'dark'
                ? 'text-white/80 hover:text-white'
                : 'text-gray-600 hover:text-[#70B325]'
            }`}
          >
            Vote
          </a>

          <button
            type="button"
            onClick={handleCheckVoteClick}
            className={`px-3 py-1 text-xs lg:text-sm font-medium transition-colors cursor-pointer ${
              isOverHero || theme === 'dark'
                ? 'text-white/80 hover:text-white'
                : 'text-gray-600 hover:text-[#70B325]'
            }`}
          >
            Cek Vote
          </button>
        </nav>

        {/* 3. BAGIAN KANAN: TOGGLE THEME + TOMBOL MASUK & DAFTAR TERPISAH */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Toggle Mode Terang & Gelap */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
              isOverHero || theme === 'dark'
                ? 'bg-white/10 border border-white/20 text-amber-400 hover:bg-white/20'
                : 'bg-black/5 border border-black/10 text-gray-700 hover:bg-black/10'
            }`}
            aria-label="Ubah Tema"
            title={`Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
          >
            {theme === 'dark' ? (
              <IconSun className="w-4 h-4 text-amber-400 animate-fadeIn" />
            ) : isOverHero ? (
              <IconMoon className="w-4 h-4 text-white animate-fadeIn" />
            ) : (
              <IconMoon className="w-4 h-4 text-gray-700 animate-fadeIn" />
            )}
          </button>

          {/* Admin Dashboard CTA if admin logged in */}
          {token && (
            <Link
              to="/admin/categories"
              className={`hidden xl:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors no-underline ${
                isOverHero
                  ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                  : 'bg-[#262A25] text-white hover:bg-black'
              }`}
              title="Buka Dashboard Administrator"
            >
              <span>Dashboard Admin</span>
            </Link>
          )}

          {/* User Account / Masuk & Daftar Terpisah */}
          {!userReady ? (
            <div className="h-9 w-24 rounded-full bg-white/10 animate-pulse hidden sm:block" />
          ) : user ? (
            <button
              type="button"
              onClick={() => setUserModalOpen(true)}
              className={`flex items-center gap-2 py-1.5 px-3.5 rounded-full transition-colors cursor-pointer ${
                isOverHero || theme === 'dark'
                  ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  : 'bg-[#F4F9EE] border border-[#D5E6C4] text-[#262A25] hover:bg-[#EAF3DE]'
              }`}
              title="Buka profil pemilih & riwayat vote"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover border border-[#70B325]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#70B325] text-white font-bold text-xs flex items-center justify-center">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs font-bold hidden sm:inline max-w-[110px] truncate">
                {user.name}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Tombol Masuk */}
              <Link
                to="/login?tab=login"
                className={`inline-flex items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold transition-colors ${
                  isOverHero || theme === 'dark'
                    ? 'text-white/90 hover:text-white'
                    : 'text-[#262A25] hover:text-[#70B325]'
                }`}
              >
                Masuk
              </Link>

              {/* Tombol Daftar */}
              <Link
                to="/login?tab=register"
                className={`inline-flex items-center px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-extrabold rounded-full shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer ${
                  isOverHero || theme === 'dark'
                    ? 'bg-white text-gray-950 hover:bg-[#D0FE15]'
                    : 'bg-[#262A25] text-white hover:bg-[#70B325]'
                }`}
              >
                Daftar
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              isOverHero || theme === 'dark'
                ? 'bg-white/10 border border-white/20 text-white'
                : 'bg-black/5 border border-black/10 text-gray-800'
            }`}
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? <IconClose className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE RESPONSIVE DRAWER / DROPDOWN PANEL */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-7xl mx-auto px-2.5 sm:px-4 pb-4 animate-fadeIn pointer-events-auto">
          <div className="mt-2 rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-[#1A2019]/95 border border-[#E5EADF] dark:border-[#2C3529] p-5 shadow-2xl space-y-4">
            
            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit}>
              <div className="relative w-full">
                <input
                  type="text"
                  value={headerSearch}
                  onChange={(e) => {
                    setHeaderSearch(e.target.value)
                    if (onSearchChange) onSearchChange(e.target.value)
                  }}
                  placeholder="Cari voting atau event..."
                  className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm bg-gray-50 dark:bg-white/5 text-[#262A25] dark:text-white placeholder-gray-400 rounded-full border border-gray-200 dark:border-white/10 focus:border-[#70B325] focus:outline-none"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <IconSearch className="w-4 h-4" />
                </span>
              </div>
            </form>

            {/* Navigasi Mobile */}
            <div className="space-y-1.5">
              <NavLink
                to="/"
                end
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    isActive
                      ? 'text-[#70B325] dark:text-[#8FE032] bg-[#70B325]/10 font-extrabold'
                      : 'text-[#262A25] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`
                }
              >
                Beranda
              </NavLink>

              <a
                href="/#voting-section"
                onClick={handleVoteClick}
                className="flex items-center px-4 py-3 rounded-2xl font-semibold text-sm text-[#262A25] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                Vote
              </a>

              <button
                type="button"
                onClick={handleCheckVoteClick}
                className="w-full text-left flex items-center px-4 py-3 rounded-2xl font-semibold text-sm text-[#262A25] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                Cek Vote
              </button>
            </div>

            {/* Mobile Actions: Masuk & Daftar Terpisah */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/10 space-y-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setUserModalOpen(true)
                  }}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border border-[#D5E6C4] dark:border-white/20 text-[#262A25] dark:text-white font-bold text-sm bg-[#F4F9EE] dark:bg-white/10"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#70B325] text-white text-xs flex items-center justify-center font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="truncate max-w-[200px]">{user.name}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/login?tab=login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-3 rounded-2xl border border-gray-300 dark:border-white/20 text-[#262A25] dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/login?tab=register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-3 rounded-2xl bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-sm shadow-sm transition-colors"
                  >
                    Daftar
                  </Link>
                </div>
              )}

              {token && (
                <Link
                  to="/admin/categories"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-2.5 rounded-2xl bg-[#262A25] dark:bg-white/10 text-white font-bold text-xs no-underline"
                >
                  Dashboard Administrator
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Login & History Modal */}
      <UserAuthModal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} />
    </header>
  )
}
