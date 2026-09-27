import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api, resolveStorageUrl } from '../api/client'
import PublicHeader from '../components/PublicHeader'
import CheckVoteModal from '../components/CheckVoteModal'
import SebarisLogo from '../components/SebarisLogo'
import HeroBannerSkeleton from '../components/HeroBannerSkeleton'
import HighlightCardsSkeleton from '../components/HighlightCardsSkeleton'
import TopVotingSkeleton from '../components/TopVotingSkeleton'
import heroBg from '../assets/hero-bg.jpg'
import iconSectionHighlight from '../assets/icon-section-highlight.png'
import iconSectionTopVoting from '../assets/icon-section-topvoting.png'
import iconSectionPastEvents from '../assets/icon-section-pastevents.png'
import {
  IconFlame,
  IconClock,
  IconCheckVote,
  IconChevronRight,
  IconChevronLeft,
  IconZap,
  IconTrophy,
  IconArrowUpRight,
  IconVoteBox,
  IconCrown,
  IconCheck,
  IconLock,
} from '../components/Icons'
import {
  BannerSchool,
  BannerCampus,
  BannerFestival,
  BannerPoster,
  ThumbnailEarth,
  ThumbnailTech,
  ThumbnailMusic,
  ThumbnailCamera,
} from '../components/CardIllustrations'

function isCategoryPast(cat) {
  if (!cat) return false
  if (cat.status === 'inactive' || cat.status === 'ended' || cat.status === 'completed') {
    return true
  }
  if (cat.event?.status === 'inactive' || cat.event?.status === 'ended' || cat.event?.status === 'completed') {
    return true
  }
  if (cat.end_date) {
    const end = new Date(cat.end_date)
    end.setHours(23, 59, 59, 999)
    if (end < new Date()) {
      return true
    }
  }
  if (cat.event?.end_date) {
    const end = new Date(cat.event.end_date)
    end.setHours(23, 59, 59, 999)
    if (end < new Date()) {
      return true
    }
  }
  return false
}

function isEventPast(ev) {
  if (!ev) return false
  if (ev.status === 'inactive' || ev.status === 'ended' || ev.status === 'completed') {
    return true
  }
  if (ev.end_date) {
    const end = new Date(ev.end_date)
    end.setHours(23, 59, 59, 999)
    if (end < new Date()) {
      return true
    }
  }
  return false
}

const CACHE_KEYS = {
  EVENTS: 'sebaris_cache_events',
  CATEGORIES: 'sebaris_cache_categories',
  BANNERS: 'sebaris_cache_banners',
  CHAMPIONS: 'sebaris_cache_champions',
}

function getLocalCache(key) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setLocalCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Quota or private browsing fallback
  }
}

export default function PublicEventsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCheckVoteModalOpen, setIsCheckVoteModalOpen] = useState(false)
  const [checkVoteModalQuery, setCheckVoteModalQuery] = useState('')
  
  // Instant Paint: initialize directly from session cache if available (0ms load on refresh)
  const [backendEvents, setBackendEvents] = useState(() => getLocalCache(CACHE_KEYS.EVENTS) || [])
  const [backendCategories, setBackendCategories] = useState(() => getLocalCache(CACHE_KEYS.CATEGORIES) || [])
  const [backendBanners, setBackendBanners] = useState(() => getLocalCache(CACHE_KEYS.BANNERS) || [])
  const [champions, setChampions] = useState(() => getLocalCache(CACHE_KEYS.CHAMPIONS) || [])
  
  const hasCachedDataRef = useRef(
    Boolean(
      (getLocalCache(CACHE_KEYS.CATEGORIES)?.length > 0) ||
      (getLocalCache(CACHE_KEYS.BANNERS)?.length > 0)
    )
  )

  const hasCachedChampionsRef = useRef(Boolean(getLocalCache(CACHE_KEYS.CHAMPIONS)?.length > 0))

  const [loadingData, setLoadingData] = useState(() => !hasCachedDataRef.current)
  const [loadingChampions, setLoadingChampions] = useState(() => !hasCachedChampionsRef.current)
  const [loadedBannerImages, setLoadedBannerImages] = useState({})
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [isBannerPaused, setIsBannerPaused] = useState(false)
  const [touchStartX, setTouchStartX] = useState(null)
  const [touchStartY, setTouchStartY] = useState(null)

  const highlightsSliderRef = useRef(null)
  const championsSliderRef = useRef(null)
  const pastSliderRef = useRef(null)

  const scrollSlider = (ref, direction) => {
    if (!ref.current) return
    const offset = direction === 'left' ? -350 : 350
    ref.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  // Always ensure the homepage starts at the very top (Hero Banner) on initial mount or refresh
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }

    const timer = setTimeout(() => {
      window.scrollTo(0, 0)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Silent background revalidation: if we already painted cached content, don't flash skeletons
    if (!hasCachedDataRef.current) {
      setLoadingData(true)
    }

    Promise.all([
      api('/events').catch(() => ({ data: [] })),
      api('/categories').catch(() => ({ data: [] })),
      api('/banners').catch(() => ({ data: [] })),
    ])
      .then(([eventsRes, catRes, bannersRes]) => {
        if (Array.isArray(eventsRes?.data) && eventsRes.data.length > 0) {
          setBackendEvents(eventsRes.data)
          setLocalCache(CACHE_KEYS.EVENTS, eventsRes.data)
        }
        if (Array.isArray(catRes?.data) && catRes.data.length > 0) {
          setBackendCategories(catRes.data)
          setLocalCache(CACHE_KEYS.CATEGORIES, catRes.data)
        }
        if (Array.isArray(bannersRes?.data) && bannersRes.data.length > 0) {
          setBackendBanners(bannersRes.data)
          setLocalCache(CACHE_KEYS.BANNERS, bannersRes.data)
        }
      })
      .catch(() => {
        // Backend offline or empty: gracefully maintain client resilience
      })
      .finally(() => setLoadingData(false))
  }, [])

  // Separate active categories (Highlight) and past categories (Sudah Berlalu)
  const activeCategories = backendCategories.filter((cat) => !isCategoryPast(cat))
  const pastCategories = backendCategories.filter((cat) => isCategoryPast(cat))

  // Fetch #1 leading candidates across active categories via single fast endpoint
  useEffect(() => {
    let isMounted = true

    api('/top-champions')
      .then((res) => {
        if (isMounted && Array.isArray(res?.data) && res.data.length > 0) {
          setChampions(res.data)
          setLocalCache(CACHE_KEYS.CHAMPIONS, res.data)
        }
      })
      .catch(() => {
        // Fallback resilient client
      })
      .finally(() => {
        if (isMounted) setLoadingChampions(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  function handleOpenCheckVoteModal(code = '') {
    setCheckVoteModalQuery(code)
    setIsCheckVoteModalOpen(true)
  }

  // 1. Highlight Events: HANYA AJANG / EVENT INDUK (Bukan per sub-kategori)
  const highlightEvents = useMemo(() => {
    // Prioritas 1: Ambil data dari backendEvents jika tersedia (hanya yang aktif)
    if (backendEvents.length > 0) {
      return backendEvents
        .filter((ev) => !isEventPast(ev))
        .map((ev, idx) => {
          const evCategories = (ev.categories && ev.categories.length > 0)
            ? ev.categories
            : backendCategories.filter((c) => c.event_id === ev.id)
          const premierCat = evCategories.find((c) => c.tier === 'premier') || evCategories[0]
          const catCount = ev.categories_count || evCategories.length
          const totalFinalists = evCategories.reduce((sum, c) => sum + (c.finalists_count || 0), 0)

          return {
            id: `event-${ev.id}`,
            eventId: ev.id,
            slug: premierCat?.slug || premierCat?.id || String(ev.id),
            title: ev.name,
            organizer: premierCat?.organizer || 'Panitia Pelaksana',
            daysLeft: ev.end_date ? `s/d ${ev.end_date}` : (premierCat?.end_date ? `s/d ${premierCat.end_date}` : 'Sedang Berlangsung'),
            votes: `${catCount} Kategori Pemilihan`,
            totalFinalists,
            thumbnail: ev.thumbnail_url || ev.thumbnail || premierCat?.thumbnail_url || premierCat?.thumbnail,
            BannerComponent: [BannerCampus, BannerSchool, BannerFestival, BannerPoster][idx % 4],
          }
        })
    }

    // Prioritas 2: Kelompokkan dari backendCategories berdasarkan event induk (hanya yang aktif)
    const eventMap = new Map()
    activeCategories.forEach((cat) => {
      const eventKey = cat.event_id ? `event-${cat.event_id}` : `cat-${cat.id}`
      if (!eventMap.has(eventKey)) {
        eventMap.set(eventKey, {
          id: eventKey,
          eventId: cat.event_id,
          slug: cat.slug || String(cat.id),
          title: cat.event?.name || cat.name,
          organizer: cat.organizer || 'Panitia Pelaksana',
          daysLeft: cat.event?.end_date ? `s/d ${cat.event.end_date}` : (cat.end_date ? `s/d ${cat.end_date}` : 'Sedang Berlangsung'),
          thumbnail: cat.event?.thumbnail_url || cat.event?.thumbnail || cat.thumbnail_url || cat.thumbnail,
          categoriesCount: 1,
        })
      } else {
        const item = eventMap.get(eventKey)
        item.categoriesCount += 1
        if (cat.tier === 'premier') {
          item.slug = cat.slug || String(cat.id)
          const thumb = cat.event?.thumbnail_url || cat.event?.thumbnail || cat.thumbnail_url || cat.thumbnail
          if (thumb) {
            item.thumbnail = thumb
          }
        }
      }
    })

    return Array.from(eventMap.values()).map((ev, idx) => ({
      ...ev,
      votes: `${ev.categoriesCount} Kategori Pemilihan`,
      BannerComponent: [BannerCampus, BannerSchool, BannerFestival, BannerPoster][idx % 4],
    }))
  }, [backendEvents, backendCategories, activeCategories])

  const filteredHighlights = highlightEvents.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return item.title.toLowerCase().includes(q) || item.organizer.toLowerCase().includes(q)
  })

  // 3. Past Events (Event/ajang yang sudah berakhir atau berstatus nonaktif)
  const pastEvents = useMemo(() => {
    // Prioritas 1: Dari backendEvents yang sudah lewat / nonaktif
    if (backendEvents.length > 0) {
      const pastEvList = backendEvents.filter((ev) => isEventPast(ev))
      if (pastEvList.length > 0) {
        return pastEvList.map((ev, idx) => {
          const evCategories = (ev.categories && ev.categories.length > 0)
            ? ev.categories
            : backendCategories.filter((c) => c.event_id === ev.id)
          const premierCat = evCategories.find((c) => c.tier === 'premier') || evCategories[0]
          const catCount = ev.categories_count || evCategories.length
          const totalFinalists = evCategories.reduce((sum, c) => sum + (c.finalists_count || 0), 0)

          return {
            id: `past-event-${ev.id}`,
            slug: premierCat?.slug || premierCat?.id || String(ev.id),
            title: ev.name,
            organizer: premierCat?.organizer || 'Panitia Pelaksana',
            endDate: ev.end_date ? `Berakhir ${ev.end_date}` : (premierCat?.end_date ? `Berakhir ${premierCat.end_date}` : 'Telah Selesai'),
            votes: `${catCount} Kategori • ${totalFinalists} Finalis`,
            thumbnail: ev.thumbnail_url || ev.thumbnail || premierCat?.thumbnail_url || premierCat?.thumbnail,
            IconComponent: [ThumbnailEarth, ThumbnailTech, ThumbnailMusic, ThumbnailCamera][idx % 4],
          }
        })
      }
    }

    // Prioritas 2: Dari pastCategories
    return pastCategories.map((cat, idx) => ({
      id: `past-cat-${cat.id}`,
      slug: cat.slug || String(cat.id),
      title: cat.event?.name || cat.name,
      organizer: cat.organizer || 'Panitia Pelaksana',
      endDate: cat.end_date ? `Berakhir ${cat.end_date}` : 'Telah Selesai',
      votes: `${cat.finalists_count || 0} finalis`,
      thumbnail: cat.event?.thumbnail_url || cat.event?.thumbnail || cat.thumbnail_url || cat.thumbnail,
      IconComponent: [ThumbnailEarth, ThumbnailTech, ThumbnailMusic, ThumbnailCamera][idx % 4],
    }))
  }, [backendEvents, backendCategories, pastCategories])

  const filteredPast = pastEvents.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return item.title.toLowerCase().includes(q) || item.organizer.toLowerCase().includes(q)
  })

  // Hero Banners (Banner gambar murni bergeser seperti Kreen & diatur lewat admin)
  const heroBanners = useMemo(() => {
    if (backendBanners && backendBanners.length > 0) {
      return backendBanners.map((b) => ({
        id: `banner-${b.id}`,
        title: b.title,
        image: resolveStorageUrl(b.image_url || b.image),
        link_url: b.link_url,
      }))
    }

    // Fallback jika admin belum mengunggah banner
    if (highlightEvents.length > 0) {
      return highlightEvents.filter((ev) => ev.thumbnail).map((ev) => ({
        id: `banner-${ev.id}`,
        title: ev.title,
        image: resolveStorageUrl(ev.thumbnail),
        link_url: `/voting/${ev.slug}`,
      }))
    }

    return []
  }, [backendBanners, highlightEvents])

  // Auto-play hero banner carousel (setiap 5 detik)
  useEffect(() => {
    if (isBannerPaused || heroBanners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isBannerPaused, heroBanners.length])

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
  }
  const handleTouchEnd = (e) => {
    if (touchStartX === null || heroBanners.length <= 1) return
    const diffX = touchStartX - e.changedTouches[0].clientX
    const diffY = touchStartY !== null ? touchStartY - e.changedTouches[0].clientY : 0
    // Only slide if horizontal intent is stronger than vertical scroll intent
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length)
      } else {
        setCurrentBannerIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length)
      }
    }
    setTouchStartX(null)
    setTouchStartY(null)
  }

  return (
    <div className="min-h-screen bg-[#F8FAF7] dark:bg-[#121612] text-[#262A25] dark:text-[#F3F5F1] flex flex-col font-sans transition-colors duration-300">
      
      {/* Top Sticky Navigation Bar */}
      <PublicHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCheckVote={() => handleOpenCheckVoteModal()}
      />

      {/* =========================================================================
          HERO BANNER CAROUSEL (Banner Gambar Murni Sesuai Kreenconnect.com)
          ========================================================================= */}
      {loadingData ? (
        <HeroBannerSkeleton />
      ) : heroBanners.length > 0 ? (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-1 w-full animate-fadeIn">
          <div
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm bg-gray-900 border border-[#E5EADF] dark:border-[#2C3529] aspect-[16/9] sm:aspect-[21/9] lg:aspect-[24/8] flex items-center group select-none ios-isolate"
            onMouseEnter={() => setIsBannerPaused(true)}
            onMouseLeave={() => setIsBannerPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sliding Track for buttery smooth transitions */}
            <div
              className="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
              style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
            >
              {heroBanners.map((banner, idx) => {
                const isImageLoaded = Boolean(loadedBannerImages[banner.id || idx])

                const imageElement = (
                  <div className="relative w-full h-full bg-[#E6ECE1] dark:bg-black/50 overflow-hidden">
                    {/* Shimmer Placeholder only when image is not yet cached or loaded */}
                    {!isImageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#E6ECE1]/90 dark:bg-white/5">
                        <div className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent pointer-events-none" />
                      </div>
                    )}
                    <img
                      src={banner.image}
                      alt={banner.title || 'Banner Event Sebaris'}
                      className={`w-full h-full object-cover object-center transition-opacity duration-300 ease-out ${
                        isImageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      draggable={false}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      fetchPriority={idx === 0 ? 'high' : 'auto'}
                      decoding="async"
                      onLoad={() => {
                        setLoadedBannerImages((prev) => ({ ...prev, [banner.id || idx]: true }))
                      }}
                      ref={(el) => {
                        if (el && el.complete && !isImageLoaded) {
                          setLoadedBannerImages((prev) => ({ ...prev, [banner.id || idx]: true }))
                        }
                      }}
                    />
                  </div>
                )

                return (
                  <div key={banner.id || idx} className="w-full h-full flex-shrink-0 relative overflow-hidden">
                    {banner.link_url ? (
                      banner.link_url.startsWith('http') ? (
                        <a
                          href={banner.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-full cursor-pointer"
                          title={banner.title}
                        >
                          {imageElement}
                        </a>
                      ) : (
                        <Link
                          to={banner.link_url}
                          className="block w-full h-full cursor-pointer"
                          title={banner.title}
                        >
                          {imageElement}
                        </Link>
                      )
                    ) : (
                      <div className="w-full h-full">{imageElement}</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Left Arrow Button (Hidden on Mobile, Visible on Desktop hover) */}
            {heroBanners.length > 1 && (
              <button
                type="button"
                onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length)}
                className="hidden sm:flex absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 sm:w-11 h-9 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md border border-white/20 text-white items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                aria-label="Banner sebelumnya"
              >
                <IconChevronLeft className="w-5 sm:w-6 h-5 sm:h-6" />
              </button>
            )}

            {/* Right Arrow Button (Hidden on Mobile, Visible on Desktop hover) */}
            {heroBanners.length > 1 && (
              <button
                type="button"
                onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length)}
                className="hidden sm:flex absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 sm:w-11 h-9 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md border border-white/20 text-white items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                aria-label="Banner selanjutnya"
              >
                <IconChevronRight className="w-5 sm:w-6 h-5 sm:h-6" />
              </button>
            )}

            {/* Mobile Counter Badge (Bottom Right, does NOT cover text/artwork in center or bottom) */}
            {heroBanners.length > 1 && (
              <div className="sm:hidden absolute bottom-2.5 right-2.5 z-20 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-xs tracking-wider pointer-events-none">
                {currentBannerIndex + 1} / {heroBanners.length}
              </div>
            )}

            {/* Desktop Pagination Dots at Bottom Center */}
            {heroBanners.length > 1 && (
              <div className="hidden sm:flex absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 items-center gap-1.5 sm:gap-2">
                {heroBanners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
                      currentBannerIndex === idx
                        ? 'w-6 sm:w-8 bg-[#70B325] shadow-md'
                        : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/90'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col">
        
        {/* =========================================================================
            1. PERTAMA: HIGHLIGHT EVENT / KATEGORI
            ========================================================================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-10 pb-4 sm:pb-6 w-full">
          <section id="voting-section" className="space-y-4">
          
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src={iconSectionHighlight}
                alt="Highlight Event Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain select-none flex-shrink-0 drop-shadow-sm hover:scale-105 transition-transform duration-300"
                loading="eager"
              />
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#262A25] dark:text-white">
                  Highlight Event
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Ajang pemilihan resmi yang sedang aktif dan dapat Anda ikuti sekarang
                </p>
              </div>
            </div>

            {filteredHighlights.length > 0 && (
              <Link
                to={`/voting/${filteredHighlights[0]?.slug || filteredHighlights[0]?.id}`}
                className="hidden sm:inline-flex items-center gap-1 text-sm font-extrabold text-[#70B325] dark:text-[#86C839] hover:underline whitespace-nowrap"
              >
                <span>Lihat Lebih Banyak</span>
                <IconChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Highlight Voting Cards Carousel / Slider */}
          {loadingData ? (
            <HighlightCardsSkeleton />
          ) : filteredHighlights.length === 0 ? (
            <div className="py-16 px-6 text-center bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F2F8EC] dark:bg-white/5 text-[#70B325] flex items-center justify-center mb-3">
                <IconFlame className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-[#262A25] dark:text-white">Belum Ada Ajang Aktif</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                Saat ini belum ada ajang voting aktif yang cocok dengan pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="relative group/slider">
              {/* Left Nav Arrow Button (Desktop/Tablet) */}
              {filteredHighlights.length > 2 && (
                <button
                  type="button"
                  onClick={() => scrollSlider(highlightsSliderRef, 'left')}
                  className="hidden sm:flex absolute -left-3.5 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-[#1A2018] shadow-md border border-[#E5EADF] dark:border-[#2C3529] text-gray-700 dark:text-gray-200 items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer opacity-90 hover:opacity-100"
                  aria-label="Geser ke kiri"
                >
                  <IconChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Right Nav Arrow Button (Desktop/Tablet) */}
              {filteredHighlights.length > 2 && (
                <button
                  type="button"
                  onClick={() => scrollSlider(highlightsSliderRef, 'right')}
                  className="hidden sm:flex absolute -right-3.5 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-[#1A2018] shadow-md border border-[#E5EADF] dark:border-[#2C3529] text-gray-700 dark:text-gray-200 items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer opacity-90 hover:opacity-100"
                  aria-label="Geser ke kanan"
                >
                  <IconChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Horizontal Snap Slider */}
              <div
                ref={highlightsSliderRef}
                className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 pb-3 pt-1"
              >
                {filteredHighlights.map((item) => {
                  const Banner = item.BannerComponent
                  return (
                    <article
                      key={item.id}
                      className="flex-shrink-0 w-[74vw] max-w-[270px] sm:w-[calc(50%-10px)] sm:max-w-none md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] snap-start aspect-[3/4] rounded-2xl overflow-hidden bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
                    >
                      {item.thumbnail ? (
                        /* Full Poster Card Layout */
                        <Link
                          to={`/voting/${item.slug || item.id}`}
                          className="relative w-full h-full block overflow-hidden group/poster select-none"
                        >
                          <img
                            src={resolveStorageUrl(item.thumbnail)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-500"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />

                          {/* Top-Left Live Status Badge */}
                          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase text-white shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#70B325] animate-ping" />
                            Live
                          </span>

                          {/* Bottom Gradient Overlay (Always visible on mobile, hover-revealed on desktop) */}
                          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col justify-end text-white opacity-100 sm:opacity-0 sm:group-hover/poster:opacity-100 transition-opacity duration-300">
                            <h3 className="font-extrabold text-xs sm:text-sm line-clamp-2 leading-tight text-white mb-1">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-gray-300 truncate mb-2 sm:mb-2.5 flex items-center gap-1">
                              <span className="truncate">{item.organizer}</span>
                              <IconCheck className="w-3 h-3 text-[#70B325] flex-shrink-0" />
                            </p>
                            <div className="w-full py-1.5 sm:py-2 px-3 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs rounded-xl text-center shadow-xs flex items-center justify-center gap-1 active:scale-98 transition-all">
                              <span>Buka Event</span>
                              <IconChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </Link>
                      ) : (
                        /* Hybrid Card Layout */
                        <div className="w-full h-full flex flex-col justify-between">
                          {/* Top Image Banner (44%) */}
                          <div className="relative h-[44%] w-full overflow-hidden bg-gray-100 dark:bg-black/30 flex items-center justify-center">
                            <Banner />
                            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-black/80 backdrop-blur-xs border border-white/60 dark:border-white/15 text-[10px] font-black uppercase text-gray-900 dark:text-white shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#70B325] animate-ping" />
                              Live
                            </span>
                          </div>

                          {/* Bottom Card Body (56%) */}
                          <div className="h-[56%] p-3 sm:p-3.5 flex flex-col justify-between space-y-1 bg-white dark:bg-[#1A2018]">
                            <div className="space-y-1">
                              <h3 className="font-bold text-xs sm:text-sm text-[#262A25] dark:text-white group-hover:text-[#70B325] dark:group-hover:text-[#86C839] transition-colors line-clamp-2 leading-tight">
                                <Link to={`/voting/${item.slug || item.id}`} className="no-underline text-inherit">
                                  {item.title}
                                </Link>
                              </h3>
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                                {item.daysLeft}
                              </p>
                              <p className="text-xs font-bold text-[#558223] dark:text-[#86C839] truncate">
                                {item.votes}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                <span className="truncate">{item.organizer}</span>
                                <IconCheck className="w-3 h-3 text-[#70B325] flex-shrink-0" />
                              </p>
                            </div>

                            <Link
                              to={`/voting/${item.slug || item.id}`}
                              className="w-full py-2 px-3 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs sm:text-sm rounded-xl text-center no-underline flex items-center justify-center gap-1 shadow-xs active:scale-98 transition-all"
                            >
                              <span>Buka Event</span>
                              <IconChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>

              {/* Mobile "Lihat Lebih Banyak ->" button below carousel */}
              {filteredHighlights.length > 1 && (
                <div className="sm:hidden flex items-center justify-center pt-3 pb-1">
                  <Link
                    to={`/voting/${filteredHighlights[0]?.slug || filteredHighlights[0]?.id}`}
                    className="inline-flex items-center gap-1 text-sm font-extrabold text-[#70B325] dark:text-[#86C839] hover:underline"
                  >
                    <span>Lihat Lebih Banyak</span>
                    <IconChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* =========================================================================
          2. KEDUA: TOP VOTING (Kandidat Juara Terdepan - Logo Yellow-Green Wave)
          ========================================================================= */}
      {loadingChampions ? (
        <TopVotingSkeleton />
      ) : champions.length > 0 ? (
        <section className="w-full relative overflow-hidden bg-gradient-to-br from-[#DDFB38] via-[#CAF118] to-[#B2E40B] dark:from-[#17240B] dark:via-[#1F330E] dark:to-[#15220A] transition-colors select-none">
          {/* Top Wave Transition (Page background #F8FAF7 / #121612 into vibrant yellow-green) */}
          <div className="w-full overflow-hidden leading-none select-none pointer-events-none">
            <svg
              viewBox="0 0 1440 74"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-7 sm:h-12 lg:h-16 block text-[#F8FAF7] dark:text-[#121612] fill-current"
              preserveAspectRatio="none"
            >
              <path d="M0,0 L1440,0 L1440,32 C1200,68 960,10 720,45 C480,80 240,18 0,42 Z" />
            </svg>
          </div>

          {/* Subtle Liquid Wave Accents in Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15 dark:opacity-20">
            <svg className="absolute w-[200%] h-full -left-1/2 top-0" viewBox="0 0 1440 400" fill="none" preserveAspectRatio="none">
              <path d="M0,160 C320,300 420,60 740,200 C1060,340 1200,120 1440,220 L1440,400 L0,400 Z" fill="white" />
            </svg>
            <svg className="absolute w-[200%] h-full -left-1/4 top-10" viewBox="0 0 1440 400" fill="none" preserveAspectRatio="none">
              <path d="M0,220 C280,100 520,320 800,180 C1080,40 1260,260 1440,140 L1440,400 L0,400 Z" fill="#9ECD06" />
            </svg>
          </div>

          {/* Inner Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 relative z-10 space-y-4 sm:space-y-6">
            {/* Header with Trophy Icon */}
            <div className="flex items-center justify-between gap-3 border-b border-[#173007]/15 dark:border-white/15 pb-3 sm:pb-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src={iconSectionTopVoting}
                  alt="Top Voting Logo"
                  className="w-13 h-13 sm:w-18 sm:h-18 lg:w-22 lg:h-22 object-contain select-none flex-shrink-0 drop-shadow-md hover:scale-105 transition-transform duration-300"
                  loading="eager"
                />
                <div>
                  <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-[#173007] dark:text-white tracking-tight">
                    Top Voting
                  </h2>
                  <p className="text-xs sm:text-sm text-[#24420D] dark:text-lime-200/80 font-semibold mt-0.5">
                    Kandidat terdepan dengan perolehan suara tertinggi saat ini dari ajang pemilihan aktif
                  </p>
                </div>
              </div>

              {champions.length > 0 && (
                <Link
                  to={`/voting/${champions[0]?.category.slug || champions[0]?.category.id}`}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#173007] hover:text-black dark:text-[#D2FF0F] dark:hover:text-white transition-colors bg-white/70 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#173007]/15 dark:border-white/20 shadow-xs whitespace-nowrap"
                >
                  <span>Lihat Lebih Banyak</span>
                  <IconChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            <div className="relative group/slider">
              {/* Left Nav Arrow Button */}
              {champions.length > 2 && (
                <button
                  type="button"
                  onClick={() => scrollSlider(championsSliderRef, 'left')}
                  className="hidden sm:flex absolute -left-3.5 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white dark:bg-[#1A2214] shadow-xl border border-[#173007]/15 dark:border-white/10 text-[#173007] dark:text-gray-100 items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 hover:scale-108 active:scale-95 transition-all cursor-pointer opacity-95 hover:opacity-100"
                  aria-label="Geser ke kiri"
                >
                  <IconChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Right Nav Arrow Button */}
              {champions.length > 2 && (
                <button
                  type="button"
                  onClick={() => scrollSlider(championsSliderRef, 'right')}
                  className="hidden sm:flex absolute -right-3.5 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white dark:bg-[#1A2214] shadow-xl border border-[#173007]/15 dark:border-white/10 text-[#173007] dark:text-gray-100 items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 hover:scale-108 active:scale-95 transition-all cursor-pointer opacity-95 hover:opacity-100"
                  aria-label="Geser ke kanan"
                >
                  <IconChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Horizontal Snap Slider */}
              <div
                ref={championsSliderRef}
                className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 pb-3 pt-1"
              >                {champions.map(({ category, finalist, totalVotes, percentage }) => (
                  <article
                    key={finalist.id}
                    className="flex-shrink-0 w-[74vw] max-w-[270px] sm:w-[calc(50%-10px)] sm:max-w-none md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] snap-start aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden relative border border-[#BCE813]/60 dark:border-white/10 shadow-[0_12px_30px_-5px_rgba(20,40,5,0.2)] hover:shadow-[0_20px_40px_-8px_rgba(20,40,5,0.3)] transition-all duration-500 group hover:-translate-y-2 bg-[#17240B]"
                  >
                    {/* Full-Bleed Portrait Photo */}
                    <div className="absolute inset-0 w-full h-full bg-gray-900 overflow-hidden">
                      {finalist.photo_url || finalist.photo ? (
                        <img
                          src={resolveStorageUrl(finalist.photo_url || finalist.photo)}
                          alt={finalist.name}
                          className="w-full h-full object-cover object-top group-hover:scale-108 transition-transform duration-700 ease-out"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-amber-400 font-black text-4xl">
                          {finalist.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
                      {/* Top-Left #1 Juara Badge */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black text-[10px] sm:text-[11px] shadow-md tracking-tight backdrop-blur-xs">
                        <IconCrown className="w-3.5 h-3.5 text-amber-950" />
                        <span>#1 Top Vote</span>
                      </span>

                      {/* Top-Right Vote Percentage Pill */}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white font-black text-[10px] sm:text-[11px] shadow-sm">
                        {percentage}%
                      </span>
                    </div>

                    {/* Bottom Light Green (Logo Matching) Low-Opacity Gradient Overlay */}
                    <div className="absolute inset-x-0 bottom-0 z-10 pt-24 pb-3.5 px-3.5 sm:pb-4 sm:px-4 bg-gradient-to-t from-[#D0FE15]/85 via-[#D0FE15]/45 via-45% to-transparent dark:from-[#17240B]/95 dark:via-[#1F330E]/60 dark:via-45% dark:to-transparent backdrop-blur-[2px] flex flex-col justify-end space-y-1.5 sm:space-y-2">
                      <div className="space-y-0.5 sm:space-y-1">
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#173007]/85 dark:text-lime-300 truncate drop-shadow-xs">
                          {category.name}
                        </p>
                        <h3 className="font-black text-sm sm:text-base lg:text-lg text-[#173007] dark:text-white leading-tight truncate group-hover:text-black dark:group-hover:text-lime-200 transition-colors drop-shadow-xs">
                          {finalist.name}
                        </h3>
                        <p className="text-[11px] sm:text-xs font-bold text-[#173007]/90 dark:text-gray-200 flex items-center gap-1">
                          <span>{finalist.vote_count.toLocaleString('id-ID')} suara</span>
                        </p>
                      </div>

                      {/* Fast Vote Button */}
                      <Link
                        to={`/voting/${category.slug || category.id}?finalist=${finalist.id}`}
                        className="w-full py-2 sm:py-2.5 bg-[#173007] group-hover:bg-black text-[#D2FF0F] dark:bg-[#D2FF0F] dark:group-hover:bg-[#C2EE08] dark:text-[#173007] font-black text-xs rounded-xl sm:rounded-2xl text-center no-underline flex items-center justify-center gap-1.5 shadow-sm group-hover:shadow-md active:scale-98 transition-all"
                      >
                        <IconZap className="w-3.5 h-3.5" />
                        <span>Dukung Juara 1</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {/* Mobile "Lihat Lebih Banyak ->" button below carousel */}
              {champions.length > 1 && (
                <div className="sm:hidden flex items-center justify-center pt-3 pb-1">
                  <Link
                    to={`/voting/${champions[0]?.category.slug || champions[0]?.category.id}`}
                    className="inline-flex items-center gap-1 text-xs font-black text-[#173007] dark:text-[#D2FF0F] bg-white/70 dark:bg-white/10 px-3.5 py-1.5 rounded-full border border-[#173007]/15 dark:border-white/20 shadow-xs"
                  >
                    <span>Lihat Lebih Banyak</span>
                    <IconChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Wave Transition */}
          <div className="w-full overflow-hidden leading-none select-none pointer-events-none">
            <svg
              viewBox="0 0 1440 74"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-7 sm:h-12 lg:h-16 block text-[#F8FAF7] dark:text-[#121612] fill-current"
              preserveAspectRatio="none"
            >
              <path d="M0,74 L1440,74 L1440,42 C1200,12 960,65 720,28 C480,-8 240,55 0,32 Z" />
            </svg>
          </div>
        </section>
      ) : null}

      {/* =========================================================================
          3. KETIGA: EVENT / KATEGORI YANG SUDAH BERLALU
          ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src={iconSectionPastEvents}
                alt="Event Selesai Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain select-none flex-shrink-0 drop-shadow-sm hover:scale-105 transition-transform duration-300"
                loading="eager"
              />
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#262A25] dark:text-white">
                  Event &amp; Kategori yang Sudah Berlalu
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Arsip dan riwayat ajang pemilihan yang periode votingnya telah resmi berakhir
                </p>
              </div>
            </div>

            {filteredPast.length > 0 && (
              <Link
                to={`/voting/${filteredPast[0]?.slug || filteredPast[0]?.id}`}
                className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-400 hover:underline whitespace-nowrap"
              >
                <span>Lihat Semua Arsip</span>
                <IconChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {filteredPast.length === 0 ? (
            <div className="py-10 px-6 text-center bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 flex items-center justify-center mb-2">
                <IconClock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#262A25] dark:text-white">Belum Ada Ajang yang Berakhir</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                Semua ajang pemilihan yang terdaftar saat ini masih berstatus aktif dan sedang berlangsung.
              </p>
            </div>
          ) : (
            <div className="relative group/slider">
              {/* Left Nav Arrow Button */}
              {filteredPast.length > 2 && (
                <button
                  type="button"
                  onClick={() => scrollSlider(pastSliderRef, 'left')}
                  className="hidden sm:flex absolute -left-3.5 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-[#1A2018] shadow-md border border-[#E5EADF] dark:border-[#2C3529] text-gray-700 dark:text-gray-200 items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer opacity-90 hover:opacity-100"
                  aria-label="Geser ke kiri"
                >
                  <IconChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Right Nav Arrow Button */}
              {filteredPast.length > 2 && (
                <button
                  type="button"
                  onClick={() => scrollSlider(pastSliderRef, 'right')}
                  className="hidden sm:flex absolute -right-3.5 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-[#1A2018] shadow-md border border-[#E5EADF] dark:border-[#2C3529] text-gray-700 dark:text-gray-200 items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer opacity-90 hover:opacity-100"
                  aria-label="Geser ke kanan"
                >
                  <IconChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Horizontal Snap Slider */}
              <div
                ref={pastSliderRef}
                className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 pb-3 pt-1"
              >
                {filteredPast.map((item) => {
                  const IconComp = item.IconComponent
                  return (
                    <article
                      key={item.id}
                      className="flex-shrink-0 w-[74vw] max-w-[270px] sm:w-[calc(50%-10px)] sm:max-w-none md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] snap-start aspect-[3/4] rounded-2xl overflow-hidden bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group opacity-90 hover:opacity-100"
                    >
                      {/* Poster / Thumbnail with subtle grayscale (46%) */}
                      <div className="relative h-[46%] w-full overflow-hidden bg-gray-100 dark:bg-black/30 flex items-center justify-center">
                        {item.thumbnail ? (
                          <img
                            src={resolveStorageUrl(item.thumbnail)}
                            alt={item.title}
                            className="w-full h-full object-cover grayscale contrast-90 group-hover:grayscale-0 transition-all duration-500"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
                            <IconComp className="w-16 h-16 opacity-40" />
                          </div>
                        )}

                        {/* Top Selesai Badge */}
                        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-gray-300 shadow-xs">
                          <IconLock className="w-3 h-3 text-gray-400" />
                          <span>Selesai</span>
                        </span>
                      </div>

                      {/* Card Body (54%) */}
                      <div className="h-[54%] p-3 sm:p-3.5 flex flex-col justify-between space-y-2 bg-white dark:bg-[#1A2018]">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-xs sm:text-sm text-[#262A25] dark:text-white line-clamp-2 leading-tight">
                            <Link
                              to={`/voting/${item.slug || item.id}`}
                              className="no-underline text-inherit hover:text-[#70B325]"
                            >
                              {item.title}
                            </Link>
                          </h3>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {item.organizer}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[11px]">
                          <span className="text-gray-500 dark:text-gray-400 font-medium">
                            {item.endDate}
                          </span>
                          <Link
                            to={`/voting/${item.slug || item.id}`}
                            className="text-[#70B325] dark:text-[#86C839] font-bold hover:underline flex items-center gap-0.5 no-underline"
                          >
                            <span>Hasil Akhir</span>
                            <IconArrowUpRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Mobile "Lihat Semua Arsip ->" button below carousel */}
              {filteredPast.length > 1 && (
                <div className="sm:hidden flex items-center justify-center pt-3 pb-1">
                  <Link
                    to={`/voting/${filteredPast[0]?.slug || filteredPast[0]?.id}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-400 hover:underline"
                  >
                    <span>Lihat Semua Arsip</span>
                    <IconChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

    </main>

      {/* Brand Footer */}
      <footer className="mt-16 bg-white dark:bg-[#121612] border-t border-[#E5EADF] dark:border-[#2C3529] py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <SebarisLogo size="sm" />
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
              Platform e-voting online terpercaya untuk pemilihan sekolah, kampus, organisasi, dan komunitas di Indonesia.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <a href="/#voting-section" className="hover:text-[#70B325] transition-colors">
              Voting Aktif
            </a>
            <button
              type="button"
              onClick={() => handleOpenCheckVoteModal()}
              className="hover:text-[#70B325] transition-colors bg-transparent border-none cursor-pointer"
            >
              Cek Suara
            </button>
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 text-center md:text-right">
            <p>© {new Date().getFullYear()} sebaris.id. Hak cipta dilindungi.</p>
          </div>
        </div>
      </footer>

      {/* Verification Receipt Modal Dialog */}
      <CheckVoteModal
        isOpen={isCheckVoteModalOpen}
        onClose={() => setIsCheckVoteModalOpen(false)}
        initialQuery={checkVoteModalQuery}
      />
    </div>
  )
}
