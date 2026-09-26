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
    <div className="bg-black/35 backdrop-blur-md text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-white/15 w-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-[#D0FE15] flex items-center justify-center flex-shrink-0">
          <IconClock className="w-4 h-4 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D0FE15] animate-ping flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#D0FE15] truncate">
              Voting Sedang Berlangsung
            </span>
          </div>
          <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">
            Sisa Waktu Pemberian Suara
          </h3>
        </div>
      </div>

      {/* 4 Counter Blocks in an unbreakable 4-column grid */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
        <div className="bg-black/40 backdrop-blur-xs py-2 px-1 rounded-xl border border-white/10">
          <span className="block text-base sm:text-lg lg:text-xl font-black text-[#D0FE15] font-mono leading-none">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase font-bold text-gray-300 mt-1 block">Hari</span>
        </div>
        <div className="bg-black/40 backdrop-blur-xs py-2 px-1 rounded-xl border border-white/10">
          <span className="block text-base sm:text-lg lg:text-xl font-black text-[#D0FE15] font-mono leading-none">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase font-bold text-gray-300 mt-1 block">Jam</span>
        </div>
        <div className="bg-black/40 backdrop-blur-xs py-2 px-1 rounded-xl border border-white/10">
          <span className="block text-base sm:text-lg lg:text-xl font-black text-[#D0FE15] font-mono leading-none">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase font-bold text-gray-300 mt-1 block">Menit</span>
        </div>
        <div className="bg-black/40 backdrop-blur-xs py-2 px-1 rounded-xl border border-white/10">
          <span className="block text-base sm:text-lg lg:text-xl font-black text-[#D0FE15] font-mono leading-none">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase font-bold text-gray-300 mt-1 block">Detik</span>
        </div>
      </div>
    </div>
  )
}
