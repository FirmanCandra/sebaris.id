import { useState } from 'react'
import { IconClose, IconCheck, IconSearch, IconCheckVote } from './Icons'
import { api } from '../api/client'
import EReceiptModal from './EReceiptModal'

export default function CheckVoteModal({ isOpen, onClose, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  if (!isOpen) return null

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const res = await api(`/votes/check?query=${encodeURIComponent(query.trim())}`)
      setResults(res.data || [])
    } catch {
      // Graceful fallback for demo
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="check-vote-title"
      >
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Tutup dialog"
          >
            <IconClose className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#F4F9EE] text-[#70B325] flex items-center justify-center flex-shrink-0">
              <IconCheckVote className="w-6 h-6" />
            </div>
            <div>
              <h2 id="check-vote-title" className="text-lg font-extrabold text-[#262A25]">
                Cek Suara & Riwayat Vote
              </h2>
              <p className="text-xs text-gray-500">
                Verifikasi keaslian dan status suara Anda di platform sebaris.id
              </p>
            </div>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearch} className="space-y-3 mb-5">
            <label htmlFor="vote-query-input" className="block text-xs font-bold text-gray-700">
              ID Voting, Kode Transaksi, atau Nomor Kontak
            </label>
            <div className="relative">
              <input
                id="vote-query-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Contoh: SVT-2026-001234 atau 081234567890"
                className="w-full h-11 pl-10 pr-24 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#70B325] focus:outline-none"
                required
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <IconSearch className="w-4 h-4" />
              </span>
              <button
                type="submit"
                disabled={loading}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-[#70B325] hover:bg-[#5F9A1E] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                {loading ? 'Mengecek...' : 'Cari'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Tips: Masukkan nomor HP/email yang Anda gunakan saat memberi suara.
            </p>
          </form>

          {/* Verification Results */}
          {searched && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              {results.length > 0 ? (
                results.map((vote) => (
                  <div
                    key={vote.id}
                    className="bg-[#F8FAF7] border border-[#E1ECD7] rounded-2xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#558223] bg-[#E9F4DE] px-2.5 py-1 rounded-full">
                        <IconCheck className="w-3.5 h-3.5" />
                        {vote.status === 'confirmed' ? 'Terverifikasi & Sah' : 'Menunggu Pembayaran'}
                      </span>
                      <span className="font-mono text-xs font-black text-gray-700">
                        {vote.reference_id || `SVT-${vote.id}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Ajang / Sesi</span>
                        <span className="font-semibold text-gray-800">
                          {vote.finalist?.category_name || 'Voting Sebaris.id'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Kandidat Pilihan</span>
                        <span className="font-black text-[#70B325]">
                          {vote.finalist?.name || 'Kandidat'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Jumlah Suara</span>
                        <span className="font-bold text-gray-800">
                          +{vote.vote_amount} Suara ({vote.type === 'free' ? 'Gratis' : 'Berbayar'})
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Waktu Transaksi</span>
                        <span className="text-gray-600">
                          {vote.created_at ? new Date(vote.created_at).toLocaleDateString('id-ID') : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-dashed border-gray-200 flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 font-mono">
                        {vote.voter_name} ({vote.voter_contact})
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(vote)}
                        className="text-xs font-bold text-[#70B325] hover:underline cursor-pointer"
                      >
                        Lihat E-Receipt 📄
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-1">
                  <p className="text-xs font-bold text-amber-900">
                    Data voting tidak ditemukan
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Tidak ditemukan catatan vote untuk kata kunci "{query}". Pastikan nomor HP/Email atau Kode Transaksi sudah tepat.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Embedded E-Receipt Viewer */}
      {selectedReceipt && (
        <EReceiptModal
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
          data={{
            ...selectedReceipt,
            finalist_name: selectedReceipt.finalist?.name,
            category_name: selectedReceipt.finalist?.category_name,
          }}
        />
      )}
    </>
  )
}
