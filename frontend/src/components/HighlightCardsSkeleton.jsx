export default function HighlightCardsSkeleton() {
  return (
    <div className="flex gap-4 sm:gap-5 overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0 pb-3 pt-1 select-none" aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex-shrink-0 w-[74vw] max-w-[270px] sm:w-[calc(50%-10px)] sm:max-w-none md:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)] aspect-[3/4] rounded-2xl overflow-hidden bg-[#E8EFE3]/80 dark:bg-white/5 border border-[#E5EADF] dark:border-[#2C3529] p-4 flex flex-col justify-between relative shadow-2xs"
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent pointer-events-none" />

          {/* Top Dummy Badge */}
          <div className="flex items-center justify-between relative z-10">
            <div className="h-5 w-16 bg-[#D5E3CE] dark:bg-white/10 rounded-full animate-pulse" />
          </div>

          {/* Bottom Card Elements */}
          <div className="space-y-2 mt-auto relative z-10">
            <div className="h-4 w-4/5 bg-[#D5E3CE] dark:bg-white/15 rounded-lg animate-pulse" />
            <div className="h-3 w-1/2 bg-[#D5E3CE]/80 dark:bg-white/10 rounded-md animate-pulse" />
            <div className="h-8 w-full bg-[#70B325]/20 dark:bg-white/10 rounded-xl mt-2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
