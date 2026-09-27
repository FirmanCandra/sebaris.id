export default function TopVotingSkeleton() {
  return (
    <section className="w-full relative overflow-hidden bg-gradient-to-br from-[#DDFB38] via-[#CAF118] to-[#B2E40B] dark:from-[#17240B] dark:via-[#1F330E] dark:to-[#15220A] transition-colors select-none pointer-events-none" aria-hidden="true">
      {/* Top Wave Transition (seamless from page background #F8FAF7 / #121612) */}
      <div className="w-full overflow-hidden leading-none select-none pointer-events-none">
        <svg
          viewBox="0 0 1440 74"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-7 sm:h-12 lg:h-16 block text-[#F8FAF7] dark:text-[#121612] fill-current"
          preserveAspectRatio="none"
        >
          <path d="M0,0 L1440,0 L1440,32 C1200,68 960,10 720,45 C480,80 240,18 0,42 Z" />
        </svg>
      </div>

      {/* Subtle Liquid Wave Accents in Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15 dark:opacity-20">
        <svg className="absolute w-[200%] h-full -left-1/2 top-0" viewBox="0 0 1440 400" fill="none" preserveAspectRatio="none">
          <path d="M0,160 C320,300 420,60 740,200 C1060,340 1200,120 1440,220 L1440,400 L0,400 Z" fill="white" />
        </svg>
        <svg className="absolute w-[200%] h-full -left-1/4 top-10" viewBox="0 0 1440 400" fill="none" preserveAspectRatio="none">
          <path d="M0,220 C280,100 520,320 800,180 C1080,40 1260,260 1440,140 L1440,400 L0,400 Z" fill="#9ECD06" />
        </svg>
      </div>

      {/* Inner Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 relative z-10 space-y-4 sm:space-y-6">
        {/* Header with Trophy Icon */}
        <div className="flex items-center justify-between gap-3 border-b border-[#173007]/15 dark:border-white/15 pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#173007]/20 dark:bg-white/20 flex items-center justify-center animate-pulse flex-shrink-0">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-[#173007]/30 dark:bg-white/30 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 sm:h-8 w-28 sm:w-36 bg-[#173007]/25 dark:bg-white/30 rounded-lg animate-pulse" />
                <div className="h-5 w-20 sm:w-24 bg-[#173007]/20 dark:bg-[#D0FE15]/40 rounded-full animate-pulse" />
              </div>
              <div className="h-3.5 w-48 sm:w-80 bg-[#173007]/15 dark:bg-white/20 rounded-md animate-pulse" />
            </div>
          </div>
        </div>

        {/* 4 Cards Skeleton */}
        <div className="flex gap-4 sm:gap-5 overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0 pb-3 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[74vw] max-w-[270px] sm:w-[calc(50%-10px)] sm:max-w-none md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] aspect-[3/4] rounded-2xl overflow-hidden bg-white dark:bg-[#1A2214] border border-[#BCE813]/60 dark:border-white/10 p-3 sm:p-4 flex flex-col justify-between relative shadow-lg"
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-[#EBFD80]/40 dark:via-white/5 to-transparent pointer-events-none" />

              {/* Top Photo Mockup */}
              <div className="relative h-[52%] w-full rounded-xl bg-gray-100 dark:bg-white/10 animate-pulse" />

              {/* Bottom Card Mockup */}
              <div className="space-y-2 mt-auto pt-2">
                <div className="h-3 w-3/4 bg-gray-200 dark:bg-white/15 rounded-md animate-pulse" />
                <div className="h-4 w-4/5 bg-gray-300 dark:bg-white/20 rounded-md animate-pulse" />
                <div className="h-3 w-1/3 bg-gray-200 dark:bg-white/10 rounded-md animate-pulse" />
                <div className="h-8 w-full bg-[#173007]/20 dark:bg-[#D0FE15]/30 rounded-xl mt-1 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Wave Transition */}
      <div className="w-full overflow-hidden leading-none select-none pointer-events-none">
        <svg
          viewBox="0 0 1440 74"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-7 sm:h-12 lg:h-16 block text-[#F8FAF7] dark:text-[#121612] fill-current"
          preserveAspectRatio="none"
        >
          <path d="M0,74 L1440,74 L1440,42 C1200,12 960,65 720,28 C480,-8 240,55 0,32 Z" />
        </svg>
      </div>
    </section>
  )
}
