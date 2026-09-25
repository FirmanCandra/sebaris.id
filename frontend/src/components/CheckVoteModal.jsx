import { useState } from 'react'
import { IconClose, IconCheck, IconSearch, IconCheckVote } from './Icons'

export default function CheckVoteModal({ isOpen, onClose, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  if (!isOpen) return null

  function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)

    // Simulate checking against the vote database
    setTimeout(() => {
      // Mock verified transaction if query matches pattern or contact
      const isSample = query.toLowerCase().includes('svt') || query.includes('08') || query.length >= 4
      if (isSample) {
        setResult({
          valid: true,
          receiptCode: query.toUpperCase().startsWith('SVT-') ? query.toUpperCase() : `SVT-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          voterName: 'Voter Terverifikasi',
          contact: query.includes('@') ? query : query.includes('08') ? query : '0812****889',
          event: 'Pemilihan Ketua OSIS SMA Nusantara 1',
          category: 'Ketua & Wakil Ketua OSIS',
          finalist: 'Kandidat 02 - Ananda & Bima',
          type: 'Vote Gratis (1x)',
          status: 'Terhitung & Terverifikasi',
          timestamp: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        })
      } else {
        setResult({
          valid: false,
          message: 'Data vote tidak ditemukan untuk kode transaksi atau kontak tersebut. Pastikan format sudah benar.',
        })
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="check-vote-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
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
              placeholder="Contoh: SVT-2025-001234 atau 081234567890"
              className="w-full h-11 pl-10 pr-24 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#70B325] focus:outline-none"
              required
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <IconSearch className="w-4 h-4" />
            </span>
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-[#70B325] hover:bg-[#5F9A1E] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              {loading ? 'Mengecek...' : 'Cari'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            Tips: Masukkan nomor HP/email yang Anda gunakan saat memberi suara.
          </p>
        </form>

        {/* Verification Result */}
        {searched && (
          <div className="border-t border-gray-100 pt-4">
            {result?.valid ? (
              <div className="bg-[#F8FAF7] border border-[#E1ECD7] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#558223] bg-[#E9F4DE] px-2.5 py-1 rounded-full">
                    <IconCheck className="w-3.5 h-3.5" />
                    {result.status}
                  </span>
                  <span className="font-mono text-xs font-bold text-gray-600">
                    {result.receiptCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Event</span>
                    <span className="font-semibold text-gray-800">{result.event}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Kategori</span>
                    <span className="font-semibold text-gray-800">{result.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Pilihan Finalis</span>
                    <span className="font-bold text-[#70B325]">{result.finalist}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Jenis & Waktu</span>
                    <span className="font-semibold text-gray-700">{result.type}</span>
                    <span className="text-[10px] text-gray-400 block">{result.timestamp}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-gray-200 text-center">
                  <p className="text-[11px] text-gray-500">
                    Suara Anda telah tercatat permanen di sistem audit sebaris.id.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-amber-800">
                  {result?.message}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
