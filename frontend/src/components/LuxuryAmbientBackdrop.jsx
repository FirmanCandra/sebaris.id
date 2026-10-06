import { useMemo } from 'react'

/**
 * Helper to convert HEX to RGB components
 */
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 21, g: 66, b: 40 }
  const cleanHex = hex.replace('#', '').trim()
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16)
    const g = parseInt(cleanHex[1] + cleanHex[1], 16)
    const b = parseInt(cleanHex[2] + cleanHex[2], 16)
    return { r, g, b }
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16)
    const g = parseInt(cleanHex.substring(2, 4), 16)
    const b = parseInt(cleanHex.substring(4, 6), 16)
    return { r, g, b }
  }
  return { r: 21, g: 66, b: 40 }
}

/**
 * 4-Point Sparkle Lens Flare Star SVG Component
 */
function SparkleStar({ className = '', style = {}, size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`pointer-events-none select-none ${className}`}
      style={style}
    >
      <defs>
        <radialGradient id="sparkleCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="40%" stopColor="#FFF2B2" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Central Ambient Glow */}
      <circle cx="12" cy="12" r="5" fill="url(#sparkleCore)" className="animate-pulse" />
      {/* 4 Point Diamond Beams */}
      <path
        d="M12 0 C12 7 13 11 24 12 C13 13 12 17 12 24 C12 17 11 13 0 12 C11 11 12 7 12 0 Z"
        fill="url(#sparkleCore)"
      />
      {/* Micro center pin */}
      <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
    </svg>
  )
}

/**
 * LuxuryAmbientBackdrop
 * Generates an ultra-luxurious, dynamic background based on a single theme color.
 * Features flowing silk wave ribbons, glowing sparkle flares, and ambient depth.
 */
export default function LuxuryAmbientBackdrop({ themeColor = '#154228', posterSrc = null }) {
  const { r, g, b } = useMemo(() => hexToRgb(themeColor), [themeColor])

  // Derive gradient palettes
  const colorStyles = useMemo(() => {
    // Ultra deep dark base (5-8% brightness)
    const darkBase = `rgb(${Math.round(r * 0.08)}, ${Math.round(g * 0.08)}, ${Math.round(b * 0.08)})`
    // Rich saturated tone
    const midTone = `rgb(${r}, ${g}, ${b})`
    // Luminous bright highlight
    const highlight = `rgb(${Math.min(255, Math.round(r * 1.35))}, ${Math.min(255, Math.round(g * 1.35))}, ${Math.min(255, Math.round(b * 1.35))})`
    // Gold/Champagne accent complement for sparkles
    const goldAccent = '#FDE047'

    return {
      darkBase,
      midTone,
      highlight,
      goldAccent,
      rgbaPrimary: (opacity) => `rgba(${r}, ${g}, ${b}, ${opacity})`,
    }
  }, [r, g, b])

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none transition-colors duration-700"
      style={{ backgroundColor: colorStyles.darkBase }}
    >
      {/* 1. Optional Soft Blurred Poster Artwork */}
      {posterSrc && (
        <img
          src={posterSrc}
          alt=""
          className="w-full h-full object-cover object-center filter blur-3xl scale-125 opacity-20 transform -translate-y-8 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* 2. Dynamic Radial Color Blooms */}
      <div
        className="absolute -top-32 -left-32 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full blur-[60px] sm:blur-[140px] pointer-events-none opacity-40 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${colorStyles.rgbaPrimary(0.85)} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute top-10 right-0 w-[320px] sm:w-[700px] h-[320px] sm:h-[700px] rounded-full blur-[70px] sm:blur-[160px] pointer-events-none opacity-45 transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${colorStyles.rgbaPrimary(0.7)} 0%, transparent 75%)`,
        }}
      />

      {/* 3. Layered Silk Waves / Luminous Ribbon Curves (SVG) */}
      <svg
        className="absolute inset-0 w-full h-full preserve-3d opacity-85 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Main Wave Gradient */}
          <linearGradient id="silkWaveGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStyles.rgbaPrimary(0.1)} />
            <stop offset="45%" stopColor={colorStyles.rgbaPrimary(0.55)} />
            <stop offset="70%" stopColor={colorStyles.highlight} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
          </linearGradient>

          {/* Golden Ambient Silk Thread */}
          <linearGradient id="goldenThreadGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStyles.rgbaPrimary(0)} />
            <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.5" />
            <stop offset="65%" stopColor="#FEF08A" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
          </linearGradient>

          {/* Secondary Ribbon Fill */}
          <linearGradient id="silkFillGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStyles.rgbaPrimary(0)} />
            <stop offset="50%" stopColor={colorStyles.rgbaPrimary(0.22)} />
            <stop offset="100%" stopColor={colorStyles.rgbaPrimary(0.04)} />
          </linearGradient>
        </defs>

        {/* Ribbon Area 1 (Soft luminous body) */}
        <path
          d="M-50,600 C350,550 500,320 850,240 C1100,180 1300,90 1500,40 L1500,600 Z"
          fill="url(#silkFillGrad)"
        />

        {/* Luminous Wave 1 (Deep elegant curve) */}
        <path
          d="M-50,580 C320,530 480,310 820,230 C1120,160 1300,80 1500,30"
          fill="none"
          stroke="url(#silkWaveGrad1)"
          strokeWidth="3.5"
          strokeLinecap="round"
          className="filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
        />

        {/* Luminous Wave 2 (Thin golden accent thread with split rise) */}
        <path
          d="M0,590 C360,540 520,340 870,250 C1160,170 1340,110 1500,70"
          fill="none"
          stroke="url(#goldenThreadGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          className="filter drop-shadow-[0_0_8px_rgba(254,240,138,0.5)]"
        />

        {/* Luminous Wave 3 (Upper delicate crest) */}
        <path
          d="M150,600 C480,480 680,260 1020,180 C1250,120 1390,60 1500,20"
          fill="none"
          stroke="url(#silkWaveGrad1)"
          strokeWidth="1.5"
          strokeDasharray="8 4"
          opacity="0.6"
        />
      </svg>

      {/* 4. Luxury Sparkle Stars & Shimmering Flares positioned along wave crests */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Sparkle 1: Near center crest */}
        <SparkleStar
          size={36}
          className="absolute top-[38%] left-[58%] animate-pulse"
          style={{ animationDuration: '3s' }}
        />
        {/* Sparkle 2: Dominant bright star on main curve */}
        <SparkleStar
          size={48}
          className="absolute top-[28%] left-[72%] animate-pulse"
          style={{ animationDuration: '2.4s', animationDelay: '0.4s' }}
        />
        {/* Sparkle 3: Upper right crest */}
        <SparkleStar
          size={32}
          className="absolute top-[12%] right-[12%] animate-pulse"
          style={{ animationDuration: '3.6s', animationDelay: '0.8s' }}
        />
        {/* Sparkle 4: Far right flourish */}
        <SparkleStar
          size={26}
          className="absolute top-[22%] right-[4%] animate-pulse"
          style={{ animationDuration: '2.8s', animationDelay: '1.2s' }}
        />
        {/* Sparkle 5: Mid-left delicate twinkle */}
        <SparkleStar
          size={22}
          className="absolute top-[48%] left-[38%] opacity-70 animate-pulse"
          style={{ animationDuration: '4s', animationDelay: '1.5s' }}
        />
        {/* Sparkle 6: Lower sweep twinkle */}
        <SparkleStar
          size={20}
          className="absolute bottom-[24%] left-[26%] opacity-60 animate-pulse"
          style={{ animationDuration: '3.2s', animationDelay: '0.6s' }}
        />
      </div>

      {/* 5. Stardust / Diamond Dust Particle Scatter */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      {/* 6. Dark Vignette / Gradient Scrim for 100% Crisp WCAG Typography Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#09130C] to-transparent pointer-events-none" />
    </div>
  )
}
