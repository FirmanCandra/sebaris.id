import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import SebarisLogo from '../components/SebarisLogo'
import { IconChevronRight } from '../components/Icons'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@sebaris.test')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await login({ email, password })
      navigate('/admin/events')
    } catch (requestError) {
      setError(requestError.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2F8EE] via-[#F6FAF2] to-[#EAF2E4] flex flex-col justify-center items-center p-4">
      {/* Back to Home Link */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-xs font-bold text-gray-600 hover:text-[#70B325] transition-colors flex items-center gap-1 no-underline"
        >
          <span>← Kembali ke Beranda</span>
        </Link>
        <span className="text-xs text-gray-400 font-medium">Ruang Akses Terbatas</span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-[#E5EADF] rounded-2xl p-8 shadow-xl space-y-6">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <SebarisLogo size="md" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#262A25] tracking-tight">
            Masuk ke Ruang Admin
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            Kelola event voting, kategori lomba, finalis, dan pantau perolehan suara secara langsung.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-bold leading-normal">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1">
              Email Administrator
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sebaris.test"
              autoComplete="email"
              className="form-input text-xs sm:text-sm"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-xs font-bold text-gray-700">
                Kata Sandi
              </label>
              <span className="text-[11px] text-gray-400">Default: password</span>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="form-input text-xs sm:text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full text-sm font-bold shadow-md cursor-pointer mt-2"
          >
            {saving ? (
              <span>Memeriksa Akses...</span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <span>Masuk Sekarang</span>
                <IconChevronRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Footer Notes */}
        <div className="pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            Platform E-Voting Sebaris.id dilindungi dengan enkripsi dan kontrol akses tingkat administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
