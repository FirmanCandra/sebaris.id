import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, resolveStorageUrl } from '../api/client'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import CheckVoteModal from '../components/CheckVoteModal'
import {
  IconSearch,
  IconClose,
  IconLock,
  IconCheck,
  IconChevronRight,
  IconCalendar,
  IconUsers,
  IconFlame,
  IconClock,
} from '../components/Icons'
import {
  BannerCampus,
  BannerSchool,
  BannerFestival,
  BannerPoster,
} from '../components/CardIllustrations'

function isPast(item) {
  if (!item) return false
  if (item.status === 'inactive' || item.status === 'ended' || item.status === 'completed') {
    return true
  }
  if (item.event?.status === 'inactive' || item.event?.status === 'ended' || item.event?.status === 'completed') {
    return true
  }
  if (item.end_date) {
    const end = new Date(item.end_date)
    end.setHours(23, 59, 59, 999)
    if (end < new Date()) return true
  }
  if (item.event?.end_date) {
    const end = new Date(item.event.end_date)
    end.setHours(23, 59, 59, 999)
    if (end < new Date()) return true
  }
  return false
}

export default function EventsDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialFilter = searchParams.get('filter') || 'all'

  const [filterStatus, setFilterStatus] = useState(initialFilter)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [backendCategories, setBackendCategories] = useState([])
  const [backendEvents, setBackendEvents] = useState([])
  const [isCheckVoteModalOpen, setIsCheckVoteModalOpen] = useState(false)
  const [checkVoteModalQuery, setCheckVoteModalQuery] = useState('')

  useEffect(() => {
    document.title = 'Semua Event & Ajang Voting | Sebaris.id'
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  // Sync state if query param changes
  useEffect(() => {
    const currentParam = searchParams.get('filter')
    if (currentParam && ['all', 'active', 'past'].includes(currentParam)) {
      setFilterStatus(currentParam)
    }
  }, [searchParams])

  useEffect(() => {
    let isMounted = true

    async function loadDirectoryData() {
      setLoading(true)
      try {
        const [catRes, evRes] = await Promise.allSettled([
          api('/categories'),
          api('/events'),
        ])

        if (isMounted) {
          if (catRes.status === 'fulfilled' && Array.isArray(catRes.value?.data)) {
            setBackendCategories(catRes.value.data)
          }
          if (evRes.status === 'fulfilled' && Array.isArray(evRes.value?.data)) {
            setBackendEvents(evRes.value.data)
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDirectoryData()
    return () => {
      isMounted = false
    }
  }, [])

  const handleStatusChange = (status) => {
    setFilterStatus(status)
    if (status === 'all') {
      searchParams.delete('filter')
    } else {
      searchParams.set('filter', status)
    }
    setSearchParams(searchParams, { replace: true })
  }

  // Group events/categories into items
  const allDirectoryItems = useMemo(() => {
    // 1. Dari backendEvents jika tersedia
    if (backendEvents.length > 0) {
      return backendEvents.map((ev, idx) => {
        const evCategories = (ev.categories && ev.categories.length > 0)
          ? ev.categories
          : backendCategories.filter((c) => c.event_id === ev.id)
        const premierCat = evCategories.find((c) => c.tier === 'premier') || evCategories[0]
        const catCount = ev.categories_count || evCategories.length
        const totalFinalists = evCategories.reduce((sum, c) => sum + (c.finalists_count || 0), 0)
        const past = isPast(ev) || (evCategories.length > 0 && evCategories.every((c) => isPast(c)))

        return {
          id: `event-${ev.id}`,
          slug: premierCat?.slug || premierCat?.id || String(ev.id),
          title: ev.name,
          organizer: premierCat?.organizer || 'Panitia Pelaksana',
          isPast: past,
          dateLabel: past
            ? (ev.end_date ? `Selesai ${ev.end_date}` : 'Ajang Selesai')
            : (ev.end_date ? `s/d ${ev.end_date}` : 'Sedang Berlangsung'),
          categoriesCount: catCount,
          finalistsCount: totalFinalists,
          thumbnail: ev.thumbnail_url || ev.thumbnail || premierCat?.thumbnail_url || premierCat?.thumbnail,
          fallbackIdx: idx,
        }
      })
    }

    // 2. Fallback: Dari backendCategories
    return backendCategories.map((cat, idx) => {
      const past = isPast(cat)
      return {
        id: `cat-${cat.id}`,
        slug: cat.slug || String(cat.id),
        title: cat.name,
        organizer: cat.organizer || 'Panitia Pelaksana',
        isPast: past,
        dateLabel: past
          ? (cat.end_date ? `Selesai ${cat.end_date}` : 'Ajang Selesai')
          : (cat.end_date ? `s/d ${cat.end_date}` : 'Sedang Berlangsung'),
        categoriesCount: 1,
        finalistsCount: cat.finalists_count || 0,
        thumbnail: cat.thumbnail_url || cat.thumbnail,
        fallbackIdx: idx,
      }
    })
  }, [backendEvents, backendCategories])

  // Filtered by search & status
  const filteredItems = useMemo(() => {
    return allDirectoryItems.filter((item) => {
      // Status filter
      if (filterStatus === 'active' && item.isPast) return false
      if (filterStatus === 'past' && !item.isPast) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title?.toLowerCase().includes(q)
        const matchOrganizer = item.organizer?.toLowerCase().includes(q)
        if (!matchTitle && !matchOrganizer) return false
      }

      return true
    })
  }, [allDirectoryItems, filterStatus, searchQuery])

  const countActive = useMemo(() => allDirectoryItems.filter((i) => !i.isPast).length, [allDirectoryItems])
  const countPast = useMemo(() => allDirectoryItems.filter((i) => i.isPast).length, [allDirectoryItems])

  return (
    <div className="min-h-screen bg-[#F8FAF7] dark:bg-[#121612] text-[#262A25] dark:text-[#E8EFE5] flex flex-col font-sans transition-colors duration-300">
      <PublicHeader
        searchQuery={searchQuery}
        onSearchChange={(val) => setSearchQuery(val)}
        onOpenCheckVote={() => {
          setCheckVoteModalQuery('')
          setIsCheckVoteModalOpen(true)
        }}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-16 space-y-6 sm:space-y-8">
        {/* Page Hero Header */}
        <section className="text-center max-w-3xl mx-auto space-y-3 pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF5DE] dark:bg-white/10 text-[#70B325] dark:text-[#86C839] text-xs font-black uppercase tracking-wider">
            <IconFlame className="w-3.5 h-3.5" />
            <span>Katalog Event &amp; Ajang</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#262A25] dark:text-white tracking-tight leading-tight">
            Semua Ajang &amp; Event Voting
          </h1>
          <p className="text-xs sm:text-base text-gray-500 dark:text-gray-400">
            Jelajahi berbagai kompetisi, pemilihan duta, organisasi kampus, dan ajang penghargaan resmi yang sedang berlangsung maupun yang telah selesai.
          </p>
        </section>

        {/* Filter & Search Toolbar */}
        <section className="bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari event, kategori, atau penyelenggara..."
                className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/15 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#70B325] transition-colors"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <IconSearch className="w-4 h-4" />
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-1"
                  title="Hapus pencarian"
                >
                  <IconClose className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Segmented Filter Status Tabs */}
            <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => handleStatusChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  filterStatus === 'all'
                    ? 'bg-white dark:bg-[#252E22] text-[#70B325] dark:text-[#86C839] shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>Semua</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200/70 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                  {allDirectoryItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  filterStatus === 'active'
                    ? 'bg-white dark:bg-[#252E22] text-[#70B325] dark:text-[#86C839] shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Berlangsung</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200/70 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                  {countActive}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('past')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  filterStatus === 'past'
                    ? 'bg-white dark:bg-[#252E22] text-[#70B325] dark:text-[#86C839] shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <IconLock className="w-3 h-3" />
                <span>Selesai</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200/70 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                  {countPast}
                </span>
              </button>
            </div>
          </div>

          {/* Active summary line */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1 px-1 border-t border-gray-100 dark:border-white/5">
            <span>
              Menampilkan <strong className="text-gray-900 dark:text-white">{filteredItems.length}</strong> ajang pemilihan
              {searchQuery && ` untuk pencarian "${searchQuery}"`}
            </span>
          </div>
        </section>

        {/* Directory Event Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-[380px] rounded-2xl bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/10 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="aspect-[4/5] w-full bg-gray-200 dark:bg-white/10 rounded-xl" />
                <div className="space-y-2 pt-3">
                  <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/10 rounded-3xl max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 flex items-center justify-center mx-auto">
              <IconSearch className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#262A25] dark:text-white">
              Tidak Ada Event Ditemukan
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {searchQuery
                ? `Tidak ada ajang atau kategori yang cocok dengan pencarian "${searchQuery}".`
                : 'Belum ada event dalam kategori status yang dipilih.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-primary text-xs font-bold py-2 px-4 mx-auto cursor-pointer"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredItems.map((item) => {
              const FallbackIllustration = [BannerCampus, BannerSchool, BannerFestival, BannerPoster][
                item.fallbackIdx % 4
              ]

              return (
                <article
                  key={item.id}
                  className="card-base flex flex-col justify-between overflow-hidden bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-xs hover:border-[#70B325] dark:hover:border-[#70B325] hover:shadow-lg transition-all duration-300 group"
                >
                  <div>
                    {/* Poster Thumbnail (4:5 Aspect Ratio) */}
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 dark:bg-black/50">
                      {item.thumbnail ? (
                        <img
                          src={resolveStorageUrl(item.thumbnail)}
                          alt={item.title}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4">
                          <FallbackIllustration className="w-full h-full object-contain opacity-70 group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                        {item.isPast ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white font-extrabold text-[10px] shadow-sm">
                            <IconLock className="w-3 h-3 text-gray-300" />
                            <span>SELESAI</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/85 backdrop-blur-md border border-emerald-500/50 text-emerald-300 font-extrabold text-[10px] shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>LIVE</span>
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold">
                          <IconUsers className="w-3 h-3" />
                          <span>{item.finalistsCount} Finalis</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 sm:p-4 space-y-2">
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#70B325] transition-colors">
                          <Link to={`/voting/${item.slug}`} className="no-underline text-inherit">
                            {item.title}
                          </Link>
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                          <span className="truncate">{item.organizer}</span>
                          <IconCheck className="w-3 h-3 text-[#70B325] flex-shrink-0" />
                        </p>
                      </div>

                      {/* Details row */}
                      <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <IconCalendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{item.dateLabel}</span>
                        </span>
                        {item.categoriesCount > 1 && (
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {item.categoriesCount} Kategori
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="p-3.5 sm:p-4 pt-0">
                    <Link
                      to={`/voting/${item.slug}`}
                      className="w-full py-2.5 px-3 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs sm:text-sm rounded-xl text-center no-underline flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-all cursor-pointer"
                    >
                      <span>{item.isPast ? 'Lihat Hasil Akhir' : 'Buka & Vote Sekarang'}</span>
                      <IconChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <PublicFooter
        onOpenCheckVote={() => {
          setCheckVoteModalQuery('')
          setIsCheckVoteModalOpen(true)
        }}
      />

      <CheckVoteModal
        isOpen={isCheckVoteModalOpen}
        onClose={() => setIsCheckVoteModalOpen(false)}
        initialQuery={checkVoteModalQuery}
      />
    </div>
  )
}
