import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import ResourcePage from './components/ResourcePage'
import AdminLayout from './layouts/AdminLayout'
import LoginPage from './pages/LoginPage'
import PublicEventsPage from './pages/PublicEventsPage'
import PublicCategoriesPage from './pages/PublicCategoriesPage'
import CategoryVotingPage from './pages/CategoryVotingPage'

const events = {
  title: 'Event',
  description: 'Tentukan periode dan status voting untuk setiap event.',
  endpoint: '/admin/events',
  fields: [
    { name: 'name', label: 'Nama event' },
    { name: 'start_date', label: 'Tanggal mulai', type: 'date' },
    { name: 'end_date', label: 'Tanggal selesai', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }] },
  ],
  columns: [
    { key: 'name', label: 'Event' },
    { key: 'start_date', label: 'Mulai' },
    { key: 'end_date', label: 'Selesai' },
    { key: 'status', label: 'Status' },
  ],
}

const categories = {
  title: 'Kategori',
  description: 'Kelompokkan finalis di dalam event yang sudah tersedia.',
  endpoint: '/admin/categories',
  fields: [
    { name: 'event_id', label: 'Event', type: 'select', optionsKey: 'events' },
    { name: 'name', label: 'Nama kategori' },
  ],
  columns: [
    { key: 'name', label: 'Kategori' },
    { label: 'Event', render: (item) => item.event?.name ?? '' },
    { key: 'finalists_count', label: 'Finalis' },
  ],
  options: { events: { endpoint: '/admin/events' } },
}

const finalists = {
  title: 'Finalis',
  description: 'Masukkan finalis beserta kategori dan deskripsi singkatnya.',
  endpoint: '/admin/finalists',
  fields: [
    { name: 'category_id', label: 'Kategori', type: 'select', optionsKey: 'categories' },
    { name: 'name', label: 'Nama finalis' },
    { name: 'photo', label: 'Foto', type: 'file' },
    { name: 'description', label: 'Deskripsi', type: 'textarea' },
  ],
  columns: [
    { key: 'name', label: 'Finalis' },
    { label: 'Kategori', render: (item) => item.category?.name ?? '' },
    { key: 'vote_count', label: 'Suara' },
  ],
  options: { categories: { endpoint: '/admin/categories' } },
}

function ProtectedApp() {
  const { token, ready } = useAuth()
  if (!ready) return <p className="boot-state">Memeriksa sesi admin...</p>
  if (!token) return <Navigate to="/login" replace />
  return <AdminLayout />
}

function LoginRoute() {
  const { token, ready } = useAuth()
  if (!ready) return <p className="boot-state">Memeriksa sesi admin...</p>
  return token ? <Navigate to="/admin/events" replace /> : <LoginPage />
}

export default function App() {
  return <AuthProvider><Routes><Route path="/" element={<PublicEventsPage />} /><Route path="/events/:eventId" element={<PublicCategoriesPage />} /><Route path="/categories/:categoryId" element={<CategoryVotingPage />} /><Route path="/login" element={<LoginRoute />} /><Route path="/admin" element={<ProtectedApp />}><Route index element={<Navigate to="events" replace />} /><Route path="events" element={<ResourcePage {...events} />} /><Route path="categories" element={<ResourcePage {...categories} />} /><Route path="finalists" element={<ResourcePage {...finalists} />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider>
}
