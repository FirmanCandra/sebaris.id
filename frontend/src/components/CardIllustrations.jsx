export function BannerSchool({ className = 'w-full h-full' }) {
  return (
    <svg className={className} viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="200" fill="#E8F4E0" />
      {/* Background Soft Hills */}
      <path d="M-20 180 Q100 130 220 170 T420 160 L420 200 L-20 200 Z" fill="#D3E8C5" />
      <path d="M0 190 Q120 150 260 180 T420 170 L420 200 L0 200 Z" fill="#BDDCAB" />
      {/* School Building */}
      <rect x="130" y="70" width="140" height="90" rx="4" fill="#FFFFFF" stroke="#8FB858" strokeWidth="2" />
      {/* Roof */}
      <polygon points="115,75 200,30 285,75" fill="#70B325" />
      {/* Bell Tower */}
      <rect x="185" y="15" width="30" height="25" fill="#FFFFFF" stroke="#8FB858" strokeWidth="2" />
      <polygon points="180,18 200,4 220,18" fill="#5A921D" />
      <circle cx="200" cy="28" r="4" fill="#EAB308" />
      {/* Windows & Doors */}
      <rect x="150" y="85" width="20" height="25" rx="2" fill="#E8F4E0" stroke="#8FB858" />
      <rect x="230" y="85" width="20" height="25" rx="2" fill="#E8F4E0" stroke="#8FB858" />
      <rect x="188" y="125" width="24" height="35" rx="3" fill="#70B325" />
      {/* Clock on front */}
      <circle cx="200" cy="55" r="9" fill="#FFFFFF" stroke="#8FB858" strokeWidth="2" />
      <line x1="200" y1="55" x2="200" y2="49" stroke="#5A921D" strokeWidth="1.5" />
      <line x1="200" y1="55" x2="204" y2="55" stroke="#5A921D" strokeWidth="1.5" />
      {/* Trees */}
      <circle cx="95" cy="140" r="28" fill="#70B325" />
      <rect x="91" y="155" width="8" height="25" fill="#846342" />
      <circle cx="305" cy="140" r="28" fill="#70B325" />
      <rect x="301" y="155" width="8" height="25" fill="#846342" />
    </svg>
  )
}

export function BannerCampus({ className = 'w-full h-full' }) {
  return (
    <svg className={className} viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="200" fill="#E6EEF5" />
      {/* Ground */}
      <rect y="160" width="400" height="40" fill="#CBDCE8" />
      {/* University Main Hall */}
      <rect x="110" y="70" width="180" height="90" fill="#FFFFFF" stroke="#7A9EB8" strokeWidth="2" />
      {/* Pediment (Triangle Roof) */}
      <polygon points="100,70 200,28 300,70" fill="#4B779A" />
      <circle cx="200" cy="53" r="10" fill="#FFFFFF" stroke="#375D7B" strokeWidth="2" />
      {/* Pillars */}
      <rect x="135" y="70" width="14" height="90" fill="#EBF2F7" stroke="#7A9EB8" strokeWidth="1.5" />
      <rect x="170" y="70" width="14" height="90" fill="#EBF2F7" stroke="#7A9EB8" strokeWidth="1.5" />
      <rect x="216" y="70" width="14" height="90" fill="#EBF2F7" stroke="#7A9EB8" strokeWidth="1.5" />
      <rect x="251" y="70" width="14" height="90" fill="#EBF2F7" stroke="#7A9EB8" strokeWidth="1.5" />
      {/* Center Grand Entrance */}
      <path d="M185 160 V125 C185 117 215 117 215 125 V160 Z" fill="#375D7B" />
      {/* Greenery */}
      <circle cx="70" cy="145" r="22" fill="#70B325" />
      <circle cx="330" cy="145" r="22" fill="#70B325" />
    </svg>
  )
}

export function BannerFestival({ className = 'w-full h-full' }) {
  return (
    <svg className={className} viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="200" fill="#FFF6E5" />
      {/* Ground */}
      <path d="M0 160 Q200 140 400 160 L400 200 L0 200 Z" fill="#F4E6C3" />
      {/* Stand Canopies */}
      {/* Canopy 1 */}
      <path d="M60 100 L140 100 L150 120 L50 120 Z" fill="#E05B5B" />
      <path d="M60 100 L80 100 L75 120 L55 120 Z" fill="#FFFFFF" />
      <path d="M100 100 L120 100 L115 120 L95 120 Z" fill="#FFFFFF" />
      <rect x="65" y="120" width="70" height="40" fill="#FFFFFF" stroke="#CBB48C" strokeWidth="1.5" />
      {/* Canopy 2 (Center UMKM) */}
      <path d="M160 85 L260 85 L275 110 L145 110 Z" fill="#70B325" />
      <path d="M160 85 L185 85 L175 110 L150 110 Z" fill="#FFFFFF" />
      <path d="M210 85 L235 85 L225 110 L200 110 Z" fill="#FFFFFF" />
      <rect x="165" y="110" width="90" height="50" fill="#FFFFFF" stroke="#8FB858" strokeWidth="1.5" />
      {/* Flags Bunting */}
      <path d="M30 40 Q200 80 370 40" stroke="#70B325" strokeWidth="2" strokeDasharray="6 6" />
      <polygon points="70,48 85,70 100,48" fill="#E05B5B" />
      <polygon points="130,58 145,80 160,58" fill="#F59E0B" />
      <polygon points="200,60 215,82 230,60" fill="#70B325" />
      <polygon points="270,58 285,80 300,58" fill="#3B82F6" />
    </svg>
  )
}

export function BannerPoster({ className = 'w-full h-full' }) {
  return (
    <svg className={className} viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="200" fill="#FDF2F0" />
      {/* Abstract Artistic Shapes */}
      <circle cx="280" cy="100" r="70" fill="#FEE2E2" />
      <circle cx="120" cy="110" r="50" fill="#FEF3C7" />
      <rect x="160" y="40" width="80" height="110" rx="6" fill="#FFFFFF" stroke="#E57373" strokeWidth="2" transform="rotate(-6 200 95)" />
      <rect x="175" y="55" width="50" height="30" rx="3" fill="#DC2626" transform="rotate(-6 200 70)" />
      <circle cx="200" cy="70" r="8" fill="#FFFFFF" />
      <line x1="172" y1="100" x2="225" y2="94" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
      <line x1="174" y1="112" x2="215" y2="108" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <line x1="176" y1="124" x2="205" y2="121" stroke="#70B325" strokeWidth="3" strokeLinecap="round" />
      {/* Stars and geometric accents */}
      <polygon points="320,40 324,50 335,50 327,58 330,68 320,62 310,68 313,58 305,50 316,50" fill="#DC2626" />
    </svg>
  )
}

export function ThumbnailEarth({ className = 'w-12 h-12' }) {
  return (
    <div className={`${className} rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#1E7E34] flex-shrink-0`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth="2" />
        <path strokeLinecap="round" strokeWidth="1.5" d="M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
      </svg>
    </div>
  )
}

export function ThumbnailTech({ className = 'w-12 h-12' }) {
  return (
    <div className={`${className} rounded-xl bg-[#E8F0FE] flex items-center justify-center text-[#1A73E8] flex-shrink-0`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="12" rx="2" strokeWidth="2" />
        <path strokeLinecap="round" strokeWidth="2" d="M8 20h8M12 16v4" />
      </svg>
    </div>
  )
}

export function ThumbnailMusic({ className = 'w-12 h-12' }) {
  return (
    <div className={`${className} rounded-xl bg-[#FEF7E0] flex items-center justify-center text-[#D97706] flex-shrink-0`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12 0a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
  )
}

export function ThumbnailCamera({ className = 'w-12 h-12' }) {
  return (
    <div className={`${className} rounded-xl bg-[#F3E8FD] flex items-center justify-center text-[#9333EA] flex-shrink-0`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <circle cx="12" cy="13" r="4" strokeWidth="2" />
      </svg>
    </div>
  )
}
