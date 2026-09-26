import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, resolveStorageUrl } from '../api/client'
import PublicHeader from '../components/PublicHeader'
import CheckVoteModal from '../components/CheckVoteModal'
import SebarisLogo from '../components/SebarisLogo'
import heroBg from '../assets/hero-bg.jpg'
import {
  IconSearch,
  IconFlame,
  IconClock,
  IconCheckVote,
  IconChevronRight,
  IconZap,
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

// Fallback arrays when no events are published yet
const POPULAR_VOTINGS_DATA = []
const RECENT_VOTINGS_DATA = []

const CATEGORIES = ['Semua', 'Sekolah', 'Kampus', 'Organisasi', 'Komunitas']

export default function PublicEventsPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [checkVoteCode, setCheckVoteCode] = useState('')
  const [isCheckVoteModalOpen, setIsCheckVoteModalOpen] = useState(false)
  const [checkVoteModalQuery, setCheckVoteModalQuery] = useState('')
  const [backendCategories, setBackendCategories] = useState([])
  const [_loadingCategories, setLoadingCategories] = useState(true)
  const [heroSlideIndex, setHeroSlideIndex] = useState(0)

  useEffect(() => {
    api('/categories')
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setBackendCategories(data)
        }
      })
      .catch(() => {
        // Backend offline or empty: gracefully maintain client resilience
      })
      .finally(() => setLoadingCategories(false))
  }, [])

  function handleCheckVoteSubmit(e) {
    e.preventDefault()
    setCheckVoteModalQuery(checkVoteCode)
    setIsCheckVoteModalOpen(true)
  }

  function handleOpenCheckVoteModal(code = '') {
    setCheckVoteModalQuery(code || checkVoteCode)
    setIsCheckVoteModalOpen(true)
  }

  // Combine backend categories or fallbacks
  const displayPopular = backendCategories.length > 0
    ? backendCategories.map((cat, idx) => ({
        id: cat.id,
        slug: cat.slug || String(cat.id),
        title: cat.name,
        organizer: cat.organizer || 'Forum Genre / Panitia',
        daysLeft: cat.end_date ? `s/d ${cat.end_date}` : 'Sedang Berlangsung',
        category: 'Komunitas',
        votes: `${cat.finalists_count || 0} finalis`,
        percentage: 60 + ((idx * 11) % 35),
        thumbnail: cat.thumbnail_url || cat.thumbnail,
        BannerComponent: [BannerSchool, BannerCampus, BannerFestival, BannerPoster][idx % 4],
        avatars: ['SB', 'ID', 'VT'],
        extraAvatars: cat.finalists_count > 3 ? cat.finalists_count - 3 : 0,
      }))
    : POPULAR_VOTINGS_DATA

  // Filter items based on active category and search query
  const filteredPopular = displayPopular.filter((item) => {
    const matchCat = activeCategory === 'Semua' || item.category === activeCategory
    const matchSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.organizer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  const displayRecent = backendCategories.length > 0
    ? backendCategories.map((cat, idx) => ({
        id: cat.id,
        slug: cat.slug || String(cat.id),
        title: cat.name,
        organizer: cat.organizer || 'Penyelenggara',
        daysLeft: cat.end_date ? `s/d ${cat.end_date}` : 'Buka',
        category: 'Komunitas',
        votes: `${cat.finalists_count || 0} finalis`,
        thumbnail: cat.thumbnail_url || cat.thumbnail,
        IconComponent: [ThumbnailEarth, ThumbnailTech, ThumbnailMusic, ThumbnailCamera][idx % 4],
      }))
    : RECENT_VOTINGS_DATA

  const filteredRecent = displayRecent.filter((item) => {
    const matchCat = activeCategory === 'Semua' || item.category === activeCategory
    const matchSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.organizer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  // Showcase item for right hero card
  const showcaseItem = backendCategories.length > 0 ? backendCategories[heroSlideIndex % backendCategories.length] : null

  return (
    <div className="min-h-screen bg-[#F8FAF7] dark:bg-[#121612] text-[#262A25] dark:text-[#F3F5F1] flex flex-col font-sans transition-colors duration-300">
      
      {/* Top Sticky Navigation Bar */}
      <PublicHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCheckVote={() => handleOpenCheckVoteModal()}
      />

      {/* HERO SECTION — Sesuai Referensi Foto (Background Gambar Setema, Typography Raksasa, Tombol Pill, Stats, Showcase Card) */}
      <section className="relative overflow-hidden min-h-[640px] sm:min-h-[700px] lg:min-h-[760px] flex items-center -mt-20 pt-24 sm:pt-28 pb-16">
        
        {/* Background Gambar Setema (Auditorium Megah E-Voting) */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Sebaris E-Voting Grand Stage"
            className="w-full h-full object-cover object-center transform scale-105 select-none"
            loading="eager"
          />
          {/* Lapisan Gradient Gelap Bernuansa Emerald yang Mewah */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAF7] dark:from-[#121612] via-black/60 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40 pointer-events-none" />
        </div>

        {/* Watermark Tipografi Raksasa (seperti EGYPT di referensi foto) */}
        <div
          aria-hidden="true"
          className="absolute top-8 sm:top-12 left-4 sm:left-10 lg:left-16 text-[80px] sm:text-[140px] lg:text-[210px] font-black tracking-widest text-white/5 dark:text-white/10 select-none pointer-events-none uppercase font-sans z-0 leading-none"
        >
          SEBARIS
        </div>

        {/* Konten Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Kolom Kiri: Headline, Subtitle, Stats & Tombol Aksi */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-white">
              
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md bg-white/10 dark:bg-black/40 border border-white/20 text-[#D0FE15] font-bold text-xs tracking-wide shadow-sm">
                <IconZap className="w-3.5 h-3.5 text-[#D0FE15]" />
                <span>Platform E-Voting Resmi &amp; Terverifikasi</span>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                  Pilih &amp; Dukung.<br />
                  <span className="text-[#D0FE15]">Transparan Nyata.</span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-200/90 max-w-xl leading-relaxed font-normal">
                  Ajang pemilihan umum daring resmi untuk kampus, sekolah, organisasi, dan ajang penghargaan komunitas. Dilengkapi verifikasi e-receipt resmi, polling QRIS otomatis, dan proteksi anti-kecurangan.
                </p>
              </div>

              {/* Stats Row (seperti 20K+, 2K+, 5K+ di foto referensi) */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-2 pb-2 border-y border-white/15 max-w-lg">
                <div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                    100%
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-300 font-medium">
                    Terenkripsi &amp; Anti-Fraud
                  </p>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#D0FE15]">
                    Real-Time
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-300 font-medium">
                    Tabulasi Suara Langsung
                  </p>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                    E-Receipt
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-300 font-medium">
                    Bukti Sah Terbit Otomatis
                  </p>
                </div>
              </div>

              {/* Tombol Aksi Terpisah (seperti Book Now ↗ di referensi foto) */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
                <a
                  href="#voting-section"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white text-gray-950 hover:bg-[#D0FE15] font-black text-sm shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer no-underline group"
                >
                  <span>Mulai Voting</span>
                  <span className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-white text-gray-900 flex items-center justify-center text-xs font-black transition-colors">
                    ↗
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => handleOpenCheckVoteModal()}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm shadow-sm transition-all cursor-pointer"
                >
                  <IconCheckVote className="w-4 h-4 text-[#D0FE15]" />
                  <span>Cek Bukti Suara</span>
                </button>
              </div>
            </div>

            {/* Kolom Kanan: Floating Showcase Card (seperti kartu pemandangan 01/10 di referensi foto) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-sm rounded-3xl backdrop-blur-xl bg-black/40 border border-white/20 p-5 shadow-2xl text-white space-y-4 relative">
                
                {/* Header Kartu Showcase */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#70B325]/80 text-white text-[10px] font-black tracking-wider uppercase backdrop-blur-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D0FE15] animate-ping" />
                    Live Voting
                  </span>
                  <span className="text-[11px] font-mono text-gray-300">
                    {backendCategories.length > 0 ? `0${heroSlideIndex + 1} / 0${backendCategories.length}` : '01 / 01'}
                  </span>
                </div>

                {/* Gambar / Visual Showcase */}
                <div className="h-44 rounded-2xl overflow-hidden relative border border-white/15 bg-black/30 group">
                  {showcaseItem?.thumbnail ? (
                    <img
                      src={resolveStorageUrl(showcaseItem.thumbnail)}
                      alt={showcaseItem.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#123E2A] to-[#1E231C] p-4 text-center">
                      <span className="text-3xl mb-1">🗳️</span>
                      <p className="text-xs font-bold text-gray-200">Ajang Pemilihan Aktif</p>
                    </div>
                  )}

                  {/* Gradient Overlay pada gambar */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  {/* Info di atas gambar */}
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <h3 className="text-sm font-extrabold text-white truncate">
                      {showcaseItem?.name || 'Ajang Pemilihan BEM 2026/2027'}
                    </h3>
                    <p className="text-[11px] text-[#D0FE15] font-semibold">
                      {showcaseItem?.finalists_count ? `${showcaseItem.finalists_count} Finalis Bersaing` : 'Voting Sedang Dibuka'}
                    </p>
                  </div>
                </div>

                {/* Slider bar & Navigasi Slide (seperti di referensi) */}
                <div className="flex items-center justify-between pt-1">
                  {/* Slider Progress Indicator */}
                  <div className="flex items-center gap-1.5">
                    {backendCategories.slice(0, 4).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setHeroSlideIndex(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          heroSlideIndex === idx ? 'w-6 bg-[#D0FE15]' : 'w-2 bg-white/30 hover:bg-white/50'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Tombol Lihat Ajang Ini */}
                  {showcaseItem ? (
                    <Link
                      to={`/voting/${showcaseItem.slug || showcaseItem.id}`}
                      className="inline-flex items-center gap-1 text-xs font-black text-white hover:text-[#D0FE15] transition-colors no-underline"
                    >
                      <span>Lihat Ajang</span>
                      <span className="text-sm">↗</span>
                    </Link>
                  ) : (
                    <a
                      href="#voting-section"
                      className="inline-flex items-center gap-1 text-xs font-black text-white hover:text-[#D0FE15] transition-colors no-underline"
                    >
                      <span>Jelajahi</span>
                      <span className="text-sm">↗</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 flex-1 w-full">
        
        {/* Category Filter Pills (dengan Dark Mode adaptif) */}
        <section className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Kategori Voting">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`filter-pill dark:bg-white/5 dark:text-gray-300 dark:border-white/10 dark:hover:bg-white/10 ${
                activeCategory === cat ? 'active' : ''
              }`}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Section 1: Voting Terpopuler & Cek Vote Kamu */}
        <section id="voting-section" className="space-y-4">
          
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <IconFlame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#262A25] dark:text-white">
                  Voting Terpopuler
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pilihan terbanyak minggu ini</p>
              </div>
            </div>
            <a
              href="#voting-section"
              className="text-xs sm:text-sm font-bold text-[#70B325] dark:text-[#86C839] hover:underline flex items-center gap-1 no-underline"
            >
              <span>Lihat Semua</span>
              <IconChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Grid Layout: 4 Cards on Left, Cek Vote Widget on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Voting Cards Grid (8 cols on lg) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredPopular.length === 0 ? (
                <div className="sm:col-span-2 py-16 px-6 text-center bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#F2F8EC] dark:bg-white/5 text-[#70B325] flex items-center justify-center mb-3">
                    <IconFlame className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#262A25] dark:text-white">Belum Ada Voting Aktif</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                    Saat ini belum ada event voting yang sedang dibuka. Kunjungi kembali dalam beberapa saat atau buat event dari dashboard admin.
                  </p>
                </div>
              ) : (
                filteredPopular.map((item) => {
                  const Banner = item.BannerComponent
                  return (
                    <article
                      key={item.id}
                      className="card-base flex flex-col overflow-hidden group bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl hover:border-[#70B325] dark:hover:border-[#70B325] transition-all"
                    >
                      {/* Banner Illustration or Uploaded Thumbnail */}
                      <div className="h-44 w-full relative overflow-hidden bg-gray-100 dark:bg-black/30 flex items-center justify-center">
                        {item.thumbnail ? (
                          <img
                            src={resolveStorageUrl(item.thumbnail)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <Banner />
                        )}
                        {/* Status Badge */}
                        <span className="absolute top-3 left-3 status-pill bg-white/90 dark:bg-black/75 backdrop-blur-xs border border-white/60 dark:border-white/10 shadow-xs text-gray-800 dark:text-gray-200">
                          <span className="status-dot" />
                          Sedang Berlangsung
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="font-extrabold text-sm sm:text-base text-[#262A25] dark:text-white group-hover:text-[#70B325] transition-colors line-clamp-2">
                            <Link
                              to={`/voting/${item.slug || item.id}`}
                              className="no-underline text-inherit hover:text-[#70B325]"
                            >
                              {item.title}
                            </Link>
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                            <span>{item.organizer}</span>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">{item.daysLeft}</span>
                          </p>
                        </div>

                        {/* Avatars Stack & Vote Count */}
                        <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-white/10">
                          <div className="flex items-center justify-between">
                            {/* Avatars */}
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {item.avatars.map((initials, idx) => (
                                <div
                                  key={idx}
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#1A2018] bg-[#E9F3DF] dark:bg-white/10 text-[#558223] dark:text-[#86C839] font-bold text-[10px] flex items-center justify-center"
                                >
                                  {initials}
                                </div>
                              ))}
                              {item.extraAvatars > 0 && (
                                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#1A2018] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-bold text-[10px] flex items-center justify-center">
                                  +{item.extraAvatars}
                                </div>
                              )}
                            </div>
                            {/* Vote Count */}
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {item.votes}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#70B325] h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* CTA Button */}
                        <Link
                          to={`/voting/${item.slug || item.id}`}
                          className="w-full mt-2 py-2 px-3 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-bold text-xs sm:text-sm rounded-xl text-center no-underline flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <span>Vote Sekarang</span>
                          <IconChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  )
                })
              )}
            </div>

            {/* Right Column: Cek Vote Kamu Card (4 cols on lg) */}
            <div className="lg:col-span-4" id="cek-vote-box">
              <div className="bg-gradient-to-b from-[#F2F9EC] to-[#EBF6E3] dark:from-[#1A2318] dark:to-[#141C12] border border-[#D7E8C8] dark:border-[#2C3529] rounded-2xl p-6 shadow-sm space-y-4 sticky top-24">
                
                {/* Header with Icon */}
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/10 text-[#70B325] shadow-xs flex items-center justify-center">
                  <IconCheckVote className="w-7 h-7 text-[#70B325]" />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-[#262A25] dark:text-white">
                    Cek Vote Kamu
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                    Masukkan kode transaksi atau ID voting untuk melihat hasil dan keabsahan suara kamu.
                  </p>
                </div>

                {/* Input & Form */}
                <form onSubmit={handleCheckVoteSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={checkVoteCode}
                      onChange={(e) => setCheckVoteCode(e.target.value)}
                      placeholder="Contoh: SVT-2025-001234"
                      className="w-full h-11 pl-9 pr-3 text-xs sm:text-sm bg-white dark:bg-black/30 border border-[#CADDB8] dark:border-white/15 rounded-xl text-[#262A25] dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#70B325] shadow-inner"
                      required
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <IconCheckVote className="w-4 h-4 text-[#70B325]" />
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Cek Sekarang</span>
                    <IconChevronRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Trust guarantee badge */}
                <div className="pt-3 border-t border-[#D5E6C4] dark:border-white/10 flex items-center justify-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#70B325]" />
                  <span>Sistem e-voting terenkripsi &amp; transparan</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 2: Voting Terbaru */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <IconClock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#262A25] dark:text-white">
                  Voting Terbaru
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Jangan lewatkan voting terbaru yang sedang dibuka
                </p>
              </div>
            </div>
            <a
              href="#voting-section"
              className="text-xs sm:text-sm font-bold text-[#70B325] dark:text-[#86C839] hover:underline flex items-center gap-1 no-underline"
            >
              <span>Lihat Semua</span>
              <IconChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Horizontal Cards Grid or Empty State */}
          {filteredRecent.length === 0 ? (
            <div className="py-8 px-6 text-center bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Belum ada voting terbaru saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredRecent.map((item) => {
                const IconComp = item.IconComponent
                return (
                  <Link
                    key={item.id}
                    to={`/voting/${item.slug || item.id}`}
                    className="card-base p-4 bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-2xl flex items-center gap-3.5 hover:border-[#70B325] dark:hover:border-[#70B325] transition-all group no-underline text-inherit cursor-pointer"
                  >
                    {item.thumbnail ? (
                      <img
                        src={resolveStorageUrl(item.thumbnail)}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover border border-[#E5EADF] dark:border-white/10 flex-shrink-0"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <IconComp className="w-12 h-12 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#558223] dark:text-[#86C839] bg-[#F2F8EC] dark:bg-white/10 px-2 py-0.5 rounded-full mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#70B325]" />
                        Sedang Berlangsung
                      </span>
                      <h3 className="font-extrabold text-xs sm:text-sm text-[#262A25] dark:text-white group-hover:text-[#70B325] transition-colors truncate">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {item.organizer} • {item.daysLeft}
                      </p>
                      <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mt-1">
                        {item.votes}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
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
