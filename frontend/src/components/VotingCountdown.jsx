import { useEffect, useState } from 'react'
import { IconClock } from './Icons'

export default function VotingCountdown({ endDate, status = 'active', onExpire }) {
  const [timeLeft, setTimeLeft] = useState(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!endDate || status === 'inactive') {
      setIsExpired(true)
      if (onExpire) onExpire(true)
      return
    }

    function calculateTime() {
      // Treat endDate as end of the specified day (23:59:59)
      const target = new Date(`${endDate}T23:59:59`).getTime()
      const now = new Date().getTime()
      const diff = target - now

      if (diff <= 0) {
        setIsExpired(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        if (onExpire) onExpire(true)
        return
      }

      setIsExpired(false)
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
      if (onExpire) onExpire(false)
    }

    calculateTime()
    const timer = setInterval(calculateTime, 1000)
    return () => clearInterval(timer)
  }, [endDate, status, onExpire])

  if (!endDate) return null

  if (isExpired || status === 'inactive') {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 sm:p-4 text-center">
        <div className="inline-flex items-center gap-2 text-red-600 font-extrabold text-xs sm:text-sm">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>VOTING TELAH RESMI DITUTUP</span>
        </div>
        <p className="text-[11px] sm:text-xs text-red-700/80 mt-0.5">
          Batas waktu pemilihan telah berakhir pada {endDate}. Perolehan suara saat ini adalah hasil final.
        </p>
      </div>
    )
  }

  if (!timeLeft) return null

  return (
    <div className="bg-gradient-to-r from-[#123E2A] to-[#1C533A] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-800/40">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 flex-shrink-0">
            <IconClock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-300">
                Voting Sedang Berlangsung
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              Sisa Waktu Pemberian Suara
            </h3>
          </div>
        </div>

        {/* Counter Blocks */}
        <div className="flex items-center gap-2 text-center">
          <div className="bg-black/30 backdrop-blur-xs px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 min-w-[52px]">
            <span className="block text-base sm:text-xl font-black text-amber-300 font-mono">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase font-bold text-gray-300">Hari</span>
          </div>
          <span className="text-amber-300 font-black text-lg">:</span>
          <div className="bg-black/30 backdrop-blur-xs px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 min-w-[52px]">
            <span className="block text-base sm:text-xl font-black text-amber-300 font-mono">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase font-bold text-gray-300">Jam</span>
          </div>
          <span className="text-amber-300 font-black text-lg">:</span>
          <div className="bg-black/30 backdrop-blur-xs px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 min-w-[52px]">
            <span className="block text-base sm:text-xl font-black text-amber-300 font-mono">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase font-bold text-gray-300">Menit</span>
          </div>
          <span className="text-amber-300 font-black text-lg">:</span>
          <div className="bg-black/30 backdrop-blur-xs px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 min-w-[52px]">
            <span className="block text-base sm:text-xl font-black text-emerald-400 font-mono">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="text-[9px] uppercase font-bold text-gray-300">Detik</span>
          </div>
        </div>
      </div>
    </div>
  )
}
