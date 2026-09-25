import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import GoogleOneTap from './components/GoogleOneTap'
import ResourcePage from './components/ResourcePage'
import AdminLayout from './layouts/AdminLayout'
import LoginPage from './pages/LoginPage'
import PublicEventsPage from './pages/PublicEventsPage'
import CategoryVotingPage from './pages/CategoryVotingPage'
import { resolveStorageUrl } from './api/client'

const categories = {
  title: 'Kategori Voting',
  description: 'Kelola sesi voting, thumbnail poster, penyelenggara, periode, dan status pemilihan.',
  endpoint: '/admin/categories',
  fields: [
    { name: 'thumbnail', label: 'Poster / Thumbnail Voting', type: 'file' },
    { name: 'name', label: 'Nama Kategori / Sesi Voting' },
    { name: 'organizer', label: 'Penyelenggara' },
    { name: 'start_date', label: 'Tanggal Mulai', type: 'date' },
    { name: 'end_date', label: 'Tanggal Selesai', type: 'date' },
    {
      name: 'status',
      label: 'Status Voting',
      type: 'select',
      options: [
        { value: 'active', label: 'Aktif (Bisa Di-vote)' },
        { value: 'inactive', label: 'Nonaktif / Selesai' },
      ],
    },
    { name: 'description', label: 'Deskripsi Voting', type: 'textarea' },
  ],
  columns: [
    {
      key: 'name',
      label: 'Sesi Voting',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.thumbnail || item.thumbnail_url ? (
            <img
              src={resolveStorageUrl(item.thumbnail_url || item.thumbnail)}
              alt={item.name}
              className="w-11 h-11 rounded-xl object-cover border border-[var(--neutral-border)] flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-black text-xs flex items-center justify-center flex-shrink-0">
              {item.name?.slice(0, 2)?.toUpperCase() || 'VT'}
            </div>
          )}
          <div className="min-w-0">
            <span className="font-extrabold block text-sm text-[var(--neutral-text-main)] truncate max-w-xs">
              {item.name}
            </span>
            <span className="text-xs text-gray-500 block truncate">
              {item.organizer || 'Tanpa Penyelenggara'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'period',
      label: 'Periode',
      render: (item) => (
        <div className="text-xs">
          <span className="font-semibold text-gray-700 dark:text-gray-300 block">
            {item.start_date || '-'}
          </span>
          <span className="text-gray-400 block">s/d {item.end_date || '-'}</span>
        </div>
      ),
    },
    { key: 'finalists_count', label: 'Jumlah Finalis' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            item.status === 'active'
              ? 'bg-[#EBF7E3] text-[#48781B]'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              item.status === 'active' ? 'bg-[#70B325] animate-pulse' : 'bg-gray-400'
            }`}
          />
          {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
  ],
  options: {},
}

const finalists = {
  title: 'Finalis',
  description: 'Daftarkan kandidat finalis, foto poster, nomor urut, dan asal/deskripsi.',
  endpoint: '/admin/finalists',
  fields: [
    { name: 'category_id', label: 'Kategori Voting', type: 'select', optionsKey: 'categories' },
    { name: 'name', label: 'Nama Lengkap Finalis' },
    { name: 'photo', label: 'Foto / Poster Finalis', type: 'file' },
    { name: 'description', label: 'Asal Daerah / Deskripsi Finalis', type: 'textarea' },
  ],
  columns: [
    {
      key: 'name',
      label: 'Finalis',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.photo || item.photo_url ? (
            <img
              src={resolveStorageUrl(item.photo_url || item.photo)}
              alt={item.name}
              className="w-11 h-11 rounded-xl object-cover border border-[var(--neutral-border)] flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center flex-shrink-0">
              {item.name?.slice(0, 2)?.toUpperCase() || 'FN'}
            </div>
          )}
          <div className="min-w-0">
            <span className="font-extrabold block text-sm text-[var(--neutral-text-main)] truncate max-w-xs">
              {item.name}
            </span>
            <span className="text-xs text-gray-500 block truncate">
              {item.description || 'Tidak ada deskripsi'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Kategori Voting',
      render: (item) => (
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {item.category?.name ?? '-'}
        </span>
      ),
    },
    {
      key: 'vote_count',
      label: 'Total Suara',
      render: (item) => (
        <span className="text-xs font-extrabold text-[#70B325] bg-[#F2F9EC] px-2.5 py-1 rounded-lg">
          {(item.vote_count ?? 0).toLocaleString('id-ID')} suara
        </span>
      ),
    },
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
  const { token, userToken, ready } = useAuth()
  if (!ready) return <p className="boot-state">Memeriksa sesi...</p>
  if (token) return <Navigate to="/admin/categories" replace />
  if (userToken) return <Navigate to="/" replace />
  return <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <GoogleOneTap />
      <Routes>
        <Route path="/" element={<PublicEventsPage />} />
        <Route path="/categories/:categoryId" element={<CategoryVotingPage />} />
        <Route path="/voting/:categoryId" element={<CategoryVotingPage />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/admin" element={<ProtectedApp />}>
          <Route index element={<Navigate to="categories" replace />} />
          <Route path="categories" element={<ResourcePage {...categories} />} />
          <Route path="finalists" element={<ResourcePage {...finalists} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

