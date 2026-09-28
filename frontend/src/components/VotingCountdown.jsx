import { useEffect, useState, useRef } from 'react'
import { IconClock } from './Icons'

export default function VotingCountdown({ endDate, status = 'active', onExpire }) {
  const [timeLeft, setTimeLeft] = useState(null)
  const [isExpired, setIsExpired] = useState(false)

  const lastExpiredRef = useRef(null)

  useEffect(() => {
    if (!endDate || status === 'inactive') {
      setIsExpired(true)
      if (lastExpiredRef.current !== true) {
        lastExpiredRef.current = true
        if (onExpire) onExpire(true)
      }
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
        if (lastExpiredRef.current !== true) {
          lastExpiredRef.current = true
          if (onExpire) onExpire(true)
        }
        return
      }

      setIsExpired(false)
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
      if (lastExpiredRef.current !== false) {
        lastExpiredRef.current = false
        if (onExpire) onExpire(false)
      }
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
    <div className="bg-black/40 backdrop-blur-xl text-white rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/15 w-full space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#70B325] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-gray-200">
            Sisa Waktu Pemilihan
          </span>
        </div>
        <span className="text-[10px] text-emerald-400/90 font-bold uppercase tracking-wider">Live Timer</span>
      </div>

      {/* 4 Counter Digital Blocks */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5 text-center">
        {[
          { val: timeLeft.days, label: 'Hari' },
          { val: timeLeft.hours, label: 'Jam' },
          { val: timeLeft.minutes, label: 'Menit' },
          { val: timeLeft.seconds, label: 'Detik' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="relative bg-[#08120A]/85 backdrop-blur-md rounded-xl py-2.5 sm:py-3 px-1 border border-white/10 shadow-inner flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Subtle flip split line */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/10 pointer-events-none" />
            <span className="block text-lg sm:text-2xl lg:text-3xl font-black text-white font-mono tracking-wider leading-none">
              {String(item.val).padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-black text-[#70B325] mt-1.5 sm:mt-2 tracking-widest block">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Subtitle footer */}
      <div className="text-center pt-0.5">
        <span className="text-[11px] text-gray-400 font-medium">
          Penutupan voting: <span className="text-white font-semibold">{endDate}</span> (23:59 WIB)
        </span>
      </div>
    </div>
  )
}
