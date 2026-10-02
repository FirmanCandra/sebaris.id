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
    <footer className="mt-14 sm:mt-20 relative overflow-hidden bg-gradient-to-br from-[#DDFB38] via-[#CAF118] to-[#B2E40B] dark:from-[#17240B] dark:via-[#1F330E] dark:to-[#15220A] transition-colors select-none">
      {/* Top Wave Transition matching Top Voting */}
      <div className="w-full overflow-hidden leading-none select-none pointer-events-none">
        <svg
          viewBox="0 0 1440 74"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-8 sm:h-12 lg:h-16 block text-[#F8FAF7] dark:text-[#121612] fill-current"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 sm:pt-6 sm:pb-16 relative z-10 space-y-8 sm:space-y-12">
        
        {/* Main Footer Grid: Centered on Mobile, 3 Columns on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* 1. BRAND & MISSION */}
          <div className="md:col-span-5 flex flex-col items-center text-center md:items-start md:text-left space-y-3">
            <Link to="/" className="inline-block focus:outline-none" aria-label="Sebaris.id Beranda">
              <SebarisLogo
                size="md"
                variant={theme === 'dark' ? 'white' : 'default'}
                className="mx-auto md:mx-0"
              />
            </Link>

            <p className="text-xs sm:text-sm text-[#24420D] dark:text-lime-200/80 font-medium leading-relaxed max-w-sm mx-auto md:mx-0">
              Platform e-voting digital resmi, aman, dan transparan untuk pemilihan duta, ketua organisasi, institusi kampus, sekolah, hingga festival nasional di Indonesia.
            </p>
          </div>

          {/* 2. NAVIGASI HALAMAN */}
          <div className="md:col-span-3 flex flex-col items-center text-center md:items-start md:text-left space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#173007] dark:text-white">
              Navigasi Halaman
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm font-bold text-[#24420D] dark:text-lime-200/80 flex flex-col items-center md:items-start text-center md:text-left">
              <li>
                <Link to="/" className="hover:text-[#173007] dark:hover:text-white transition-colors">
                  Beranda Utama
                </Link>
              </li>
              <li>
                <Link to="/vote" className="hover:text-[#173007] dark:hover:text-white transition-colors">
                  Ajang &amp; Event Voting
                </Link>
              </li>
              <li>
                <Link to="/daftarkan-vote" className="hover:text-[#173007] dark:hover:text-white transition-colors">
                  Daftarkan Event
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleCheckVoteClick}
                  className="hover:text-[#173007] dark:hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit text-center md:text-left"
                >
                  Cek E-Receipt Vote
                </button>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#173007] dark:hover:text-white transition-colors">
                  Masuk / Daftar Akun
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. BANTUAN & LAYANAN */}
          <div className="md:col-span-4 flex flex-col items-center text-center md:items-start md:text-left space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#173007] dark:text-white">
              Bantuan &amp; Layanan
            </h3>
            <p className="text-xs text-[#24420D] dark:text-lime-200/80 font-medium leading-relaxed max-w-xs mx-auto md:mx-0">
              Butuh konsultasi penyelenggaraan pemilihan daring atau bantuan teknis transaksi e-voting?
            </p>

            <div className="pt-1 flex justify-center md:justify-start w-full">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#173007] hover:bg-black text-white dark:bg-[#CAF118] dark:hover:bg-[#DDFB38] dark:text-[#142308] font-black text-xs shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
              >
                <IconWhatsApp className="w-4 h-4 text-emerald-400 dark:text-[#142308]" />
                <span>Hubungi CS via WhatsApp</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t border-[#173007]/15 dark:border-white/15 flex flex-col md:flex-row items-center justify-between gap-2.5 text-xs text-[#24420D]/80 dark:text-lime-200/70 text-center md:text-left">
          <p className="font-semibold">© {currentYear} Sebaris.id. Hak Cipta Dilindungi.</p>
          <p className="text-[11px] font-medium">
            Platform E-Voting Resmi Indonesia • Aman, Terpercaya &amp; Transparan
          </p>
        </div>

      </div>
    </footer>
  )
}
