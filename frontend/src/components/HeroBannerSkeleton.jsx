export default function HeroBannerSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-1 w-full" aria-hidden="true">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#E6ECE1]/80 dark:bg-white/5 border border-[#E5EADF] dark:border-[#2C3529] aspect-[16/9] sm:aspect-[21/9] lg:aspect-[24/8] flex flex-col justify-between p-4 sm:p-8 select-none ios-isolate">
        
        {/* Shimmer Wave Glow */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer-sweep bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent pointer-events-none" />

        {/* Top dummy badges */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="h-6 w-24 sm:w-28 bg-[#D3DFCC] dark:bg-white/10 rounded-full animate-pulse" />
          <div className="h-6 w-16 sm:w-20 bg-[#D3DFCC]/80 dark:bg-white/10 rounded-full hidden sm:block animate-pulse" />
        </div>

        {/* Middle dummy content info */}
        <div className="space-y-2.5 max-w-md relative z-10 mt-auto pb-4 sm:pb-2">
          <div className="h-6 sm:h-8 w-4/5 bg-[#D3DFCC] dark:bg-white/15 rounded-xl animate-pulse" />
          <div className="h-3.5 sm:h-4 w-3/5 bg-[#D3DFCC]/80 dark:bg-white/10 rounded-lg animate-pulse hidden sm:block" />
        </div>

        {/* Desktop dummy nav arrows */}
        <div className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/40 dark:bg-white/5 border border-white/20 items-center justify-center pointer-events-none opacity-60" />
        <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/40 dark:bg-white/5 border border-white/20 items-center justify-center pointer-events-none opacity-60" />

        {/* Bottom dummy indicator dots */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
          <div className="w-6 h-2 rounded-full bg-[#70B325]/40 dark:bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-[#D3DFCC] dark:bg-white/15" />
          <div className="w-2 h-2 rounded-full bg-[#D3DFCC] dark:bg-white/15" />
        </div>
      </div>
    </section>
  )
}
