export default function HeroIllustration() {
  return (
    <div className="hero-visual-wrapper relative w-full max-w-lg mx-auto lg:max-w-none flex items-center justify-center py-6 select-none" aria-hidden="true">
      {/* Background soft ambient halo */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#E6F4D8] via-[#F2F9EC] to-transparent rounded-full opacity-70 filter blur-2xl transform scale-110 pointer-events-none" />

      {/* Decorative floating badge */}
      <div className="absolute -top-1 right-4 lg:right-12 z-30 bg-white text-[#262A25] font-bold text-xs lg:text-sm px-3.5 py-1.5 rounded-full shadow-md border border-[#E2EADA] transform rotate-6 flex items-center gap-1.5 animate-pulse">
        <span className="text-[#70B325]">Suaramu</span> berarti!
        <span className="text-base leading-none">🌿</span>
      </div>

      {/* Main Ballot Card */}
      <div className="relative z-10 w-[270px] sm:w-[300px] bg-white rounded-2xl shadow-xl border border-[#E5EADF] p-4 transform -rotate-3 transition-transform hover:rotate-0 duration-300">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#70B325]" />
            <h3 className="font-extrabold text-xs text-[#262A25] tracking-tight">Pilih Kandidat</h3>
          </div>
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">1 suara gratis</span>
        </div>

        {/* Candidate List */}
        <div className="space-y-2.5">
          {/* Candidate 1 */}
          <div className="flex items-center justify-between p-2 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E5EFE0] text-[#558223] font-bold text-xs flex items-center justify-center">
                AP
              </div>
              <div>
                <div className="w-16 h-2 bg-gray-300 rounded mb-1" />
                <div className="w-10 h-1.5 bg-gray-200 rounded" />
              </div>
            </div>
            <span className="w-4 h-4 rounded-full border-2 border-gray-300" />
          </div>

          {/* Candidate 2 (Selected) */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#F4F9EE] border-2 border-[#70B325] shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#70B325] text-white font-bold text-xs flex items-center justify-center">
                RN
              </div>
              <div>
                <div className="w-20 h-2 bg-[#70B325] rounded mb-1" />
                <div className="w-12 h-1.5 bg-[#8FB858] rounded" />
              </div>
            </div>
            <div className="w-4 h-4 rounded-full bg-[#70B325] flex items-center justify-center text-white">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Candidate 3 */}
          <div className="flex items-center justify-between p-2 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center">
                DA
              </div>
              <div>
                <div className="w-14 h-2 bg-gray-300 rounded mb-1" />
                <div className="w-8 h-1.5 bg-gray-200 rounded" />
              </div>
            </div>
            <span className="w-4 h-4 rounded-full border-2 border-gray-300" />
          </div>
        </div>

        {/* Card Footer Bar */}
        <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
          <span>Status verifikasi</span>
          <span className="text-[#558223] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#70B325]" />
            Aman & Transparan
          </span>
        </div>
      </div>

      {/* Layered Background Sheet behind Ballot Card */}
      <div className="absolute top-2 right-12 w-[240px] h-[220px] bg-white/70 rounded-2xl border border-white/80 shadow-md transform rotate-6 -z-1" />

      {/* 3D Ballot Box Component */}
      <div className="absolute -bottom-4 right-2 sm:right-6 z-20 w-24 sm:w-28 h-28 sm:h-32 flex flex-col items-center">
        {/* Top Slit */}
        <div className="w-20 h-5 bg-[#5E971E] rounded-t-lg transform skew-x-[-12deg] flex items-center justify-center shadow-inner">
          <div className="w-10 h-1 bg-[#253D0A] rounded-full" />
        </div>
        {/* Box Body */}
        <div className="w-22 sm:w-24 h-22 sm:h-24 bg-gradient-to-b from-[#70B325] to-[#5A921D] rounded-b-xl shadow-xl flex items-center justify-center border-t border-[#86C839] relative">
          {/* Checkmark Badge on Box */}
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/40 shadow-inner">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {/* Subtle light reflection on box */}
          <div className="absolute top-1 left-2 w-1.5 h-16 bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  )
}
