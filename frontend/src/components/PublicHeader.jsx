import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import SebarisLogo from './SebarisLogo'
import { IconSearch, IconMenu, IconClose, IconSun, IconMoon, IconLogout } from './Icons'
import { useAuth, useUserAuth } from '../auth/AuthProvider'
import { useTheme } from '../context/ThemeProvider'
import UserAuthModal from './UserAuthModal'

export default function PublicHeader({ searchQuery = '', onSearchChange, onOpenCheckVote }) {
  const { token, admin, logout } = useAuth()
  const { user, userReady } = useUserAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [headerSearch, setHeaderSearch] = useState(searchQuery)
  const [isScrolled, setIsScrolled] = useState(false)

  const isAdmin = Boolean(token)
  const isVoter = Boolean(user)

  // Track window scroll
  useEffect(() => {
    function handleScroll() {
      // Transition slightly stronger glass when scrolled past 40px
      setIsScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    if (e && e.preventDefault) e.preventDefault()
    if (window.location.pathname === '/') {
      const target = document.getElementById('voting-section')
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate('/')
      setTimeout(() => {
        const target = document.getElementById('voting-section')
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
        }
      }, 150)
    }
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 sm:top-3 z-50 w-full px-2.5 sm:px-6 lg:px-8 pt-[env(safe-area-inset-top,0px)] pointer-events-none transition-all duration-300">
        <div
          className={`max-w-7xl mx-auto pointer-events-auto h-16 sm:h-18 px-4 sm:px-8 rounded-full flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300 backdrop-blur-xl backdrop-saturate-150 ios-isolate ${
            theme === 'dark'
              ? isScrolled
                ? 'bg-[#131912]/92 border border-white/15 text-white shadow-2xl shadow-black/50'
                : 'bg-[#131912]/80 border border-white/10 text-white shadow-xl shadow-black/30'
              : isScrolled
              ? 'bg-white/92 border border-white/90 text-gray-900 shadow-xl shadow-gray-900/10'
              : 'bg-white/80 border border-white/80 text-gray-900 shadow-lg shadow-gray-900/5'
          }`}
        >
          {/* 1. LOGO KIRI */}
          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0 group focus:outline-none"
            aria-label="Sebaris.id Beranda"
          >
            <SebarisLogo
              size="sm"
              variant={theme === 'dark' ? 'white' : 'default'}
              className="sm:hidden"
            />
            <SebarisLogo
              size="md"
              variant={theme === 'dark' ? 'white' : 'default'}
              className="hidden sm:flex"
            />
          </Link>

          {/* 2. MENU TENGAH LANGSUNG TANPA KAPSUL */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-7 lg:gap-9 text-xs sm:text-sm font-semibold tracking-wide transition-all"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `transition-colors duration-200 ${
                  isActive
                    ? 'text-[#70B325] dark:text-[#8FE032] font-black'
                    : 'text-gray-700 dark:text-gray-200 hover:text-[#70B325] dark:hover:text-[#8FE032] font-medium'
                }`
              }
            >
              Beranda
            </NavLink>

            <button
              type="button"
              onClick={handleVoteClick}
              className="text-gray-700 dark:text-gray-200 hover:text-[#70B325] dark:hover:text-[#8FE032] font-medium transition-colors duration-200 cursor-pointer"
            >
              Vote
            </button>

            <button
              type="button"
              onClick={handleCheckVoteClick}
              className="text-gray-700 dark:text-gray-200 hover:text-[#70B325] dark:hover:text-[#8FE032] font-medium transition-colors duration-200 cursor-pointer"
            >
              Cek Vote
            </button>

            <NavLink
              to="/daftarkan-vote"
              className={({ isActive }) =>
                `transition-colors duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#70B325] dark:text-[#8FE032] font-black'
                    : 'text-gray-700 dark:text-gray-200 hover:text-[#70B325] dark:hover:text-[#8FE032] font-medium'
                }`
              }
            >
              <span>Daftarkan Vote</span>
              <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider bg-[#EBF7E3] text-[#48781B] dark:bg-[#70B325]/20 dark:text-[#8FE032]">
                Panitia
              </span>
            </NavLink>
          </nav>

          {/* 3. BAGIAN KANAN: TOGGLE THEME + AUTH ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Toggle Mode Terang & Gelap */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 text-gray-700 dark:text-amber-400 hover:bg-black/10 dark:hover:bg-white/20 flex-shrink-0"
              aria-label="Ubah Tema"
              title={`Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
            >
              {theme === 'dark' ? (
                <IconSun className="w-4 h-4 text-amber-400 animate-fadeIn" />
              ) : (
                <IconMoon className="w-4 h-4 text-gray-700 animate-fadeIn" />
              )}
            </button>

            {/* AUTH LOGIC */}
            {isAdmin ? (
              /* KONDISI 1: ADMIN LOGIN - Hanya tampilkan Dashboard Admin & Profil Logout di desktop, mobile lewat drawer */
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/admin/categories"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[#262A25] text-white hover:bg-black dark:bg-[#70B325] dark:text-[#0E140E] dark:hover:bg-[#8FE032] transition-all no-underline shadow-xs"
                  title="Buka Dashboard Administrator"
                >
                  <span>Dashboard Admin</span>
                </Link>

                <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-white/15">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-[#70B325] text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <span
                      className="text-xs font-bold text-gray-800 dark:text-gray-200 max-w-[100px] truncate"
                      title={admin?.name || 'Administrator'}
                    >
                      {admin?.name?.split(' ')[0] || 'Admin'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Keluar dari sesi Administrator"
                  >
                    <IconLogout className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Keluar</span>
                  </button>
                </div>
              </div>
            ) : isVoter ? (
              /* KONDISI 2: VOTER USER LOGIN - Tampilkan Profil Voter */
              <button
                type="button"
                onClick={() => setUserModalOpen(true)}
                className="flex items-center gap-2 py-1.5 px-2.5 sm:px-3.5 rounded-full transition-colors cursor-pointer bg-[#F4F9EE] dark:bg-white/10 border border-[#D5E6C4] dark:border-white/15 text-[#262A25] dark:text-white hover:bg-[#EAF3DE] dark:hover:bg-white/20"
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
              /* KONDISI 3: BELUM LOGIN SIAPAPUN - Desktop: Masuk & Daftar, Mobile: Lewat Hamburger Drawer */
              <div className="hidden sm:flex items-center gap-1 sm:gap-2">
                <Link
                  to="/login?tab=login"
                  className="inline-flex items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#262A25] dark:text-gray-200 hover:text-[#70B325] dark:hover:text-[#8FE032] transition-colors"
                >
                  Masuk
                </Link>

                <Link
                  to="/login?tab=register"
                  className="inline-flex items-center px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-extrabold rounded-full bg-[#262A25] text-white hover:bg-[#70B325] dark:bg-white dark:text-gray-950 dark:hover:bg-[#8FE032] shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  Daftar
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger Button (Selalu tampak jelas & tidak pernah terdorong keluar layar) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15 text-gray-900 dark:text-white hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 flex-shrink-0"
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu navigasi'}
            >
              {mobileMenuOpen ? (
                <IconClose className="w-5 h-5 text-gray-900 dark:text-white stroke-[2.5]" />
              ) : (
                <IconMenu className="w-5 h-5 text-gray-900 dark:text-white stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE RESPONSIVE DRAWER / DROPDOWN PANEL */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs pointer-events-auto transition-opacity"
              aria-hidden="true"
            />

            {/* Floating Mobile Card */}
            <div className="md:hidden fixed top-[calc(env(safe-area-inset-top,0px)+4.5rem)] inset-x-3 sm:inset-x-6 z-50 pointer-events-auto animate-fadeIn">
              <div className="rounded-3xl backdrop-blur-2xl bg-white/95 dark:bg-[#151C14]/95 border border-white/60 dark:border-white/15 p-5 shadow-2xl space-y-4 max-h-[82vh] overflow-y-auto ios-isolate">
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

                  <button
                    type="button"
                    onClick={handleVoteClick}
                    className="w-full text-left flex items-center px-4 py-3 rounded-2xl font-semibold text-sm text-[#262A25] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Vote
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckVoteClick}
                    className="w-full text-left flex items-center px-4 py-3 rounded-2xl font-semibold text-sm text-[#262A25] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cek Vote
                  </button>

                  <NavLink
                    to="/daftarkan-vote"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${
                        isActive
                          ? 'text-[#70B325] dark:text-[#8FE032] bg-[#70B325]/10 font-extrabold'
                          : 'text-[#262A25] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`
                    }
                  >
                    <span>Daftarkan Vote</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#EBF7E3] text-[#48781B] dark:bg-[#70B325]/20 dark:text-[#8FE032]">
                      Panitia
                    </span>
                  </NavLink>
                </div>

                {/* Mobile Actions: Auth State */}
                <div className="pt-3 border-t border-gray-100 dark:border-white/10 space-y-2">
                  {isAdmin ? (
                    /* Admin Mobile State: Info Admin + Link Dashboard + Tombol Keluar */
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                        <div className="w-8 h-8 rounded-full bg-[#70B325] text-white font-black text-sm flex items-center justify-center">
                          {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase text-[#48781B] dark:text-[#8FE032] block">
                            Administrator Terhubung
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate block">
                            {admin?.name || 'Admin Sebaris'}
                          </span>
                        </div>
                      </div>

                      <Link
                        to="/admin/categories"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-center py-2.5 rounded-2xl bg-[#262A25] dark:bg-[#70B325] text-white dark:text-gray-950 font-bold text-xs no-underline shadow-xs"
                      >
                        Buka Dashboard Admin
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          logout()
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                      >
                        <IconLogout className="w-3.5 h-3.5" />
                        <span>Keluar dari Admin</span>
                      </button>
                    </div>
                  ) : isVoter ? (
                    /* Voter User Mobile State: Profil & Riwayat */
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setUserModalOpen(true)
                      }}
                      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border border-[#D5E6C4] dark:border-white/20 text-[#262A25] dark:text-white font-bold text-sm bg-[#F4F9EE] dark:bg-white/10"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-6 h-6 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#70B325] text-white text-xs flex items-center justify-center font-bold">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <span className="truncate max-w-[200px]">{user.name}</span>
                    </button>
                  ) : (
                    /* Belum Login Siapapun: Masuk & Daftar */
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
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* User Login & History Modal */}
      <UserAuthModal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} />
    </>
  )
}
