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
  IconZap,
  IconList,
  IconGrid,
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

  // View mode (Google Drive style: 'grid' vs 'list')
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('sebaris_events_view_mode') || 'grid'
    } catch {
      return 'grid'
    }
  })

  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    try {
      localStorage.setItem('sebaris_events_view_mode', mode)
    } catch {}
  }

  useEffect(() => {
    document.title = 'Ajang & Event Voting | Sebaris.id'
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
    <div className="min-h-screen bg-[#F8FAF7] dark:bg-[#121612] text-[#262A25] dark:text-[#E8EFE5] flex flex-col font-sans transition-colors duration-300 relative">
      {/* Subtle Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-[#70B325]/12 via-[#70B325]/4 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Sticky Public Header */}
      <PublicHeader
        searchQuery={searchQuery}
        onSearchChange={(val) => setSearchQuery(val)}
        onOpenCheckVote={() => {
          setCheckVoteModalQuery('')
          setIsCheckVoteModalOpen(true)
        }}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-20 space-y-6 sm:space-y-8">
        {/* Page Hero Header: Clean & Punchy */}
        <section className="text-center max-w-2xl mx-auto space-y-2 pt-2 sm:pt-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#262A25] dark:text-white tracking-tight leading-tight">
            Ajang &amp; Event Voting
          </h1>
          <p className="text-xs sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            Dukung kandidat dan ajang favorit Anda secara real-time, transparan, dan terpercaya.
          </p>
        </section>

        {/* Filter, Search & View Mode Toolbar */}
        <section className="space-y-3 w-full">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari event atau penyelenggara..."
                className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm bg-white dark:bg-[#1A2018] border border-gray-200/90 dark:border-white/15 rounded-full text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#70B325] shadow-xs transition-all"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <IconSearch className="w-4 h-4" />
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-0.5"
                  title="Hapus pencarian"
                >
                  <IconClose className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right side: Status Filter Tabs + View Mode Toggle (Google Drive style) */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5">
              {/* Segmented Filter Status Tabs */}
              <div className="inline-flex items-center p-1 bg-gray-200/70 dark:bg-white/10 rounded-full border border-gray-200/60 dark:border-white/10 shadow-2xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => handleStatusChange('all')}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    filterStatus === 'all'
                      ? 'bg-white dark:bg-[#252E22] text-[#70B325] dark:text-[#86C839] shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span>Semua</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-extrabold">
                    {allDirectoryItems.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('active')}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    filterStatus === 'active'
                      ? 'bg-white dark:bg-[#252E22] text-[#70B325] dark:text-[#86C839] shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Live</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-extrabold">
                    {countActive}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('past')}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    filterStatus === 'past'
                      ? 'bg-white dark:bg-[#252E22] text-[#70B325] dark:text-[#86C839] shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <IconLock className="w-3 h-3" />
                  <span>Selesai</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-extrabold">
                    {countPast}
                  </span>
                </button>
              </div>

              {/* Google Drive Segmented View Mode Toggle: List vs Grid */}
              <div className="inline-flex items-center p-1 bg-gray-200/70 dark:bg-white/10 rounded-full border border-gray-200/60 dark:border-white/10 shadow-2xs flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('list')}
                  className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-[#252E22] text-[#70B325] dark:text-[#86C839] shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Tampilan List"
                  aria-label="Tampilan List"
                >
                  <IconList className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-[#252E22] text-[#70B325] dark:text-[#86C839] shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Tampilan Grid (2 Kolom)"
                  aria-label="Tampilan Grid"
                >
                  <IconGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Directory Event Cards: Loading / Empty / Grid (2 cols mobile) / List */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/10 animate-pulse p-2.5 sm:p-4 flex flex-col justify-between space-y-3"
              >
                <div className="aspect-[4/5] sm:aspect-[16/10] w-full bg-gray-200 dark:bg-white/10 rounded-xl sm:rounded-2xl" />
                <div className="space-y-1.5">
                  <div className="h-4 sm:h-5 bg-gray-200 dark:bg-white/10 rounded-md w-3/4" />
                  <div className="h-3 sm:h-3.5 bg-gray-100 dark:bg-white/5 rounded-md w-1/2" />
                </div>
                <div className="h-9 sm:h-11 bg-gray-100 dark:bg-white/5 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/10 rounded-3xl max-w-md mx-auto space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 text-gray-400 flex items-center justify-center mx-auto">
              <IconSearch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-[#262A25] dark:text-white">
              Tidak Ada Event Ditemukan
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {searchQuery
                ? `Tidak ada ajang yang cocok dengan pencarian "${searchQuery}".`
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
        ) : viewMode === 'grid' ? (
          /* Grid View: 2 COLUMNS ON MOBILE, 2-3 on Desktop */
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {filteredItems.map((item) => {
              const FallbackIllustration = [BannerCampus, BannerSchool, BannerFestival, BannerPoster][
                item.fallbackIdx % 4
              ]

              return (
                <article
                  key={item.id}
                  className="group bg-white dark:bg-[#181F16] border border-gray-200/90 dark:border-white/10 rounded-2xl sm:rounded-3xl p-2 sm:p-4 shadow-xs hover:shadow-xl hover:border-[#70B325] dark:hover:border-[#70B325]/70 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-2.5 sm:space-y-3.5">
                    {/* Poster Thumbnail */}
                    <div className="relative aspect-[4/5] sm:aspect-[16/10] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-black/50 shadow-inner">
                      {item.thumbnail ? (
                        <img
                          src={resolveStorageUrl(item.thumbnail)}
                          alt={item.title}
                          className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-500 ease-out"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-emerald-950/40 to-black/60">
                          <FallbackIllustration className="w-full h-full object-contain opacity-75 group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex items-center justify-between pointer-events-none z-10">
                        {item.isPast ? (
                          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white font-extrabold text-[9px] sm:text-[11px] shadow-sm">
                            <IconLock className="w-3 h-3 text-gray-300" />
                            <span>SELESAI</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 text-emerald-300 font-extrabold text-[9px] sm:text-[11px] shadow-sm">
                            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                            </span>
                            <span>LIVE</span>
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white text-[9px] sm:text-[11px] font-bold shadow-xs">
                          <IconUsers className="w-3 h-3 flex-shrink-0" />
                          <span>{item.finalistsCount} <span className="hidden sm:inline">Finalis</span></span>
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="space-y-1 sm:space-y-2 px-0.5 sm:px-1">
                      <h3 className="font-extrabold text-xs sm:text-base lg:text-lg text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-[#70B325] dark:group-hover:text-[#8FE032] transition-colors min-h-[2rem] sm:min-h-[2.75rem] flex items-start">
                        <Link to={`/voting/${item.slug}`} className="no-underline text-inherit">
                          {item.title}
                        </Link>
                      </h3>

                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                        <span className="truncate">{item.organizer}</span>
                        <IconCheck className="w-3 h-3 text-[#70B325] flex-shrink-0" />
                      </p>

                      {/* Meta Information */}
                      <div className="pt-1.5 sm:pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1 truncate">
                          <IconCalendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{item.dateLabel}</span>
                        </span>
                        {item.categoriesCount > 1 && (
                          <span className="hidden sm:inline font-bold text-gray-700 dark:text-gray-300">
                            {item.categoriesCount} Kategori
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <div className="pt-2 sm:pt-3 px-0.5 sm:px-1">
                    <Link
                      to={`/voting/${item.slug}`}
                      className="w-full py-1.5 sm:py-2.5 px-2 sm:px-4 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs sm:text-sm rounded-xl text-center no-underline flex items-center justify-center gap-1 sm:gap-2 shadow-xs hover:shadow-md active:scale-98 transition-all cursor-pointer"
                    >
                      <IconZap className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{item.isPast ? 'Hasil Akhir' : 'Buka & Vote'}</span>
                      <IconChevronRight className="w-3.5 h-3.5 flex-shrink-0 hidden sm:inline" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          /* List View: Row Layout (Google Drive Style) */
          <div className="flex flex-col gap-2.5 sm:gap-3.5">
            {filteredItems.map((item) => {
              const FallbackIllustration = [BannerCampus, BannerSchool, BannerFestival, BannerPoster][
                item.fallbackIdx % 4
              ]

              return (
                <article
                  key={item.id}
                  className="card-base flex items-center justify-between gap-2.5 sm:gap-4 p-2.5 sm:p-4 bg-white dark:bg-[#181F16] border border-gray-200/90 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-xs hover:border-[#70B325] dark:hover:border-[#70B325]/70 hover:shadow-md transition-all group"
                >
                  {/* Left: Thumbnail Poster */}
                  <div className="relative w-16 h-16 sm:w-28 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 dark:bg-black/50 flex-shrink-0 shadow-xs">
                    {item.thumbnail ? (
                      <img
                        src={resolveStorageUrl(item.thumbnail)}
                        alt={item.title}
                        className="w-full h-full object-cover object-center group-hover:scale-106 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-emerald-950/40 to-black/60">
                        <FallbackIllustration className="w-full h-full object-contain opacity-75" />
                      </div>
                    )}
                    <div className="absolute top-1 left-1 z-10">
                      {item.isPast ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-white text-[9px] font-black">
                          SELESAI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/90 backdrop-blur-xs text-emerald-300 text-[9px] font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Title, Organizer, Date, Finalists */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h3 className="font-extrabold text-xs sm:text-base text-gray-900 dark:text-white truncate group-hover:text-[#70B325] dark:group-hover:text-[#8FE032] transition-colors">
                      <Link to={`/voting/${item.slug}`} className="no-underline text-inherit">
                        {item.title}
                      </Link>
                    </h3>

                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate mt-0.5">
                      <span className="truncate">{item.organizer}</span>
                      <IconCheck className="w-3 h-3 text-[#70B325] flex-shrink-0" />
                    </p>

                    <div className="flex items-center gap-2 sm:gap-4 mt-1.5 text-[10px] sm:text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1 truncate">
                        <IconCalendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{item.dateLabel}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300 font-bold">
                        <IconUsers className="w-3 h-3 flex-shrink-0" />
                        <span>{item.finalistsCount} Finalis</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: CTA Button */}
                  <div className="flex-shrink-0">
                    <Link
                      to={`/voting/${item.slug}`}
                      className="py-1.5 sm:py-2.5 px-3 sm:px-5 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer no-underline"
                    >
                      <IconZap className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{item.isPast ? 'Hasil Akhir' : 'Buka Event'}</span>
                      <span className="sm:hidden">Buka</span>
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
