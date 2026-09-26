import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, resolveStorageUrl } from '../api/client'
import PublicHeader from '../components/PublicHeader'
import VotingCountdown from '../components/VotingCountdown'
import CommercialVoteModal from '../components/CommercialVoteModal'
import FinalistDetailModal from '../components/FinalistDetailModal'
import EReceiptModal from '../components/EReceiptModal'
import {
  IconChevronRight,
  IconClock,
  IconUsers,
  IconSearch,
  IconCalendar,
  IconZap,
  IconClose,
  IconCheckVote,
  IconTrophy,
} from '../components/Icons'

export default function CategoryVotingPage() {
  const { categoryId } = useParams()
  const [searchParams] = useSearchParams()

  const [category, setCategory] = useState(null)
  const [finalists, setFinalists] = useState([])
  const [activeTab, setActiveTab] = useState('finalis') // 'finalis' | 'leaderboard' | 'dukungan' | 'deskripsi'
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isVotingExpired, setIsVotingExpired] = useState(false)

  // Wall of Support Messages State
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [selectedMessageFinalistId, setSelectedMessageFinalistId] = useState('')

  // Modals state
  const [selectedFinalistForVote, setSelectedFinalistForVote] = useState(null)
  const [selectedFinalistForDetail, setSelectedFinalistForDetail] = useState(null)
  const [eReceiptData, setEReceiptData] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // Fetch category info and finalists
  const loadData = useCallback(async () => {
    try {
      const [catRes, finRes] = await Promise.all([
        api(`/categories/${categoryId}`).catch(() => null),
        api(`/categories/${categoryId}/leaderboard`),
      ])

      if (catRes?.data) {
        setCategory(catRes.data)
      }
      setFinalists(finRes.data || [])
      setError('')
    } catch (err) {
      setError(err.message || 'Gagal memuat data kategori')
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  const loadMessages = useCallback(async () => {
    try {
      setLoadingMessages(true)
      const query = selectedMessageFinalistId ? `?finalist_id=${selectedMessageFinalistId}` : ''
      const res = await api(`/categories/${categoryId}/messages${query}`)
      setMessages(res.data || [])
    } catch {
      // Gracefully maintain client resilience
    } finally {
      setLoadingMessages(false)
    }
  }, [categoryId, selectedMessageFinalistId])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [categoryId])

  useEffect(() => {
    loadData()
    const interval = window.setInterval(loadData, 10000)
    return () => window.clearInterval(interval)
  }, [loadData])

  useEffect(() => {
    loadMessages()
    const interval = window.setInterval(loadMessages, 8000)
    return () => window.clearInterval(interval)
  }, [loadMessages])

  // Handle URL param: ?finalist=123 (direct candidate deep link)
  useEffect(() => {
    const finalistParam = searchParams.get('finalist')
    if (finalistParam && finalists.length > 0) {
      const found = finalists.find(
        (f) => String(f.id) === String(finalistParam)
      )
      if (found) {
        setSelectedFinalistForDetail(found)
      }
    }
  }, [searchParams, finalists])

  // Update browser tab document.title
  useEffect(() => {
    if (category?.name) {
      document.title = `${category.name} | Sebaris E-Voting`
    } else if (!loading) {
      document.title = 'Voting Tidak Ditemukan | Sebaris E-Voting'
    } else {
      document.title = 'Memuat Voting... | Sebaris E-Voting'
    }
    return () => {
      document.title = 'Sebaris | Platform E-Voting'
    }
  }, [category?.name, loading])

  // Dynamically update browser address bar to match slug
  useEffect(() => {
    if (category?.slug && categoryId !== category.slug) {
      window.history.replaceState(null, '', `/categories/${category.slug}`)
    }
  }, [category?.slug, categoryId])

  // Total votes for percentage calculation
  const totalVotes = useMemo(
    () => finalists.reduce((acc, curr) => acc + (curr.vote_count || 0), 0),
    [finalists]
  )

  // Filtered finalists by search query
  const filteredFinalists = useMemo(() => {
    if (!searchQuery.trim()) return finalists
    const q = searchQuery.toLowerCase()
    return finalists.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    )
  }, [finalists, searchQuery])

  // Share candidate helpers
  function handleShareWhatsApp(finalist) {
    const directUrl = `${window.location.origin}/categories/${category?.slug || categoryId}?finalist=${finalist.id}`
    const text = `Halo! Yuk dukung kandidat *${finalist.name}* di ajang *${category?.name || 'Voting'}* melalui sebaris.id! 🌟\n\nKlik link ini untuk beri vote secara langsung:\n${directUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function handleCopyLink(finalist) {
    const directUrl = `${window.location.origin}/categories/${category?.slug || categoryId}?finalist=${finalist.id}`
    navigator.clipboard.writeText(directUrl)
    setCopiedId(finalist.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const categoryTitle =
    category?.name || (loading ? 'Memuat data voting...' : 'Kategori Voting')

  const isFrozen = Boolean(category?.freeze_leaderboard)

  return (
    <div className="min-h-screen bg-[#F8FAF7] dark:bg-[#121612] text-[#262A25] dark:text-[#F3F5F1] flex flex-col font-sans transition-colors duration-300">
      
      {/* Sticky Header */}
      <PublicHeader />

      {/* TOP OFFICIAL EVENT HERO BANNER (KreenConnect Pageant & Competition Stage) */}
      <section className="relative bg-gradient-to-br from-[#123E2A] via-[#102D1F] to-[#0A1D14] text-white border-b border-[#2C3529] overflow-hidden -mt-16 sm:-mt-20 pt-20 sm:pt-24 pb-6 sm:pb-8">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10 space-y-5">
          
          {/* Breadcrumb Row */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-gray-300/80 truncate">
            <Link to="/" className="text-gray-300 hover:text-[#D0FE15] transition-colors no-underline">
              Beranda
            </Link>
            <IconChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <Link to="/#voting-section" className="text-gray-300 hover:text-[#D0FE15] transition-colors no-underline">
              Ajang Voting
            </Link>
            <IconChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="text-white font-bold truncate">
              {categoryTitle}
            </span>
          </nav>

          {/* Event Header Information & Live Countdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Left Column (8 cols): Event Badges, Title, Organizer, and Metrics */}
            <div className="lg:col-span-8 space-y-4 text-left">
              
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#70B325]/90 text-white text-[11px] font-black tracking-wide uppercase shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Sedang Berlangsung
                </span>

                {category?.organizer && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-gray-200 text-xs font-semibold">
                    <span className="text-[#D0FE15] font-black">✓</span>
                    <span>{category.organizer}</span>
                  </span>
                )}

                {category?.allow_free_vote !== false && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-[11px] font-extrabold">
                    ⚡ 1x Vote Gratis
                  </span>
                )}
              </div>

              {/* Event Main Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
                {categoryTitle}
              </h1>

              {/* Event Description Snippet */}
              {category?.description && (
                <p className="text-xs sm:text-sm text-gray-200/85 max-w-3xl leading-relaxed line-clamp-2">
                  {category.description}
                </p>
              )}

              {/* Event Metrics Pills Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1">
                <div className="bg-black/35 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-white/15 flex flex-col justify-between min-w-0">
                  <span className="text-[10px] uppercase font-bold text-gray-300 block truncate">Finalis Resmi</span>
                  <span className="text-sm sm:text-base lg:text-lg font-black text-white block mt-0.5 truncate">
                    {finalists.length} Kandidat
                  </span>
                </div>

                <div className="bg-black/35 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-white/15 flex flex-col justify-between min-w-0">
                  <span className="text-[10px] uppercase font-bold text-gray-300 block truncate">Total Suara</span>
                  <span className="text-sm sm:text-base lg:text-lg font-black text-[#D0FE15] block mt-0.5 truncate">
                    {isFrozen ? '🔒 Freeze' : `${totalVotes.toLocaleString('id-ID')} Suara`}
                  </span>
                </div>

                <div className="bg-black/35 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-white/15 flex flex-col justify-between min-w-0">
                  <span className="text-[10px] uppercase font-bold text-gray-300 block truncate">Tarif Tambahan</span>
                  <span className="text-sm sm:text-base lg:text-lg font-black text-white block mt-0.5 truncate">
                    Rp {(category?.price_per_vote || 1000).toLocaleString('id-ID')}/vote
                  </span>
                </div>

                <div className="bg-black/35 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-white/15 flex flex-col justify-between min-w-0">
                  <span className="text-[10px] uppercase font-bold text-gray-300 block truncate">Pembayaran</span>
                  <span className="text-sm sm:text-base lg:text-lg font-black text-white block mt-0.5 truncate">
                    QRIS &amp; VA Otomatis
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column (4 cols): Embedded Digital Countdown Box */}
            <div className="lg:col-span-4 w-full">
              {category?.end_date ? (
                <VotingCountdown
                  endDate={category.end_date}
                  status={category.status}
                  onExpire={(expired) => setIsVotingExpired(expired)}
                />
              ) : (
                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-[#D0FE15] text-xs font-black uppercase">
                    <span className="w-2 h-2 rounded-full bg-[#D0FE15] animate-ping" />
                    Live Voting System
                  </div>
                  <h3 className="text-sm font-extrabold text-white">Tabulasi Suara Real-Time</h3>
                  <p className="text-xs text-gray-300">
                    Sistem pemilihan daring terbuka dan diproteksi anti kecurangan.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* STICKY NAVIGATION TABS (KreenConnect Dense Navigation Bar) */}
      <nav
        aria-label="Tab Ajang Pemilihan"
        className="bg-white dark:bg-[#161B15] border-b border-[#E5EADF] dark:border-[#2C3529] sticky top-20 z-30 shadow-xs transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start sm:justify-start gap-4 sm:gap-8 overflow-x-auto scrollbar-none">
            
            <button
              type="button"
              onClick={() => setActiveTab('finalis')}
              className={`py-3.5 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'finalis'
                  ? 'border-[#70B325] text-[#70B325] dark:text-[#86C839]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>Daftar Finalis</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'finalis'
                  ? 'bg-[#EBF6E2] text-[#4F7E1D] dark:bg-white/10 dark:text-[#86C839]'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'
              }`}>
                {finalists.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className={`py-3.5 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'leaderboard'
                  ? 'border-[#70B325] text-[#70B325] dark:text-[#86C839]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>Peringkat &amp; Perolehan</span>
              {isFrozen && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-black">
                  ❄️ Freeze
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dukungan')}
              className={`py-3.5 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'dukungan'
                  ? 'border-[#70B325] text-[#70B325] dark:text-[#86C839]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>Pesan Pendukung</span>
              {messages.length > 0 && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'dukungan'
                    ? 'bg-[#EBF6E2] text-[#4F7E1D] dark:bg-white/10 dark:text-[#86C839]'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                }`}>
                  {messages.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('deskripsi')}
              className={`py-3.5 font-extrabold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'deskripsi'
                  ? 'border-[#70B325] text-[#70B325] dark:text-[#86C839]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Ketentuan &amp; Regulasi
            </button>

          </div>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6">
        
        {/* FREEZE NOTIFICATION BANNER */}
        {isFrozen && (
          <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-2xl p-4 sm:p-5 border border-sky-400/30 shadow-sm animate-fadeIn">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
                ❄️
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-sky-300">
                    Leaderboard Freeze Active
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Perolehan Suara Sementara Dirahasiakan oleh Panitia
                </h3>
                <p className="text-xs text-sky-100/80 mt-0.5">
                  Untuk menjaga kejutan juara di malam puncak pengumuman, perolehan angka disembunyikan. Anda tetap dapat memberikan suara dukungan sah.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* WALL OF SUPPORT LIVE STREAM TICKER */}
        {messages.length > 0 && activeTab !== 'dukungan' && (
          <div
            onClick={() => setActiveTab('dukungan')}
            className="bg-white dark:bg-[#1A2018] hover:bg-[#F8FAF6] dark:hover:bg-[#20271E] border border-[#D5E6C4] dark:border-[#2C3529] rounded-2xl p-3 sm:px-4 sm:py-3 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition-all animate-fadeIn"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#70B325] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#70B325]" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#558223] dark:text-[#86C839] flex-shrink-0">
                💬 Dukungan Baru:
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                <strong className="text-gray-900 dark:text-white">{messages[0].voter_name}</strong>{' '}
                <span className="text-gray-400">({messages[0].time_ago}):</span>{' '}
                <span className="italic text-gray-600 dark:text-gray-300">&quot;{messages[0].message}&quot;</span>
              </p>
            </div>
            <span className="text-xs font-bold text-[#70B325] dark:text-[#86C839] flex-shrink-0 hover:underline">
              Lihat Semua →
            </span>
          </div>
        )}

        {/* TAB 1: FINALIS (Authentic KreenConnect Competition Card Architecture) */}
        {activeTab === 'finalis' && (
          <section className="space-y-6">
            
            {/* Search Bar & Filter Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:max-w-md relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau nomor urut kandidat..."
                  className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm bg-white dark:bg-[#1A2018] border border-[#CADDB8] dark:border-[#2C3529] rounded-xl text-[#262A25] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#70B325] shadow-xs"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <IconSearch className="w-4 h-4 text-gray-400" />
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  >
                    <IconClose className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 self-end sm:self-center">
                Menampilkan <strong className="text-gray-900 dark:text-white">{filteredFinalists.length}</strong> finalis
              </div>
            </div>

            {/* Loading & Error States */}
            {loading && (
              <div className="p-16 text-center text-gray-500">
                <div className="w-8 h-8 border-3 border-[#70B325] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold">Memuat data finalis...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-xl text-center">
                <p className="text-sm font-bold">{error}</p>
                <button
                  type="button"
                  onClick={loadData}
                  className="mt-2 text-xs font-bold underline cursor-pointer"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredFinalists.length === 0 && (
              <div className="bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl p-12 text-center text-gray-500 max-w-lg mx-auto">
                <IconUsers className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-base font-extrabold text-[#262A25] dark:text-white">
                  {searchQuery ? 'Finalis tidak ditemukan' : 'Belum ada finalis terdaftar'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery
                    ? `Tidak ada kandidat yang cocok dengan pencarian "${searchQuery}".`
                    : 'Penyelenggara belum mendaftarkan kandidat untuk ajang ini.'}
                </p>
              </div>
            )}

            {/* CONTESTANT CARDS GRID (KreenConnect Professional Pageant Style) */}
            {!loading && !error && filteredFinalists.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredFinalists.map((finalist, index) => {
                  const photoSrc = finalist.photo_url || finalist.photo
                  const percentage =
                    totalVotes > 0
                      ? Math.round((finalist.vote_count / totalVotes) * 100)
                      : 0

                  return (
                    <article
                      key={finalist.id}
                      className="card-base flex flex-col overflow-hidden bg-white dark:bg-[#1A2018] border border-[#E2EADA] dark:border-[#2C3529] rounded-2xl shadow-xs hover:border-[#70B325] dark:hover:border-[#70B325] hover:shadow-md transition-all group max-w-sm sm:max-w-none mx-auto w-full"
                    >
                      {/* Portrait Photo Centerpiece (Aspect 3:4) */}
                      <div
                        onClick={() => setSelectedFinalistForDetail(finalist)}
                        className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 dark:bg-black/50 cursor-pointer"
                        title="Klik untuk membuka profil lengkap finalis"
                      >
                        {photoSrc ? (
                          <img
                            src={resolveStorageUrl(photoSrc)}
                            alt={finalist.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-emerald-950 to-gray-900 text-center p-4">
                            <div className="w-16 h-16 rounded-full bg-[#70B325]/20 text-[#70B325] flex items-center justify-center font-black text-2xl mb-2">
                              {finalist.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-gray-300">
                              Foto Resmi Finalis
                            </span>
                          </div>
                        )}

                        {/* Top Left: Candidate Number Badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20 text-xs font-black tracking-wide shadow-sm">
                            No. {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>

                        {/* Top Right: Real-time Rank Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          {index === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 font-black text-xs shadow-md border border-amber-300">
                              🥇 Juara 1
                            </span>
                          ) : index === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-black text-xs shadow-md border border-slate-300">
                              🥈 Peringkat 2
                            </span>
                          ) : index === 2 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-700 text-white font-black text-xs shadow-md border border-amber-600">
                              🥉 Peringkat 3
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-gray-200 font-bold text-[11px]">
                              #{index + 1}
                            </span>
                          )}
                        </div>

                        {/* Bottom Gradient Overlay on Photo with Status Dot */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end px-3.5 pb-2.5 justify-between pointer-events-none">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/90 bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/15">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#70B325] animate-ping" />
                            Finalis Resmi
                          </span>
                          <span className="text-[10px] text-gray-300 font-mono">
                            ID: #{finalist.id}
                          </span>
                        </div>
                      </div>

                      {/* Card Body: Information, Vote Stats & Authentic Action Buttons */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-[#1A2018]">
                        
                        {/* Name & Short Description */}
                        <div>
                          <h3
                            onClick={() => setSelectedFinalistForDetail(finalist)}
                            className="font-black text-base sm:text-lg text-[#262A25] dark:text-white group-hover:text-[#70B325] dark:group-hover:text-[#86C839] transition-colors line-clamp-1 cursor-pointer"
                          >
                            {finalist.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {finalist.description || 'Kandidat perwakilan resmi yang siap berkontribusi.'}
                          </p>
                        </div>

                        {/* Vote Stats Row */}
                        <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-white/10">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-[#262A25] dark:text-white">
                              {isFrozen ? '🔒 Suara Terkunci' : `${finalist.vote_count.toLocaleString('id-ID')} suara`}
                            </span>
                            <span className="font-bold text-[#70B325] dark:text-[#86C839] bg-[#F2F8EC] dark:bg-white/5 px-2 py-0.5 rounded-md text-[11px]">
                              {isFrozen ? 'Dirahasiakan' : `${percentage}% suara`}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isFrozen ? 'bg-sky-400 w-full opacity-40' : 'bg-[#70B325]'
                              }`}
                              style={{ width: isFrozen ? '100%' : `${percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Buttons: Primary Vote + Secondary Profile/Share Row */}
                        <div className="space-y-2 pt-1">
                          
                          {/* Main Vote CTA Button */}
                          <button
                            type="button"
                            disabled={isVotingExpired}
                            onClick={() => setSelectedFinalistForVote(finalist)}
                            className="w-full py-2.5 px-4 bg-[#70B325] hover:bg-[#5F9A1E] disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <IconZap className="w-4 h-4 text-white" />
                            <span>
                              {isVotingExpired
                                ? 'Voting Ditutup'
                                : `Beri Vote (${finalist.name.split(' ')[0]})`}
                            </span>
                          </button>

                          {/* Action Row: Profil, WhatsApp, Salin Link */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedFinalistForDetail(finalist)}
                              className="flex-1 py-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Lihat Bio 👤
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(finalist)}
                              className="px-2.5 py-1.5 text-[11px] font-bold text-[#1F8A43] bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Bagikan ke WhatsApp"
                            >
                              <span>💬 WA</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(finalist)}
                              className="px-2.5 py-1.5 text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/15 rounded-lg transition-colors cursor-pointer"
                              title="Salin Link Voting Finalis"
                            >
                              {copiedId === finalist.id ? '✓' : '🔗'}
                            </button>
                          </div>

                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: PEROLEHAN SUARA / LEADERBOARD (KreenConnect Podium Ranking) */}
        {activeTab === 'leaderboard' && (
          <section className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#262A25] dark:text-white">
                Peringkat &amp; Perolehan Suara
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {isFrozen ? (
                  <span className="text-sky-700 dark:text-sky-300 font-bold">
                    ❄️ Angka perolehan suara disembunyikan sementara oleh panitia
                  </span>
                ) : (
                  <>
                    Total Suara Masuk:{' '}
                    <strong className="text-gray-900 dark:text-white">
                      {totalVotes.toLocaleString('id-ID')} suara
                    </strong>
                  </>
                )}
              </p>
            </div>

            <div className="space-y-3">
              {finalists.map((finalist, index) => {
                const percentage =
                  totalVotes > 0
                    ? Math.round((finalist.vote_count / totalVotes) * 100)
                    : 0
                const rankColor =
                  index === 0
                    ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                    : index === 1
                    ? 'bg-slate-300 text-slate-800 font-black shadow-xs'
                    : index === 2
                    ? 'bg-amber-700 text-white font-black shadow-xs'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-bold'

                return (
                  <div
                    key={finalist.id}
                    className="card-base p-4 bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl flex items-center gap-4 hover:border-[#70B325] dark:hover:border-[#70B325] transition-all"
                  >
                    {/* Rank Number / Medal */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${rankColor}`}
                    >
                      {isFrozen ? '?' : index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>

                    {/* Candidate Photo */}
                    {finalist.photo_url || finalist.photo ? (
                      <img
                        src={resolveStorageUrl(finalist.photo_url || finalist.photo)}
                        alt={finalist.name}
                        onClick={() => setSelectedFinalistForDetail(finalist)}
                        className="w-12 h-14 rounded-xl object-cover border border-gray-200 dark:border-white/15 flex-shrink-0 cursor-pointer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-12 h-14 rounded-xl bg-[#E9F3DF] dark:bg-white/10 text-[#558223] dark:text-[#86C839] font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {finalist.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Info & Progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h3
                            onClick={() => setSelectedFinalistForDetail(finalist)}
                            className="font-extrabold text-sm text-[#262A25] dark:text-white truncate cursor-pointer hover:text-[#70B325] dark:hover:text-[#86C839]"
                          >
                            {finalist.name}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                            {finalist.description || 'Kandidat'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-[#70B325] dark:text-[#86C839] block">
                            {isFrozen ? '🔒 Dirahasiakan' : finalist.vote_count.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold block">
                            {isFrozen ? 'Freeze Mode' : `${percentage}% suara`}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-gray-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFrozen ? 'bg-sky-300 w-full opacity-40' : 'bg-[#70B325]'
                          }`}
                          style={{ width: isFrozen ? '100%' : `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Action Button */}
                    <button
                      type="button"
                      disabled={isVotingExpired}
                      onClick={() => setSelectedFinalistForVote(finalist)}
                      className="px-3.5 py-2 bg-[#F2F9EC] dark:bg-white/10 hover:bg-[#70B325] dark:hover:bg-[#70B325] disabled:bg-gray-100 text-[#558223] dark:text-[#86C839] hover:text-white dark:hover:text-white disabled:text-gray-400 font-bold text-xs rounded-xl transition-all flex-shrink-0 cursor-pointer"
                    >
                      Vote
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* TAB 3: WALL OF SUPPORT (PESAN & DOA PENDUKUNG) */}
        {activeTab === 'dukungan' && (
          <section className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
            <div className="text-center space-y-1.5 pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#70B325] dark:text-[#86C839] bg-[#EAF5DE] dark:bg-white/10 px-3 py-1 rounded-full">
                Wall of Support
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#262A25] dark:text-white">
                Pesan &amp; Doa Pendukung
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                Dukungan nyata dan pesan semangat dari para pemilih yang mengalir untuk para kandidat favorit.
              </p>
            </div>

            {/* Filter by Candidate */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl shadow-2xs">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Saring pesan berdasarkan kandidat:
              </span>
              <select
                value={selectedMessageFinalistId}
                onChange={(e) => setSelectedMessageFinalistId(e.target.value)}
                className="w-full sm:w-auto text-xs font-bold py-2 px-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/15 rounded-xl text-gray-900 dark:text-white focus:border-[#70B325] focus:outline-none"
              >
                <option value="">Semua Finalis ({messages.length} pesan)</option>
                {finalists.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Messages Grid / List */}
            {loadingMessages ? (
              <div className="p-16 text-center text-gray-500">
                <div className="w-8 h-8 border-3 border-[#70B325] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold">Memuat pesan dukungan...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl p-12 text-center text-gray-500 max-w-lg mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF5DE] dark:bg-white/10 text-[#70B325] dark:text-[#86C839] flex items-center justify-center mx-auto text-2xl font-black">
                  💬
                </div>
                <div className="space-y-1">
                  <p className="text-base font-extrabold text-[#262A25] dark:text-white">
                    Belum ada pesan dukungan
                  </p>
                  <p className="text-xs text-gray-400">
                    Jadilah pemilih pertama yang menuliskan pesan semangat dan doa untuk kandidat!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('finalis')}
                  className="btn-primary text-xs font-bold py-2 px-5 mx-auto"
                >
                  Pilih Finalis &amp; Beri Dukungan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {messages.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white dark:bg-[#1A2018] rounded-2xl border border-[#E2EADA] dark:border-[#2C3529] shadow-2xs hover:shadow-xs transition-all space-y-2.5 flex flex-col justify-between text-left"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#EAF5DE] dark:bg-white/10 text-[#558223] dark:text-[#86C839] font-black text-xs flex items-center justify-center flex-shrink-0">
                            {item.voter_name ? item.voter_name.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div className="min-w-0">
                            <strong className="text-xs font-extrabold text-gray-800 dark:text-white block truncate">
                              {item.voter_name}
                            </strong>
                            <span className="text-[10px] text-gray-400 font-semibold block truncate">
                              Mendukung: <span className="text-[#70B325] dark:text-[#86C839] font-bold">{item.finalist_name}</span>
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-black text-[#558223] dark:text-[#86C839] bg-[#EAF5DE] dark:bg-white/10 px-2.5 py-0.5 rounded-full flex-shrink-0">
                          ⚡ {item.vote_amount} Suara
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed pl-10 border-l-2 border-[#70B325]/30">
                        &quot;{item.message}&quot;
                      </p>
                    </div>

                    <div className="pt-2 text-right border-t border-gray-50 dark:border-white/5">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {item.time_ago}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 4: DESKRIPSI & REGULASI */}
        {activeTab === 'deskripsi' && (
          <section className="max-w-3xl mx-auto bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F2D9] dark:bg-white/10 text-[#4F7E1D] dark:text-[#86C839] font-bold text-xs tracking-wide mb-2">
                <IconCalendar className="w-3.5 h-3.5 text-[#70B325]" />
                Informasi Voting
              </span>
              <h2 className="text-2xl font-extrabold text-[#262A25] dark:text-white">
                {categoryTitle}
              </h2>
              {category?.organizer && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Penyelenggara: <strong className="text-gray-900 dark:text-white">{category.organizer}</strong>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-gray-100 dark:border-white/10">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Periode Voting
                </span>
                <p className="text-sm font-bold text-[#262A25] dark:text-white">
                  {category?.start_date || 'Segera'} s/d{' '}
                  {category?.end_date || 'Selesai'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Metode Pemilihan &amp; Tarif
                </span>
                <p className="text-sm font-bold text-[#70B325] dark:text-[#86C839]">
                  E-Voting Online ({category?.allow_free_vote !== false ? 'Gratis 1x & ' : ''}Paket Tambahan Rp{' '}
                  {(category?.price_per_vote || 1000).toLocaleString('id-ID')}/suara)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#262A25] dark:text-white uppercase tracking-wide">
                Tentang Ajang Ini
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {category?.description ||
                  'Ajang pemilihan dan voting online resmi yang diselenggarakan untuk menentukan perwakilan favorit masyarakat secara terbuka, transparan, dan terenkripsi.'}
              </p>
            </div>

            <div className="bg-[#F8FAF7] dark:bg-black/30 rounded-xl p-4 border border-[#E5EADF] dark:border-white/10 space-y-2">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Ketentuan &amp; Alur Voting Resmi
              </h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 list-disc pl-4">
                <li>
                  {category?.allow_free_vote !== false
                    ? 'Tersedia 1 suara gratis per kontak WhatsApp/Email atau akun Google terverifikasi.'
                    : 'Ajang ini sepenuhnya menggunakan sistem paket vote berbayar.'}
                </li>
                <li>
                  Untuk menambah dukungan, Anda dapat membeli paket suara tambahan via QRIS Dinamis dan Virtual Account Bank.
                </li>
                <li>
                  Setiap transaksi akan menerbitkan Bukti Sah E-Receipt ber-ID unik yang dapat diunduh dan dicetak.
                </li>
                <li>
                  Perolehan suara diperbarui secara real-time dan diproteksi anti kecurangan.
                </li>
              </ul>
            </div>
          </section>
        )}

      </main>

      {/* POP-UP 1: COMMERCIAL VOTE MODAL */}
      {selectedFinalistForVote && (
        <CommercialVoteModal
          isOpen={true}
          onClose={() => setSelectedFinalistForVote(null)}
          finalist={selectedFinalistForVote}
          category={category}
          onVoteSuccess={(receipt) => {
            setEReceiptData(receipt)
            loadData()
          }}
        />
      )}

      {/* POP-UP 2: FINALIST DETAIL PROFILE */}
      {selectedFinalistForDetail && (
        <FinalistDetailModal
          isOpen={true}
          onClose={() => setSelectedFinalistForDetail(null)}
          finalist={selectedFinalistForDetail}
          category={category}
          totalVotes={totalVotes}
          rank={
            finalists.findIndex((f) => f.id === selectedFinalistForDetail.id) + 1 || 1
          }
          isVotingExpired={isVotingExpired}
          onOpenVote={(finalist) => setSelectedFinalistForVote(finalist)}
        />
      )}

      {/* POP-UP 3: OFFICIAL E-RECEIPT MODAL */}
      {eReceiptData && (
        <EReceiptModal
          isOpen={true}
          onClose={() => setEReceiptData(null)}
          data={eReceiptData}
        />
      )}

    </div>
  )
}
