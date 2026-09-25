import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const links = [
  { to: '/admin/events', label: 'Event' },
  { to: '/admin/categories', label: 'Kategori' },
  { to: '/admin/finalists', label: 'Finalis' },
]

export default function AdminLayout() {
  const { admin, logout } = useAuth()

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('sebaris.theme', next)
  }

  return (
    <div className="admin-shell">
      <header className="topbar">
        <NavLink to="/admin/events" className="wordmark">sebaris.id</NavLink>
        <div className="topbar-actions">
          <span className="admin-name">{admin?.name}</span>
          <button type="button" className="icon-button" onClick={toggleTheme} aria-label="Ubah tema warna" title="Ubah tema warna">Tema</button>
          <button type="button" className="text-button" onClick={logout}>Keluar</button>
        </div>
      </header>
      <div className="workspace">
        <nav className="section-nav" aria-label="Navigasi admin">
          {links.map((link) => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)}
        </nav>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
