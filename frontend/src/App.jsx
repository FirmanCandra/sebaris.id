import { useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import GoogleOneTap from './components/GoogleOneTap'
import LiveVoteTicker from './components/LiveVoteTicker'
import ResourcePage from './components/ResourcePage'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboardPage from './pages/AdminDashboardPage'
import LoginPage from './pages/LoginPage'
import PublicEventsPage from './pages/PublicEventsPage'
import CategoryVotingPage from './pages/CategoryVotingPage'
import NotFoundPage from './pages/NotFoundPage'
import EmbedVotingPage from './pages/EmbedVotingPage'
import AdminManagementPage from './pages/AdminManagementPage'
import EventWorkspacePage from './pages/EventWorkspacePage'
import RegisterEventPage from './pages/RegisterEventPage'
import AdminProposalsPage from './pages/AdminProposalsPage'
import AdminParticipantsPage from './pages/AdminParticipantsPage'
import EventsDirectoryPage from './pages/EventsDirectoryPage'
import EmbedCodeModal from './components/EmbedCodeModal'
import VotePackagesModal from './components/VotePackagesModal'
import AdjustVoteModal from './components/AdjustVoteModal'
import {
  IconChevronRight,
  IconLayers,
  IconCrown,
  IconMedal,
  IconSnowflake,
  IconLockOpen,
  IconCoins,
  IconGlobe,
  IconScale,
  IconDownload,
  IconCheck,
} from './components/Icons'
import { resolveStorageUrl, downloadExport } from './api/client'

function EventThumbnailCell({ item }) {
  const [imgError, setImgError] = useState(false)
  const thumbSrc =
    item.thumbnail_url ||
    item.thumbnail ||
    item.categories?.[0]?.thumbnail_url ||
    item.categories?.[0]?.thumbnail

  if (!thumbSrc || imgError) {
    return (
      <div className="w-12 h-14 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
        {item.name?.slice(0, 2)?.toUpperCase() || 'EV'}
      </div>
    )
  }

  return (
    <img
      src={resolveStorageUrl(thumbSrc)}
      alt={item.name}
      className="w-12 h-14 rounded-xl object-cover border border-[var(--neutral-border)] flex-shrink-0 shadow-2xs"
      onError={() => setImgError(true)}
    />
  )
}

function CategoryThumbnailCell({ item }) {
  const [imgError, setImgError] = useState(false)
  const thumbSrc = item.thumbnail_url || item.thumbnail

  if (!thumbSrc || imgError) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
        {item.name?.slice(0, 2)?.toUpperCase() || 'VT'}
      </div>
    )
  }

  return (
    <img
      src={resolveStorageUrl(thumbSrc)}
      alt={item.name}
      className="w-11 h-11 rounded-xl object-cover border border-[var(--neutral-border)] flex-shrink-0 shadow-2xs"
      onError={() => setImgError(true)}
    />
  )
}

function FinalistThumbnailCell({ item }) {
  const [imgError, setImgError] = useState(false)
  const photoSrc = item.photo_url || item.photo

  if (!photoSrc || imgError) {
    return (
      <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
        {item.name?.slice(0, 2)?.toUpperCase() || 'FN'}
      </div>
    )
  }

  return (
    <img
      src={resolveStorageUrl(photoSrc)}
      alt={item.name}
      className="w-11 h-11 rounded-xl object-cover border border-[var(--neutral-border)] flex-shrink-0 shadow-2xs"
      onError={() => setImgError(true)}
    />
  )
}

function BannerThumbnailCell({ item }) {
  const [imgError, setImgError] = useState(false)
  const bannerSrc = item.image_url || item.image

  return (
    <div className="w-36 sm:w-44 aspect-[21/8] rounded-xl overflow-hidden bg-gray-900 border border-[var(--neutral-border)] shadow-xs flex-shrink-0 flex items-center justify-center">
      {bannerSrc && !imgError ? (
        <img
          src={resolveStorageUrl(bannerSrc)}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-[10px] text-gray-400">Tanpa Gambar</span>
      )}
    </div>
  )
}

const events = {
  title: 'Event / Ajang',
  description: 'Kelola induk ajang/event yang menaungi beberapa tingkatan kategori pemilihan (Premier, Sekunder, Tersier).',
  endpoint: '/admin/events',
  fields: [
    { name: 'thumbnail', label: 'Poster / Thumbnail Event (Rasio 3:4 Potret, misal 900x1200 px)', type: 'file' },
    { name: 'name', label: 'Nama Event / Ajang' },
    { name: 'start_date', label: 'Tanggal Mulai', type: 'date' },
    { name: 'end_date', label: 'Tanggal Selesai', type: 'date' },
    {
      name: 'status',
      label: 'Status Event',
      type: 'select',
      options: [
        { value: 'active', label: 'Aktif' },
        { value: 'inactive', label: 'Nonaktif / Selesai' },
      ],
    },
    { name: 'theme_color', label: 'Warna Tema / Aksen Background (Tema Kemewahan)', type: 'color' },
  ],
  columns: [
    {
      key: 'name',
      label: 'Nama Event / Ajang',
      render: (item) => (
        <div className="flex items-center gap-3">
          <EventThumbnailCell item={item} />
          <Link
            to={`/admin/events/${item.id}`}
            className="group block no-underline min-w-0"
            title="Klik untuk membuka dan mengelola event ini"
          >
            <span className="font-extrabold text-sm text-[var(--neutral-text-main)] group-hover:text-[var(--brand-primary)] transition-colors block truncate max-w-sm">
              {item.name}
            </span>
            <span className="text-xs text-gray-500 group-hover:text-[var(--brand-primary)] transition-colors flex items-center gap-1 mt-0.5">
              <span>{item.categories_count ?? 0} Kategori Terdaftar</span>
              <span className="text-[var(--brand-primary)] font-bold inline-flex items-center gap-0.5">
                Buka Event <IconChevronRight className="w-3 h-3" />
              </span>
            </span>
          </Link>
        </div>
      ),
    },
    {
      key: 'period',
      label: 'Periode Event',
      render: (item) => (
        <div className="text-xs">
          <span className="font-semibold text-gray-700 dark:text-gray-300 block">
            {item.start_date || '-'}
          </span>
          <span className="text-gray-400 block">s/d {item.end_date || '-'}</span>
        </div>
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
  ],
  options: {},
}

const categories = {
  title: 'Kategori Voting',
  description: 'Kelola sesi voting, penentuan tingkatan (Premier, Sekunder, Tersier), induk event, tarif, dan freeze leaderboard.',
  endpoint: '/admin/categories',
  fields: [
    { name: 'thumbnail', label: 'Thumbnail Khusus Kategori (Opsional, jika kosong otomatis memakai poster Event)', type: 'file' },
    { name: 'event_id', label: 'Induk Event / Ajang (Pilih Event)', type: 'select', optionsKey: 'events' },
    {
      name: 'tier',
      label: 'Tingkatan Kategori (Tier Order)',
      type: 'select',
      options: [
        { value: 'premier', label: 'Premier (Kategori Utama / Prioritas 1)' },
        { value: 'sekunder', label: 'Sekunder (Kategori Kedua / Prioritas 2)' },
        { value: 'tersier', label: 'Tersier (Kategori Ketiga / Prioritas 3)' },
      ],
    },
    { name: 'sort_order', label: 'Urutan Tampilan (1, 2, 3...)', type: 'number' },
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
        { value: 1, label: 'Bekukan / Sembunyikan Perolehan Suara (Freeze)' },
      ],
    },
    { name: 'theme_color', label: 'Warna Tema / Aksen Background (Tema Kemewahan)', type: 'color' },
    { name: 'description', label: 'Deskripsi Voting', type: 'textarea' },
  ],
  columns: [
    {
      key: 'name',
      label: 'Sesi Voting',
      render: (item) => (
        <div className="flex items-center gap-3">
          <CategoryThumbnailCell item={item} />
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
      key: 'tier',
      label: 'Tingkatan (Tier)',
      render: (item) => {
        const tier = item.tier || 'premier'
        const badgeConfig = {
          premier: {
            label: 'Premier',
            icon: IconCrown,
            cls: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 font-extrabold',
          },
          sekunder: {
            label: 'Sekunder',
            icon: IconMedal,
            cls: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 font-bold',
          },
          tersier: {
            label: 'Tersier',
            icon: IconMedal,
            cls: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-200 border-orange-300 font-bold',
          },
        }
        const cfg = badgeConfig[tier] || badgeConfig.premier
        const TierIcon = cfg.icon
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${cfg.cls}`}>
              <TierIcon className="w-3.5 h-3.5" />
              {cfg.label}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">
              Urutan: #{item.sort_order ?? 1}
            </span>
          </div>
        )
      },
    },
    {
      key: 'event',
      label: 'Induk Event',
      render: (item) => (
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {item.event?.name || '— Standalone'}
        </span>
      ),
    },
    {
      key: 'pricing',
      label: 'Tarif & Mode',
      render: (item) => (
        <div className="text-xs">
          <span className="font-extrabold text-[#70B325] block">
            Rp {(item.price_per_vote || 1000).toLocaleString('id-ID')} / suara
          </span>
          <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
            {item.allow_free_vote ? (
              <>
                <IconCheck className="w-3 h-3 text-emerald-500" />
                <span>Ada Vote Gratis</span>
              </>
            ) : (
              <>
                <IconCoins className="w-3 h-3 text-amber-500" />
                <span>Full Berbayar</span>
              </>
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'freeze_leaderboard',
      label: 'Freeze Mode',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            item.freeze_leaderboard
              ? 'bg-sky-100 text-sky-800 border border-sky-300 font-extrabold'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {item.freeze_leaderboard ? (
            <>
              <IconSnowflake className="w-3.5 h-3.5 text-sky-600" />
              <span>Dibekukan</span>
            </>
          ) : (
            <>
              <IconLockOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terbuka</span>
            </>
          )}
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
          <IconDownload className="w-3.5 h-3.5" />
          <span>Unduh CSV</span>
        </button>
      ),
    },
  ],
  options: {
    events: { endpoint: '/admin/events' },
  },
}

function EventsAdminPage() {
  const { token } = useAuth()
  const [exportingId, setExportingId] = useState(null)

  const handleExport = async (item) => {
    setExportingId(item.id)
    try {
      const cleanName = item.name ? item.name.replace(/[^a-zA-Z0-9_-]/g, '_') : item.id
      await downloadExport(
        `/admin/events/${item.id}/export`,
        `Laporan_Event_${cleanName}.csv`,
        token
      )
    } catch (err) {
      alert(err.message || 'Gagal mengekspor data event')
    } finally {
      setExportingId(null)
    }
  }

  return (
    <ResourcePage
      {...events}
      extraActions={(item) => (
        <div className="flex items-center gap-1.5 mr-1">
          <button
            type="button"
            onClick={() => handleExport(item)}
            disabled={exportingId === item.id}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Ekspor seluruh rekap voting, revenue, finalis, dan audit log transaksi ke CSV/Excel"
          >
            <IconDownload className={`w-3.5 h-3.5 text-emerald-600 ${exportingId === item.id ? 'animate-bounce' : ''}`} />
            <span>{exportingId === item.id ? 'Ekspor...' : 'Export CSV'}</span>
          </button>
          <Link
            to={`/admin/events/${item.id}`}
            className="px-2.5 py-1 rounded-lg text-xs font-black text-white bg-[#70B325] hover:bg-[#5f991f] transition-all flex items-center gap-1.5 no-underline shadow-2xs cursor-pointer"
            title="Buka dan kelola kategori serta finalis di event ini"
          >
            <IconLayers className="w-3.5 h-3.5" />
            <span>Kelola Event</span>
            <IconChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    />
  )
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
          <FinalistThumbnailCell item={item} />
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
              <IconCoins className="w-3.5 h-3.5" />
              <span>Paket</span>
            </button>
            <button
              type="button"
              onClick={() => setEmbedModalCategory(item)}
              className="px-2 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Dapatkan kode widget iframe untuk website"
            >
              <IconGlobe className="w-3.5 h-3.5" />
              <span>Embed</span>
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
            <IconScale className="w-3.5 h-3.5" />
            <span>Koreksi</span>
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

const banners = {
  title: 'Banner Slider (Hero Section)',
  description: 'Kelola banner gambar landscape yang bergeser di halaman utama. Gunakan gambar berformat landscape rasio 21:9 atau ~3:1 (misal 1920x640 px atau 1200x400 px).',
  endpoint: '/admin/banners',
  fields: [
    { name: 'title', label: 'Nama Banner / Judul Acara (Untuk referensi & alt text)' },
    {
      name: 'image',
      label: 'Gambar Banner (Rasio Landscape 21:9 atau ~3:1, misal 1920x640 px atau 1200x400 px)',
      type: 'file',
    },
    {
      name: 'link_url',
      label: 'Link Tujuan saat Banner Diklik (contoh: /voting/puteri-diy-2026 atau https://... atau kosongkan jika hanya gambar)',
    },
    { name: 'sort_order', label: 'Urutan Tampilan Slider (1, 2, 3...)', type: 'number' },
    {
      name: 'is_active',
      label: 'Status Tampil di Beranda',
      type: 'select',
      options: [
        { value: 1, label: 'Aktif (Tampilkan di Beranda)' },
        { value: 0, label: 'Nonaktif (Sembunyikan)' },
      ],
    },
  ],
  columns: [
    {
      key: 'image',
      label: 'Pratinjau Banner',
      render: (item) => <BannerThumbnailCell item={item} />,
    },
    {
      key: 'title',
      label: 'Informasi Banner',
      render: (item) => (
        <div>
          <span className="font-extrabold block text-sm text-[var(--neutral-text-main)]">
            {item.title}
          </span>
          {item.link_url ? (
            <span className="text-xs text-[var(--brand-primary)] flex items-center gap-1 mt-0.5 font-medium truncate max-w-xs">
              <span>Link: {item.link_url}</span>
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic block mt-0.5">
              Hanya gambar (tanpa link)
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'sort_order',
      label: 'Urutan',
      render: (item) => (
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
          #{item.sort_order ?? 1}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            item.is_active
              ? 'bg-[#EBF7E3] text-[#48781B]'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              item.is_active ? 'bg-[#70B325] animate-pulse' : 'bg-gray-400'
            }`}
          />
          {item.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
  ],
  options: {},
}

function BannersAdminPage() {
  return <ResourcePage {...banners} />
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
      <LiveVoteTicker />
      <Routes>
        <Route path="/" element={<PublicEventsPage />} />
        <Route path="/events" element={<EventsDirectoryPage />} />
        <Route path="/vote" element={<EventsDirectoryPage />} />
        <Route path="/daftarkan-vote" element={<RegisterEventPage />} />
        <Route path="/categories/:categoryId" element={<CategoryVotingPage />} />
        <Route path="/voting/:categoryId" element={<CategoryVotingPage />} />
        <Route path="/embed/voting/:categoryId" element={<EmbedVotingPage />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/admin" element={<ProtectedApp />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="proposals" element={<AdminProposalsPage />} />
          <Route path="events" element={<EventsAdminPage />} />
          <Route path="events/:eventId" element={<EventWorkspacePage />} />
          <Route path="categories" element={<CategoriesAdminPage />} />
          <Route path="finalists" element={<FinalistsAdminPage />} />
          <Route path="participants" element={<AdminParticipantsPage />} />
          <Route path="banners" element={<BannersAdminPage />} />
          <Route path="admins" element={<AdminManagementPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

