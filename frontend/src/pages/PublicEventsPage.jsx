import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, resolveStorageUrl } from '../api/client'
import PublicHeader from '../components/PublicHeader'
import HeroIllustration from '../components/HeroIllustration'
import CheckVoteModal from '../components/CheckVoteModal'
import SebarisLogo from '../components/SebarisLogo'
import {
  IconSearch,
  IconFlame,
  IconClock,
  IconCalendar,
  IconCheckVote,
  IconChevronRight,
  IconLocation,
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

// Initial fallback/reference items from the mockup
const POPULAR_VOTINGS_DATA = [
  {
    id: 1,
    title: 'Pemilihan Ketua OSIS SMA Nusantara 1',
    organizer: 'SMA Nusantara 1',
    daysLeft: '3 hari lagi',
    category: 'Sekolah',
    votes: '2.843',
    percentage: 56,
    BannerComponent: BannerSchool,
    avatars: ['AN', 'BM', 'CR'],
    extraAvatars: 1,
  },
  {
    id: 2,
    title: 'Ketua BEM Universitas Merdeka 2025',
    organizer: 'Universitas Merdeka',
    daysLeft: '5 hari lagi',
    category: 'Kampus',
    votes: '5.120',
    percentage: 68,
    BannerComponent: BannerCampus,
    avatars: ['FR', 'DY', 'AL'],
    extraAvatars: 2,
  },
  {
    id: 3,
    title: 'Favorit Stand UMKM Festival Desa Maju',
    organizer: 'Desa Maju',
    daysLeft: '2 hari lagi',
    category: 'Komunitas',
    votes: '1.372',
    percentage: 42,
    BannerComponent: BannerFestival,
    avatars: ['KT', 'ST', 'WN'],
    extraAvatars: 1,
  },
  {
    id: 4,
    title: 'Desain Poster Terbaik HUT RI ke-80',
    organizer: 'Karang Taruna Suka Maju',
    daysLeft: '6 hari lagi',
    category: 'Organisasi',
    votes: '892',
    percentage: 37,
    BannerComponent: BannerPoster,
    avatars: ['RT', 'BL', 'HN'],
    extraAvatars: 1,
  },
]

const RECENT_VOTINGS_DATA = [
  {
    id: 101,
    title: 'Pemilihan Logo Komunitas Peduli Bumi',
    organizer: 'Komunitas Peduli Bumi',
    daysLeft: '4 hari lagi',
    category: 'Komunitas',
    votes: '934 suara',
    IconComponent: ThumbnailEarth,
  },
  {
    id: 102,
    title: 'Lomba Inovasi Mahasiswa Teknologi 2025',
    organizer: 'Politeknik Harapan',
    daysLeft: '5 hari lagi',
    category: 'Kampus',
    votes: '1.892 suara',
    IconComponent: ThumbnailTech,
  },
  {
    id: 103,
    title: 'Vote Lagu Favorit Acara Kampus',
    organizer: 'BEM Politeknik',
    daysLeft: '3 hari lagi',
    category: 'Kampus',
    votes: '1.457 suara',
    IconComponent: ThumbnailMusic,
  },
  {
    id: 104,
    title: 'Foto Terbaik Alam Indonesia',
    organizer: 'Komunitas Fotografi',
    daysLeft: '6 hari lagi',
    category: 'Komunitas',
    votes: '623 suara',
    IconComponent: ThumbnailCamera,
  },
]

const RECOMMENDED_EVENTS_DATA = [
  {
    id: 201,
    title: 'Seminar Kepemimpinan Pemuda',
    date: '12',
    monthYear: 'Okt 2025',
    location: 'Aula Universitas Merdeka',
    tags: ['Seminar', 'Kampus'],
    bgGrad: 'from-amber-500 to-amber-700',
  },
  {
    id: 202,
    title: 'Festival Musik Pelajar',
    date: '18',
    monthYear: 'Okt 2025',
    location: 'Lapangan Desa Maju',
    tags: ['Festival', 'Komunitas'],
    bgGrad: 'from-emerald-500 to-teal-700',
  },
  {
    id: 203,
    title: 'Workshop Desain Grafis',
    date: '25',
    monthYear: 'Okt 2025',
    location: 'Gedung Kreatif Nusantara',
    tags: ['Workshop', 'Organisasi'],
    bgGrad: 'from-blue-500 to-indigo-700',
  },
  {
    id: 204,
    title: 'Turnamen Futsal Antar Kampus',
    date: '02',
    monthYear: 'Nov 2025',
    location: 'GOR Wijaya Kusuma',
    tags: ['Olahraga', 'Kampus'],
    bgGrad: 'from-sky-500 to-blue-700',
  },
]

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

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#262A25] flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <PublicHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCheckVote={() => handleOpenCheckVoteModal()}
      />

      {/* Hero Section (Matching exact visual in reference image) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F2F8EE] via-[#F6FAF2] to-[#F8FAF7] pt-8 pb-14 lg:pt-14 lg:pb-20 border-b border-[#E8ECE4]">
        {/* Soft decorative background waves */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#EAF5E1]/60 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E5F2D9] text-[#4F7E1D] font-bold text-xs tracking-wide">
                <IconZap className="w-3.5 h-3.5 text-[#70B325]" />
                <span>Platform Voting & Event Online</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#262A25] leading-tight">
                Pilih. Dukung.
                <br />
                <span className="text-[#70B325]">Menang Bersama.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
                sebaris.id adalah platform e-voting yang aman, mudah, dan transparan untuk berbagai kebutuhan, mulai dari pemilihan ketua, lomba, hingga ajang favorit pilihan komunitasmu.
              </p>

              {/* Hero Search Box & CTA */}
              <div className="pt-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const target = document.getElementById('voting-section')
                    if (target) target.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg bg-white p-2 rounded-2xl shadow-md border border-[#E5EADF]"
                >
                  <div className="relative flex-1 flex items-center">
                    <span className="absolute left-3.5 text-gray-400">
                      <IconSearch className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari voting atau event..."
                      className="w-full h-11 pl-10 pr-3 text-sm bg-transparent text-[#262A25] placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-11 px-6 bg-[#70B325] hover:bg-[#5F9A1E] active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <span>Mulai Voting</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Hero Graphic: Candidate ballot card & 3D box */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 flex-1 w-full">
        {/* Category Filter Pills */}
        <section className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Kategori Voting">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`filter-pill ${activeCategory === cat ? 'active' : ''}`}
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
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <IconFlame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#262A25]">
                  Voting Terpopuler
                </h2>
                <p className="text-xs text-gray-500">Pilihan terbanyak minggu ini</p>
              </div>
            </div>
            <a
              href="#voting-section"
              className="text-xs sm:text-sm font-bold text-[#70B325] hover:text-[#5F9A1E] flex items-center gap-1 no-underline"
            >
              <span>Lihat Semua</span>
              <IconChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Grid Layout: 4 Cards on Left, Cek Vote Widget on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Voting Cards Grid (8 cols on lg) */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredPopular.map((item) => {
                const Banner = item.BannerComponent
                return (
                  <article
                    key={item.id}
                    className="card-base flex flex-col overflow-hidden group bg-white border border-[#E5EADF] rounded-2xl hover:border-[#70B325] transition-all"
                  >
                    {/* Banner Illustration or Uploaded Thumbnail */}
                    <div className="h-44 w-full relative overflow-hidden bg-gray-100 flex items-center justify-center">
                      {item.thumbnail ? (
                        <img
                          src={resolveStorageUrl(item.thumbnail)}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <Banner />
                      )}
                      {/* Status Badge */}
                      <span className="absolute top-3 left-3 status-pill bg-white/90 backdrop-blur-xs border border-white/60 shadow-xs">
                        <span className="status-dot" />
                        Sedang Berlangsung
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-[#262A25] group-hover:text-[#70B325] transition-colors line-clamp-2">
                          <Link
                            to={`/categories/${item.id}`}
                            className="no-underline text-inherit hover:text-[#70B325]"
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <span>{item.organizer}</span>
                          <span>•</span>
                          <span className="text-amber-600 font-semibold">{item.daysLeft}</span>
                        </p>
                      </div>

                      {/* Avatars Stack & Vote Count */}
                      <div className="space-y-2 pt-1 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          {/* Avatars */}
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {item.avatars.map((initials, idx) => (
                              <div
                                key={idx}
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-[#E9F3DF] text-[#558223] font-bold text-[10px] flex items-center justify-center"
                              >
                                {initials}
                              </div>
                            ))}
                            {item.extraAvatars > 0 && (
                              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 text-gray-600 font-bold text-[10px] flex items-center justify-center">
                                +{item.extraAvatars}
                              </div>
                            )}
                          </div>
                          {/* Vote Count */}
                          <span className="text-xs font-bold text-gray-700">
                            {item.votes}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#70B325] h-full rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Link
                        to={`/categories/${item.id}`}
                        className="w-full mt-2 py-2 px-3 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-bold text-xs sm:text-sm rounded-xl text-center no-underline flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <span>Vote Sekarang</span>
                        <IconChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Right Column: Cek Vote Kamu Card (4 cols on lg) */}
            <div className="lg:col-span-4" id="cek-vote-box">
              <div className="bg-gradient-to-b from-[#F2F9EC] to-[#EBF6E3] border border-[#D7E8C8] rounded-2xl p-6 shadow-sm space-y-4 sticky top-24">
                {/* Header with Icon */}
                <div className="w-12 h-12 rounded-xl bg-white text-[#70B325] shadow-xs flex items-center justify-center">
                  <IconCheckVote className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-[#262A25]">
                    Cek Vote Kamu
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Masukkan kode transaksi atau ID voting untuk melihat hasil suara kamu.
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
                      className="w-full h-11 pl-9 pr-3 text-xs sm:text-sm bg-white border border-[#CADDB8] rounded-xl text-[#262A25] placeholder-gray-400 focus:outline-none focus:border-[#70B325] shadow-inner"
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
                <div className="pt-3 border-t border-[#D5E6C4] flex items-center justify-center gap-2 text-[11px] text-gray-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#70B325]" />
                  <span>Sistem e-voting terenkripsi & transparan</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Voting Terbaru */}
        <section className="space-y-4 pt-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IconClock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#262A25]">
                  Voting Terbaru
                </h2>
                <p className="text-xs text-gray-500">
                  Jangan lewatkan voting terbaru yang sedang dibuka
                </p>
              </div>
            </div>
            <a
              href="#voting-section"
              className="text-xs sm:text-sm font-bold text-[#70B325] hover:text-[#5F9A1E] flex items-center gap-1 no-underline"
            >
              <span>Lihat Semua</span>
              <IconChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* 4 Compact Horizontal Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredRecent.map((item) => {
              const IconComp = item.IconComponent
              return (
                <Link
                  key={item.id}
                  to={`/categories/${item.id}`}
                  className="card-base p-4 bg-white border border-[#E5EADF] rounded-2xl flex items-center gap-3.5 hover:border-[#70B325] transition-all group no-underline text-inherit cursor-pointer"
                >
                  {item.thumbnail ? (
                    <img
                      src={resolveStorageUrl(item.thumbnail)}
                      alt={item.title}
                      className="w-12 h-12 rounded-xl object-cover border border-[#E5EADF] flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <IconComp className="w-12 h-12 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#558223] bg-[#F2F8EC] px-2 py-0.5 rounded-full mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#70B325]" />
                      Sedang Berlangsung
                    </span>
                    <h3 className="font-extrabold text-xs sm:text-sm text-[#262A25] group-hover:text-[#70B325] transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {item.organizer} • {item.daysLeft}
                    </p>
                    <p className="text-[11px] font-bold text-gray-700 mt-1">
                      {item.votes}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Section 3: Event Rekomendasi */}
        <section id="events-section" className="space-y-4 pt-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <IconCalendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#262A25]">
                  Event Rekomendasi
                </h2>
                <p className="text-xs text-gray-500">
                  Ikuti event menarik dan jangan sampai ketinggalan
                </p>
              </div>
            </div>
            <a
              href="#events-section"
              className="text-xs sm:text-sm font-bold text-[#70B325] hover:text-[#5F9A1E] flex items-center gap-1 no-underline"
            >
              <span>Lihat Semua</span>
              <IconChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECOMMENDED_EVENTS_DATA.map((event) => (
              <article
                key={event.id}
                className="card-base p-4 bg-white border border-[#E5EADF] rounded-2xl flex flex-col justify-between space-y-3 hover:border-[#70B325] transition-all group"
              >
                <div className="flex items-start gap-3">
                  {/* Date Badge Box */}
                  <div className="w-13 h-14 rounded-xl bg-[#F4F9EE] border border-[#D5E6C4] flex flex-col items-center justify-center text-center flex-shrink-0">
                    <span className="text-base font-extrabold text-[#70B325] leading-none">
                      {event.date}
                    </span>
                    <span className="text-[10px] font-bold text-gray-600 uppercase mt-0.5">
                      {event.monthYear}
                    </span>
                  </div>

                  {/* Title & Location */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-xs sm:text-sm text-[#262A25] group-hover:text-[#70B325] transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 truncate">
                      <IconLocation className="w-3 h-3 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{event.location}</span>
                    </p>
                  </div>
                </div>

                {/* Footer Tags & Round Arrow Button */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const firstEvt = backendEvents[0]
                      if (firstEvt) navigate(`/events/${firstEvt.id}`)
                    }}
                    className="w-7 h-7 rounded-full bg-[#F4F9EE] text-[#70B325] hover:bg-[#70B325] hover:text-white flex items-center justify-center transition-colors cursor-pointer border-none"
                    aria-label={`Lihat detail ${event.title}`}
                  >
                    <IconChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Brand Footer */}
      <footer className="mt-16 bg-white border-t border-[#E5EADF] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <SebarisLogo size="sm" />
            <p className="text-xs text-gray-500 max-w-sm">
              Platform e-voting online terpercaya untuk pemilihan sekolah, kampus, organisasi, dan komunitas di Indonesia.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-gray-600">
            <a href="/#voting-section" className="hover:text-[#70B325] transition-colors">
              Voting Aktif
            </a>
            <a href="/#events-section" className="hover:text-[#70B325] transition-colors">
              Event
            </a>
            <button
              type="button"
              onClick={() => handleOpenCheckVoteModal()}
              className="hover:text-[#70B325] transition-colors bg-transparent border-none cursor-pointer"
            >
              Cek Suara
            </button>
            <Link to="/login" className="hover:text-[#70B325] transition-colors font-bold text-[#70B325]">
              Ruang Admin
            </Link>
          </div>

          <div className="text-xs text-gray-400 text-center md:text-right">
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
