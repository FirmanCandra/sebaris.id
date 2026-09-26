import { useParams, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { api, resolveStorageUrl } from '../api/client'
import CommercialVoteModal from '../components/CommercialVoteModal'
import FinalistDetailModal from '../components/FinalistDetailModal'
import EReceiptModal from '../components/EReceiptModal'
import { IconZap, IconSearch, IconTrophy } from '../components/Icons'

export default function EmbedVotingPage() {
  const { categoryId } = useParams()
  const [searchParams] = useSearchParams()

  const [category, setCategory] = useState(null)
  const [finalists, setFinalists] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals
  const [selectedFinalistForVote, setSelectedFinalistForVote] = useState(null)
  const [selectedFinalistForDetail, setSelectedFinalistForDetail] = useState(null)
  const [eReceiptData, setEReceiptData] = useState(null)

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
      setError(err.message || 'Gagal memuat sesi voting')
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    loadData()
    const interval = window.setInterval(loadData, 10000)
    return () => window.clearInterval(interval)
  }, [loadData])

  const totalVotes = finalists.reduce((acc, curr) => acc + (curr.vote_count || 0), 0)

  const filteredFinalists = finalists.filter((f) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q))
  })

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-gray-400 font-sans">
        <div className="w-8 h-8 border-3 border-[#70B325] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold">Memuat widget voting...</span>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center p-6 text-center font-sans">
        <span className="text-sm font-bold text-red-600 mb-1">Voting tidak tersedia</span>
        <span className="text-xs text-gray-500">{error || 'Data kategori tidak ditemukan.'}</span>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-transparent font-sans text-gray-900 max-w-5xl mx-auto">
      {/* Widget Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#70B325] bg-[#EAF5DE] px-2 py-0.5 rounded-full">
              {category.organizer || 'Official Voting'}
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              Total {totalVotes.toLocaleString('id-ID')} Suara
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-1">
            {category.name}
          </h2>
        </div>

        {/* Search Candidate */}
        <div className="relative max-w-xs w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <IconSearch className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kandidat..."
            className="w-full h-9 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#70B325]"
          />
        </div>
      </div>

      {/* Finalists Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredFinalists.map((finalist, idx) => {
          const photoSrc = finalist.photo_url || finalist.photo
          const pct = totalVotes > 0 ? Math.round((finalist.vote_count / totalVotes) * 100) : 0

          return (
            <div
              key={finalist.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              {/* Photo Box */}
              <div
                onClick={() => setSelectedFinalistForDetail(finalist)}
                className="relative aspect-[4/5] bg-gray-100 cursor-pointer overflow-hidden"
              >
                {photoSrc ? (
                  <img
                    src={resolveStorageUrl(photoSrc)}
                    alt={finalist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-gray-400 text-lg">
                    {finalist.name.slice(0, 2).toUpperCase()}
                  </div>
                )}

                {/* Rank Badge */}
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-amber-300 flex items-center gap-1">
                    <IconTrophy className="w-2.5 h-2.5" />
                    #{idx + 1}
                  </span>
                </div>

                {/* Multi-photo badge if available */}
                {Array.isArray(finalist.extra_photos) && finalist.extra_photos.length > 0 && (
                  <div className="absolute bottom-2 right-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] font-bold text-white">
                      📷 +{finalist.extra_photos.length}
                    </span>
                  </div>
                )}
              </div>

              {/* Info & Action */}
              <div className="p-3 space-y-2">
                <div>
                  <h3
                    onClick={() => setSelectedFinalistForDetail(finalist)}
                    className="font-extrabold text-xs sm:text-sm text-gray-900 truncate cursor-pointer hover:text-[#70B325]"
                    title={finalist.name}
                  >
                    {finalist.name}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] mt-0.5">
                    <span className="font-bold text-[#70B325]">
                      {category.freeze_leaderboard
                        ? '🔒 Tersembunyi'
                        : `${(finalist.vote_count || 0).toLocaleString('id-ID')} suara`}
                    </span>
                    {!category.freeze_leaderboard && (
                      <span className="text-gray-400 font-semibold">{pct}%</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFinalistForVote(finalist)}
                  className="w-full py-2 px-3 bg-[#70B325] hover:bg-[#5E9B1F] text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <IconZap className="w-3.5 h-3.5 text-white" />
                  <span>Vote</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Powered by Sebaris Footer */}
      <div className="pt-4 mt-6 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-400">
        <span>Powered by <strong className="text-gray-600">Sebaris.id</strong> E-Voting</span>
        <a
          href={`/categories/${category.slug || category.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#70B325] font-bold hover:underline no-underline"
        >
          Buka Halaman Lengkap ↗
        </a>
      </div>

      {/* Voting Modal */}
      {selectedFinalistForVote && (
        <CommercialVoteModal
          isOpen={Boolean(selectedFinalistForVote)}
          onClose={() => setSelectedFinalistForVote(null)}
          finalist={selectedFinalistForVote}
          category={category}
          onVoteSuccess={(data) => {
            setEReceiptData(data)
            loadData()
          }}
        />
      )}

      {/* Finalist Detail Modal */}
      {selectedFinalistForDetail && (
        <FinalistDetailModal
          isOpen={Boolean(selectedFinalistForDetail)}
          onClose={() => setSelectedFinalistForDetail(null)}
          finalist={selectedFinalistForDetail}
          category={category}
          totalVotes={totalVotes}
          rank={finalists.findIndex((f) => f.id === selectedFinalistForDetail.id) + 1}
          onOpenVote={(f) => setSelectedFinalistForVote(f)}
          isVotingExpired={false}
        />
      )}

      {/* E-Receipt Modal */}
      {eReceiptData && (
        <EReceiptModal
          isOpen={Boolean(eReceiptData)}
          onClose={() => setEReceiptData(null)}
          receiptData={eReceiptData}
        />
      )}
    </div>
  )
}
