import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import GoogleOneTap from './components/GoogleOneTap'
import ResourcePage from './components/ResourcePage'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboardPage from './pages/AdminDashboardPage'
import LoginPage from './pages/LoginPage'
import PublicEventsPage from './pages/PublicEventsPage'
import CategoryVotingPage from './pages/CategoryVotingPage'
import NotFoundPage from './pages/NotFoundPage'
import EmbedVotingPage from './pages/EmbedVotingPage'
import AdminManagementPage from './pages/AdminManagementPage'
import EmbedCodeModal from './components/EmbedCodeModal'
import VotePackagesModal from './components/VotePackagesModal'
import AdjustVoteModal from './components/AdjustVoteModal'
import { resolveStorageUrl } from './api/client'

const categories = {
  title: 'Kategori Voting',
  description: 'Kelola sesi voting, thumbnail poster, tarif per vote, freeze leaderboard, dan export laporan.',
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
    { name: 'price_per_vote', label: 'Harga per Suara Berbayar (Rp)', type: 'number' },
    {
      name: 'allow_free_vote',
      label: 'Sediakan 1x Vote Gratis?',
      type: 'select',
      options: [
        { value: 1, label: 'Ya, Sediakan 1x Vote Gratis per Kontak' },
        { value: 0, label: 'Tidak, Wajib Vote Berbayar (Pure Paid)' },
      ],
    },
    {
      name: 'freeze_leaderboard',
      label: 'Bekukan Leaderboard (Freeze Mode)?',
      type: 'select',
      options: [
        { value: 0, label: 'Buka Publik (Real-time Terbuka)' },
        { value: 1, label: 'Bekukan / Sembunyikan Perolehan Suara (Freeze ❄️)' },
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
      key: 'pricing',
      label: 'Tarif & Mode',
      render: (item) => (
        <div className="text-xs">
          <span className="font-extrabold text-[#70B325] block">
            Rp {(item.price_per_vote || 1000).toLocaleString('id-ID')} / suara
          </span>
          <span className="text-[10px] text-gray-400 block font-semibold">
            {item.allow_free_vote ? '✓ Ada Vote Gratis' : '⭐ Full Berbayar'}
          </span>
        </div>
      ),
    },
    {
      key: 'freeze_leaderboard',
      label: 'Freeze Mode',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            item.freeze_leaderboard
              ? 'bg-sky-100 text-sky-800 border border-sky-300 font-extrabold'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {item.freeze_leaderboard ? '❄️ Dibekukan' : '🔓 Terbuka'}
        </span>
      ),
    },
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
    {
      key: 'export',
      label: 'Laporan',
      render: (item) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            window.open(`/api/admin/categories/${item.id}/export`, '_blank')
          }}
          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F4F9EE] hover:bg-[#70B325] text-[#558223] hover:text-white border border-[#D5E6C4] transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
          title="Unduh rekap suara dan data transaksi ke Excel (CSV)"
        >
          <span>📥 Unduh CSV</span>
        </button>
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
    { name: 'photo', label: 'Foto Utama / Poster Finalis', type: 'file' },
    { name: 'extra_photos', label: 'Foto Tambahan / Galeri (Pilih Beberapa Foto Sekaligus)', type: 'files' },
    { name: 'social_ig', label: 'Instagram (contoh: yogafatwanto_)' },
    { name: 'bio', label: 'Biodata / Visi Misi Singkat' },
    { name: 'description', label: 'Asal Daerah / Profil Lengkap Finalis', type: 'textarea' },
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

function CategoriesAdminPage() {
  const [embedModalCategory, setEmbedModalCategory] = useState(null)
  const [packagesModalCategory, setPackagesModalCategory] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  return (
    <>
      <ResourcePage
        key={reloadKey}
        {...categories}
        extraActions={(item) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPackagesModalCategory(item)}
              className="px-2 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Atur paket harga suara voting"
            >
              <span>💰 Paket</span>
            </button>
            <button
              type="button"
              onClick={() => setEmbedModalCategory(item)}
              className="px-2 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Dapatkan kode widget iframe untuk website"
            >
              <span>🌐 Embed</span>
            </button>
          </div>
        )}
      />

      {embedModalCategory && (
        <EmbedCodeModal
          isOpen={Boolean(embedModalCategory)}
          onClose={() => setEmbedModalCategory(null)}
          category={embedModalCategory}
        />
      )}

      {packagesModalCategory && (
        <VotePackagesModal
          isOpen={Boolean(packagesModalCategory)}
          onClose={() => setPackagesModalCategory(null)}
          category={packagesModalCategory}
          onSuccess={() => setReloadKey((prev) => prev + 1)}
        />
      )}
    </>
  )
}

function FinalistsAdminPage() {
  const [adjustModalFinalist, setAdjustModalFinalist] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  return (
    <>
      <ResourcePage
        key={reloadKey}
        {...finalists}
        extraActions={(item) => (
          <button
            type="button"
            onClick={() => setAdjustModalFinalist(item)}
            className="px-2 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="Koreksi atau reset perolehan suara"
          >
            <span>⚖️ Koreksi</span>
          </button>
        )}
      />

      {adjustModalFinalist && (
        <AdjustVoteModal
          isOpen={Boolean(adjustModalFinalist)}
          onClose={() => setAdjustModalFinalist(null)}
          finalist={adjustModalFinalist}
          onSuccess={() => setReloadKey((prev) => prev + 1)}
        />
      )}
    </>
  )
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
  if (token) return <Navigate to="/admin/dashboard" replace />
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
        <Route path="/embed/voting/:categoryId" element={<EmbedVotingPage />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/admin" element={<ProtectedApp />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="categories" element={<CategoriesAdminPage />} />
          <Route path="finalists" element={<FinalistsAdminPage />} />
          <Route path="admins" element={<AdminManagementPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

