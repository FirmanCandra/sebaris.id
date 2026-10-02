import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { api, resolveStorageUrl } from '../api/client'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import LuxuryAmbientBackdrop from '../components/LuxuryAmbientBackdrop'
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
  IconWhatsApp,
  IconLink,
  IconLock,
  IconChat,
  IconCrown,
  IconMedal,
  IconBuilding,
  IconCoins,
  IconTrendingUp,
  IconCheck,
  IconSparkles,
  IconArrowDown,
  IconList,
  IconGrid,
  IconChevronDown,
} from '../components/Icons'

export default function CategoryVotingPage() {
  const { categoryId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const handleCategorySwitch = useCallback((targetCat) => {
    if (!targetCat) return
    const currentPrefix = window.location.pathname.startsWith('/voting') ? '/voting' : '/categories'
    navigate(`${currentPrefix}/${targetCat.slug || targetCat.id}`)
  }, [navigate])

  const [category, setCategory] = useState(null)
  const [finalists, setFinalists] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isVotingExpired, setIsVotingExpired] = useState(false)

  // Multi-Category Switcher States & Refs
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const categoryMenuRef = useRef(null)
  const categoryPillsRef = useRef(null)
  const activePillRef = useRef(null)

  // View mode for Finalists section (Google Drive style: 'grid' or 'list')
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('sebaris_finalists_view_mode') || 'grid'
    } catch {
      return 'grid'
    }
  })

  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    try {
      localStorage.setItem('sebaris_finalists_view_mode', mode)
    } catch { }
  }

  // Wall of Support Messages State
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [selectedMessageFinalistId, setSelectedMessageFinalistId] = useState('')

  // Modals state
  const [selectedFinalistForVote, setSelectedFinalistForVote] = useState(null)
  const [selectedFinalistForDetail, setSelectedFinalistForDetail] = useState(null)
  const [eReceiptData, setEReceiptData] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [shareOpenId, setShareOpenId] = useState(null)
  const shareDropdownRef = useRef(null)

  // Tracking refs to eliminate re-render loops and flicker ("kejang-kejang")
  const deepLinkHandledRef = useRef(false)
  const isInitialDataLoadedRef = useRef(false)
  const isInitialMessagesLoadedRef = useRef(false)

  // Fetch category info and finalists quietly
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent && !isInitialDataLoadedRef.current) {
      setLoading(true)
    }
    try {
      const [catRes, finRes] = await Promise.all([
        api(`/categories/${categoryId}`).catch(() => null),
        api(`/categories/${categoryId}/leaderboard`),
      ])

      if (catRes?.data) {
        setCategory((prev) => {
          if (!prev) return catRes.data
          if (
            prev.id === catRes.data.id &&
            prev.name === catRes.data.name &&
            prev.status === catRes.data.status &&
            prev.freeze_leaderboard === catRes.data.freeze_leaderboard &&
            prev.price_per_vote === catRes.data.price_per_vote &&
            prev.end_date === catRes.data.end_date &&
            prev.theme_color === catRes.data.theme_color
          ) {
            return prev
          }
          return catRes.data
        })
      }

      if (finRes?.data) {
        setFinalists((prev) => {
          const next = finRes.data || []
          if (
            prev.length === next.length &&
            prev.every((p, idx) => p.id === next[idx]?.id && p.vote_count === next[idx]?.vote_count)
          ) {
            return prev
          }
          return next
        })
      }
      setError('')
      isInitialDataLoadedRef.current = true
    } catch (err) {
      if (!isInitialDataLoadedRef.current) {
        setError(err.message || 'Gagal memuat data kategori')
      }
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  // Fetch support messages quietly without flashing loading indicators during background polls
  const loadMessages = useCallback(async (isSilent = false) => {
    if (!isSilent && !isInitialMessagesLoadedRef.current) {
      setLoadingMessages(true)
    }
    try {
      const query = selectedMessageFinalistId ? `?finalist_id=${selectedMessageFinalistId}` : ''
      const res = await api(`/categories/${categoryId}/messages${query}`)
      const next = res?.data || []
      setMessages((prev) => {
        if (
          prev.length === next.length &&
          prev.length > 0 &&
          prev[0]?.id === next[0]?.id &&
          prev[prev.length - 1]?.id === next[next.length - 1]?.id
        ) {
          return prev
        }
        return next
      })
      isInitialMessagesLoadedRef.current = true
    } catch {
      // Gracefully maintain client resilience
    } finally {
      setLoadingMessages(false)
    }
  }, [categoryId, selectedMessageFinalistId])

  // Reset scroll and state on category change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    isInitialDataLoadedRef.current = false
    isInitialMessagesLoadedRef.current = false
    deepLinkHandledRef.current = false
    setMessages([])
    setSearchQuery('')
    setSelectedMessageFinalistId('')
    loadData(false)
    loadMessages(false)
  }, [categoryId, loadData, loadMessages])

  // Reload messages when message filter changes
  useEffect(() => {
    loadMessages(false)
  }, [selectedMessageFinalistId, loadMessages])

  // Periodic background polling without flickering ("kejang-kejang")
  // Completely pauses when any modal is open so user interactions are never interrupted
  useEffect(() => {
    if (selectedFinalistForVote || selectedFinalistForDetail || eReceiptData) return

    const interval = window.setInterval(() => {
      loadData(true)
      loadMessages(true)
    }, 12000)

    return () => window.clearInterval(interval)
  }, [loadData, loadMessages, selectedFinalistForVote, selectedFinalistForDetail, eReceiptData])

  // Handle URL param: ?finalist=<name-slug-or-id> (direct candidate deep link, run once when finalists loaded)
  useEffect(() => {
    if (deepLinkHandledRef.current) return
    const finalistParam = searchParams.get('finalist')
    if (finalistParam && finalists.length > 0) {
      // Support both name slug (new) and numeric ID (legacy backward compat)
      const found =
        finalists.find((f) => finalistSlug(f.name) === finalistParam) ||
        finalists.find((f) => String(f.id) === String(finalistParam))
      if (found) {
        deepLinkHandledRef.current = true
        setSelectedFinalistForVote(found)
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

  // Dynamically update browser address bar to match slug preserving path prefix
  useEffect(() => {
    if (category?.slug && categoryId !== category.slug) {
      const currentPrefix = window.location.pathname.startsWith('/voting') ? '/voting' : '/categories'
      window.history.replaceState(null, '', `${currentPrefix}/${category.slug}`)
    }
  }, [category?.slug, categoryId])

  // Auto-scroll active category into view in the switcher track
  useEffect(() => {
    if (activePillRef.current && categoryPillsRef.current) {
      activePillRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [category?.id, category?.slug])

  // Close category dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setShowCategoryMenu(false)
      }
    }
    if (showCategoryMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showCategoryMenu])

  // Close share dropdown on click outside
  useEffect(() => {
    if (!shareOpenId) return
    const handleClickOutside = (e) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target)) {
        setShareOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [shareOpenId])

  // Smooth scroll helper for quick anchor jumps (e.g. from ticker to #card-dukungan)
  const scrollToTab = (sectionId) => {
    const el = document.getElementById(sectionId)
    if (el) {
      const scrollOffset = 110
      const y = el.getBoundingClientRect().top + window.pageYOffset - scrollOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  // Total votes for percentage calculation
  const totalVotes = useMemo(
    () => finalists.reduce((acc, curr) => acc + (curr.vote_count || 0), 0),
    [finalists]
  )

  // Determine if voting is ended/closed
  const isVotingClosed = useMemo(() => {
    if (!category) return false
    if (category.status === 'inactive' || category.status === 'ended' || category.status === 'completed') {
      return true
    }
    if (category.event?.status === 'inactive' || category.event?.status === 'ended' || category.event?.status === 'completed') {
      return true
    }
    if (category.end_date) {
      const end = new Date(category.end_date)
      end.setHours(23, 59, 59, 999)
      if (end < new Date()) return true
    }
    if (category.event?.end_date) {
      const end = new Date(category.event.end_date)
      end.setHours(23, 59, 59, 999)
      if (end < new Date()) return true
    }
    return isVotingExpired
  }, [category, isVotingExpired])

  // Top 3 candidates and ranks 4+ list (KreenConnect Architecture)
  const topThreeFinalists = useMemo(() => finalists.slice(0, 3), [finalists])
  const otherFinalists = useMemo(() => finalists.slice(3), [finalists])

  // When voting is ended/closed, ONLY retain the winners: Rank 1, 2, 3!
  const activeFinalistPool = useMemo(() => {
    if (isVotingClosed) {
      return finalists.slice(0, 3)
    }
    return finalists
  }, [finalists, isVotingClosed])

  // Filtered finalists for the full roster section
  const filteredFinalists = useMemo(() => {
    if (!searchQuery.trim()) return activeFinalistPool
    const q = searchQuery.toLowerCase()
    return activeFinalistPool.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    )
  }, [activeFinalistPool, searchQuery])

  // Memoized expiration handler to prevent VotingCountdown from triggering re-renders
  const handleExpire = useCallback((expired) => {
    setIsVotingExpired((prev) => (prev !== expired ? expired : prev))
  }, [])

  // Convert finalist name to URL-friendly slug for share links
  function finalistSlug(name) {
    return (name || '')
      .toLowerCase()
      .replace(/&/g, 'dan')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  // Share candidate helpers
  function handleShareWhatsApp(finalist) {
    const directUrl = `${window.location.origin}/categories/${category?.slug || categoryId}?finalist=${finalistSlug(finalist.name)}`
    const text = `Halo! Yuk dukung kandidat *${finalist.name}* di ajang *${category?.name || 'Voting'}* melalui sebaris.id!\n\nKlik tautan ini untuk beri vote langsung:\n${directUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function handleCopyLink(finalist) {
    const directUrl = `${window.location.origin}/categories/${category?.slug || categoryId}?finalist=${finalistSlug(finalist.name)}`
    navigator.clipboard.writeText(directUrl)
    setCopiedId(finalist.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const categoryTitle =
    category?.name || (loading ? 'Memuat data voting...' : 'Kategori Voting')

  const isFrozen = Boolean(category?.freeze_leaderboard)
  const posterSrc = useMemo(() => {
    return resolveStorageUrl(
      category?.thumbnail ||
      category?.thumbnail_url ||
      category?.event?.thumbnail ||
      category?.event?.thumbnail_url
    )
  }, [category])

  const activeThemeColor = useMemo(() => {
    return category?.theme_color || category?.event?.theme_color || '#154228'
  }, [category])

  return (
    <div className="min-h-screen bg-[#F8FAF7] dark:bg-[#121612] text-[#262A25] dark:text-[#F3F5F1] flex flex-col font-sans transition-colors duration-300">

      {/* Sticky Header */}
      <PublicHeader />

      {/* =========================================================================
          TOP OFFICIAL EVENT HERO BANNER (CINEMATIC AMBIENT HORIZON)
          ========================================================================= */}
      <section className="relative text-white border-b border-[#2C3529] overflow-hidden -mt-[4.75rem] sm:-mt-20 pt-[5.75rem] sm:pt-24 pb-8 sm:pb-12 bg-[#09130C]">
        {/* Luxury Dynamic Ambient Silk & Sparkle Backdrop */}
        <LuxuryAmbientBackdrop themeColor={activeThemeColor} posterSrc={posterSrc} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10 space-y-6">

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
            <Link to="/" className="hover:text-white transition-colors no-underline">
              Beranda
            </Link>
            <span className="opacity-40">/</span>
            {category?.event?.name && (
              <>
                <span className="text-gray-300 truncate max-w-[140px] sm:max-w-xs">{category.event.name}</span>
                <span className="opacity-40">/</span>
              </>
            )}
            <span className="text-emerald-400 font-semibold truncate max-w-[180px] sm:max-w-none">
              {categoryTitle}
            </span>
          </nav>

          {/* Main 3-Column Hero Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">

            {/* 1. LEFT POSTER CARD (3 cols on lg) */}
            <div className="w-full flex justify-center lg:justify-start lg:col-span-3">
              <div className="relative w-44 sm:w-52 lg:w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black/60 group/poster select-none flex-shrink-0">
                {posterSrc ? (
                  <img
                    src={posterSrc}
                    alt={categoryTitle}
                    className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-500"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#152217] text-emerald-400 p-4 text-center">
                    <IconTrophy className="w-12 h-12 mb-2 opacity-60 text-[#70B325]" />
                    <span className="text-xs font-bold text-gray-300 line-clamp-2">{categoryTitle}</span>
                  </div>
                )}

                {/* Live Status Pill Overlay on Poster */}
                <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase text-white shadow-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${isVotingClosed ? 'bg-gray-400' : 'bg-[#70B325] animate-ping'}`} />
                  <span>{isVotingClosed ? 'Closed' : 'Live'}</span>
                </div>
              </div>
            </div>

            {/* 2. CENTER EVENT DETAILS (5 cols on lg) */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-3.5 text-left">

              {/* Official Organizer Badge with Verified Check */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 text-xs text-white shadow-xs">
                  <span className="w-4 h-4 rounded-full bg-[#70B325] flex items-center justify-center flex-shrink-0">
                    <IconCheck className="w-2.5 h-2.5 text-white stroke-[3]" />
                  </span>
                  <span className="text-gray-300 font-medium">Penyelenggara:</span>
                  <span className="font-extrabold text-white truncate max-w-[200px] sm:max-w-xs">
                    {category?.organizer || category?.event?.name || 'Sebaris Official'}
                  </span>
                </div>

                {category?.allow_free_vote !== false && !isVotingClosed && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#70B325]/20 border border-[#70B325]/40 text-[#D0FE15] text-[11px] font-bold backdrop-blur-md">
                    <IconZap className="w-3 h-3 text-[#D0FE15]" />
                    <span>1x Vote Gratis</span>
                  </span>
                )}
              </div>

              {/* Main Category Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
                {categoryTitle}
              </h1>

              {/* Description */}
              {category?.description && (
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-3">
                  {category.description}
                </p>
              )}

              {/* Metrics Ribbon */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-gray-400 font-medium">Total Suara:</span>
                  <span className="font-black text-[#D0FE15] text-sm sm:text-base">
                    {isFrozen ? (
                      <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                        <IconLock className="w-3.5 h-3.5" />
                        <span>Dirahasiakan</span>
                      </span>
                    ) : (
                      `${totalVotes.toLocaleString('id-ID')} Suara`
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-gray-400 font-medium">Kandidat:</span>
                  <span className="font-bold text-white">{finalists.length} Finalis</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-gray-400 font-medium">Biaya:</span>
                  <span className="font-bold text-white">
                    Rp {(category?.price_per_vote || 1000).toLocaleString('id-ID')}/vote
                  </span>
                </div>
              </div>

              {/* Quick Jump to Vote Button */}
              {!isVotingClosed && (
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => scrollToTab('card-finalis')}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#70B325]/25 active:scale-98 transition-all cursor-pointer"
                  >
                    <span>Beri Vote Finalis</span>
                    <IconArrowDown className="w-4 h-4 animate-bounce" />
                  </button>
                </div>
              )}
            </div>

            {/* 3. RIGHT COUNTDOWN TIMER (4 cols on lg) */}
            <div className="lg:col-span-4 xl:col-span-4 w-full">
              {isVotingClosed ? (
                <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-5 border border-amber-400/40 text-center space-y-2.5 shadow-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider">
                    <IconTrophy className="w-4 h-4 text-amber-400" />
                    <span>Ajang Telah Berakhir</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Pengumuman Pemenang Sah
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Periode voting telah resmi selesai. Rekapitulasi suara final telah terkunci dan menetapkan Juara 1, 2, dan 3.
                  </p>
                </div>
              ) : category?.end_date ? (
                <VotingCountdown
                  endDate={category.end_date}
                  status={category.status}
                  onExpire={handleExpire}
                />
              ) : (
                <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-5 border border-white/15 text-center space-y-2">
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

      {/* =========================================================================
          IMPROVED CATEGORY SWITCHER (SUB-NAVBAR - NON-STICKY PER USER REQUEST)
          Only displayed when multiple categories exist for the event
          ========================================================================= */}
      {category?.sibling_categories && category.sibling_categories.length > 1 && (
        <div className="w-full bg-white dark:bg-[#151C14] border-b border-gray-200 dark:border-white/10 shadow-2xs transition-colors">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
            <div className="flex items-center justify-between gap-3">

              {/* Context Label on Desktop */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0 text-xs font-black text-gray-700 dark:text-gray-300">
                <span className="w-2 h-2 rounded-full bg-[#70B325] animate-pulse" />
                <span className="uppercase tracking-wider text-[11px] text-gray-500 dark:text-gray-400">Kategori:</span>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 font-extrabold text-[11px]">
                  {category.sibling_categories.length} Pilihan
                </span>
              </div>

              {/* -------------------------------------------------------------
                  MOBILE VIEW (sm:hidden)
                  ------------------------------------------------------------- */}
              <div className="sm:hidden w-full min-w-0 relative">
                {category.sibling_categories.length === 2 ? (
                  /* Case A: Exactly 2 Categories -> 2-Column Segmented Grid */
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100/90 dark:bg-black/30 rounded-2xl border border-gray-200/80 dark:border-white/10">
                    {category.sibling_categories.map((sibling) => {
                      const isCurrent =
                        sibling.is_current ||
                        String(sibling.id) === String(category.id) ||
                        sibling.slug === category.slug

                      return (
                        <button
                          key={sibling.id}
                          type="button"
                          onClick={() => handleCategorySwitch(sibling)}
                          className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black tracking-tight transition-all flex items-center justify-center cursor-pointer text-center leading-tight ${isCurrent
                              ? 'bg-[#70B325] text-white shadow-xs font-black ring-1 ring-white/20'
                              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
                            }`}
                        >
                          <span className="line-clamp-2">{sibling.name}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  /* Case B: 3+ Categories -> Smooth Horizontal Scroll with Dropdown Quick Jump */
                  <div className="flex items-center gap-2" ref={categoryMenuRef}>
                    <div
                      ref={categoryPillsRef}
                      className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-1 -mx-1 scroll-smooth"
                    >
                      {category.sibling_categories.map((sibling) => {
                        const isCurrent =
                          sibling.is_current ||
                          String(sibling.id) === String(category.id) ||
                          sibling.slug === category.slug

                        return (
                          <button
                            key={sibling.id}
                            ref={isCurrent ? activePillRef : null}
                            type="button"
                            onClick={() => handleCategorySwitch(sibling)}
                            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold tracking-tight transition-all whitespace-nowrap flex items-center cursor-pointer flex-shrink-0 border ${isCurrent
                                ? 'bg-[#70B325] text-white border-[#70B325] shadow-xs font-black ring-2 ring-[#70B325]/30'
                                : 'bg-gray-100/90 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:border-[#70B325]/50 hover:bg-[#70B325]/10 active:scale-97'
                              }`}
                          >
                            <span className="truncate max-w-[190px]">{sibling.name}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Quick Dropdown Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                      className={`min-h-[42px] px-2.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 flex-shrink-0 border transition-all cursor-pointer shadow-2xs ${showCategoryMenu
                          ? 'bg-[#70B325] text-white border-[#70B325]'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-white/15 hover:bg-gray-200 dark:hover:bg-white/15'
                        }`}
                      aria-label="Tampilkan daftar lengkap kategori"
                      title="Lihat semua kategori"
                    >
                      <span className="text-[11px]">Semua</span>
                      <IconChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${showCategoryMenu ? 'rotate-180' : ''
                          }`}
                      />
                    </button>

                    {/* Dropdown Menu Popover */}
                    {showCategoryMenu && (
                      <div className="absolute right-0 top-full mt-2 w-72 max-w-[90vw] bg-white dark:bg-[#1A2216] border border-gray-200 dark:border-white/15 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-fadeIn">
                        <div className="px-3 py-1.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between text-[11px] font-black uppercase text-gray-400">
                          <span>Pilih Kategori</span>
                          <span>{category.sibling_categories.length} total</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-1 pt-1">
                          {category.sibling_categories.map((sibling) => {
                            const isCurrent =
                              sibling.is_current ||
                              String(sibling.id) === String(category.id) ||
                              sibling.slug === category.slug

                            return (
                              <button
                                key={sibling.id}
                                type="button"
                                onClick={() => {
                                  setShowCategoryMenu(false)
                                  handleCategorySwitch(sibling)
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${isCurrent
                                    ? 'bg-[#70B325]/15 dark:bg-[#70B325]/25 text-[#558223] dark:text-[#A3E635] font-black'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-semibold'
                                  }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCurrent ? 'bg-[#70B325]' : 'bg-gray-400'}`} />
                                  <span className="truncate">{sibling.name}</span>
                                </div>
                                {isCurrent && (
                                  <IconCheck className="w-4 h-4 text-[#70B325] dark:text-[#A3E635] flex-shrink-0" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* -------------------------------------------------------------
                  DESKTOP VIEW (hidden sm:flex)
                  ------------------------------------------------------------- */}
              <div
                ref={categoryPillsRef}
                className="hidden sm:flex items-center gap-2 overflow-x-auto scrollbar-none py-1 flex-1 min-w-0"
              >
                {category.sibling_categories.map((sibling) => {
                  const isCurrent =
                    sibling.is_current ||
                    String(sibling.id) === String(category.id) ||
                    sibling.slug === category.slug

                  return (
                    <button
                      key={sibling.id}
                      ref={isCurrent ? activePillRef : null}
                      type="button"
                      onClick={() => handleCategorySwitch(sibling)}
                      className={`relative min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer flex-shrink-0 border ${isCurrent
                          ? 'bg-[#70B325] text-white border-[#70B325] shadow-sm shadow-[#70B325]/25 font-black ring-2 ring-[#70B325]/30'
                          : 'bg-gray-100/80 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:border-[#70B325]/50 hover:bg-[#70B325]/10 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      <span className="truncate max-w-[280px] lg:max-w-md">{sibling.name}</span>
                    </button>
                  )
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MAIN SINGLE-PAGE CONTINUOUS CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 w-full space-y-12 sm:space-y-16">

        {/* FREEZE NOTIFICATION BANNER */}
        {isFrozen && (
          <div className="bg-gradient-to-r from-blue-900 to-sky-900 text-white rounded-2xl p-4 sm:p-5 border border-sky-400/30 shadow-sm animate-fadeIn">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <IconLock className="w-5 h-5 text-white" />
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

        {/* LIVE SUPPORT TICKER BAR (Clicks down to #card-dukungan) */}
        {messages.length > 0 && (
          <div
            onClick={() => scrollToTab('card-dukungan')}
            className="bg-white dark:bg-[#1A2018] hover:bg-[#F8FAF6] dark:hover:bg-[#20271E] border border-[#D5E6C4] dark:border-[#2C3529] rounded-2xl p-3 sm:px-4 sm:py-3 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition-all"
            title="Klik untuk langsung membaca pesan pendukung di bawah"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#70B325] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#70B325]" />
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#558223] dark:text-[#86C839] flex-shrink-0">
                <IconChat className="w-3.5 h-3.5" />
                <span>Dukungan Baru:</span>
              </span>
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                <strong className="text-gray-900 dark:text-white">{messages[0].voter_name}</strong>{' '}
                <span className="text-gray-400">({messages[0].time_ago}):</span>{' '}
                <span className="italic text-gray-600 dark:text-gray-300">&quot;{messages[0].message}&quot;</span>
              </p>
            </div>
            <span className="text-xs font-bold text-[#70B325] dark:text-[#86C839] flex-shrink-0 hover:underline inline-flex items-center gap-1">
              <span>Lihat di Bawah</span>
              <IconArrowDown className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {/* GLOBAL INITIAL LOADING STATE */}
        {loading && (
          <div className="p-16 text-center text-gray-500">
            <div className="w-8 h-8 border-3 border-[#70B325] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Memuat data ajang voting...</p>
          </div>
        )}

        {/* GLOBAL INITIAL ERROR STATE */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-4 rounded-xl text-center max-w-lg mx-auto">
            <p className="text-sm font-bold">{error}</p>
            <button
              type="button"
              onClick={() => loadData(false)}
              className="mt-2 text-xs font-bold underline cursor-pointer"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 1: PAPAN PERINGKAT (KREENCONNECT AUTHENTIC PODIUM ARCHITECTURE)   */}
        {/* ========================================================================= */}
        {!loading && !error && finalists.length > 0 && (
          <section id="card-leaderboard" className="scroll-mt-28 space-y-6">

            {/* Background Container for Leaderboard (Harmonized with Event Theme Color) */}
            <div
              className="relative rounded-3xl overflow-hidden border p-4 sm:p-6 lg:p-10"
              style={{
                background: `linear-gradient(to bottom, ${activeThemeColor}25, ${activeThemeColor}08, transparent)`,
                borderColor: `${activeThemeColor}30`,
              }}
            >

              {/* Header (Clean, no redundant nested glass box) */}
              <div className="text-center space-y-1 max-w-xl mx-auto mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-[#262A25] dark:text-white tracking-tight flex items-center justify-center gap-2">
                  <IconTrophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>Papan Peringkat</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isFrozen
                    ? 'Perolehan suara sementara dirahasiakan oleh panitia pelaksana.'
                    : `Rekapitulasi ${totalVotes.toLocaleString('id-ID')} suara sah masuk`}
                </p>
              </div>

              {/* TOP 3 PODIUM (KreenConnect 3-Column Podium with Rank 1 Crown & Center Elevation) */}
              {topThreeFinalists.length > 0 && (
                <div className="mt-6 sm:mt-8 max-w-4xl mx-auto">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 items-end">

                    {/* PODIUM COLUMN 1: RANK 2 (Silver - Left) */}
                    {topThreeFinalists[1] ? (
                      <div className="flex flex-col items-center justify-end w-full group">
                        {/* Spacer to keep center Rank 1 visually elevated */}
                        <div className="h-6 sm:h-10 w-full" />

                        <div className="w-full rounded-xl sm:rounded-2xl bg-white/80 dark:bg-[#1A2018]/90 backdrop-blur-xl border border-slate-300 dark:border-slate-700/80 p-2 sm:p-4 lg:p-5 flex flex-col justify-between space-y-2 sm:space-y-3 shadow-md hover:shadow-lg transition-all scale-95 sm:scale-100">
                          {/* Photo with 4:5 aspect ratio */}
                          <div
                            onClick={() => setSelectedFinalistForDetail(topThreeFinalists[1])}
                            className="aspect-[4/5] w-full rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 dark:bg-black/50 cursor-pointer relative"
                          >
                            <img
                              src={resolveStorageUrl(topThreeFinalists[1].photo_url || topThreeFinalists[1].photo)}
                              alt={topThreeFinalists[1].name}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                            <div className="absolute top-2 left-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold border border-white/20">
                                <IconMedal className="w-3 h-3 text-slate-300" />
                                <span>#2</span>
                              </span>
                            </div>
                          </div>

                          {/* Candidate Name */}
                          <div
                            onClick={() => setSelectedFinalistForDetail(topThreeFinalists[1])}
                            className="text-[11px] sm:text-sm lg:text-base font-black text-center line-clamp-2 cursor-pointer hover:text-[#70B325] text-gray-900 dark:text-white"
                          >
                            {topThreeFinalists[1].name}
                          </div>

                          {/* Percentage / Vote Stat */}
                          <div className="text-center font-black text-xs sm:text-base text-gray-700 dark:text-gray-200">
                            {isFrozen
                              ? 'Rahasia'
                              : `${totalVotes > 0 ? ((topThreeFinalists[1].vote_count / totalVotes) * 100).toFixed(1) : 0}%`}
                          </div>

                          {/* Bottom Row: Full-width Vote Button */}
                          <div className="w-full pt-0.5">
                            {isVotingClosed ? (
                              <div className="w-full py-1.5 sm:py-2 px-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-[11px] sm:text-xs rounded-lg text-center border border-slate-300 dark:border-slate-700">
                                Juara 2
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isVotingExpired}
                                onClick={() => setSelectedFinalistForVote(topThreeFinalists[1])}
                                className="w-full py-1.5 sm:py-2 px-2 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs sm:text-sm rounded-lg transition-all text-center cursor-pointer disabled:cursor-not-allowed shadow-xs min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
                              >
                                Vote
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div />
                    )}

                    {/* PODIUM COLUMN 2: RANK 1 (Gold Crown - Center Champion) */}
                    {topThreeFinalists[0] ? (
                      <div className="flex flex-col items-center justify-end w-full group relative z-10">
                        {/* Animated Golden Crown on Top */}
                        <div className="h-8 sm:h-12 flex items-center justify-center -mb-1 animate-bounce">
                          <IconCrown className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-amber-400 drop-shadow-md" />
                        </div>

                        <div className="w-full rounded-xl sm:rounded-2xl bg-white/90 dark:bg-[#1A2018] backdrop-blur-xl border-2 border-amber-400 dark:border-amber-400 p-2 sm:p-5 lg:p-6 flex flex-col justify-between space-y-2 sm:space-y-3 shadow-xl shadow-amber-500/15 transition-all scale-100 sm:scale-105">
                          {/* Photo with 4:5 aspect ratio */}
                          <div
                            onClick={() => setSelectedFinalistForDetail(topThreeFinalists[0])}
                            className="aspect-[4/5] w-full rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 dark:bg-black/50 cursor-pointer relative"
                          >
                            <img
                              src={resolveStorageUrl(topThreeFinalists[0].photo_url || topThreeFinalists[0].photo)}
                              alt={topThreeFinalists[0].name}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                            <div className="absolute top-2 left-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-amber-950 text-[10px] sm:text-xs font-black shadow-xs">
                                <IconCrown className="w-3 h-3 text-amber-950" />
                                <span>Juara 1</span>
                              </span>
                            </div>
                          </div>

                          {/* Candidate Name */}
                          <div
                            onClick={() => setSelectedFinalistForDetail(topThreeFinalists[0])}
                            className="text-xs sm:text-base lg:text-lg font-black text-center line-clamp-2 cursor-pointer hover:text-[#70B325] text-gray-900 dark:text-white"
                          >
                            {topThreeFinalists[0].name}
                          </div>

                          {/* Percentage / Vote Stat */}
                          <div className="text-center font-black text-sm sm:text-lg lg:text-xl text-amber-600 dark:text-amber-400">
                            {isFrozen
                              ? 'Rahasia'
                              : `${totalVotes > 0 ? ((topThreeFinalists[0].vote_count / totalVotes) * 100).toFixed(1) : 0}%`}
                          </div>

                          {/* Bottom Row: Full-width Vote Button */}
                          <div className="w-full pt-0.5">
                            {isVotingClosed ? (
                              <div className="w-full py-1.5 sm:py-2 px-2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black text-xs sm:text-sm rounded-lg text-center shadow-xs">
                                Juara 1
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isVotingExpired}
                                onClick={() => setSelectedFinalistForVote(topThreeFinalists[0])}
                                className="w-full py-1.5 sm:py-2 px-2 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-black text-xs sm:text-sm rounded-lg transition-all text-center cursor-pointer disabled:cursor-not-allowed shadow-xs min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
                              >
                                Vote
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div />
                    )}

                    {/* PODIUM COLUMN 3: RANK 3 (Bronze - Right) */}
                    {topThreeFinalists[2] ? (
                      <div className="flex flex-col items-center justify-end w-full group">
                        {/* Spacer to keep center Rank 1 visually elevated */}
                        <div className="h-6 sm:h-10 w-full" />

                        <div className="w-full rounded-xl sm:rounded-2xl bg-white/80 dark:bg-[#1A2018]/90 backdrop-blur-xl border border-amber-800/40 dark:border-amber-700/60 p-2 sm:p-4 lg:p-5 flex flex-col justify-between space-y-2 sm:space-y-3 shadow-md hover:shadow-lg transition-all scale-95 sm:scale-100">
                          {/* Photo with 4:5 aspect ratio */}
                          <div
                            onClick={() => setSelectedFinalistForDetail(topThreeFinalists[2])}
                            className="aspect-[4/5] w-full rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 dark:bg-black/50 cursor-pointer relative"
                          >
                            <img
                              src={resolveStorageUrl(topThreeFinalists[2].photo_url || topThreeFinalists[2].photo)}
                              alt={topThreeFinalists[2].name}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                            <div className="absolute top-2 left-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold border border-white/20">
                                <IconMedal className="w-3 h-3 text-amber-400" />
                                <span>#3</span>
                              </span>
                            </div>
                          </div>

                          {/* Candidate Name */}
                          <div
                            onClick={() => setSelectedFinalistForDetail(topThreeFinalists[2])}
                            className="text-[11px] sm:text-sm lg:text-base font-black text-center line-clamp-2 cursor-pointer hover:text-[#70B325] text-gray-900 dark:text-white"
                          >
                            {topThreeFinalists[2].name}
                          </div>

                          {/* Percentage / Vote Stat */}
                          <div className="text-center font-black text-xs sm:text-base text-gray-700 dark:text-gray-200">
                            {isFrozen
                              ? 'Rahasia'
                              : `${totalVotes > 0 ? ((topThreeFinalists[2].vote_count / totalVotes) * 100).toFixed(1) : 0}%`}
                          </div>

                          {/* Bottom Row: Full-width Vote Button */}
                          <div className="w-full pt-0.5">
                            {isVotingClosed ? (
                              <div className="w-full py-1.5 sm:py-2 px-2 bg-amber-900/20 text-amber-300 font-extrabold text-[11px] sm:text-xs rounded-lg text-center border border-amber-700/50">
                                Juara 3
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isVotingExpired}
                                onClick={() => setSelectedFinalistForVote(topThreeFinalists[2])}
                                className="w-full py-1.5 sm:py-2 px-2 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs sm:text-sm rounded-lg transition-all text-center cursor-pointer disabled:cursor-not-allowed shadow-xs min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
                              >
                                Vote
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div />
                    )}

                  </div>
                </div>
              )}

              {/* RANKS 4+ LEADERBOARD ROWS (KreenConnect Authentic Rows under Top 3 - HANYA MUNCUL SAAT VOTING MASIH AKTIF) */}
              {!isVotingClosed && otherFinalists.length > 0 && (
                <div className="mt-8 max-w-4xl mx-auto space-y-2.5">
                  {otherFinalists.map((finalist, idx) => {
                    const rankNumber = idx + 4
                    const percentage = totalVotes > 0 ? ((finalist.vote_count / totalVotes) * 100).toFixed(2) : '0'

                    return (
                      <div
                        key={finalist.id}
                        className="p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-[#1A2018]/90 backdrop-blur-md border border-gray-200/70 dark:border-white/10 flex items-center justify-between gap-3 hover:border-[#70B325] transition-all shadow-2xs"
                      >
                        {/* Left: Rank Box, Photo, Name */}
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center font-black text-sm sm:text-base text-gray-700 dark:text-gray-200 flex-shrink-0">
                            {isFrozen ? '?' : rankNumber}
                          </div>

                          <img
                            loading="lazy"
                            src={resolveStorageUrl(finalist.photo_url || finalist.photo)}
                            alt={finalist.name}
                            onClick={() => setSelectedFinalistForDetail(finalist)}
                            className="w-10 h-12 sm:w-12 sm:h-14 rounded-lg object-cover flex-shrink-0 cursor-pointer border border-gray-100 dark:border-white/10"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />

                          <div className="min-w-0">
                            <h4
                              onClick={() => setSelectedFinalistForDetail(finalist)}
                              className="font-extrabold text-xs sm:text-base text-gray-900 dark:text-white truncate cursor-pointer hover:text-[#70B325]"
                            >
                              {finalist.name}
                            </h4>
                            <p className="text-[10px] sm:text-xs text-gray-400 truncate mt-0.5">
                              {finalist.description || `Finalis Nomor Urut ${rankNumber}`}
                            </p>
                          </div>
                        </div>

                        {/* Right: Percentage & Vote CTA */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                          <span className="font-extrabold text-xs sm:text-base text-[#70B325] dark:text-[#86C839]">
                            {isFrozen ? 'Rahasia' : `${percentage}%`}
                          </span>

                          <button
                            type="button"
                            disabled={isVotingExpired}
                            onClick={() => setSelectedFinalistForVote(finalist)}
                            className="w-16 sm:w-20 py-1.5 sm:py-2 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs rounded-lg transition-all text-center cursor-pointer disabled:cursor-not-allowed"
                          >
                            Vote
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

            </div>
          </section>
        )}

        {/* DECORATIVE SEPARATOR DIVIDER (KreenConnect Primo Ornament) */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 my-6 sm:my-10">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#70B325]/40 to-transparent" />
          <div className="flex items-center gap-1.5 text-[#70B325] flex-shrink-0">
            <IconSparkles className="w-5 h-5 text-[#70B325]" />
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#70B325]/40 to-transparent" />
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: FINALIS (KREENCONNECT FULL ROSTER CARDS WITH 2-STAT BOX)       */}
        {/* ========================================================================= */}
        <section id="card-finalis" className="scroll-mt-28 space-y-6">

          {/* Section Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#262A25] dark:text-white tracking-tight">
              {isVotingClosed ? 'Daftar Juara Resmi' : 'Finalis'}
            </h2>
            <h3 className="text-sm sm:text-base font-bold text-gray-500 dark:text-gray-400">
              {categoryTitle}
            </h3>
            {isVotingClosed && (
              <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-bold max-w-xl mx-auto pt-1">
                Ajang ini telah resmi berakhir. Hanya finalis Juara 1, 2, dan 3 yang ditampilkan sesuai perolehan suara sah.
              </p>
            )}
          </div>

          {/* Centered Pill Search Bar (KreenConnect Architecture) */}
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau nomor urut finalis..."
              className="w-full h-12 pl-11 pr-11 text-xs sm:text-sm bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/15 rounded-full text-[#262A25] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#70B325] shadow-xs transition-colors"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <IconSearch className="w-4 h-4 text-gray-400" />
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                title="Hapus pencarian"
              >
                <IconClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Empty Search State */}
          {filteredFinalists.length === 0 && (
            <div className="bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl p-12 text-center text-gray-500 max-w-lg mx-auto space-y-3">
              <IconUsers className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-base font-extrabold text-[#262A25] dark:text-white">
                {searchQuery ? 'Finalis tidak ditemukan' : 'Belum ada finalis terdaftar'}
              </p>
              <p className="text-xs text-gray-400">
                {searchQuery
                  ? `Tidak ada kandidat yang cocok dengan pencarian "${searchQuery}".`
                  : 'Penyelenggara belum mendaftarkan kandidat untuk ajang ini.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="btn-primary text-xs font-bold py-2 px-4 mx-auto cursor-pointer"
                >
                  Tampilkan Semua Finalis
                </button>
              )}
            </div>
          )}

          {/* View Mode Controls Toolbar (Google Drive Style) */}
          {filteredFinalists.length > 0 && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400">
                <span>Daftar Finalis</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-[#70B325] dark:text-[#86C839] font-extrabold">{filteredFinalists.length} Finalis</span>
              </div>

              {/* Google Drive Segmented Pill Toggle */}
              <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-[#1A2018] rounded-xl border border-gray-200 dark:border-white/10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleViewModeChange('list')}
                  className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'list'
                      ? 'bg-white dark:bg-[#252E22] text-[#70B325] dark:text-[#86C839] shadow-xs border border-gray-200/60 dark:border-white/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
                  className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'grid'
                      ? 'bg-white dark:bg-[#252E22] text-[#70B325] dark:text-[#86C839] shadow-xs border border-gray-200/60 dark:border-white/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  title="Tampilan Grid (2 Kolom di Mobile)"
                  aria-label="Tampilan Grid"
                >
                  <IconGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>
            </div>
          )}

          {/* Grid View: 2-Column on Mobile, 2-3 on Desktop */}
          {filteredFinalists.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5 lg:gap-6">
              {filteredFinalists.map((finalist) => {
                const photoSrc = finalist.photo_url || finalist.photo
                const percentage =
                  totalVotes > 0
                    ? ((finalist.vote_count / totalVotes) * 100).toFixed(1)
                    : 0
                const globalRank = finalists.findIndex((f) => f.id === finalist.id) + 1
                const priceFormatted = (category?.price_per_vote || 1000).toLocaleString('id-ID')

                return (
                  <article
                    key={finalist.id}
                    className="card-base flex flex-col justify-between overflow-hidden bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/10 rounded-2xl p-2 sm:p-4 shadow-xs hover:border-[#70B325] dark:hover:border-[#70B325] hover:shadow-md transition-all group"
                  >
                    <div>
                      {/* Portrait Image (4:5 Aspect Ratio) */}
                      <div
                        onClick={() => setSelectedFinalistForDetail(finalist)}
                        className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-black/50 cursor-pointer"
                        title="Klik untuk membuka profil lengkap finalis"
                      >
                        {photoSrc ? (
                          <img
                            src={resolveStorageUrl(photoSrc)}
                            alt={finalist.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-emerald-950 to-gray-900 text-center p-2 sm:p-4">
                            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-[#70B325]/20 text-[#70B325] flex items-center justify-center font-black text-sm sm:text-2xl mb-1 sm:mb-2">
                              {finalist.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-gray-300">Foto Resmi</span>
                          </div>
                        )}

                        {/* Top Left: Candidate Number / Juara Badge */}
                        <div className="absolute top-2 left-2 z-10">
                          {isVotingClosed ? (
                            globalRank === 1 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[10px] sm:text-xs font-black shadow-md border border-amber-300">
                                <IconTrophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">JUARA</span> 1
                              </span>
                            ) : globalRank === 2 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 text-[10px] sm:text-xs font-black shadow-md border border-slate-300">
                                <IconMedal className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">JUARA</span> 2
                              </span>
                            ) : globalRank === 3 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-gradient-to-r from-amber-800 to-amber-900 text-amber-100 text-[10px] sm:text-xs font-black shadow-md border border-amber-700">
                                <IconMedal className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">JUARA</span> 3
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-black/75 backdrop-blur-md text-white border border-white/20 text-[10px] sm:text-xs font-black shadow-sm">
                                No. {String(globalRank).padStart(2, '0')}
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-black/75 backdrop-blur-md text-white border border-white/20 text-[10px] sm:text-xs font-black shadow-sm">
                              No. {String(globalRank).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Candidate Name (Centered) */}
                      <h3
                        onClick={() => setSelectedFinalistForDetail(finalist)}
                        className="font-bold text-xs sm:text-base text-center mt-2 sm:mt-3 text-gray-900 dark:text-white line-clamp-1 sm:line-clamp-2 min-h-[1.5rem] sm:min-h-[2.5rem] flex items-center justify-center cursor-pointer hover:text-[#70B325] transition-colors leading-tight"
                      >
                        {finalist.name}
                      </h3>

                      {/* Sub-label / Affiliation */}
                      <div className="text-[10px] sm:text-[11px] text-center text-gray-400 pb-1.5 sm:pb-2 border-b border-gray-100 dark:border-white/10 truncate">
                        {finalist.description || `Kandidat Nomor Urut ${globalRank}`}
                      </div>

                      {/* 3-Column Compact Stat Box: Tarif, Vote%, Total Suara */}
                      <div className="grid grid-cols-3 rounded-xl bg-gray-50/90 dark:bg-white/5 py-1.5 px-1 my-2 text-center divide-x divide-gray-200/70 dark:divide-white/10 border border-gray-100 dark:border-white/5">
                        <div className="px-0.5 min-w-0">
                          <span className="block text-[9px] text-gray-400 font-semibold tracking-tight uppercase">Tarif</span>
                          <span className="block text-[10px] sm:text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight whitespace-nowrap">
                            Rp {priceFormatted}
                          </span>
                        </div>
                        <div className="px-0.5 min-w-0">
                          <span className="block text-[9px] text-gray-400 font-semibold tracking-tight uppercase">Vote</span>
                          <span className="block text-[10px] sm:text-xs font-bold text-[#70B325] dark:text-[#86C839] leading-tight whitespace-nowrap">
                            {isFrozen ? 'Rahasia' : `${percentage}%`}
                          </span>
                        </div>
                        <div className="px-0.5 min-w-0">
                          <span className="block text-[9px] text-gray-400 font-semibold tracking-tight uppercase">Suara</span>
                          <span className="block text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 leading-tight whitespace-nowrap">
                            {isFrozen ? '?' : (finalist.vote_count || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: 2-Row Compact Layout */}
                    <div className="space-y-1.5 pt-1">
                      {/* Row 1: Primary Action (Vote or Juara) */}
                      {isVotingClosed ? (
                        <div className="w-full h-8 sm:h-9 px-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center gap-1 shadow-2xs">
                          <IconTrophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span className="truncate">
                            {globalRank === 1 ? 'Juara 1' : globalRank === 2 ? 'Juara 2' : 'Juara 3'}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isVotingExpired}
                          onClick={() => setSelectedFinalistForVote(finalist)}
                          className="w-full h-8 sm:h-9 px-2 bg-[#70B325] hover:bg-[#5F9A1E] disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                          <IconZap className="w-3.5 h-3.5 text-white flex-shrink-0" />
                          <span className="truncate">
                            {isVotingExpired ? 'Voting Ditutup' : `Vote ${finalist.name.split(' ')[0]}`}
                          </span>
                        </button>
                      )}

                      {/* Row 2: Secondary Actions (Detail + Bagikan Side-by-Side) */}
                      <div className="grid grid-cols-2 gap-1.5 relative">
                        {/* Detail Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedFinalistForDetail(finalist)}
                          className="h-7 sm:h-8 px-2 text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-lg transition-colors cursor-pointer flex items-center justify-center truncate"
                        >
                          <span>Detail</span>
                        </button>

                        {/* Bagikan Button with Dropdown Popover */}
                        <div className="relative" ref={shareOpenId === finalist.id ? shareDropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setShareOpenId(shareOpenId === finalist.id ? null : finalist.id)}
                            className="w-full h-7 sm:h-8 px-2 text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                            title="Bagikan Profil Finalis"
                          >
                            <IconLink className="w-3 h-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                            <span>Bagikan</span>
                            <IconChevronDown
                              className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                                shareOpenId === finalist.id ? 'rotate-180 text-[#70B325]' : ''
                              }`}
                            />
                          </button>

                          {/* Share Dropdown Popover */}
                          {shareOpenId === finalist.id && (
                            <div className="absolute bottom-full mb-1.5 right-0 w-44 bg-white dark:bg-[#1C2519] border border-gray-200 dark:border-white/15 rounded-xl shadow-xl z-40 p-1 overflow-hidden animate-fadeIn space-y-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  handleShareWhatsApp(finalist)
                                  setShareOpenId(null)
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#1F8A43] dark:text-[#8FE032] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer text-left"
                              >
                                <IconWhatsApp className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Bagikan ke WA</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleCopyLink(finalist)
                                  setTimeout(() => setShareOpenId(null), 1600)
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
                              >
                                {copiedId === finalist.id ? (
                                  <>
                                    <IconCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Link Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <IconLink className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                    <span>Salin Link</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* List View: Row Layout (Mobile Optimized + Desktop Streamlined) */}
          {filteredFinalists.length > 0 && viewMode === 'list' && (
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {filteredFinalists.map((finalist) => {
                const photoSrc = finalist.photo_url || finalist.photo
                const percentage =
                  totalVotes > 0
                    ? ((finalist.vote_count / totalVotes) * 100).toFixed(1)
                    : 0
                const globalRank = finalists.findIndex((f) => f.id === finalist.id) + 1
                const priceFormatted = (category?.price_per_vote || 1000).toLocaleString('id-ID')

                return (
                  <article
                    key={finalist.id}
                    className="card-base p-2.5 sm:p-3.5 bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xs hover:border-[#70B325] dark:hover:border-[#70B325] hover:shadow-sm transition-all group"
                  >
                    {/* Top Content Area: Photo on Left, Info & Stats on Right */}
                    <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
                      {/* Left: Thumbnail Candidate Image */}
                      <div
                        onClick={() => setSelectedFinalistForDetail(finalist)}
                        className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-black/50 flex-shrink-0 cursor-pointer shadow-xs"
                        title="Klik untuk membuka profil lengkap finalis"
                      >
                        {photoSrc ? (
                          <img
                            src={resolveStorageUrl(photoSrc)}
                            alt={finalist.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-950 text-[#70B325] font-black text-sm">
                            {finalist.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute top-1 left-1 z-10">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-black tracking-tight border border-white/20">
                            No. {String(globalRank).padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      {/* Center: Candidate Info & Stats */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isVotingClosed && globalRank <= 3 && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black ${
                              globalRank === 1 ? 'bg-amber-400 text-amber-950' : globalRank === 2 ? 'bg-slate-300 text-slate-900' : 'bg-amber-800 text-amber-100'
                            }`}>
                              <IconTrophy className="w-3 h-3" /> Juara {globalRank}
                            </span>
                          )}
                          <h3
                            onClick={() => setSelectedFinalistForDetail(finalist)}
                            className="font-bold text-xs sm:text-base text-gray-900 dark:text-white truncate cursor-pointer hover:text-[#70B325] transition-colors"
                          >
                            {finalist.name}
                          </h3>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {finalist.description || `Kandidat Nomor Urut ${globalRank}`}
                        </p>

                        {/* Stat Badges: Clean Horizontal Strip Without Vertical Wrapping */}
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                          <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200/60 dark:border-white/5 font-semibold whitespace-nowrap">
                            <IconCoins className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            <span>Rp {priceFormatted}</span>
                          </div>
                          <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-[#70B325] dark:text-[#86C839] bg-[#70B325]/10 px-2 py-0.5 rounded-md border border-[#70B325]/20 font-bold whitespace-nowrap">
                            <IconTrendingUp className="w-3 h-3 flex-shrink-0" />
                            <span>{isFrozen ? 'Rahasia' : `${percentage}%`}</span>
                          </div>
                          <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 font-bold whitespace-nowrap">
                            <IconUsers className="w-3 h-3 flex-shrink-0" />
                            <span>{isFrozen ? '?' : `${(finalist.vote_count || 0).toLocaleString('id-ID')} suara`}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Desktop Actions Toolbar (Hidden on Mobile) */}
                      <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0">
                        {isVotingClosed ? (
                          <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 px-2.5 py-1 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200/60 dark:border-white/5">
                            Selesai
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isVotingExpired}
                            onClick={() => setSelectedFinalistForVote(finalist)}
                            className="h-8 sm:h-9 px-3 sm:px-4 bg-[#70B325] hover:bg-[#5F9A1E] disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                          >
                            <IconZap className="w-3.5 h-3.5 text-white flex-shrink-0" />
                            <span>Vote {finalist.name.split(' ')[0]}</span>
                          </button>
                        )}

                        {/* Desktop Detail & Share Toolbar */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedFinalistForDetail(finalist)}
                            className="h-7 px-2.5 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail Profil"
                          >
                            Detail
                          </button>

                          {/* Desktop Bagikan Popover */}
                          <div className="relative" ref={shareOpenId === `list-d-${finalist.id}` ? shareDropdownRef : null}>
                            <button
                              type="button"
                              onClick={() => setShareOpenId(shareOpenId === `list-d-${finalist.id}` ? null : `list-d-${finalist.id}`)}
                              className="h-7 px-2 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Bagikan Profil Finalis"
                            >
                              <IconLink className="w-3 h-3 text-gray-400" />
                              <span>Bagikan</span>
                              <IconChevronDown
                                className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                                  shareOpenId === `list-d-${finalist.id}` ? 'rotate-180 text-[#70B325]' : ''
                                }`}
                              />
                            </button>

                            {shareOpenId === `list-d-${finalist.id}` && (
                              <div className="absolute bottom-full right-0 mb-1.5 w-44 bg-white dark:bg-[#1C2519] border border-gray-200 dark:border-white/15 rounded-xl shadow-xl z-40 p-1 overflow-hidden animate-fadeIn space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleShareWhatsApp(finalist)
                                    setShareOpenId(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-[#1F8A43] dark:text-[#8FE032] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer text-left"
                                >
                                  <IconWhatsApp className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span>Bagikan ke WA</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleCopyLink(finalist)
                                    setTimeout(() => setShareOpenId(null), 1600)
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
                                >
                                  {copiedId === finalist.id ? (
                                    <>
                                      <IconCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                      <span className="text-emerald-600 dark:text-emerald-400">Link Tersalin!</span>
                                    </>
                                  ) : (
                                    <>
                                      <IconLink className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                      <span>Salin Link</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Content Area: Mobile Actions Toolbar (Visible Only on Mobile, sm:hidden) */}
                    <div className="sm:hidden mt-2 pt-2 border-t border-gray-100 dark:border-white/5 flex items-center gap-1.5">
                      {isVotingClosed ? (
                        <div className="flex-1 h-7 px-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center gap-1">
                          <IconTrophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>Selesai</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isVotingExpired}
                          onClick={() => setSelectedFinalistForVote(finalist)}
                          className="flex-1 h-7 px-2.5 bg-[#70B325] hover:bg-[#5F9A1E] disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white font-extrabold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                          <IconZap className="w-3 h-3 text-white flex-shrink-0" />
                          <span className="truncate">
                            {isVotingExpired ? 'Voting Ditutup' : `Vote ${finalist.name.split(' ')[0]}`}
                          </span>
                        </button>
                      )}

                      {/* Detail Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedFinalistForDetail(finalist)}
                        className="h-7 px-2.5 text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      >
                        Detail
                      </button>

                      {/* Bagikan Popover for Mobile */}
                      <div className="relative" ref={shareOpenId === `list-m-${finalist.id}` ? shareDropdownRef : null}>
                        <button
                          type="button"
                          onClick={() => setShareOpenId(shareOpenId === `list-m-${finalist.id}` ? null : `list-m-${finalist.id}`)}
                          className="h-7 px-2 text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                          title="Bagikan Profil Finalis"
                        >
                          <IconLink className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          <span>Bagikan</span>
                          <IconChevronDown
                            className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                              shareOpenId === `list-m-${finalist.id}` ? 'rotate-180 text-[#70B325]' : ''
                            }`}
                          />
                        </button>

                        {shareOpenId === `list-m-${finalist.id}` && (
                          <div className="absolute bottom-full right-0 mb-1.5 w-44 bg-white dark:bg-[#1C2519] border border-gray-200 dark:border-white/15 rounded-xl shadow-xl z-40 p-1 overflow-hidden animate-fadeIn space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleShareWhatsApp(finalist)
                                setShareOpenId(null)
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-[#1F8A43] dark:text-[#8FE032] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer text-left"
                            >
                              <IconWhatsApp className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Bagikan ke WA</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleCopyLink(finalist)
                                setTimeout(() => setShareOpenId(null), 1600)
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
                            >
                              {copiedId === finalist.id ? (
                                <>
                                  <IconCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                  <span className="text-emerald-600 dark:text-emerald-400">Link Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <IconLink className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                  <span>Salin Link</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: DUKUNGAN (WALL OF SUPPORT / PESAN & DOA PENDUKUNG)             */}
        {/* ========================================================================= */}
        <section id="card-dukungan" className="scroll-mt-28 space-y-6 pt-4">

          {/* Section Header & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5DE] dark:bg-white/10 text-[#70B325] dark:text-[#86C839] text-xs font-black uppercase tracking-wider mb-2">
                <IconChat className="w-3.5 h-3.5" />
                <span>Wall of Support</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#262A25] dark:text-white tracking-tight">
                Pesan &amp; Doa Pendukung
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Apresiasi dan pesan semangat nyata yang dikirimkan pemilih untuk para kandidat.
              </p>
            </div>

            {/* Filter by Candidate Dropdown */}
            {finalists.length > 0 && (
              <div className="w-full sm:w-auto">
                <select
                  value={selectedMessageFinalistId}
                  onChange={(e) => setSelectedMessageFinalistId(e.target.value)}
                  className="w-full sm:w-64 h-11 text-xs font-bold py-2 px-3 bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/15 rounded-xl text-gray-900 dark:text-white focus:border-[#70B325] focus:outline-none shadow-xs"
                >
                  <option value="">Semua Finalis ({messages.length} pesan)</option>
                  {finalists.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Messages Grid (KreenConnect Card Layout with Message, Divider, & Mascot) */}
          {loadingMessages && messages.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-8 h-8 border-3 border-[#70B325] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold">Memuat pesan dukungan...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/10 rounded-2xl p-10 text-center text-gray-500 max-w-lg mx-auto space-y-4 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5DE] dark:bg-white/10 text-[#70B325] dark:text-[#86C839] flex items-center justify-center mx-auto">
                <IconChat className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-extrabold text-[#262A25] dark:text-white">
                  Belum Ada Pesan Dukungan
                </p>
                <p className="text-xs text-gray-400">
                  Jadilah pemilih pertama yang menuliskan doa dan pesan semangat untuk kandidat jagoanmu!
                </p>
              </div>
              <button
                type="button"
                onClick={() => scrollToTab('card-finalis')}
                className="btn-primary text-xs font-bold py-2.5 px-5 mx-auto cursor-pointer"
              >
                Pilih Finalis &amp; Beri Dukungan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 bg-white dark:bg-[#1A2018] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  {/* Top: Message Text */}
                  <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed italic">
                    &quot;{item.message}&quot;
                  </div>

                  {/* Divider Line */}
                  <div className="h-px w-full bg-gray-100 dark:bg-white/10" />

                  {/* Bottom: Author Info, Mascot & Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#70B325] to-emerald-700 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                        {item.voter_name ? item.voter_name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div className="min-w-0">
                        <strong className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                          {item.voter_name}
                        </strong>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {item.time_ago}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#558223] dark:text-[#86C839] bg-[#EAF5DE] dark:bg-white/10 px-2.5 py-0.5 rounded-full flex-shrink-0">
                      <IconZap className="w-3 h-3 text-[#70B325] fill-current" />
                      <span>{item.vote_amount} Suara</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: DESKRIPSI & REGULASI RESMI (KREENCONNECT EXACT CARD LAYOUT)    */}
        {/* ========================================================================= */}
        <section id="card-tentang" className="scroll-mt-28 space-y-6 pt-4">
          <div className="border-b border-gray-200 dark:border-white/10 pb-4">
            <h2 className="text-2xl sm:text-3xl font-black text-[#262A25] dark:text-white tracking-tight">
              Deskripsi
            </h2>
          </div>

          <div className="bg-white dark:bg-[#1A2018] border border-gray-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Event Poster / Banner Thumbnail */}
              {category?.thumbnail || category?.event?.thumbnail || category?.thumbnail_url || category?.event?.thumbnail_url ? (
                <div className="w-full sm:w-48 aspect-[3/4] rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 dark:border-white/10 shadow-xs group">
                  <img
                    src={resolveStorageUrl(category?.thumbnail || category?.thumbnail_url || category?.event?.thumbnail || category?.event?.thumbnail_url)}
                    alt={categoryTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="w-full sm:w-48 aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-[#123E2A] to-[#0A1D14] flex-shrink-0 flex items-center justify-center p-3 text-center border border-gray-200 dark:border-white/10">
                  <div className="space-y-1">
                    <IconTrophy className="w-7 h-7 text-[#70B325] mx-auto" />
                    <div className="text-xs font-black text-white">{categoryTitle}</div>
                    <div className="text-[10px] text-gray-300">Official Voting</div>
                  </div>
                </div>
              )}

              {/* Event Details */}
              <div className="space-y-4 flex-1">
                <div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E5F2D9] dark:bg-white/10 text-[#4F7E1D] dark:text-[#86C839] text-xs font-bold uppercase tracking-wider mb-2">
                    Official Competition Event
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                    {categoryTitle}
                  </h3>
                  {category?.organizer && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Penyelenggara: <strong className="text-gray-900 dark:text-white">{category.organizer}</strong>
                    </p>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {category?.description ||
                    'Ajang pemilihan dan voting online resmi yang diselenggarakan untuk menentukan perwakilan favorit masyarakat secara terbuka, transparan, dan terenkripsi.'}
                </p>

                {/* Period & Pricing Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-white/10">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Periode Pemilihan</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {category?.start_date || 'Segera'} s/d {category?.end_date || 'Selesai'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Metode Pemilihan &amp; Tarif</span>
                    <span className="text-xs sm:text-sm font-bold text-[#70B325] dark:text-[#86C839]">
                      E-Voting ({category?.allow_free_vote !== false ? '1x Gratis & ' : ''}Rp {(category?.price_per_vote || 1000).toLocaleString('id-ID')}/suara)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Regulations List */}
            <div className="bg-[#F8FAF7] dark:bg-black/30 rounded-xl p-4 sm:p-5 border border-gray-100 dark:border-white/10 space-y-2">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Ketentuan &amp; Alur Pemilihan Resmi
              </h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>
                  {category?.allow_free_vote !== false
                    ? 'Tersedia 1 kuota vote gratis per akun kontak (WhatsApp/Email) terverifikasi.'
                    : 'Ajang ini menggunakan sistem pemilihan paket suara sah berbayar.'}
                </li>
                <li>
                  Untuk menambah dukungan bagi kandidat, Anda dapat membeli paket suara tambahan secara instan melalui QRIS Dinamis dan Virtual Account Bank.
                </li>
                <li>
                  Setiap transaksi yang berhasil akan langsung menerbitkan Bukti Sah E-Receipt ber-ID unik yang dapat diunduh dan dicetak secara resmi.
                </li>
                <li>
                  Tabulasi suara diperbarui secara otomatis dan diproteksi dari segala bentuk kecurangan digital dan manipulasi bot.
                </li>
              </ul>
            </div>
          </div>
        </section>

      </main>

      {/* POP-UP 1: COMMERCIAL VOTE MODAL */}
      {selectedFinalistForVote && (
        <CommercialVoteModal
          key={selectedFinalistForVote.id}
          isOpen={true}
          onClose={() => setSelectedFinalistForVote(null)}
          finalist={selectedFinalistForVote}
          category={category}
          onVoteSuccess={(receipt) => {
            setEReceiptData(receipt)
            loadData(true)
            loadMessages(true)
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
          isVotingExpired={isVotingClosed}
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

      {/* Official Brand Footer */}
      <PublicFooter />

    </div>
  )
}
