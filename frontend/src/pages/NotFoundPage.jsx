import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import SebarisLogo from '../components/SebarisLogo'
import { IconSearch } from '../components/Icons'

export default function NotFoundPage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Halaman Tidak Ditemukan (404) — Sebaris'
  }, [])

  return (
    <div className="min-h-screen bg-[var(--neutral-bg)] text-[var(--neutral-text-main)] flex flex-col justify-between">
      {/* Top Simple Header */}
      <header className="px-6 py-4 border-b border-[var(--neutral-border)] bg-[var(--neutral-surface)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center no-underline">
            <SebarisLogo size="sm" />
          </Link>
          <Link
            to="/"
            className="text-xs font-bold text-[var(--brand-primary)] hover:underline no-underline"
          >
            Beranda
          </Link>
        </div>
      </header>

      {/* Main 404 Content */}
      <main className="flex-1 flex items-center justify-center p-6 my-auto">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Visual 404 Badge */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-black text-4xl shadow-inner border border-[var(--brand-primary)]/20">
            404
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--neutral-text-main)]">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Tautan yang Anda tuju mungkin sudah berakhir, dihapus, atau salah ketik.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[var(--neutral-border)] text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Kembali ke Sebelumnya
            </button>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[#5E9B1F] text-white text-xs font-bold transition-colors no-underline text-center shadow-xs"
            >
              Lihat Daftar Event
            </Link>
          </div>

          {/* Search Hint */}
          <div className="pt-6 border-t border-[var(--neutral-border)]">
            <p className="text-xs text-gray-400">
              Sedang mencari voting tertentu? Masuk ke{' '}
              <Link to="/" className="text-[var(--brand-primary)] font-bold hover:underline">
                halaman utama
              </Link>{' '}
              untuk mencari berdasarkan nama event atau peserta.
            </p>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-4 text-center text-xs text-gray-400 border-t border-[var(--neutral-border)] bg-[var(--neutral-surface)]">
        &copy; {new Date().getFullYear()} Sebaris.id — Platform E-Voting Terpercaya
      </footer>
    </div>
  )
}
