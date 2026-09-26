import { useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { IconClose } from './Icons'

export default function AdjustVoteModal({ isOpen, onClose, finalist, onSuccess }) {
  const { token } = useAuth()
  const [voteCount, setVoteCount] = useState(() => finalist?.vote_count ?? 0)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !finalist) return null

  const currentCount = finalist.vote_count ?? 0
  const diff = Number(voteCount) - currentCount

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await api(`/admin/finalists/${finalist.id}/adjust-votes`, {
        method: 'PATCH',
        token,
        body: {
          vote_count: Math.max(0, parseInt(voteCount) || 0),
          reason: reason || null,
        },
      })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal mengubah perolehan suara')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 relative my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <IconClose className="w-5 h-5" />
        </button>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              Koreksi Manual
            </span>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1">
              Sesuaikan / Reset Perolehan Suara
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Gunakan fitur ini jika terdapat data anomali atau permintaan audit resmi penyelenggara.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Candidate Info Box */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Nama Finalis:</span>
              <strong className="text-gray-900 dark:text-white font-black">{finalist.name}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Suara Saat Ini:</span>
              <span className="font-extrabold text-[#70B325]">
                {currentCount.toLocaleString('id-ID')} suara
              </span>
            </div>
          </div>

          {/* New Vote Count Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Jumlah Suara Baru:
            </label>
            <input
              type="number"
              min="0"
              required
              value={voteCount}
              onChange={(e) => setVoteCount(e.target.value)}
              className="w-full h-11 px-3.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-[#70B325] focus:outline-none font-bold"
            />

            {/* Quick Adjustment Helpers */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setVoteCount(0)}
                className="py-1 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold border border-red-200 cursor-pointer"
              >
                Reset ke 0
              </button>
              <button
                type="button"
                onClick={() => setVoteCount(Math.max(0, currentCount - 100))}
                className="py-1 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-bold cursor-pointer"
              >
                -100
              </button>
              <button
                type="button"
                onClick={() => setVoteCount(currentCount + 100)}
                className="py-1 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-bold cursor-pointer"
              >
                +100
              </button>
              <button
                type="button"
                onClick={() => setVoteCount(currentCount + 500)}
                className="py-1 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-bold cursor-pointer"
              >
                +500
              </button>
            </div>

            {diff !== 0 && (
              <p className="text-[11px] font-semibold text-gray-500 pt-0.5">
                Perubahan: {diff > 0 ? `+${diff}` : diff} suara
              </p>
            )}
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Alasan Penyesuaian (Opsional):
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Koreksi pembayaran terduplikasi / rekonsiliasi panitia"
              className="w-full p-2.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:border-[#70B325] focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-5 rounded-xl bg-[#70B325] hover:bg-[#5E9B1F] text-white text-xs font-bold transition-all shadow-xs disabled:bg-gray-300 cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Terapkan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
