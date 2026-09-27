export default function TopVotingSkeleton() {
  return (
    <section className="bg-gradient-to-r from-[#FFFDF6] via-[#FDF7EA] to-[#FBF0D9] dark:from-[#21281A] dark:via-[#1D2418] dark:to-[#181E14] border border-amber-300/60 dark:border-amber-500/30 rounded-3xl p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-5 overflow-hidden select-none" aria-hidden="true">
      {/* Header with Trophy Icon */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-500/20 pb-3 sm:pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/80 text-amber-950 flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0 animate-pulse">
            <span className="w-5 h-5 bg-amber-600/30 rounded-full" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-28 bg-amber-200/80 dark:bg-white/15 rounded-lg animate-pulse" />
              <div className="h-5 w-20 bg-amber-300/80 dark:bg-white/10 rounded-full animate-pulse" />
            </div>
            <div className="h-3.5 w-48 sm:w-72 bg-amber-200/60 dark:bg-white/10 rounded-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* 4 Cards Skeleton */}
      <div className="flex gap-4 sm:gap-5 overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0 pb-3 pt-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[74vw] max-w-[270px] sm:w-[calc(50%-10px)] sm:max-w-none md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] aspect-[3/4] rounded-2xl overflow-hidden bg-white/70 dark:bg-[#1A2018] border border-amber-200 dark:border-amber-500/20 p-3 sm:p-3.5 flex flex-col justify-between relative shadow-2xs"
          >
            {/* Shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-amber-100/40 dark:via-white/5 to-transparent pointer-events-none" />

            {/* Top Photo Mockup */}
            <div className="relative h-[52%] w-full rounded-xl bg-amber-100/70 dark:bg-white/10 animate-pulse" />

            {/* Bottom Card Mockup */}
            <div className="space-y-2 mt-auto pt-2">
              <div className="h-3 w-3/4 bg-amber-200/70 dark:bg-white/15 rounded-md animate-pulse" />
              <div className="h-4 w-4/5 bg-amber-300/80 dark:bg-white/20 rounded-md animate-pulse" />
              <div className="h-3 w-1/3 bg-amber-200/60 dark:bg-white/10 rounded-md animate-pulse" />
              <div className="h-8 w-full bg-amber-400/30 dark:bg-white/10 rounded-xl mt-1 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
