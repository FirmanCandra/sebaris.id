import { useCallback, useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, resolveStorageUrl } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconClose,
  IconChevronRight,
  IconChevronLeft,
  IconExternal,
  IconTrophy,
  IconLayers,
  IconUsers,
  IconFlame,
  IconSearch,
  IconCrown,
  IconMedal,
  IconCoins,
  IconGlobe,
  IconDownload,
  IconScale,
  IconCheck,
  IconSnowflake,
  IconLockOpen,
} from '../components/Icons'
import EmbedCodeModal from '../components/EmbedCodeModal'
import VotePackagesModal from '../components/VotePackagesModal'
import AdjustVoteModal from '../components/AdjustVoteModal'

const LUXURY_PALETTES = [
  { name: 'Emerald', color: '#166534' },
  { name: 'Ruby', color: '#BE123C' },
  { name: 'Sapphire', color: '#1E40AF' },
  { name: 'Amethyst', color: '#6B21A8' },
  { name: 'Amber', color: '#B45309' },
  { name: 'Midnight', color: '#0F172A' },
]

export default function EventWorkspacePage() {
  const { eventId } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [eventData, setEventData] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Drilldown state: selected category for finalist management
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [finalists, setFinalists] = useState([])
  const [loadingFinalists, setLoadingFinalists] = useState(false)
  const [finalistSearch, setFinalistSearch] = useState('')

  // Modals state
  const [embedModalCategory, setEmbedModalCategory] = useState(null)
  const [packagesModalCategory, setPackagesModalCategory] = useState(null)
  const [adjustModalFinalist, setAdjustModalFinalist] = useState(null)

  // Drawer states
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryValues, setCategoryValues] = useState({})
  const [categoryErrors, setCategoryErrors] = useState({})
  const [savingCategory, setSavingCategory] = useState(false)

  const [isFinalistDrawerOpen, setIsFinalistDrawerOpen] = useState(false)
  const [editingFinalist, setEditingFinalist] = useState(null)
  const [finalistValues, setFinalistValues] = useState({})
  const [finalistErrors, setFinalistErrors] = useState({})
  const [savingFinalist, setSavingFinalist] = useState(false)

  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [eventValues, setEventValues] = useState({ name: '', thumbnail: '', start_date: '', end_date: '', status: 'active', theme_color: '#154228' })
  const [savingEvent, setSavingEvent] = useState(false)

  // Load Event and its categories
  const loadEvent = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api(`/admin/events/${eventId}`, { token })
      if (res?.data) {
        setEventData(res.data)
        const cats = res.data.categories || []
        setCategories(cats)
        // If a category was selected, update its reference
        if (selectedCategory) {
          const updated = cats.find((c) => c.id === selectedCategory.id)
          if (updated) setSelectedCategory(updated)
        }
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat data event')
    } finally {
      setLoading(false)
    }
  }, [eventId, token, selectedCategory])

  useEffect(() => {
    loadEvent()
  }, [eventId, token])

  // Load finalists when selectedCategory changes
  const loadFinalists = useCallback(async () => {
    if (!selectedCategory) return
    setLoadingFinalists(true)
    try {
      const res = await api(`/admin/finalists?category_id=${selectedCategory.id}`, { token })
      setFinalists(res?.data || [])
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar finalis')
    } finally {
      setLoadingFinalists(false)
    }
  }, [selectedCategory, token])

  useEffect(() => {
    if (selectedCategory) {
      loadFinalists()
    }
  }, [selectedCategory, loadFinalists])

  // Aggregated totals for this specific event
  const totalFinalists = useMemo(
    () => categories.reduce((sum, c) => sum + (c.finalists_count || 0), 0),
    [categories]
  )

  const totalVotesInSelectedCategory = useMemo(
    () => finalists.reduce((sum, f) => sum + (f.vote_count || 0), 0),
    [finalists]
  )

  // Find premier category for public preview link
  const premierCategory = useMemo(() => {
    return categories.find((c) => c.tier === 'premier') || categories[0]
  }, [categories])

  // ===================== CATEGORY DRAWER HANDLERS =====================
  const openCreateCategory = () => {
    const nextOrder = categories.length + 1
    // Default tier: premier if none, sekunder if 1 exists, tersier if 2 exist
    const defaultTier = categories.length === 0 ? 'premier' : categories.length === 1 ? 'sekunder' : 'tersier'

    setCategoryValues({
      event_id: Number(eventId),
      name: '',
      tier: defaultTier,
      sort_order: nextOrder,
      thumbnail: '',
      organizer: eventData?.name || '',
      start_date: eventData?.start_date || '',
      end_date: eventData?.end_date || '',
      status: 'active',
      price_per_vote: 10000,
      allow_free_vote: 1,
      freeze_leaderboard: 0,
      description: '',
      theme_color: '#154228',
    })
    setEditingCategory(null)
    setCategoryErrors({})
    setIsCategoryDrawerOpen(true)
  }

  const openEditCategory = (cat) => {
    setEditingCategory(cat)
    setCategoryValues({
      event_id: Number(eventId),
      name: cat.name || '',
      tier: cat.tier || 'premier',
      sort_order: cat.sort_order ?? 1,
      thumbnail: cat.thumbnail || '',
      organizer: cat.organizer || '',
      start_date: cat.start_date || '',
      end_date: cat.end_date || '',
      status: cat.status || 'active',
      price_per_vote: cat.price_per_vote || 10000,
      allow_free_vote: cat.allow_free_vote ? 1 : 0,
      freeze_leaderboard: cat.freeze_leaderboard ? 1 : 0,
      description: cat.description || '',
      theme_color: cat.theme_color || '#154228',
    })
    setCategoryErrors({})
    setIsCategoryDrawerOpen(true)
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    setSavingCategory(true)
    setCategoryErrors({})

    try {
      const hasFile = categoryValues.thumbnail instanceof File
      const body = hasFile
        ? (() => {
            const fd = new FormData()
            Object.entries(categoryValues).forEach(([k, v]) => {
              if (k === 'thumbnail') {
                if (v instanceof File) fd.append('thumbnail', v)
              } else if (v !== '' && v !== null && v !== undefined) {
                fd.append(k, v)
              }
            })
            if (editingCategory) fd.append('_method', 'PUT')
            return fd
          })()
        : {
            ...categoryValues,
            event_id: Number(eventId),
            sort_order: Number(categoryValues.sort_order || 1),
            price_per_vote: Number(categoryValues.price_per_vote || 10000),
            allow_free_vote: Boolean(Number(categoryValues.allow_free_vote)),
            freeze_leaderboard: Boolean(Number(categoryValues.freeze_leaderboard)),
          }

      await api(editingCategory ? `/admin/categories/${editingCategory.id}` : '/admin/categories', {
        method: hasFile ? 'POST' : editingCategory ? 'PUT' : 'POST',
        token,
        body,
      })

      setIsCategoryDrawerOpen(false)
      setEditingCategory(null)
      await loadEvent()
    } catch (err) {
      if (err instanceof ApiError) {
        setCategoryErrors(err.errors || {})
      } else {
        alert(err.message || 'Gagal menyimpan kategori')
      }
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Hapus kategori "${cat.name}" beserta seluruh finalisnya?`)) return
    try {
      await api(`/admin/categories/${cat.id}`, { method: 'DELETE', token })
      if (selectedCategory?.id === cat.id) {
        setSelectedCategory(null)
      }
      await loadEvent()
    } catch (err) {
      alert(err.message || 'Gagal menghapus kategori')
    }
  }

  // ===================== FINALIST DRAWER HANDLERS =====================
  const openCreateFinalist = () => {
    if (!selectedCategory) return
    setFinalistValues({
      category_id: selectedCategory.id,
      name: '',
      photo: '',
      extra_photos: [],
      social_ig: '',
      bio: '',
      description: '',
    })
    setEditingFinalist(null)
    setFinalistErrors({})
    setIsFinalistDrawerOpen(true)
  }

  const openEditFinalist = (fin) => {
    setEditingFinalist(fin)
    setFinalistValues({
      category_id: selectedCategory.id,
      name: fin.name || '',
      photo: fin.photo || '',
      extra_photos: [],
      social_ig: fin.social_ig || '',
      bio: fin.bio || '',
      description: fin.description || '',
    })
    setFinalistErrors({})
    setIsFinalistDrawerOpen(true)
  }

  const handleSaveFinalist = async (e) => {
    e.preventDefault()
    setSavingFinalist(true)
    setFinalistErrors({})

    try {
      const hasPhoto = finalistValues.photo instanceof File
      const hasExtra = Array.isArray(finalistValues.extra_photos) && finalistValues.extra_photos.some((f) => f instanceof File)
      const hasFile = hasPhoto || hasExtra

      const body = hasFile
        ? (() => {
            const fd = new FormData()
            Object.entries(finalistValues).forEach(([k, v]) => {
              if (k === 'photo') {
                if (v instanceof File) fd.append('photo', v)
              } else if (k === 'extra_photos') {
                if (Array.isArray(v)) {
                  v.forEach((file) => {
                    if (file instanceof File) fd.append('extra_photos[]', file)
                  })
                }
              } else if (v !== '' && v !== null && v !== undefined) {
                fd.append(k, v)
              }
            })
            if (editingFinalist) fd.append('_method', 'PUT')
            return fd
          })()
        : {
            ...finalistValues,
            category_id: Number(selectedCategory.id),
          }

      await api(editingFinalist ? `/admin/finalists/${editingFinalist.id}` : '/admin/finalists', {
        method: hasFile ? 'POST' : editingFinalist ? 'PUT' : 'POST',
        token,
        body,
      })

      setIsFinalistDrawerOpen(false)
      setEditingFinalist(null)
      await loadFinalists()
      await loadEvent()
    } catch (err) {
      if (err instanceof ApiError) {
        setFinalistErrors(err.errors || {})
      } else {
        alert(err.message || 'Gagal menyimpan finalis')
      }
    } finally {
      setSavingFinalist(false)
    }
  }

  const handleDeleteFinalist = async (fin) => {
    if (!window.confirm(`Hapus finalis "${fin.name}"?`)) return
    try {
      await api(`/admin/finalists/${fin.id}`, { method: 'DELETE', token })
      await loadFinalists()
      await loadEvent()
    } catch (err) {
      alert(err.message || 'Gagal menghapus finalis')
    }
  }

  // ===================== EVENT MODAL HANDLERS =====================
  const openEditEvent = () => {
    if (!eventData) return
    setEventValues({
      name: eventData.name || '',
      thumbnail: eventData.thumbnail || '',
      start_date: eventData.start_date || '',
      end_date: eventData.end_date || '',
      status: eventData.status || 'active',
      theme_color: eventData.theme_color || '#154228',
    })
    setIsEventModalOpen(true)
  }

  const handleSaveEvent = async (e) => {
    e.preventDefault()
    setSavingEvent(true)
    try {
      const hasFile = eventValues.thumbnail instanceof File
      const body = hasFile
        ? (() => {
            const fd = new FormData()
            Object.entries(eventValues).forEach(([k, v]) => {
              if (k === 'thumbnail') {
                if (v instanceof File) fd.append('thumbnail', v)
              } else if (v !== '' && v !== null && v !== undefined) {
                fd.append(k, v)
              }
            })
            fd.append('_method', 'PUT')
            return fd
          })()
        : eventValues

      await api(`/admin/events/${eventId}`, {
        method: hasFile ? 'POST' : 'PUT',
        token,
        body,
      })
      setIsEventModalOpen(false)
      await loadEvent()
    } catch (err) {
      alert(err.message || 'Gagal memperbarui event')
    } finally {
      setSavingEvent(false)
    }
  }

  // Filter finalists
  const filteredFinalists = finalists.filter((f) => {
    if (!finalistSearch.trim()) return true
    const q = finalistSearch.toLowerCase()
    return (
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.bio && f.bio.toLowerCase().includes(q)) ||
      (f.description && f.description.toLowerCase().includes(q))
    )
  })

  if (loading && !eventData) {
    return (
      <div className="p-16 text-center text-gray-500">
        <div className="w-9 h-9 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold">Memuat data event dan kategori...</p>
      </div>
    )
  }

  if (error && !eventData) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 p-5 rounded-2xl">
          <p className="text-sm font-bold">{error}</p>
        </div>
        <Link to="/admin/events" className="btn-secondary inline-flex items-center gap-2">
          <IconChevronLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Event</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb and Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-500">
          <Link
            to="/admin/events"
            className="font-bold hover:text-[var(--brand-primary)] transition-colors no-underline flex items-center gap-1"
          >
            <IconChevronLeft className="w-3.5 h-3.5" />
            <span>Event / Ajang</span>
          </Link>
          <span className="text-gray-400">/</span>
          <span className="font-extrabold text-[var(--neutral-text-main)] truncate max-w-xs">
            {eventData?.name}
          </span>
          {selectedCategory && (
            <>
              <span className="text-gray-400">/</span>
              <span className="font-bold text-[var(--brand-primary)] truncate max-w-xs">
                {selectedCategory.name} (Finalis)
              </span>
            </>
          )}
        </div>

        {premierCategory?.slug && (
          <Link
            to={`/voting/${premierCategory.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-[#48781B] bg-[#EBF7E3] hover:bg-[#70B325] hover:text-white transition-all no-underline shadow-2xs"
            title="Lihat halaman voting publik di tab baru"
          >
            <span>Pratinjau Publik</span>
            <IconExternal className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Main Event Hero Banner Card */}
      <div className="card-base p-6 bg-[var(--neutral-surface)] border border-[var(--neutral-border)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {eventData?.thumbnail || eventData?.thumbnail_url ? (
              <img
                src={resolveStorageUrl(eventData.thumbnail_url || eventData.thumbnail)}
                alt={eventData.name}
                className="w-16 h-20 rounded-2xl object-cover border border-[var(--neutral-border)] shadow-xs flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-20 rounded-2xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-black text-sm flex items-center justify-center border border-[var(--neutral-border)] shadow-xs flex-shrink-0">
                {eventData?.name?.slice(0, 2)?.toUpperCase() || 'EV'}
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide ${
                    eventData?.status === 'active'
                      ? 'bg-[#EBF7E3] text-[#48781B]'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      eventData?.status === 'active' ? 'bg-[#70B325] animate-pulse' : 'bg-gray-400'
                    }`}
                  />
                  {eventData?.status === 'active' ? 'Event Aktif' : 'Nonaktif'}
                </span>

                <span className="text-xs text-gray-400 font-semibold">
                  Periode: {eventData?.start_date || '-'} s/d {eventData?.end_date || '-'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[var(--neutral-text-main)] tracking-tight">
                {eventData?.name}
              </h1>
              <p className="text-xs text-gray-500">
                Kelola kategori bertingkat (Premier, Sekunder, Tersier) dan finalis langsung dari event ini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={openEditEvent}
              className="btn-secondary text-xs font-bold py-2 px-3 flex items-center gap-1.5"
            >
              <IconEdit className="w-4 h-4" />
              <span>Edit Event</span>
            </button>
            <button
              type="button"
              onClick={openCreateCategory}
              className="btn-primary text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              <IconPlus className="w-4 h-4" />
              <span>Tambah Kategori</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Stat Boxes for this Event */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--neutral-border)]">
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                Total Kategori
              </span>
              <span className="text-xl font-black text-[var(--neutral-text-main)] block mt-0.5">
                {categories.length} Kategori
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#EBF7E3] text-[#70B325] flex items-center justify-center flex-shrink-0">
              <IconLayers className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                Total Finalis Terdaftar
              </span>
              <span className="text-xl font-black text-[var(--neutral-text-main)] block mt-0.5">
                {totalFinalists} Kandidat
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center flex-shrink-0">
              <IconUsers className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                Alur Kerja Terpadu
              </span>
              <span className="text-xs font-bold text-[#70B325] flex items-center gap-1 mt-0.5">
                <span>Event</span>
                <IconChevronRight className="w-3 h-3 text-gray-400" />
                <span>Kategori</span>
                <IconChevronRight className="w-3 h-3 text-gray-400" />
                <span>Finalis</span>
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
              <IconTrophy className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* LEVEL 1: CATEGORIES LIST (If selectedCategory === null)                */}
      {/* ====================================================================== */}
      {!selectedCategory ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[var(--neutral-text-main)] tracking-tight">
                Daftar Kategori Voting dalam Event Ini ({categories.length})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Klik tombol <strong>&quot;Kelola Finalis&quot;</strong> pada kategori untuk langsung mendaftarkan atau mengelola kandidat.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateCategory}
              className="btn-primary text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-center"
            >
              <IconPlus className="w-4 h-4" />
              <span>Tambah Kategori di Event Ini</span>
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="p-12 text-center text-gray-500 card-base bg-[var(--neutral-surface)] border border-[var(--neutral-border)] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center mx-auto">
                <IconLayers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Belum ada kategori dalam event ini
                </p>
                <p className="text-xs text-gray-400 mt-0.5 max-w-sm mx-auto">
                  Tambahkan kategori pertama seperti <strong>Kategori Premier (Utama)</strong> untuk memulai.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateCategory}
                className="btn-primary text-xs font-bold py-2 px-4 mx-auto"
              >
                + Tambah Kategori Pertama
              </button>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tingkatan (Tier)</th>
                    <th>Nama Kategori</th>
                    <th>Finalis</th>
                    <th>Tarif &amp; Mode</th>
                    <th>Freeze</th>
                    <th>Status</th>
                    <th className="text-right">Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => {
                    const tier = cat.tier || 'premier'
                    const tierConfig = {
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
                    const cfg = tierConfig[tier] || tierConfig.premier
                    const TierIcon = cfg.icon

                    return (
                      <tr key={cat.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                        {/* Tier Column */}
                        <td>
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${cfg.cls}`}>
                              <TierIcon className="w-3.5 h-3.5" />
                              {cfg.label}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              Urutan: #{cat.sort_order ?? 1}
                            </span>
                          </div>
                        </td>

                        {/* Category Name Column */}
                        <td>
                          <div className="flex items-center gap-3">
                            {cat.thumbnail || cat.thumbnail_url ? (
                              <img
                                src={resolveStorageUrl(cat.thumbnail_url || cat.thumbnail)}
                                alt={cat.name}
                                className="w-10 h-10 rounded-xl object-cover border border-[var(--neutral-border)] flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-black text-xs flex items-center justify-center flex-shrink-0">
                                {cat.name?.slice(0, 2)?.toUpperCase() || 'KT'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-extrabold block text-sm text-[var(--neutral-text-main)] truncate max-w-xs">
                                {cat.name}
                              </span>
                              <span className="text-xs text-gray-500 block truncate">
                                {cat.organizer || eventData?.name || 'Tanpa Penyelenggara'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Finalists Count */}
                        <td>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                            {cat.finalists_count ?? 0} Finalis
                          </span>
                        </td>

                        {/* Pricing & Mode */}
                        <td>
                          <div className="text-xs">
                            <span className="font-extrabold text-[#70B325] block">
                              Rp {(cat.price_per_vote || 1000).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                              {cat.allow_free_vote ? (
                                <>
                                  <IconCheck className="w-3 h-3 text-emerald-500" />
                                  <span>Vote Gratis</span>
                                </>
                              ) : (
                                <>
                                  <IconCoins className="w-3 h-3 text-amber-500" />
                                  <span>Pure Paid</span>
                                </>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Freeze Mode */}
                        <td>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cat.freeze_leaderboard
                                ? 'bg-sky-100 text-sky-800 border border-sky-300 font-extrabold'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {cat.freeze_leaderboard ? (
                              <>
                                <IconSnowflake className="w-3 h-3 text-sky-600" />
                                <span>Freeze</span>
                              </>
                            ) : (
                              <>
                                <IconLockOpen className="w-3 h-3 text-emerald-600" />
                                <span>Buka</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cat.status === 'active'
                                ? 'bg-[#EBF7E3] text-[#48781B]'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {cat.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>

                        {/* Actions: Direct Finalists Drilldown + Tools */}
                        <td className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Primary Action Button: Buka Finalis */}
                            <button
                              type="button"
                              onClick={() => setSelectedCategory(cat)}
                              className="px-3 py-1.5 rounded-lg text-xs font-black text-white bg-[#70B325] hover:bg-[#5f991f] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                              title="Buka dan kelola daftar finalis untuk kategori ini"
                            >
                              <IconUsers className="w-3.5 h-3.5" />
                              <span>Kelola Finalis ({cat.finalists_count ?? 0})</span>
                              <IconChevronRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Secondary Action: Paket */}
                            <button
                              type="button"
                              onClick={() => setPackagesModalCategory(cat)}
                              className="px-2 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Atur paket harga suara"
                            >
                              <IconCoins className="w-3.5 h-3.5" />
                              <span>Paket</span>
                            </button>

                            {/* Secondary Action: Embed */}
                            <button
                              type="button"
                              onClick={() => setEmbedModalCategory(cat)}
                              className="px-2 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Kode widget embed"
                            >
                              <IconGlobe className="w-3.5 h-3.5" />
                              <span>Embed</span>
                            </button>

                            {/* Secondary Action: CSV */}
                            <button
                              type="button"
                              onClick={() => window.open(`/api/admin/categories/${cat.id}/export`, '_blank')}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-green-700 hover:bg-green-50 transition-colors cursor-pointer"
                              title="Unduh laporan suara (CSV)"
                            >
                              <IconDownload className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit & Delete */}
                            <button
                              type="button"
                              onClick={() => openEditCategory(cat)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] transition-colors cursor-pointer"
                              title="Ubah data kategori"
                            >
                              <IconEdit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus kategori"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ====================================================================== */
        /* LEVEL 2: FINALISTS WORKSPACE FOR SELECTED CATEGORY                     */
        /* ====================================================================== */
        <div className="space-y-4">
          {/* Header Bar with Back Button */}
          <div className="card-base p-4 bg-[var(--neutral-surface)] border border-[var(--neutral-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-[var(--brand-primary)] text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <IconChevronLeft className="w-4 h-4" />
                <span>Kembali ke Kategori</span>
              </button>

              <div className="h-6 w-[1px] bg-gray-200 dark:bg-white/10 hidden sm:block" />

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                      selectedCategory.tier === 'premier'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : selectedCategory.tier === 'sekunder'
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : 'bg-orange-100 text-orange-800 border-orange-300'
                    }`}
                  >
                    {selectedCategory.tier === 'premier' ? (
                      <>
                        <IconCrown className="w-3 h-3 text-amber-600" />
                        <span>Premier</span>
                      </>
                    ) : selectedCategory.tier === 'sekunder' ? (
                      <>
                        <IconMedal className="w-3 h-3 text-slate-600" />
                        <span>Sekunder</span>
                      </>
                    ) : (
                      <>
                        <IconMedal className="w-3 h-3 text-orange-600" />
                        <span>Tersier</span>
                      </>
                    )}
                  </span>
                  <h2 className="text-base font-black text-[var(--neutral-text-main)] truncate">
                    {selectedCategory.name}
                  </h2>
                </div>
                <span className="text-[11px] text-gray-400 font-semibold block">
                  Total Suara Kategori Ini: <strong className="text-[#70B325]">{totalVotesInSelectedCategory.toLocaleString('id-ID')} suara</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateFinalist}
              className="btn-primary text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-center"
            >
              <IconPlus className="w-4 h-4" />
              <span>Tambah Finalis di Kategori Ini</span>
            </button>
          </div>

          {/* Search toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <IconSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={finalistSearch}
                onChange={(e) => setFinalistSearch(e.target.value)}
                placeholder="Cari nama kandidat finalis..."
                className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-xl focus:border-[var(--brand-primary)] focus:outline-none"
              />
            </div>

            <span className="text-xs text-gray-500">
              Menampilkan <strong>{filteredFinalists.length}</strong> finalis
            </span>
          </div>

          {/* Finalists Table */}
          <div className="data-table-container">
            {loadingFinalists ? (
              <div className="p-12 text-center text-gray-500">
                <div className="w-7 h-7 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold">Memuat daftar finalis...</p>
              </div>
            ) : filteredFinalists.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                  <IconUsers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Belum ada finalis di kategori &quot;{selectedCategory.name}&quot;
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Klik tombol di bawah untuk mendaftarkan kandidat pertama.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateFinalist}
                  className="btn-primary text-xs font-bold py-2 px-4 mx-auto"
                >
                  + Daftarkan Finalis Baru
                </button>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Foto &amp; Nama Finalis</th>
                    <th>Instagram</th>
                    <th>Total Suara</th>
                    <th>Visi / Bio</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFinalists.map((fin) => {
                    const photoSrc = fin.photo || fin.photo_url ? resolveStorageUrl(fin.photo_url || fin.photo) : null

                    return (
                      <tr key={fin.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                        {/* Name & Photo */}
                        <td>
                          <div className="flex items-center gap-3">
                            {photoSrc ? (
                              <img
                                src={photoSrc}
                                alt={fin.name}
                                className="w-11 h-11 rounded-xl object-cover border border-[var(--neutral-border)] flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center flex-shrink-0">
                                {fin.name?.slice(0, 2)?.toUpperCase() || 'FN'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-extrabold block text-sm text-[var(--neutral-text-main)] truncate max-w-xs">
                                {fin.name}
                              </span>
                              <span className="text-xs text-gray-400 block truncate">
                                {fin.description || 'Tidak ada deskripsi'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* IG */}
                        <td>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {fin.social_ig ? `@${fin.social_ig.replace(/^@/, '')}` : '-'}
                          </span>
                        </td>

                        {/* Votes */}
                        <td>
                          <span className="text-xs font-black text-[#70B325] bg-[#F2F9EC] dark:bg-[#70B325]/15 px-2.5 py-1 rounded-lg">
                            {(fin.vote_count ?? 0).toLocaleString('id-ID')} suara
                          </span>
                        </td>

                        {/* Bio */}
                        <td>
                          <span className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                            {fin.bio || '-'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setAdjustModalFinalist(fin)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Koreksi jumlah perolehan suara"
                            >
                              <IconScale className="w-3.5 h-3.5" />
                              <span>Koreksi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditFinalist(fin)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] transition-colors cursor-pointer"
                              title="Ubah data finalis"
                            >
                              <IconEdit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFinalist(fin)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus finalis"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* DRAWER: ADD / EDIT CATEGORY                                            */}
      {/* ====================================================================== */}
      {isCategoryDrawerOpen && (
        <>
          <div onClick={() => setIsCategoryDrawerOpen(false)} className="drawer-backdrop animate-fadeIn" />
          <div className="drawer-panel p-6 animate-slideLeft">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--neutral-border)]">
              <div>
                <h2 className="text-lg font-extrabold text-[var(--neutral-text-main)]">
                  {editingCategory ? 'Ubah Kategori Voting' : 'Tambah Kategori di Event Ini'}
                </h2>
                <p className="text-xs text-gray-400">
                  Event: <strong>{eventData?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex-1 overflow-y-auto py-5 space-y-4">
              {/* Poster Thumbnail */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Thumbnail Khusus Kategori (Opsional)
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Fallback: Poster Event
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCategoryValues((prev) => ({ ...prev, thumbnail: e.target.files?.[0] ?? '' }))}
                  className="form-input text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[var(--brand-primary-light)] file:text-[var(--brand-primary)]"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Kosongkan jika ingin otomatis menggunakan poster/thumbnail utama dari Event. Jika diisi, thumbnail ini akan khusus tampil untuk sesi kategori ini saja.
                </p>
              </div>

              {/* Theme Color Selection */}
              <div className="space-y-2 p-3.5 rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-surface-soft)]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Warna Tema Background (Luxury Dynamic Backdrop)
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Auto-Generate
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {LUXURY_PALETTES.map((pal) => (
                    <button
                      key={pal.color}
                      type="button"
                      onClick={() => setCategoryValues((prev) => ({ ...prev, theme_color: pal.color }))}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        (categoryValues.theme_color || '#154228').toLowerCase() === pal.color.toLowerCase()
                          ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm ring-2 ring-emerald-500/30'
                          : 'border-[var(--neutral-border)] text-gray-600 dark:text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs flex-shrink-0"
                        style={{ backgroundColor: pal.color }}
                      />
                      <span>{pal.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="color"
                    value={categoryValues.theme_color || '#154228'}
                    onChange={(e) => setCategoryValues((prev) => ({ ...prev, theme_color: e.target.value }))}
                    className="w-9 h-9 p-0.5 rounded-xl border border-[var(--neutral-border)] bg-transparent cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={categoryValues.theme_color ?? '#154228'}
                    onChange={(e) => setCategoryValues((prev) => ({ ...prev, theme_color: e.target.value }))}
                    className="form-input text-xs sm:text-sm font-mono flex-1 uppercase"
                    placeholder="Contoh: #BE123C"
                  />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                  Cukup pilih 1 warna dasar yang cocok dengan poster. Sistem akan otomatis me-render latar belakang bergelombang sutra mewah dan kilau bintang sparkle.
                </p>
              </div>

              {/* Tier Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Tingkatan Kategori (Tier Order) *
                </label>
                <select
                  value={categoryValues.tier ?? 'premier'}
                  onChange={(e) => setCategoryValues((prev) => ({ ...prev, tier: e.target.value }))}
                  className="form-input text-xs sm:text-sm bg-[var(--neutral-surface)]"
                  required
                >
                  <option value="premier">Premier (Kategori Utama / Prioritas 1)</option>
                  <option value="sekunder">Sekunder (Kategori Kedua / Prioritas 2)</option>
                  <option value="tersier">Tersier (Kategori Ketiga / Prioritas 3)</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Urutan Tampilan Nomor (1, 2, 3...)
                </label>
                <input
                  type="number"
                  min="1"
                  value={categoryValues.sort_order ?? 1}
                  onChange={(e) => setCategoryValues((prev) => ({ ...prev, sort_order: e.target.value }))}
                  className="form-input text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Nama Kategori / Sesi Voting *
                </label>
                <input
                  type="text"
                  value={categoryValues.name ?? ''}
                  onChange={(e) => setCategoryValues((prev) => ({ ...prev, name: e.target.value }))}
                  className="form-input text-xs sm:text-sm"
                  placeholder="Contoh: Pemilihan Ketua BEM"
                  required
                />
                {categoryErrors.name && (
                  <small className="text-red-600 text-[11px] block mt-1">{categoryErrors.name[0]}</small>
                )}
              </div>

              {/* Price per vote */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Tarif per Suara Berbayar (Rp)
                </label>
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={categoryValues.price_per_vote ?? 10000}
                  onChange={(e) => setCategoryValues((prev) => ({ ...prev, price_per_vote: e.target.value }))}
                  className="form-input text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Free Vote Option */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Sediakan 1x Vote Gratis?
                </label>
                <select
                  value={categoryValues.allow_free_vote ?? 1}
                  onChange={(e) => setCategoryValues((prev) => ({ ...prev, allow_free_vote: Number(e.target.value) }))}
                  className="form-input text-xs sm:text-sm bg-[var(--neutral-surface)]"
                >
                  <option value={1}>Ya, Sediakan 1x Vote Gratis</option>
                  <option value={0}>Tidak, Wajib Vote Berbayar (Pure Paid)</option>
                </select>
              </div>

              {/* Freeze Leaderboard Option */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Bekukan Leaderboard (Freeze Mode)?
                </label>
                <select
                  value={categoryValues.freeze_leaderboard ?? 0}
                  onChange={(e) => setCategoryValues((prev) => ({ ...prev, freeze_leaderboard: Number(e.target.value) }))}
                  className="form-input text-xs sm:text-sm bg-[var(--neutral-surface)]"
                >
                  <option value={0}>Buka Publik (Real-time Terbuka)</option>
                  <option value={1}>Bekukan / Sembunyikan Perolehan Suara (Freeze)</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Deskripsi Singkat Voting
                </label>
                <textarea
                  rows={3}
                  value={categoryValues.description ?? ''}
                  onChange={(e) => setCategoryValues((prev) => ({ ...prev, description: e.target.value }))}
                  className="form-input text-xs sm:text-sm resize-y"
                  placeholder="Deskripsi sesi kategori pemilihan..."
                />
              </div>

              {/* Actions */}
              <div className="pt-5 border-t border-[var(--neutral-border)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryDrawerOpen(false)}
                  className="btn-secondary text-xs font-bold py-2.5 px-4"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="btn-primary text-xs font-bold py-2.5 px-5"
                >
                  {savingCategory ? 'Menyimpan...' : editingCategory ? 'Simpan Kategori' : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ====================================================================== */}
      {/* DRAWER: ADD / EDIT FINALIST                                            */}
      {/* ====================================================================== */}
      {isFinalistDrawerOpen && (
        <>
          <div onClick={() => setIsFinalistDrawerOpen(false)} className="drawer-backdrop animate-fadeIn" />
          <div className="drawer-panel p-6 animate-slideLeft">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--neutral-border)]">
              <div>
                <h2 className="text-lg font-extrabold text-[var(--neutral-text-main)]">
                  {editingFinalist ? 'Ubah Data Finalis' : 'Daftarkan Finalis Baru'}
                </h2>
                <p className="text-xs text-gray-400">
                  Kategori: <strong>{selectedCategory?.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFinalistDrawerOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFinalist} className="flex-1 overflow-y-auto py-5 space-y-4">
              {/* Photo */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Foto Utama / Poster Finalis *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFinalistValues((prev) => ({ ...prev, photo: e.target.files?.[0] ?? '' }))}
                  className="form-input text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[var(--brand-primary-light)] file:text-[var(--brand-primary)]"
                />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Nama Lengkap Finalis *
                </label>
                <input
                  type="text"
                  value={finalistValues.name ?? ''}
                  onChange={(e) => setFinalistValues((prev) => ({ ...prev, name: e.target.value }))}
                  className="form-input text-xs sm:text-sm"
                  placeholder="Contoh: Arya Pratama Putra"
                  required
                />
                {finalistErrors.name && (
                  <small className="text-red-600 text-[11px] block mt-1">{finalistErrors.name[0]}</small>
                )}
              </div>

              {/* Instagram */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Akun Instagram
                </label>
                <input
                  type="text"
                  value={finalistValues.social_ig ?? ''}
                  onChange={(e) => setFinalistValues((prev) => ({ ...prev, social_ig: e.target.value }))}
                  className="form-input text-xs sm:text-sm"
                  placeholder="Contoh: aryapratama_"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Biodata / Visi Misi Singkat
                </label>
                <input
                  type="text"
                  value={finalistValues.bio ?? ''}
                  onChange={(e) => setFinalistValues((prev) => ({ ...prev, bio: e.target.value }))}
                  className="form-input text-xs sm:text-sm"
                  placeholder="Contoh: Mewujudkan kampus yang inklusif dan inovatif"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Asal Daerah / Profil Lengkap Finalis
                </label>
                <textarea
                  rows={3}
                  value={finalistValues.description ?? ''}
                  onChange={(e) => setFinalistValues((prev) => ({ ...prev, description: e.target.value }))}
                  className="form-input text-xs sm:text-sm resize-y"
                  placeholder="Asal daerah, fakultas, atau riwayat prestasi..."
                />
              </div>

              {/* Actions */}
              <div className="pt-5 border-t border-[var(--neutral-border)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFinalistDrawerOpen(false)}
                  className="btn-secondary text-xs font-bold py-2.5 px-4"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingFinalist}
                  className="btn-primary text-xs font-bold py-2.5 px-5"
                >
                  {savingFinalist ? 'Menyimpan...' : editingFinalist ? 'Simpan Perubahan' : 'Tambah Finalis'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ====================================================================== */}
      {/* MODAL: EDIT EVENT DETAILS                                              */}
      {/* ====================================================================== */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--neutral-border)]">
              <h3 className="font-extrabold text-base text-[var(--neutral-text-main)]">
                Edit Data Event
              </h3>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Nama Event / Ajang *
                </label>
                <input
                  type="text"
                  value={eventValues.name}
                  onChange={(e) => setEventValues((prev) => ({ ...prev, name: e.target.value }))}
                  className="form-input text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={eventValues.start_date || ''}
                    onChange={(e) => setEventValues((prev) => ({ ...prev, start_date: e.target.value }))}
                    className="form-input text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={eventValues.end_date || ''}
                    onChange={(e) => setEventValues((prev) => ({ ...prev, end_date: e.target.value }))}
                    className="form-input text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Poster / Thumbnail Event (Rasio 3:4 Potret)
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    900 × 1200 px
                  </span>
                </div>
                {eventValues.thumbnail && !(eventValues.thumbnail instanceof File) && (
                  <div className="flex items-center gap-3 p-2 bg-[var(--neutral-surface-soft)] rounded-xl border border-[var(--neutral-border)]">
                    <img
                      src={resolveStorageUrl(eventValues.thumbnail)}
                      alt="Current Poster"
                      className="w-12 h-16 rounded-lg object-cover border border-[var(--neutral-border)] shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Poster Saat Ini</p>
                      <p className="text-[11px] text-gray-500 truncate">Pilih file baru di bawah untuk mengganti</p>
                    </div>
                  </div>
                )}
                {eventValues.thumbnail instanceof File && (
                  <div className="flex items-center gap-3 p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                    <img
                      src={URL.createObjectURL(eventValues.thumbnail)}
                      alt="New Poster Preview"
                      className="w-12 h-16 rounded-lg object-cover border border-emerald-300 shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Poster Baru Terpilih</p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate">{eventValues.thumbnail.name}</p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEventValues((prev) => ({ ...prev, thumbnail: e.target.files?.[0] ?? prev.thumbnail }))}
                  className="form-input text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[var(--brand-primary-light)] file:text-[var(--brand-primary)]"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Poster ini adalah identitas visual utama event dan akan tampil di katalog beranda publik serta diwarisi ke seluruh kategori di bawah event ini.
                </p>
              </div>

              {/* Event Theme Color */}
              <div className="space-y-2 p-3.5 rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-surface-soft)]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Warna Tema Utama Event (Default untuk Kategori)
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Auto-Generate
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {LUXURY_PALETTES.map((pal) => (
                    <button
                      key={pal.color}
                      type="button"
                      onClick={() => setEventValues((prev) => ({ ...prev, theme_color: pal.color }))}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        (eventValues.theme_color || '#154228').toLowerCase() === pal.color.toLowerCase()
                          ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm ring-2 ring-emerald-500/30'
                          : 'border-[var(--neutral-border)] text-gray-600 dark:text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs flex-shrink-0"
                        style={{ backgroundColor: pal.color }}
                      />
                      <span>{pal.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="color"
                    value={eventValues.theme_color || '#154228'}
                    onChange={(e) => setEventValues((prev) => ({ ...prev, theme_color: e.target.value }))}
                    className="w-9 h-9 p-0.5 rounded-xl border border-[var(--neutral-border)] bg-transparent cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={eventValues.theme_color ?? '#154228'}
                    onChange={(e) => setEventValues((prev) => ({ ...prev, theme_color: e.target.value }))}
                    className="form-input text-xs sm:text-sm font-mono flex-1 uppercase"
                    placeholder="Contoh: #166534"
                  />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                  Warna ini akan menjadi tema default seluruh kategori jika kategori tidak menentukan warna tersendiri.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Status Event
                </label>
                <select
                  value={eventValues.status}
                  onChange={(e) => setEventValues((prev) => ({ ...prev, status: e.target.value }))}
                  className="form-input text-xs sm:text-sm bg-[var(--neutral-surface)]"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif / Selesai</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[var(--neutral-border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="btn-secondary text-xs font-bold py-2 px-3"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="btn-primary text-xs font-bold py-2 px-4"
                >
                  {savingEvent ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* External Reusable Modals */}
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
          onSuccess={loadEvent}
        />
      )}

      {adjustModalFinalist && (
        <AdjustVoteModal
          isOpen={Boolean(adjustModalFinalist)}
          onClose={() => setAdjustModalFinalist(null)}
          finalist={adjustModalFinalist}
          onSuccess={async () => {
            await loadFinalists()
            await loadEvent()
          }}
        />
      )}
    </div>
  )
}
