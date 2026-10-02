import { Link } from 'react-router-dom'
import SebarisLogo from './SebarisLogo'
import { useTheme } from '../context/ThemeProvider'
import {
  IconWhatsApp,
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
    <footer className="mt-14 sm:mt-20 bg-white dark:bg-[#0E140E] border-t border-[#E5EADF] dark:border-[#20291D] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        
        {/* Main Footer Grid: Clean Left-Aligned on Mobile & Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* 1. BRAND & MISSION (5 cols on md/lg) */}
          <div className="sm:col-span-2 md:col-span-5 flex flex-col items-start text-left space-y-3">
            <Link to="/" className="inline-block focus:outline-none" aria-label="Sebaris.id Beranda">
              <SebarisLogo
                size="md"
                variant={theme === 'dark' ? 'white' : 'default'}
              />
            </Link>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm">
              Platform e-voting digital resmi, aman, dan transparan untuk pemilihan duta, ketua organisasi, institusi kampus, sekolah, hingga festival nasional di Indonesia.
            </p>
          </div>

          {/* 2. NAVIGASI HALAMAN (3 cols on md/lg) */}
          <div className="md:col-span-3 flex flex-col items-start text-left space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
              Navigasi Halaman
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
              <li>
                <Link to="/" className="hover:text-[#70B325] dark:hover:text-[#8FE032] transition-colors">
                  Beranda Utama
                </Link>
              </li>
              <li>
                <Link to="/vote" className="hover:text-[#70B325] dark:hover:text-[#8FE032] transition-colors">
                  Ajang &amp; Event Voting
                </Link>
              </li>
              <li>
                <Link to="/daftarkan-vote" className="hover:text-[#70B325] dark:hover:text-[#8FE032] transition-colors">
                  Daftarkan Event
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleCheckVoteClick}
                  className="hover:text-[#70B325] dark:hover:text-[#8FE032] transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit text-left"
                >
                  Cek E-Receipt Vote
                </button>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#70B325] dark:hover:text-[#8FE032] transition-colors">
                  Masuk / Daftar Akun
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. BANTUAN & LAYANAN (4 cols on md/lg) */}
          <div className="md:col-span-4 flex flex-col items-start text-left space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
              Bantuan &amp; Layanan
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs">
              Butuh konsultasi penyelenggaraan pemilihan daring atau bantuan teknis transaksi e-voting?
            </p>

            <div className="pt-1">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-98"
              >
                <IconWhatsApp className="w-4 h-4 text-white" />
                <span>Hubungi CS via WhatsApp</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 mt-8 sm:mt-12 border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-gray-500 dark:text-gray-400">
          <p>© {currentYear} Sebaris.id. Hak Cipta Dilindungi.</p>
          <p className="text-gray-400 dark:text-gray-500 text-[11px]">
            Platform E-Voting Resmi Indonesia • Aman, Terpercaya &amp; Transparan
          </p>
        </div>

      </div>
    </footer>
  )
}
