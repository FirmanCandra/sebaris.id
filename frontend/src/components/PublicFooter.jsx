import { Link } from 'react-router-dom'
import SebarisLogo from './SebarisLogo'
import { useTheme } from '../context/ThemeProvider'
import {
  IconCheck,
  IconLock,
  IconZap,
  IconCheckVote,
  IconWhatsApp,
  IconChevronRight,
} from './Icons'

export default function PublicFooter({ onOpenCheckVote }) {
  const { theme } = useTheme()
  const currentYear = new Date().getFullYear()

  function handleCheckVoteClick(e) {
    e.preventDefault()
    if (onOpenCheckVote) {
      onOpenCheckVote()
    } else {
      const el = document.getElementById('cek-vote-box')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        const input = el.querySelector('input')
        if (input) input.focus()
      }
    }
  }

  return (
    <footer className="mt-16 sm:mt-24 bg-white dark:bg-[#0E140E] border-t border-[#E5EADF] dark:border-[#20291D] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* 1. BRAND & MISSION (5 cols on md/lg) */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            <Link to="/" className="inline-block focus:outline-none" aria-label="Sebaris.id Beranda">
              <SebarisLogo
                size="md"
                variant={theme === 'dark' ? 'white' : 'default'}
              />
            </Link>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm">
              Platform e-voting digital resmi, aman, dan transparan untuk pemilihan duta, ketua organisasi, institusi kampus, sekolah, hingga festival nasional di Indonesia.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F9EE] dark:bg-white/5 border border-[#D5E6C4] dark:border-white/10 text-[11px] font-bold text-[#48781B] dark:text-[#8FE032]">
                <IconZap className="w-3.5 h-3.5" />
                <span>Real-Time Tabulasi</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F9EE] dark:bg-white/5 border border-[#D5E6C4] dark:border-white/10 text-[11px] font-bold text-[#48781B] dark:text-[#8FE032]">
                <IconLock className="w-3.5 h-3.5" />
                <span>Terenkripsi & Sah</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F9EE] dark:bg-white/5 border border-[#D5E6C4] dark:border-white/10 text-[11px] font-bold text-[#48781B] dark:text-[#8FE032]">
                <IconCheck className="w-3.5 h-3.5" />
                <span>Anti-Manipulasi</span>
              </div>
            </div>
          </div>

          {/* 2. NAVIGASI CEPAT (3 cols on md/lg) */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
              Navigasi Halaman
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
              <li>
                <Link to="/" className="inline-block py-1 hover:text-[#70B325] dark:hover:text-[#8FE032] transition-colors">
                  Beranda Utama
                </Link>
              </li>
              <li>
                <a href="/#voting-section" className="inline-block py-1 hover:text-[#70B325] dark:hover:text-[#8FE032] transition-colors">
                  Highlight Ajang Voting
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleCheckVoteClick}
                  className="inline-block py-1 hover:text-[#70B325] dark:hover:text-[#8FE032] transition-colors cursor-pointer bg-transparent border-0 text-inherit font-inherit"
                >
                  Cek E-Receipt Vote
                </button>
              </li>
              <li>
                <Link to="/login" className="inline-block py-1 hover:text-[#70B325] dark:hover:text-[#8FE032] transition-colors">
                  Masuk / Daftar Akun
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. BANTUAN & VERIFIKASI (4 cols on md/lg) */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
              Bantuan & Layanan
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs">
              Butuh konsultasi penyelenggaraan pemilihan daring atau bantuan teknis transaksi e-voting?
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCheckVoteClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#70B325] hover:bg-[#5F9A1E] text-white font-bold text-xs shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <IconCheckVote className="w-4 h-4" />
                <span>Verifikasi Suara</span>
              </button>

              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 font-bold text-xs transition-colors"
              >
                <IconWhatsApp className="w-4 h-4 text-emerald-500" />
                <span>Hubungi CS</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 mt-10 border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
          <p>© {currentYear} Sebaris.id. Hak Cipta Dilindungi.</p>
          <p className="text-gray-400 dark:text-gray-500 text-[11px]">
            Platform E-Voting Resmi Indonesia • Aman, Terpercaya & Transparan
          </p>
        </div>

      </div>
    </footer>
  )
}
