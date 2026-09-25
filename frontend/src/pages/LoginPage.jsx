import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import SebarisLogo from '../components/SebarisLogo'
import { IconChevronRight, IconGoogle } from '../components/Icons'

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@sebaris.test')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const googleBtnRef = useRef(null)

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  // Initialize Google Identity Services
  useEffect(() => {
    if (!googleClientId) return

    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (window.google?.accounts?.id) {
        clearInterval(interval)
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          })

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = ''
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: 350,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            })
          }
        } catch (initErr) {
          console.error('GSI Init Error:', initErr)
        }
      } else if (attempts > 30) {
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [googleClientId])

  async function handleGoogleResponse(response) {
    if (!response?.credential) {
      setError('Gagal menerima kredensial otorisasi dari Google.')
      return
    }

    setGoogleLoading(true)
    setError('')
    try {
      await loginWithGoogle(response.credential)
      navigate('/admin/categories')
    } catch (err) {
      setError(err.message || 'Login dengan Google gagal. Pastikan akun Anda memiliki akses.')
    } finally {
      setGoogleLoading(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await login({ email, password })
      navigate('/admin/categories')
    } catch (requestError) {
      setError(requestError.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.')
    } finally {
      setSaving(false)
    }
  }

  function handleFallbackGoogleClick() {
    if (!googleClientId) {
      setError('Google Client ID belum diatur. Silakan masukkan GOOGLE_CLIENT_ID pada file .env terlebih dahulu.')
      return
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
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
            Kelola sesi voting, kategori lomba, finalis, dan pantau perolehan suara secara langsung.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-bold leading-normal">
            {error}
          </div>
        )}

        {/* Google Sign In Section */}
        <div className="space-y-3">
          <div className="flex justify-center">
            {googleClientId ? (
              <div
                ref={googleBtnRef}
                className="w-full flex justify-center min-h-[44px]"
                id="googleSignInBtn"
              />
            ) : (
              <button
                type="button"
                onClick={handleFallbackGoogleClick}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm rounded-xl border border-gray-300 shadow-sm transition-all hover:shadow active:scale-[0.99] cursor-pointer"
              >
                <IconGoogle className="w-5 h-5 flex-shrink-0" />
                <span>Masuk dengan Google</span>
              </button>
            )}
          </div>

          {googleLoading && (
            <p className="text-center text-xs text-[#70B325] font-semibold animate-pulse">
              Memproses autentikasi Google...
            </p>
          )}

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400">
              atau gunakan email admin
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
        </div>

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
            disabled={saving || googleLoading}
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

