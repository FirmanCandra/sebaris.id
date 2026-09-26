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
} from '../components/Icons'

export default function CategoryVotingPage() {
  const { categoryId } = useParams()
  const [searchParams] = useSearchParams()

  const [category, setCategory] = useState(null)
  const [finalists, setFinalists] = useState([])
  const [activeTab, setActiveTab] = useState('finalis') // 'finalis' | 'leaderboard' | 'deskripsi'
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isVotingExpired, setIsVotingExpired] = useState(false)

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

  useEffect(() => {
    loadData()
    const interval = window.setInterval(loadData, 10000)
    return () => window.clearInterval(interval)
  }, [loadData])

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
      document.title = `${category.name} — Sebaris | Platform E-Voting`
    } else if (!loading) {
      document.title = 'Voting Tidak Ditemukan — Sebaris | Platform E-Voting'
    } else {
      document.title = 'Memuat Voting... — Sebaris | Platform E-Voting'
    }
    return () => {
      document.title = 'Sebaris | Platform E-Voting'
    }
  }, [category?.name, loading])

  // Dynamically update the browser address bar to match slug
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
    <div className="min-h-screen bg-[#F8FAF7] text-[#262A25] flex flex-col font-sans">
      <PublicHeader />

      {/* Top Banner Bar (Kreen Connect Style header banner) */}
      <div className="bg-[#123E2A] text-white py-2 px-4 text-center text-xs font-semibold tracking-wide border-b border-white/10 shadow-xs">
        <span>
          Sebaris Vote &bull; Your Trusted E-Voting Partner &bull; Dukung finalis favorit kamu di{' '}
          <strong className="text-amber-300">{categoryTitle}</strong>
        </span>
      </div>

      {/* Top Breadcrumb & Live Update Indicator */}
      <div className="bg-white border-b border-[#E8ECE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500 truncate">
            <Link to="/" className="hover:text-[#70B325] transition-colors no-underline">
              Beranda
            </Link>
            <IconChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-[#262A25] font-bold truncate">
              {categoryTitle}
            </span>
          </nav>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-500 bg-[#F4F9EE] px-3 py-1 rounded-full border border-[#D5E6C4]">
            <IconClock className="w-3.5 h-3.5 text-[#70B325]" />
            <span>Update Real-time</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Kreen Connect Style) */}
      <nav className="bg-white border-b border-[#E8ECE4] sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center sm:justify-start gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('finalis')}
              className={`py-3.5 font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer ${
                activeTab === 'finalis'
                  ? 'border-[#70B325] text-[#70B325]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Finalis ({finalists.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className={`py-3.5 font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'leaderboard'
                  ? 'border-[#70B325] text-[#70B325]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>Perolehan Suara</span>
              {isFrozen && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black">
                  ❄️ Freeze
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deskripsi')}
              className={`py-3.5 font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer ${
                activeTab === 'deskripsi'
                  ? 'border-[#70B325] text-[#70B325]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Deskripsi & Ketentuan
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* COUNTDOWN TIMER COMPONENT (PRIORITAS 1) */}
        {category?.end_date && (
          <VotingCountdown
            endDate={category.end_date}
            status={category.status}
            onExpire={(expired) => setIsVotingExpired(expired)}
          />
        )}

        {/* FREEZE NOTIFICATION BANNER (PRIORITAS 3) */}
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
                  Untuk menjaga kejutan juara di malam puncak pengumuman, perolehan angka disembunyikan. Anda tetap dapat memberikan suara dukungan!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: FINALIS (Primary view matching Kreen Connect Screenshot 2) */}
        {activeTab === 'finalis' && (
          <section className="space-y-6">
            {/* Header Titles */}
            <div className="text-center space-y-1.5 pt-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#262A25]">
                Finalis
              </h1>
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-gray-500 max-w-2xl mx-auto">
                {categoryTitle}
              </h2>
            </div>

            {/* Search Bar (Kreen Connect: 'Cari finalis') */}
            <div className="max-w-md mx-auto relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari finalis..."
                className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm bg-white border border-[#CADDB8] rounded-full text-[#262A25] placeholder-gray-400 focus:outline-none focus:border-[#70B325] shadow-xs"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <IconSearch className="w-4 h-4 text-gray-400" />
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <IconClose className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Loading & Error States */}
            {loading && (
              <div className="p-16 text-center text-gray-500">
                <div className="w-8 h-8 border-3 border-[#70B325] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold">Memuat data finalis...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
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
              <div className="bg-white border border-[#E5EADF] rounded-2xl p-12 text-center text-gray-500 max-w-lg mx-auto">
                <IconUsers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-base font-extrabold text-[#262A25]">
                  {searchQuery ? 'Finalis tidak ditemukan' : 'Belum ada finalis terdaftar'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery
                    ? `Tidak ada finalis yang cocok dengan "${searchQuery}".`
                    : 'Penyelenggara belum menambahkan kandidat untuk kategori ini.'}
                </p>
              </div>
            )}

            {/* Finalist Poster Cards Grid (Matching Adugen Poster in Screenshot 2) */}
            {!loading && !error && filteredFinalists.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredFinalists.map((finalist, index) => {
                  const photoSrc = finalist.photo_url || finalist.photo
                  const percentage =
                    totalVotes > 0
                      ? Math.round((finalist.vote_count / totalVotes) * 100)
                      : 0

                  return (
                    <article
                      key={finalist.id}
                      className="card-base flex flex-col overflow-hidden bg-white border border-[#E5EADF] rounded-2xl shadow-sm hover:border-[#70B325] hover:shadow-md transition-all group"
                    >
                      {/* Vertical Poster Container (Deep green branding like Kreen Screenshot) */}
                      <div
                        onClick={() => setSelectedFinalistForDetail(finalist)}
                        className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-b from-[#133E2B] via-[#0E2F20] to-[#0A1F16] flex flex-col justify-between p-4 cursor-pointer"
                        title="Klik untuk lihat profil lengkap finalis"
                      >
                        {/* Subtle decorative background glow */}
                        <div className="absolute inset-0 bg-radial from-emerald-500/15 via-transparent to-transparent pointer-events-none" />

                        {/* Top Branding / Category Emblem */}
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/40 backdrop-blur-xs border border-white/20 text-[10px] font-black tracking-wider text-amber-300 uppercase max-w-[200px] truncate">
                            <span className="truncate">
                              {category?.name
                                ? category.name.length > 25
                                  ? category.name.slice(0, 22) + '...'
                                  : category.name
                                : 'VOTING'}
                            </span>
                          </div>
                          <span className="text-[11px] font-black text-amber-400 tracking-wider">
                            #{index + 1}
                          </span>
                        </div>

                        {/* "VOTE NOW" Headline Watermark */}
                        <div className="relative z-10 text-center my-auto py-2">
                          <span className="block font-black text-2xl sm:text-3xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 drop-shadow-md italic">
                            VOTE NOW
                          </span>
                        </div>

                        {/* Candidate Portrait Photo */}
                        <div className="relative z-10 my-auto flex items-center justify-center">
                          {photoSrc ? (
                            <img
                              src={resolveStorageUrl(photoSrc)}
                              alt={finalist.name}
                              className="w-48 h-56 object-cover object-top rounded-2xl shadow-2xl border-2 border-amber-300/40 group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-40 h-48 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 flex flex-col items-center justify-center text-center p-4">
                              <div className="w-16 h-16 rounded-full bg-[#70B325]/20 text-[#70B325] flex items-center justify-center font-black text-xl mb-2">
                                {finalist.name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-xs font-bold text-gray-300">
                                Foto Resmi
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Nameplate */}
                        <div className="relative z-10 pt-2 border-t border-white/10 flex items-end justify-between">
                          <div className="min-w-0 pr-2">
                            <h3 className="text-base sm:text-lg font-black uppercase text-amber-300 tracking-wide truncate">
                              {finalist.name}
                            </h3>
                            <p className="text-xs font-bold text-white/90 uppercase tracking-wider truncate">
                              {finalist.description || 'Kandidat'}
                            </p>
                          </div>

                          <div className="w-9 h-9 rounded-lg bg-white p-1 flex-shrink-0 flex items-center justify-center shadow-xs">
                            <IconCheckVote className="w-6 h-6 text-[#133E2B]" />
                          </div>
                        </div>
                      </div>

                      {/* Card Action & Vote Stats */}
                      <div className="p-4 bg-white space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-[#262A25]">
                            {isFrozen ? '🔒 Suara Terkunci' : `${finalist.vote_count.toLocaleString('id-ID')} suara`}
                          </span>
                          <span className="font-bold text-[#70B325]">
                            {isFrozen ? 'Dirahasiakan' : `${percentage}% suara`}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFrozen ? 'bg-sky-400 w-full opacity-40' : 'bg-[#70B325]'
                            }`}
                            style={{ width: isFrozen ? '100%' : `${percentage}%` }}
                          />
                        </div>

                        {/* Card Buttons: Vote & Share */}
                        <div className="space-y-2 pt-1">
                          <button
                            type="button"
                            disabled={isVotingExpired}
                            onClick={() => setSelectedFinalistForVote(finalist)}
                            className="w-full py-2.5 px-4 bg-[#70B325] hover:bg-[#5F9A1E] disabled:bg-gray-300 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <IconZap className="w-4 h-4 text-white" />
                            <span>
                              {isVotingExpired
                                ? 'Voting Ditutup'
                                : `Beri Vote (${finalist.name.split(' ')[0]})`}
                            </span>
                          </button>

                          {/* Quick Actions (Share to WA, Copy link, Bio popup) */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedFinalistForDetail(finalist)}
                              className="flex-1 py-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Lihat Bio 👤
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(finalist)}
                              className="px-2.5 py-1.5 text-[11px] font-bold text-[#1F8A43] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Bagikan ke WhatsApp"
                            >
                              <span>💬 WA</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(finalist)}
                              className="px-2.5 py-1.5 text-[11px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                              title="Salin Link"
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

        {/* TAB 2: PEROLEHAN SUARA / LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <section className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#262A25]">
                Peringkat & Perolehan Suara
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {isFrozen ? (
                  <span className="text-sky-700 font-bold">
                    ❄️ Angka perolehan suara disembunyikan sementara oleh panitia
                  </span>
                ) : (
                  <>
                    Total Suara Masuk:{' '}
                    <strong className="text-gray-900">
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
                    ? 'bg-amber-400 text-amber-950 font-black'
                    : index === 1
                    ? 'bg-slate-300 text-slate-800 font-black'
                    : index === 2
                    ? 'bg-amber-700/80 text-white font-black'
                    : 'bg-gray-100 text-gray-600 font-bold'

                return (
                  <div
                    key={finalist.id}
                    className="card-base p-4 bg-white border border-[#E5EADF] rounded-2xl flex items-center gap-4 hover:border-[#70B325] transition-all"
                  >
                    {/* Rank Number */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${rankColor}`}
                    >
                      {isFrozen ? '?' : index + 1}
                    </div>

                    {/* Candidate Photo */}
                    {finalist.photo_url || finalist.photo ? (
                      <img
                        src={resolveStorageUrl(finalist.photo_url || finalist.photo)}
                        alt={finalist.name}
                        onClick={() => setSelectedFinalistForDetail(finalist)}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0 cursor-pointer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#E9F3DF] text-[#558223] font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {finalist.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Info & Progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h3
                            onClick={() => setSelectedFinalistForDetail(finalist)}
                            className="font-extrabold text-sm text-[#262A25] truncate cursor-pointer hover:text-[#70B325]"
                          >
                            {finalist.name}
                          </h3>
                          <span className="text-xs text-gray-500 block truncate">
                            {finalist.description || 'Kandidat'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-[#70B325] block">
                            {isFrozen ? '🔒 Dirahasiakan' : finalist.vote_count.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold block">
                            {isFrozen ? 'Freeze Mode' : `${percentage}% suara`}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
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
                      className="px-3 py-1.5 bg-[#F2F9EC] hover:bg-[#70B325] disabled:bg-gray-100 text-[#558223] hover:text-white disabled:text-gray-400 font-bold text-xs rounded-xl transition-all flex-shrink-0 cursor-pointer"
                    >
                      Vote
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* TAB 3: DESKRIPSI ACARA */}
        {activeTab === 'deskripsi' && (
          <section className="max-w-3xl mx-auto bg-white border border-[#E5EADF] rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F2D9] text-[#4F7E1D] font-bold text-xs tracking-wide mb-2">
                <IconCalendar className="w-3.5 h-3.5 text-[#70B325]" />
                Informasi Voting
              </span>
              <h2 className="text-2xl font-extrabold text-[#262A25]">
                {categoryTitle}
              </h2>
              {category?.organizer && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Penyelenggara: <strong>{category.organizer}</strong>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-gray-100">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Periode Voting
                </span>
                <p className="text-sm font-bold text-[#262A25]">
                  {category?.start_date || 'Segera'} s/d{' '}
                  {category?.end_date || 'Selesai'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Metode Pemilihan & Tarif
                </span>
                <p className="text-sm font-bold text-[#70B325]">
                  E-Voting Online (Gratis 1x & Paket Suara Berbayar Rp{' '}
                  {(category?.price_per_vote || 1000).toLocaleString('id-ID')}/suara)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#262A25] uppercase tracking-wide">
                Tentang Ajang Ini
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {category?.description ||
                  'Ajang pemilihan dan voting online resmi yang diselenggarakan untuk menentukan perwakilan favorit masyarakat secara terbuka, transparan, dan terenkripsi.'}
              </p>
            </div>

            <div className="bg-[#F8FAF7] rounded-xl p-4 border border-[#E5EADF] space-y-2">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Ketentuan & Alur Voting Resmi
              </h4>
              <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
                <li>
                  {category?.allow_free_vote !== false
                    ? 'Tersedia 1 suara gratis per kontak WhatsApp/Email atau akun Google terverifikasi.'
                    : 'Ajang ini sepenuhnya menggunakan sistem paket vote berbayar.'}
                </li>
                <li>
                  Untuk menambah dukungan, Anda dapat membeli paket suara tambahan via QRIS Dinamis dan Virtual Account Bank.
                </li>
                <li>
                  Setiap transaksi akan menerbitkan Bukti Resmi E-Receipt ber-ID unik yang dapat diunduh dan dicetak.
                </li>
                <li>
                  Perolehan suara diperbarui secara real-time dan diproteksi anti kecurangan.
                </li>
              </ul>
            </div>
          </section>
        )}
      </main>

      {/* POP-UP 1: COMMERCIAL VOTE MODAL (PRIORITAS 1) */}
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

      {/* POP-UP 2: FINALIST DETAIL PROFILE (PRIORITAS 2) */}
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

      {/* POP-UP 3: OFFICIAL E-RECEIPT MODAL (PRIORITAS 2) */}
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
