import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import PublicHeader from '../components/PublicHeader'
import { IconChevronRight, IconLayers, IconCalendar } from '../components/Icons'

export default function PublicCategoriesPage() {
  const { eventId } = useParams()
  const [categories, setCategories] = useState([])
  const [eventName, setEventName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Fetch categories for this event
    api(`/events/${eventId}/categories`)
      .then(({ data }) => {
        setCategories(data)
        if (data.length > 0 && data[0].event) {
          setEventName(data[0].event.name)
        }
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [eventId])

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#262A25] flex flex-col font-sans">
      <PublicHeader />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#F2F8EE] to-[#F8FAF7] py-8 sm:py-12 border-b border-[#E8ECE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Link to="/" className="hover:text-[#70B325] transition-colors no-underline">
              Beranda
            </Link>
            <IconChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[#262A25] font-bold">
              {eventName || `Event #${eventId}`}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F2D9] text-[#4F7E1D] font-bold text-xs tracking-wide mb-2">
                <IconCalendar className="w-3.5 h-3.5 text-[#70B325]" />
                Voting Terbuka
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#262A25]">
                {eventName || 'Daftar Kategori Voting'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
                Pilih kategori untuk melihat finalis dan berikan suara Anda. Setiap kontak memiliki 1 kesempatan vote gratis.
              </p>
            </div>
            
            <Link
              to="/"
              className="btn-secondary self-start sm:self-center text-xs font-bold"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full" aria-live="polite">
        {loading && (
          <div className="p-12 text-center text-gray-500">
            <div className="w-8 h-8 border-3 border-[#70B325] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Memuat kategori event...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center max-w-md mx-auto my-8">
            <p className="text-sm font-bold">{error}</p>
            <Link to="/" className="inline-block mt-3 text-xs font-bold underline">
              Kembali ke daftar event
            </Link>
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="bg-white border border-[#E5EADF] rounded-2xl p-10 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[#F4F9EE] text-[#70B325] flex items-center justify-center mx-auto mb-3">
              <IconLayers className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-extrabold text-[#262A25]">Belum Ada Kategori</h2>
            <p className="text-xs text-gray-500 mt-1">
              Penyelenggara belum menambahkan kategori pada event ini.
            </p>
            <Link to="/" className="btn-primary mt-4 text-xs font-bold">
              Lihat Event Lain
            </Link>
          </div>
        )}

        {!loading && !error && categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/categories/${category.id}`}
                className="card-base p-6 bg-white border border-[#E5EADF] rounded-2xl hover:border-[#70B325] transition-all no-underline group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="status-pill">
                      <span className="status-dot" />
                      Aktif
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      {category.finalists_count ?? 0} Finalis
                    </span>
                  </div>

                  <h2 className="text-lg font-extrabold text-[#262A25] group-hover:text-[#70B325] transition-colors">
                    {category.name}
                  </h2>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#70B325] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Lihat Finalis & Vote
                    <IconChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-[#E5EADF] py-6 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} sebaris.id. Hak cipta dilindungi.</p>
      </footer>
    </div>
  )
}
