import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import SebarisLogo from './SebarisLogo'
import { IconSearch, IconBell, IconMenu, IconClose } from './Icons'
import { useAuth, useUserAuth } from '../auth/AuthProvider'
import UserAuthModal from './UserAuthModal'

export default function PublicHeader({ searchQuery = '', onSearchChange, onOpenCheckVote }) {
  const { token } = useAuth()
  const { user, userReady } = useUserAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [headerSearch, setHeaderSearch] = useState(searchQuery)

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (onSearchChange) {
      onSearchChange(headerSearch)
    }
    const target = document.getElementById('voting-section')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
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

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5EADF] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Sebaris.id Beranda">
          <SebarisLogo size="md" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Navigasi Utama">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `relative px-3 py-2 text-sm font-bold transition-colors ${
                isActive ? 'text-[#70B325]' : 'text-[#262A25] hover:text-[#70B325]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span>Beranda</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.75 bg-[#70B325] rounded-full" />
                )}
              </>
            )}
          </NavLink>

          <a
            href="/#voting-section"
            className="px-3 py-2 text-sm font-semibold text-[#262A25] hover:text-[#70B325] transition-colors"
          >
            Voting
          </a>

          <button
            type="button"
            onClick={handleCheckVoteClick}
            className="px-3 py-2 text-sm font-semibold text-[#262A25] hover:text-[#70B325] transition-colors bg-transparent border-none text-left cursor-pointer"
          >
            Cek Vote
          </button>
        </nav>

        {/* Center / Right Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden lg:flex items-center flex-1 max-w-xs relative"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => {
                setHeaderSearch(e.target.value)
                if (onSearchChange) onSearchChange(e.target.value)
              }}
              placeholder="Cari voting atau event..."
              className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm bg-[#F4F6F2] hover:bg-gray-100 focus:bg-white text-[#262A25] placeholder-gray-400 rounded-full border border-transparent focus:border-[#70B325] focus:outline-none transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <IconSearch className="w-4 h-4" />
            </span>
          </div>
        </form>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Button */}
          <button
            type="button"
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:text-[#262A25] hover:bg-gray-100 transition-colors relative"
            aria-label="Pemberitahuan"
            title="Pemberitahuan"
          >
            <IconBell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#70B325]" />
          </button>

          {/* Admin Dashboard CTA if admin logged in */}
          {token && (
            <Link
              to="/admin/categories"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#262A25] text-white text-xs font-bold hover:bg-black transition-colors no-underline"
              title="Buka Dashboard Administrator"
            >
              <span>Dashboard Admin</span>
            </Link>
          )}

          {/* User Account Button — skeleton while auth loads to prevent flash */}
          {!userReady ? (
            <div className="h-8 w-28 rounded-full bg-gray-100 animate-pulse" />
          ) : user ? (
            <button
              type="button"
              onClick={() => setUserModalOpen(true)}
              className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-[#F4F9EE] border border-[#D5E6C4] hover:bg-[#EAF3DE] transition-colors cursor-pointer"
              title="Buka profil pemilih & riwayat vote"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-[#70B325]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#70B325] text-white font-bold text-xs flex items-center justify-center">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs font-bold text-[#262A25] hidden sm:inline max-w-[110px] truncate">
                {user.name}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 py-1.5 px-4 rounded-full bg-[#70B325] hover:bg-[#5c9420] text-white transition-all text-xs font-bold shadow-sm cursor-pointer"
            >
              <span>Masuk &amp; Daftar</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-[#262A25] rounded-lg hover:bg-gray-100"
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? <IconClose className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2 animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="mb-3">
            <div className="relative w-full">
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => {
                  setHeaderSearch(e.target.value)
                  if (onSearchChange) onSearchChange(e.target.value)
                }}
                placeholder="Cari voting atau event..."
                className="w-full h-10 pl-9 pr-3 text-sm bg-[#F4F6F2] rounded-full border border-gray-200"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <IconSearch className="w-4 h-4" />
              </span>
            </div>
          </form>

          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg font-bold text-sm text-[#70B325] bg-[#F4F9EE]"
          >
            Beranda
          </NavLink>
          <a
            href="/#voting-section"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg font-medium text-sm text-[#262A25] hover:bg-gray-50"
          >
            Voting
          </a>
          <button
            type="button"
            onClick={handleCheckVoteClick}
            className="w-full text-left px-3 py-2 rounded-lg font-medium text-sm text-[#262A25] hover:bg-gray-50"
          >
            Cek Vote
          </button>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setUserModalOpen(true)
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#D5E6C4] text-[#262A25] font-bold text-sm bg-[#F4F9EE]"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#70B325] text-white text-xs flex items-center justify-center font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="truncate max-w-[160px]">{user.name}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/login')
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#70B325] text-white font-bold text-sm"
              >
                <span>Masuk &amp; Daftar</span>
              </button>
            )}

            {token && (
              <Link
                to="/admin/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 rounded-xl bg-[#262A25] text-white font-bold text-sm no-underline"
              >
                Dashboard Administrator
              </Link>
            )}
          </div>
        </div>
      )}

      {/* User Login & History Modal */}
      <UserAuthModal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} />
    </header>
  )
}
