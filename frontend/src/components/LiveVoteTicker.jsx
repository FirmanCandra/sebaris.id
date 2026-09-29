import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api, resolveStorageUrl } from '../api/client'

export default function LiveVoteTicker() {
  const location = useLocation()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const timerRef = useRef(null)

  // Don't render on admin, login, or embed routes
  const isHiddenRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/embed')

  // Extract category param if on a category voting page
  const categoryMatch = location.pathname.match(/^\/(?:voting|categories)\/([^/]+)/)
  const currentCategory = categoryMatch ? decodeURIComponent(categoryMatch[1]) : null

  // Fetch recent votes strictly scoped to current category ONLY when on a category page
  useEffect(() => {
    if (isHiddenRoute || !currentCategory) {
      setItems([])
      setVisible(false)
      return
    }

    let isMounted = true
    setVisible(false)
    setCurrentIndex(0)

    async function fetchRecentVotes() {
      try {
        const queryParam = `?category=${encodeURIComponent(currentCategory)}`
        const res = await api(`/votes/recent${queryParam}`)
        if (isMounted) {
          if (res.data && res.data.length > 0) {
            setItems(res.data)
            setCurrentIndex(0)
          } else {
            setItems([])
          }
        }
      } catch {
        if (isMounted) setItems([])
      }
    }

    fetchRecentVotes()
    const refreshInterval = setInterval(fetchRecentVotes, 30000)

    return () => {
      isMounted = false
      clearInterval(refreshInterval)
    }
  }, [isHiddenRoute, currentCategory])

  // Cycle through votes
  useEffect(() => {
    if (isHiddenRoute || !currentCategory || dismissed || items.length === 0 || isPaused) return

    // Show initial item after small entrance delay
    const initialDelay = setTimeout(() => {
      setVisible(true)
    }, 1200)

    timerRef.current = setInterval(() => {
      // Fade out
      setVisible(false)

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length)
        setVisible(true)
      }, 400)
    }, 7000)

    return () => {
      clearTimeout(initialDelay)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isHiddenRoute, currentCategory, dismissed, items.length, isPaused])

  if (isHiddenRoute || !currentCategory || dismissed || items.length === 0) {
    return null
  }

  const currentItem = items[currentIndex]
  if (!currentItem) return null

  function handleClick() {
    if (currentItem.category_slug) {
      navigate(`/voting/${currentItem.category_slug}`)
    }
  }

  function handleDismiss(e) {
    e.stopPropagation()
    setVisible(false)
    setTimeout(() => {
      setDismissed(true)
    }, 300)
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-40 max-w-[340px] sm:max-w-[380px] transition-all duration-400 ease-out select-none print:hidden ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <div
        onClick={handleClick}
        className="group relative flex items-center gap-3 p-3 sm:py-3 sm:px-3.5 rounded-2xl bg-white/95 dark:bg-[#151C14]/95 backdrop-blur-md border border-gray-200/90 dark:border-white/12 shadow-xl shadow-gray-900/8 dark:shadow-black/60 cursor-pointer hover:border-[#70B325] dark:hover:border-[#70B325]/60 transition-all hover:scale-[1.02] active:scale-[0.99]"
      >
        {/* Candidate Photo or Live Pulse Indicator */}
        <div className="relative flex-shrink-0">
          {currentItem.finalist_photo ? (
            <img
              src={resolveStorageUrl(currentItem.finalist_photo)}
              alt={currentItem.finalist_name}
              className="w-10 h-10 rounded-full object-cover border border-[#70B325]/40 shadow-xs"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#EBF7E3] dark:bg-[#70B325]/20 text-[#48781B] dark:text-[#8FE032] font-black text-xs flex items-center justify-center border border-[#70B325]/30">
              {currentItem.finalist_name?.slice(0, 2)?.toUpperCase() || 'VT'}
            </div>
          )}
          {/* Subtle Live Status Indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#151C14]" />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            <span className="truncate max-w-[120px] font-semibold text-gray-700 dark:text-gray-300">
              {currentItem.voter_display}
            </span>
            <span>·</span>
            <span>{currentItem.time_ago}</span>
          </div>

          <p className="text-xs text-gray-900 dark:text-white leading-snug truncate mt-0.5">
            <span className="font-extrabold text-[#70B325] dark:text-[#8FE032]">
              +{currentItem.vote_amount} suara
            </span>{' '}
            untuk <span className="font-bold">{currentItem.finalist_name}</span>
          </p>

          {currentItem.category_name && (
            <span className="text-[10px] text-gray-400 dark:text-gray-400 block truncate">
              {currentItem.category_name}
            </span>
          )}
        </div>

        {/* Close / Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Tutup notifikasi"
          title="Tutup"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
