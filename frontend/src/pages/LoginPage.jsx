import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import SebarisLogo from '../components/SebarisLogo'
import { IconChevronRight, IconGoogle, IconCheck } from '../components/Icons'

export default function LoginPage() {
  const { login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Tabs: 'login' | 'register'
  const [authMode, setAuthMode] = useState(() =>
    searchParams.get('tab') === 'register' ? 'register' : 'login'
  )

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'register' || tab === 'login') {
      setAuthMode(tab)
    }
  }, [searchParams])

  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
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
  }, [googleClientId, authMode])

  async function handleGoogleResponse(response) {
    if (!response?.credential) {
      setError('Gagal menerima kredensial otorisasi dari Google.')
      return
    }

    setGoogleLoading(true)
    setError('')
    try {
      const res = await loginWithGoogle(response.credential)
      if (res?.redirect) {
        navigate(res.redirect)
      } else if (res?.role === 'admin' || res?.role === 'superadmin') {
        navigate('/admin/categories')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Login dengan Google gagal. Silakan coba kembali.')
    } finally {
      setGoogleLoading(false)
    }
  }

  async function submitLogin(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await login({ email, password })
      if (res?.redirect) {
        navigate(res.redirect)
      } else if (res?.role === 'admin' || res?.role === 'superadmin') {
        navigate('/admin/categories')
      } else {
        navigate('/')
      }
    } catch (requestError) {
      setError(requestError.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.')
    } finally {
      setSaving(false)
    }
  }

  async function submitRegister(event) {
    event.preventDefault()
    if (regPassword !== regConfirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
      })
      if (res?.redirect) {
        navigate(res.redirect)
      } else {
        navigate('/')
      }
    } catch (requestError) {
      setError(requestError.message || 'Pendaftaran gagal. Pastikan email belum terdaftar.')
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
    <div className="min-h-screen bg-gradient-to-b from-[#F2F8EE] via-[#F6FAF2] to-[#EAF2E4] dark:from-[#121612] dark:via-[#161B15] dark:to-[#0E120E] flex flex-col justify-center items-center p-4 transition-colors duration-300">
      {/* Back to Home Link */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-[#70B325] dark:hover:text-[#86C839] transition-colors flex items-center gap-1 no-underline"
        >
          <span>← Kembali ke Beranda</span>
        </Link>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">sebaris.id</span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#1A2018] border border-[#E5EADF] dark:border-[#2C3529] rounded-3xl p-7 sm:p-8 shadow-xl space-y-5 transition-colors">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-1">
            <SebarisLogo size="md" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#262A25] dark:text-white tracking-tight">
            {authMode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Pemilih Baru'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed px-2">
            {authMode === 'login'
              ? 'Masuk untuk memberikan suara, mengelola sistem, atau melihat riwayat pemilihan.'
              : 'Daftarkan diri Anda untuk memberikan suara pada event voting dan finalis favorit.'}
          </p>
        </div>

        {/* Tab Switcher: Masuk vs Daftar */}
        <div className="flex bg-[#F4F6F2] dark:bg-black/30 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login')
              setError('')
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-white dark:bg-[#252E21] text-[#262A25] dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register')
              setError('')
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
              authMode === 'register'
                ? 'bg-white dark:bg-[#252E21] text-[#262A25] dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-3.5 rounded-xl text-xs font-bold leading-normal">
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
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm rounded-xl border border-gray-300 shadow-xs transition-all hover:shadow active:scale-[0.99] cursor-pointer"
              >
                <IconGoogle className="w-5 h-5 flex-shrink-0" />
                <span>Masuk dengan Google</span>
              </button>
            )}
          </div>

          {googleLoading && (
            <p className="text-center text-xs text-[#70B325] font-semibold animate-pulse">
              Memproses akun Google & mengirim email notifikasi...
            </p>
          )}

          {/* Divider */}
          <div className="relative flex py-1.5 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-semibold text-gray-400">
              atau dengan email & kata sandi
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>
        </div>

        {/* MODE 1: LOGIN FORM */}
        {authMode === 'login' ? (
          <form onSubmit={submitLogin} className="space-y-3.5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Email 
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.com"
                autoComplete="email"
                className="form-input text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Kata Sandi
                </label>
              </div>
              <input
                id="login-password"
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
              className="btn-primary w-full text-xs sm:text-sm font-bold shadow-md cursor-pointer mt-2"
            >
              {saving ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <span>Masuk Sekarang</span>
                  <IconChevronRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>
        ) : (
          /* MODE 2: REGISTER FORM */
          <form onSubmit={submitRegister} className="space-y-3.5">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Nama Lengkap
              </label>
              <input
                id="reg-name"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                autoComplete="name"
                className="form-input text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Alamat Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="nama@domain.com"
                autoComplete="email"
                className="form-input text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Kata Sandi
              </label>
              <input
                id="reg-password"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                className="form-input text-xs sm:text-sm"
                minLength={6}
                required
              />
            </div>

            <div>
              <label htmlFor="reg-confirm-password" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Konfirmasi Kata Sandi
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi"
                autoComplete="new-password"
                className="form-input text-xs sm:text-sm"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving || googleLoading}
              className="btn-primary w-full text-xs sm:text-sm font-bold shadow-md cursor-pointer mt-2"
            >
              {saving ? (
                <span>Mendaftarkan Akun...</span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <IconCheck className="w-4 h-4" />
                  <span>Daftar Akun Baru</span>
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
