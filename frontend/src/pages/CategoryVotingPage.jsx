import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError, resolveStorageUrl } from '../api/client'
import PublicHeader from '../components/PublicHeader'
import {
  IconChevronRight,
  IconTrophy,
  IconCheck,
  IconClock,
  IconUsers,
  IconSearch,
  IconCalendar,
  IconZap,
  IconClose,
  IconFlame,
  IconCheckVote,
} from '../components/Icons'

export default function CategoryVotingPage() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const [category, setCategory] = useState(null)
  const [finalists, setFinalists] = useState([])
  const [activeTab, setActiveTab] = useState('finalis') // 'finalis' | 'leaderboard' | 'deskripsi'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFinalist, setSelectedFinalist] = useState(null)
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ voter_name: '', voter_contact: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  // Fetch category info and leaderboard
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

  // Update browser tab document.title to match the category / event name
  useEffect(() => {
    if (category?.name) {
      document.title = `${category.name} — sebaris.id`
    } else if (!loading) {
      document.title = 'Voting Tidak Ditemukan — sebaris.id'
    } else {
      document.title = 'Memuat Voting... — sebaris.id'
    }
    return () => {
      document.title = 'sebaris.id — Platform E-Voting & Event Online'
    }
  }, [category?.name, loading])

  // Dynamically update the browser address bar to match the event's slug if loaded by ID
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

  function handleOpenVote(finalist) {
    setSelectedFinalist(finalist)
    setFieldErrors({})
    setIsVoteModalOpen(true)
  }

  function handleCloseVote() {
    setIsVoteModalOpen(false)
    setFieldErrors({})
  }

  async function handleVoteSubmit(event) {
    event.preventDefault()
    if (!selectedFinalist) return
    setSaving(true)
    setFieldErrors({})

    try {
      await api('/votes', {
        method: 'POST',
        body: { ...form, finalist_id: selectedFinalist.id, type: 'free' },
      })

      const receipt = `SVT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
      setNotice({
        receipt,
        finalistName: selectedFinalist.name,
        contact: form.voter_contact,
      })

      setForm({ voter_name: '', voter_contact: '' })
      setIsVoteModalOpen(false)
      await loadData()
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setFieldErrors(requestError.errors || {})
        if (requestError.message) {
          setFieldErrors((prev) => ({ ...prev, general: requestError.message }))
        }
      } else {
        setFieldErrors({ general: requestError.message })
      }
    } finally {
      setSaving(false)
    }
  }

  const categoryTitle =
    category?.name || (loading ? 'Memuat data voting...' : 'Kategori Voting')

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#262A25] flex flex-col font-sans">
      <PublicHeader />

      {/* Top Banner Bar (Kreen Connect Style header banner) */}
      <div className="bg-[#123E2A] text-white py-2 px-4 text-center text-xs font-semibold tracking-wide border-b border-white/10 shadow-xs">
        <span>
          Sebaris Vote &bull; Your Trusted Voting Partner &bull; Dukung finalis favorit kamu di{' '}
          <strong className="text-amber-300">{categoryTitle}</strong>
        </span>
      </div>

      {/* Top Breadcrumb & Category Bar */}
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
              className={`py-3.5 font-bold text-sm sm:text-base border-b-2 transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'border-[#70B325] text-[#70B325]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Perolehan Suara
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
              Deskripsi
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 w-full space-y-6">
        {/* Success Notice Notification */}
        {notice && (
          <div className="bg-[#F2F9EC] border-2 border-[#70B325] rounded-2xl p-5 shadow-sm animate-fadeIn">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#70B325] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#262A25]">
                    Vote Berhasil Dicatat!
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                    Terima kasih telah memberikan suara untuk{' '}
                    <strong className="text-[#70B325]">{notice.finalistName}</strong>. Suara kamu telah sah dan terhitung.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-[#D0E2C1] text-gray-800">
                      ID Transaksi: {notice.receipt}
                    </span>
                    <Link
                      to="/"
                      className="text-xs font-bold text-[#70B325] hover:underline"
                    >
                      Cek di menu Cek Vote →
                    </Link>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                Tutup
              </button>
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
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-b from-[#133E2B] via-[#0E2F20] to-[#0A1F16] flex flex-col justify-between p-4">
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

                        {/* Candidate Portrait Photo or Clean Monogram */}
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

                        {/* Bottom Nameplate (Gold/Amber banner as seen in reference) */}
                        <div className="relative z-10 pt-2 border-t border-white/10 flex items-end justify-between">
                          <div className="min-w-0 pr-2">
                            <h3 className="text-base sm:text-lg font-black uppercase text-amber-300 tracking-wide truncate">
                              {finalist.name}
                            </h3>
                            <p className="text-xs font-bold text-white/90 uppercase tracking-wider truncate">
                              {finalist.description || 'Kandidat'}
                            </p>
                          </div>

                          {/* QR Code / Verify Badge */}
                          <div className="w-9 h-9 rounded-lg bg-white p-1 flex-shrink-0 flex items-center justify-center shadow-xs">
                            <IconCheckVote className="w-6 h-6 text-[#133E2B]" />
                          </div>
                        </div>
                      </div>

                      {/* Card Action & Vote Stats */}
                      <div className="p-4 bg-white space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-[#262A25]">
                            {finalist.vote_count.toLocaleString('id-ID')} suara
                          </span>
                          <span className="font-bold text-[#70B325]">
                            {percentage}% suara
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#70B325] h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        {/* Vote Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenVote(finalist)}
                          className="w-full py-2.5 px-4 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <IconZap className="w-4 h-4 text-white" />
                          <span>Beri Vote ({finalist.name.split(' ')[0]})</span>
                        </button>
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
                Peringkat & Perolehan Suara Sementara
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Total Suara Masuk:{' '}
                <strong className="text-gray-900">
                  {totalVotes.toLocaleString('id-ID')} suara
                </strong>
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
                      {index + 1}
                    </div>

                    {/* Candidate Photo */}
                    {finalist.photo_url || finalist.photo ? (
                      <img
                        src={resolveStorageUrl(finalist.photo_url || finalist.photo)}
                        alt={finalist.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0"
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
                          <h3 className="font-extrabold text-sm text-[#262A25] truncate">
                            {finalist.name}
                          </h3>
                          <span className="text-xs text-gray-500 block truncate">
                            {finalist.description || 'Kandidat'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-[#70B325] block">
                            {finalist.vote_count.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold block">
                            {percentage}% suara
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#70B325] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Vote Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenVote(finalist)}
                      className="px-3 py-1.5 bg-[#F2F9EC] hover:bg-[#70B325] text-[#558223] hover:text-white font-bold text-xs rounded-xl transition-all flex-shrink-0 cursor-pointer"
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
                  Metode Pemilihan
                </span>
                <p className="text-sm font-bold text-[#70B325]">
                  E-Voting Online (1 Kontak = 1 Suara Sah)
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
                Ketentuan Pemberian Suara
              </h4>
              <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
                <li>Setiap pengguna hanya dapat memberikan 1 suara gratis per kontak WhatsApp/Email.</li>
                <li>Setiap suara yang masuk akan mendapatkan bukti ID Transaksi resmi SVT.</li>
                <li>Hasil perolehan suara diperbarui secara real-time dan terbuka untuk publik.</li>
              </ul>
            </div>
          </section>
        )}
      </main>

      {/* VOTE SUBMISSION MODAL / DRAWER */}
      {isVoteModalOpen && selectedFinalist && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-100 relative"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseVote}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <IconClose className="w-5 h-5" />
            </button>

            {/* Candidate Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              {selectedFinalist.photo_url || selectedFinalist.photo ? (
                <img
                  src={resolveStorageUrl(
                    selectedFinalist.photo_url || selectedFinalist.photo
                  )}
                  alt={selectedFinalist.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#70B325] flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#E9F3DF] text-[#558223] font-black text-xl flex items-center justify-center flex-shrink-0">
                  {selectedFinalist.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold text-[#70B325] uppercase tracking-wider block">
                  Kandidat Pilihanmu
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#262A25] truncate">
                  {selectedFinalist.name}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {selectedFinalist.description || 'Finalis Terpilih'}
                </p>
              </div>
            </div>

            {/* General Error Alert */}
            {fieldErrors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold">
                {fieldErrors.general}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleVoteSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Nama Lengkap Pemilih
                </label>
                <input
                  type="text"
                  required
                  value={form.voter_name}
                  onChange={(e) =>
                    setForm({ ...form, voter_name: e.target.value })
                  }
                  placeholder="Masukkan nama lengkap kamu"
                  className="w-full h-11 px-3.5 text-xs sm:text-sm bg-[#F8FAF7] border border-[#CADDB8] rounded-xl text-[#262A25] focus:outline-none focus:border-[#70B325]"
                />
                {fieldErrors.voter_name && (
                  <p className="text-[11px] text-red-600 font-semibold">
                    {fieldErrors.voter_name[0] || fieldErrors.voter_name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Nomor WhatsApp atau Email
                </label>
                <input
                  type="text"
                  required
                  value={form.voter_contact}
                  onChange={(e) =>
                    setForm({ ...form, voter_contact: e.target.value })
                  }
                  placeholder="Contoh: 08123456789 atau email@domain.com"
                  className="w-full h-11 px-3.5 text-xs sm:text-sm bg-[#F8FAF7] border border-[#CADDB8] rounded-xl text-[#262A25] focus:outline-none focus:border-[#70B325]"
                />
                {fieldErrors.voter_contact && (
                  <p className="text-[11px] text-red-600 font-semibold">
                    {fieldErrors.voter_contact[0] || fieldErrors.voter_contact}
                  </p>
                )}
                <p className="text-[10px] text-gray-400">
                  Digunakan untuk verifikasi 1 suara unik dan bukti ID Transaksi.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseVote}
                  className="flex-1 h-11 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-11 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <span>Mencatat Vote...</span>
                  ) : (
                    <>
                      <IconCheck className="w-4 h-4" />
                      <span>Konfirmasi Vote</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
