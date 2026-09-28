import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../context/ThemeProvider'
import SebarisLogo from '../components/SebarisLogo'
import {
  IconChevronRight,
  IconChevronLeft,
  IconGoogle,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconSun,
  IconMoon,
  IconLock,
  IconShieldCheck,
  IconCheckVote,
} from '../components/Icons'

export default function LoginPage() {
  const { login, register, loginWithGoogle } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  // Register form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isGsiRendered, setIsGsiRendered] = useState(false)
  const googleBtnRef = useRef(null)

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  // Initialize Google Identity Services
  useEffect(() => {
    if (!googleClientId) return

    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (window.google?.accounts?.id && googleBtnRef.current) {
        clearInterval(interval)
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false,
          })

          googleBtnRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: theme === 'dark' ? 'filled_black' : 'outline',
            size: 'large',
            width: 360,
            text: authMode === 'register' ? 'signup_with' : 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          })
          setIsGsiRendered(true)
        } catch (initErr) {
          console.warn('GSI Init Error:', initErr)
          setIsGsiRendered(false)
        }
      } else if (attempts > 25) {
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [googleClientId, authMode, theme])

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
      setError('Google Client ID belum diatur. Silakan periksa konfigurasi VITE_GOOGLE_CLIENT_ID.')
      return
    }
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        })
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn('Google One Tap tidak ditampilkan:', notification.getNotDisplayedReason())
          }
        })
      } catch (err) {
        console.warn('GSI prompt error:', err)
      }
    } else {
      setError('Layanan Google Sign-In sedang dimuat. Mohon tunggu sejenak atau periksa koneksi internet.')
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F7F9F6] dark:bg-[#0A0F0B] text-[#262A25] dark:text-[#F3F5F1] transition-colors duration-300 p-4 sm:p-6 lg:p-10">
      
      {/* 1. Top Navigation Bar */}
      <header className="w-full max-w-[1040px] mx-auto flex items-center justify-between pb-4 sm:pb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-[#70B325] dark:hover:text-[#8FE032] transition-colors"
        >
          <IconChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 shadow-2xs"
          aria-label="Ubah Tema Tampilan"
          title={`Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
        >
          {theme === 'dark' ? (
            <IconSun className="w-4 h-4 text-amber-400" />
          ) : (
            <IconMoon className="w-4 h-4 text-neutral-700" />
          )}
        </button>
      </header>

      {/* 2. Main Unified Split-Card Container */}
      <main className="w-full max-w-[1040px] mx-auto my-auto py-2 sm:py-4">
        
        <div className="bg-white dark:bg-[#141A15] border border-neutral-200/90 dark:border-neutral-800/90 rounded-3xl shadow-2xl shadow-neutral-900/10 overflow-hidden flex flex-col lg:flex-row items-stretch">
          
          {/* =========================================================================
              LEFT SIDE: EDITORIAL & BRAND MISSION
              ========================================================================= */}
          <aside aria-label="Informasi Platform Sebaris.id" className="hidden lg:flex lg:w-5/12 bg-[#141B15] text-white p-8 xl:p-10 flex-col justify-between select-none border-b lg:border-b-0 lg:border-r border-[#222E23]">
            
            {/* Brand Logo */}
            <div>
              <Link to="/" className="inline-block focus:outline-none focus:ring-2 focus:ring-[#70B325] rounded-xl" aria-label="Sebaris.id Beranda">
                <SebarisLogo size="md" variant="white" />
              </Link>
            </div>

          {/* Card Body: Headline & 3 Key Value Pillars */}
          <div className="my-auto py-6 space-y-6">
            <div className="space-y-2.5">
              <h2 className="text-xl xl:text-2xl font-bold tracking-tight text-white leading-snug">
                Pemungutan suara digital yang aman, terbuka, dan akuntabel.
              </h2>
              <p className="text-xs xl:text-sm text-neutral-300 leading-relaxed">
                Mendukung pemilihan organisasi, institusi pendidikan, dan ajang penghargaan dengan integritas data yang terjamin.
              </p>
            </div>

            {/* Authentic Core Features */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5 flex-shrink-0">
                  <IconShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white">
                    Otentikasi Pemilih Sah
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    Verifikasi email resmi dan Google Sign-In untuk memastikan prinsip satu suara sah untuk satu pemilih.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5 flex-shrink-0">
                  <IconLock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white">
                    Kerahasiaan Hak Pilih
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    Pilihan disimpan secara aman dalam bilik suara terenkripsi tanpa intervensi pihak luar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5 flex-shrink-0">
                  <IconCheckVote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white">
                    Tanda Terima Resmi
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                    Setiap voting menghasilkan kode referensi digital sebagai bukti suara telah tercatat.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer: Simple Editorial Quote */}
          <div className="pt-6 border-t border-white/10 text-xs text-neutral-400">
            <p className="italic text-neutral-300">
              &ldquo;Kemudahan akses dan transparansi adalah fondasi kepercayaan dalam setiap proses pemilihan.&rdquo;
            </p>
            <p className="font-semibold text-white mt-1.5">
              Komitmen Sebaris.id
            </p>
          </div>

        </aside>

          {/* =========================================================================
              RIGHT SIDE: AUTHENTICATION FORM
              ========================================================================= */}
          <section aria-label="Formulir Autentikasi" className="w-full lg:w-7/12 p-6 sm:p-8 xl:p-10 flex flex-col justify-between space-y-6">
            
            {/* Brand Logo for Mobile */}
            <div className="lg:hidden flex items-center justify-center pb-1">
            <SebarisLogo size="md" variant={theme === 'dark' ? 'white' : 'default'} />
          </div>

          {/* Heading */}
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {authMode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {authMode === 'login'
                ? 'Masukkan kredensial Anda untuk mengakses bilik suara.'
                : 'Daftarkan akun pemilih baru untuk berpartisipasi dalam pemilihan.'}
            </p>
          </div>

          {/* Segmented Mode Switcher (Shadcn Tabs Style) */}
          <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800/70 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login')
                setError('')
              }}
              className={`flex-1 py-2 text-xs rounded-lg transition-all cursor-pointer font-semibold ${
                authMode === 'login'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register')
                setError('')
              }}
              className={`flex-1 py-2 text-xs rounded-lg transition-all cursor-pointer font-semibold ${
                authMode === 'register'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-2xs font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Daftar
            </button>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          {/* Google SSO Container */}
          <div className="space-y-3">
            <div className="flex justify-center w-full min-h-[44px]">
              {/* Google official rendered button container */}
              <div
                ref={googleBtnRef}
                className={`w-full flex justify-center ${isGsiRendered ? 'block' : 'hidden'}`}
                id="googleSignInBtn"
              />

              {/* Resilient Fallback Button */}
              {!isGsiRendered && (
                <button
                  type="button"
                  onClick={handleFallbackGoogleClick}
                  className="w-full h-11 flex items-center justify-center gap-3 px-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-xs sm:text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-2xs transition-all cursor-pointer active:scale-[0.99]"
                >
                  <IconGoogle className="w-4 h-4 flex-shrink-0" />
                  <span>{authMode === 'login' ? 'Lanjutkan dengan Google' : 'Daftar dengan Google'}</span>
                </button>
              )}
            </div>

            {googleLoading && (
              <p className="text-center text-xs text-[#70B325] dark:text-[#8FE032] font-semibold animate-pulse">
                Menghubungkan ke layanan Google...
              </p>
            )}

            {/* Clean Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800" />
              <span className="flex-shrink mx-3 text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                atau lanjutkan dengan email
              </span>
              <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800" />
            </div>
          </div>

          {/* Form Content */}
          {authMode === 'login' ? (
            /* Mode 1: Login Form */
            <form onSubmit={submitLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Alamat Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  autoComplete="email"
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/60 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#70B325] focus:border-transparent transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/60 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#70B325] focus:border-transparent transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-600 dark:text-neutral-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#70B325] focus:ring-[#70B325] border-neutral-300 dark:border-neutral-700"
                  />
                  <span>Ingat saya</span>
                </label>

                <a
                  href="https://wa.me/6281234567890?text=Halo%20Admin%20Sebaris,%20saya%20butuh%20bantuan%20reset%20kata%20sandi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#48781B] dark:text-[#8FE032] hover:underline"
                >
                  Lupa kata sandi?
                </a>
              </div>

              <button
                type="submit"
                disabled={saving || googleLoading}
                className="w-full h-11 px-4 rounded-xl bg-[#70B325] hover:bg-[#5F9B1E] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {saving ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <span>Masuk ke Akun</span>
                    <IconChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Mode 2: Register Form */
            <form onSubmit={submitRegister} className="space-y-3.5">
              <div className="space-y-1.5">
                <label htmlFor="reg-name" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nama Lengkap
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  autoComplete="name"
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/60 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#70B325] focus:border-transparent transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-email" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Alamat Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  autoComplete="email"
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/60 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#70B325] focus:border-transparent transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="reg-password" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {showRegPassword ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                    <span>{showRegPassword ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </div>
                <input
                  id="reg-password"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/60 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#70B325] focus:border-transparent transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Konfirmasi Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="text-[11px] font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {showRegConfirmPassword ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                    <span>{showRegConfirmPassword ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </div>
                <input
                  id="reg-confirm-password"
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi"
                  autoComplete="new-password"
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/60 text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#70B325] focus:border-transparent transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving || googleLoading}
                className="w-full h-11 px-4 rounded-xl bg-[#70B325] hover:bg-[#5F9B1E] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {saving ? (
                  <span>Mendaftarkan...</span>
                ) : (
                  <>
                    <IconCheck className="w-4 h-4 stroke-[3]" />
                    <span>Daftar Akun Baru</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switcher Text */}
          <div className="pt-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
            {authMode === 'login' ? (
              <p>
                Belum memiliki akun pemilih?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register')
                    setError('')
                  }}
                  className="font-bold text-[#48781B] dark:text-[#8FE032] hover:underline cursor-pointer"
                >
                  Daftar sekarang
                </button>
              </p>
            ) : (
              <p>
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login')
                    setError('')
                  }}
                  className="font-bold text-[#48781B] dark:text-[#8FE032] hover:underline cursor-pointer"
                >
                  Masuk ke akun
                </button>
              </p>
            )}
          </div>

          {/* Legal Disclaimer */}
          <div className="pt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/80">
            Dengan melanjutkan, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi Sebaris.id.
          </div>

          </section>

        </div>

      </main>

      {/* 3. Bottom Footer Note */}
      <footer className="w-full max-w-[1040px] mx-auto text-center text-[11px] text-neutral-400 dark:text-neutral-600 select-none py-2">
        <span>Sebaris.id &bull; Platform Pemilihan Digital Resmi</span>
      </footer>

    </div>
  )
}
