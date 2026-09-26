import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import SebarisLogo from '../components/SebarisLogo'
import {
  IconSun,
  IconMoon,
  IconExternal,
  IconTrophy,
  IconLayers,
  IconUsers,
  IconMenu,
  IconClose,
  IconBarChart,
} from '../components/Icons'
import { api } from '../api/client'

const NAV_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: IconBarChart },
  { to: '/admin/categories', label: 'Kategori', icon: IconLayers },
  { to: '/admin/finalists', label: 'Finalis', icon: IconUsers },
]

export default function AdminLayout() {
  const { admin, logout, token } = useAuth()
  const location = useLocation()
  const [theme, setTheme] = useState(
    () => localStorage.getItem('sebaris.theme') || (document.documentElement.dataset.theme || 'light')
  )
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [counts, setCounts] = useState({ categories: 0, finalists: 0 })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('sebaris.theme', theme)
  }, [theme])

  // Fetch count badges for sidebar
  useEffect(() => {
    if (!token) return
    Promise.allSettled([
      api('/admin/categories', { token }),
      api('/admin/finalists', { token }),
    ]).then(([resCats, resFinalists]) => {
      setCounts({
        categories: resCats.status === 'fulfilled' && resCats.value?.data ? resCats.value.data.length : 0,
        finalists: resFinalists.status === 'fulfilled' && resFinalists.value?.data ? resFinalists.value.data.length : 0,
      })
    })
  }, [token, location.pathname])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Current page title from location
  const currentNav = NAV_LINKS.find((item) => location.pathname.startsWith(item.to)) || NAV_LINKS[0]

  return (
    <div className="admin-shell flex flex-col min-h-screen bg-[var(--neutral-bg)] text-[var(--neutral-text-main)]">
      {/* Top Header Bar */}
      <header className="admin-header flex items-center justify-between px-4 sm:px-6 border-b border-[var(--neutral-border)] bg-[var(--neutral-surface)]">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Mobile Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle menu navigasi"
          >
            {mobileSidebarOpen ? <IconClose className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link to="/admin/categories" className="flex items-center no-underline">
            <SebarisLogo size="sm" variant={theme === 'dark' ? 'white' : 'default'} />
          </Link>

          {/* Breadcrumb Indicator */}
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-gray-800 text-xs">
            <span className="text-gray-400 font-semibold">Admin</span>
            <span className="text-gray-400">/</span>
            <span className="text-[var(--brand-primary)] font-bold">{currentNav.label}</span>
          </div>
        </div>

        {/* Topbar Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick link to public website */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] transition-colors no-underline"
            title="Buka Website Publik di tab baru"
          >
            <span>Lihat Website</span>
            <IconExternal className="w-3.5 h-3.5" />
          </Link>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] transition-colors"
            aria-label="Ubah tema warna"
            title={`Ubah ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
          >
            {theme === 'dark' ? <IconSun className="w-4 h-4 text-amber-400" /> : <IconMoon className="w-4 h-4" />}
          </button>

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
            {admin?.avatar ? (
              <img
                src={admin.avatar}
                alt={admin.name || 'Admin'}
                className="w-8 h-8 rounded-full object-cover border border-[var(--neutral-border)] shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <div className="hidden md:block text-left">
              <span className="block text-xs font-bold leading-tight">
                {admin?.name || 'Admin Sebaris'}
              </span>
              <span className="block text-[10px] text-[var(--brand-primary)] font-semibold">
                Superadmin
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="ml-1 sm:ml-2 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
              title="Keluar dari akun admin"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex w-full">
        {/* Sidebar Navigation */}
        <aside
          className={`admin-sidebar p-4 space-y-6 flex flex-col justify-between ${
            mobileSidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 shadow-2xl block'
              : 'hidden md:flex'
          }`}
        >
          <div className="space-y-4">
            <div className="px-3 pt-2">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Menu Manajemen
              </span>
            </div>

            <nav className="space-y-1.5" aria-label="Navigasi admin utama">
              {NAV_LINKS.map((link) => {
                const IconComponent = link.icon
                const countKey = link.label === 'Kategori' ? 'categories' : link.label === 'Finalis' ? 'finalists' : null
                const badgeCount = counts[countKey]

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `admin-nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className="w-4 h-4 flex-shrink-0" />
                      <span>{link.label}</span>
                    </div>

                    {badgeCount > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {badgeCount}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 bg-[var(--brand-primary-light)] rounded-xl border border-[var(--brand-primary)]/20 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
              <span className="text-xs font-bold text-[var(--brand-primary)]">
                Sistem Sebaris Aktif
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              API REST & E-Voting Engine terhubung normal.
            </p>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs"
          />
        )}

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
