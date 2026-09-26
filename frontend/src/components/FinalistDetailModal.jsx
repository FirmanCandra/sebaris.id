import { useState } from 'react'
import { IconClose, IconZap, IconTrophy } from './Icons'
import { resolveStorageUrl } from '../api/client'

export default function FinalistDetailModal({
  isOpen,
  onClose,
  finalist,
  category,
  totalVotes = 0,
  rank = 1,
  onOpenVote,
  isVotingExpired = false,
}) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !finalist) return null

  const photoSrc = finalist.photo_url || finalist.photo
  const percentage =
    totalVotes > 0 ? Math.round((finalist.vote_count / totalVotes) * 100) : 0

  function handleShareWhatsApp() {
    const directUrl = `${window.location.origin}/categories/${category?.slug || category?.id}?finalist=${finalist.id}`
    const text = `Halo! Yuk dukung kandidat *${finalist.name}* di ajang *${category?.name || 'Voting'}* melalui sebaris.id! 🌟\n\nKlik link ini untuk beri vote secara langsung:\n${directUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function handleCopyLink() {
    const directUrl = `${window.location.origin}/categories/${category?.slug || category?.id}?finalist=${finalist.id}`
    navigator.clipboard.writeText(directUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 relative my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-white/90 hover:text-white bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-xs transition-colors"
        >
          <IconClose className="w-5 h-5" />
        </button>

        {/* Top Header & Poster Card Header */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-gradient-to-b from-[#133E2B] via-[#0E2F20] to-[#0A1F16] flex items-center justify-center p-6 overflow-hidden">
          <div className="absolute inset-0 bg-radial from-emerald-500/20 via-transparent to-transparent pointer-events-none" />

          {/* Rank Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/50 backdrop-blur-xs border border-white/20 text-amber-300 font-black text-xs">
              <IconTrophy className="w-3.5 h-3.5" />
              <span>Peringkat #{rank}</span>
            </span>
          </div>

          {/* Candidate Photo */}
          <div className="relative z-10 flex items-center justify-center">
            {photoSrc ? (
              <img
                src={resolveStorageUrl(photoSrc)}
                alt={finalist.name}
                className="w-36 h-44 sm:w-40 sm:h-48 object-cover object-top rounded-2xl shadow-2xl border-2 border-amber-300/50"
              />
            ) : (
              <div className="w-36 h-44 sm:w-40 sm:h-48 rounded-2xl bg-emerald-950/70 border border-emerald-700/50 flex flex-col items-center justify-center text-center p-4">
                <div className="w-16 h-16 rounded-full bg-[#70B325]/20 text-[#70B325] flex items-center justify-center font-black text-2xl mb-2">
                  {finalist.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-gray-300">Foto Resmi</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Identity & Category */}
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#70B325] block">
              {category?.name || 'Ajang Voting'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#262A25]">
              {finalist.name}
            </h2>
            <p className="text-xs font-semibold text-gray-500">
              {category?.organizer ? `Penyelenggara: ${category.organizer}` : 'Kandidat Resmi'}
            </p>
          </div>

          {/* Live Vote Stats Bar */}
          <div className="p-4 bg-[#F8FAF7] border border-[#E5EADF] rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#262A25]">
                {finalist.vote_count.toLocaleString('id-ID')} Suara Sah
              </span>
              <span className="font-black text-[#70B325]">
                {percentage}% dari total suara
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#70B325] h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Biography / Advocacy / Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
              Profil & Advokasi Finalis
            </h4>
            <div className="text-xs sm:text-sm text-gray-600 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line pr-2 border-l-2 border-[#70B325] pl-3 bg-gray-50/70 py-2 rounded-r-xl">
              {finalist.description ||
                `${finalist.name} adalah salah satu kandidat perwakilan terbaik yang siap memberikan kontribusi nyata. Berikan dukungan terbaikmu agar terpilih sebagai pemenang favorit.`}
            </div>
          </div>

          {/* Social Share Strip */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-500">Ajak Teman Mendukung:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20BE5C] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>💬 WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {copied ? 'Tersalin!' : '🔗 Salin Link'}
              </button>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isVotingExpired}
              onClick={() => {
                onClose()
                if (onOpenVote) onOpenVote(finalist)
              }}
              className="w-full py-3.5 px-4 bg-[#70B325] hover:bg-[#5F9A1E] disabled:bg-gray-300 text-white font-black text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <IconZap className="w-5 h-5 text-white" />
              <span>
                {isVotingExpired
                  ? 'Voting Telah Berakhir'
                  : `Vote Sekarang (${finalist.name.split(' ')[0]})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
