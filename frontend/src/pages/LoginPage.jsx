import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../context/ThemeProvider'
import SebarisLogo from '../components/SebarisLogo'
import mascotImg from '../assets/mascot-sebaris-login.jpg'
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
  IconZap,
  IconSparkles,
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
            width: 320,
            text: authMode === 'register' ? 'signup_with' : 'continue_with',
            shape: 'pill',
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
      setError('Google Client ID belum diatur. Silakan masukkan VITE_GOOGLE_CLIENT_ID pada file .env.')
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
            console.warn('Google One Tap not displayed:', notification.getNotDisplayedReason())
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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F5F8F2] via-[#EDF5E8] to-[#E2EEDC] dark:from-[#0B100B] dark:via-[#111711] dark:to-[#0D130D] text-[#262A25] dark:text-[#F3F5F1] flex items-center justify-center p-3 sm:p-6 lg:p-10 transition-colors duration-300">
      
      {/* Outer Card Container with Soft Glass Shadow */}
      <div className="w-full max-w-5xl bg-white dark:bg-[#141B13] border border-[#E5EADF] dark:border-[#243021] rounded-[28px] sm:rounded-[36px] shadow-[0_20px_60px_-15px_rgba(20,50,15,0.12)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* =========================================================================
              LEFT COLUMN: SEBARIS OFFICIAL MASCOT & PROMO ADS (5 cols on lg)
              ========================================================================= */}
          <div className="lg:col-span-6 relative bg-gradient-to-br from-[#F0F6EB] via-[#E8F2E2] to-[#DFECDA] dark:from-[#192318] dark:via-[#141D13] dark:to-[#0F160E] p-6 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#E0E8D9] dark:border-[#243021] select-none">
            
            {/* Ambient Background Decorative Elements */}
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-br from-[#70B325]/25 to-emerald-400/10 blur-2xl pointer-events-none" />
            <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-gradient-to-tl from-emerald-500/20 to-lime-300/10 blur-3xl pointer-events-none" />
            
            {/* Subtle Floating Orbit Sphere (Matches Reference Art) */}
            <div className="absolute top-6 left-8 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#70B325]/30 via-emerald-600/20 to-transparent border border-[#70B325]/20 shadow-xs pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}>
              <div className="absolute inset-x-[-20%] top-1/2 -translate-y-1/2 h-[1.5px] bg-[#70B325]/30 rotate-[-25deg] pointer-events-none" />
            </div>

            {/* Sparkle Specks */}
            <div className="absolute top-12 right-12 w-2 h-2 rounded-full bg-[#70B325] opacity-60 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute bottom-28 left-6 w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-70" />
            <div className="absolute top-1/2 right-6 w-2 h-2 rounded-full bg-lime-400 opacity-60" />

            {/* Top Brand Tag */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-md border border-[#D5E6C4] dark:border-white/10 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#70B325] animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#48781B] dark:text-[#8FE032]">
                  Maskot Resmi Sebaris
                </span>
              </div>

              {/* Security Pill */}
              <div className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                <IconLock className="w-3.5 h-3.5 text-[#70B325]" />
                <span>E-Voting Terverifikasi</span>
              </div>
            </div>

            {/* Center Mascot Artwork with Speech Bubbles */}
            <div className="relative z-10 my-6 sm:my-8 flex flex-col items-center justify-center">
              
              {/* Floating Password Speech Bubble (Left, matching reference image) */}
              <div className="absolute -top-3 left-2 sm:left-4 z-20 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-[#1E291C]/95 backdrop-blur-md border border-[#D5E6C4] dark:border-white/15 shadow-lg flex items-center gap-2 animate-bounce" style={{ animationDuration: '4s' }}>
                <span className="text-xs font-mono tracking-widest text-[#70B325] font-black">••••••</span>
                <IconLock className="w-3.5 h-3.5 text-[#70B325]" />
              </div>

              {/* Floating Verification Speech Bubble (Right, matching reference image) */}
              <div className="absolute bottom-8 right-2 sm:right-4 z-20 px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-[#1E291C]/95 backdrop-blur-md border border-[#D5E6C4] dark:border-white/15 shadow-lg flex items-center gap-1.5 shadow-emerald-500/10">
                <div className="w-4 h-4 rounded-full bg-[#70B325] text-white flex items-center justify-center">
                  <IconCheck className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="text-[11px] font-extrabold text-gray-800 dark:text-gray-200">Vote Sah &amp; Aman</span>
              </div>

              {/* Main Mascot Visual Frame */}
              <div className="relative w-52 sm:w-64 lg:w-72 aspect-square rounded-3xl overflow-hidden border-2 border-white/80 dark:border-white/15 shadow-2xl bg-gradient-to-b from-white/60 to-transparent group">
                <img
                  src={mascotImg}
                  alt="Maskot Sebaris.id"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out select-none"
                  draggable={false}
                  loading="eager"
                />
                {/* Subtle Inner Glow */}
                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/10 rounded-3xl pointer-events-none" />
              </div>
            </div>

            {/* Bottom Marketing Headline & Copy (Matches Reference) */}
            <div className="relative z-10 text-center sm:text-left space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#1E3014] dark:text-white tracking-tight leading-snug">
                Suarakan Pilihanmu, Wujudkan Perubahan Nyata.
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
                Dukung kandidat favoritmu dengan aman dan transparan di platform e-voting resmi pertama dengan verifikasi tanda terima e-receipt di Indonesia.
              </p>

              {/* Feature Micro-Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/70 dark:bg-black/30 border border-[#D5E6C4] dark:border-white/10 text-[10px] font-bold text-[#48781B] dark:text-[#8FE032]">
                  <IconZap className="w-3 h-3" />
                  <span>Real-Time Tabulasi</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/70 dark:bg-black/30 border border-[#D5E6C4] dark:border-white/10 text-[10px] font-bold text-[#48781B] dark:text-[#8FE032]">
                  <IconSparkles className="w-3 h-3 text-amber-500" />
                  <span>1x Vote Gratis</span>
                </span>
              </div>
            </div>

          </div>

          {/* =========================================================================
              RIGHT COLUMN: AUTHENTICATION FORMS (7 cols on lg)
              ========================================================================= */}
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white dark:bg-[#141B13]">
            
            <div>
              {/* Top Controls: Logo + Back to Home + Theme Toggle */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100 dark:border-white/10">
                <Link
                  to="/"
                  className="flex items-center gap-2 group focus:outline-none"
                  aria-label="Sebaris.id Beranda"
                >
                  <SebarisLogo
                    size="sm"
                    variant={theme === 'dark' ? 'white' : 'default'}
                  />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-amber-400 hover:bg-gray-200 dark:hover:bg-white/20"
                    aria-label="Ubah Tema"
                    title={`Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
                  >
                    {theme === 'dark' ? (
                      <IconSun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <IconMoon className="w-4 h-4 text-gray-700" />
                    )}
                  </button>

                  <Link
                    to="/"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-[#70B325] dark:hover:text-[#8FE032] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors no-underline"
                  >
                    <IconChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Beranda</span>
                  </Link>
                </div>
              </div>

              {/* Form Header Title */}
              <div className="space-y-1.5 mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  {authMode === 'login' ? 'Masuk ke Akun Anda' : 'Buat Akun Pemilih Baru'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {authMode === 'login'
                    ? 'Silakan masuk untuk memberikan suara, melihat riwayat voting, atau mengelola event.'
                    : 'Daftarkan akun pemilih Anda untuk mendukung kandidat favorit dalam pemilihan resmi.'}
                </p>
              </div>

              {/* Tab Switcher: Masuk vs Daftar */}
              <div className="flex bg-[#F2F6EF] dark:bg-black/30 p-1 rounded-2xl mb-5 border border-[#E5EADF] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login')
                    setError('')
                  }}
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-[#20291D] text-[#262A25] dark:text-white shadow-sm'
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
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white dark:bg-[#20291D] text-[#262A25] dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Daftar Baru
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 p-3.5 rounded-2xl text-xs font-bold leading-normal animate-shake">
                  {error}
                </div>
              )}

              {/* Google Single Sign-On Button */}
              <div className="space-y-3 mb-5">
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
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-[#1E281C] hover:bg-gray-50 dark:hover:bg-[#273424] text-gray-800 dark:text-gray-100 font-bold text-xs sm:text-sm rounded-2xl border border-gray-300 dark:border-white/15 shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <IconGoogle className="w-5 h-5 flex-shrink-0" />
                      <span>{authMode === 'login' ? 'Masuk dengan Google' : 'Daftar dengan Google'}</span>
                    </button>
                  )}
                </div>

                {googleLoading && (
                  <p className="text-center text-xs text-[#70B325] dark:text-[#8FE032] font-bold animate-pulse">
                    Memproses otorisasi Google...
                  </p>
                )}

                {/* Divider Line */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-200 dark:border-white/10" />
                  <span className="flex-shrink mx-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                    atau dengan email &amp; kata sandi
                  </span>
                  <div className="flex-grow border-t border-gray-200 dark:border-white/10" />
                </div>
              </div>

              {/* =====================================================================
                  FORM 1: LOGIN MODE
                  ===================================================================== */}
              {authMode === 'login' ? (
                <form onSubmit={submitLogin} className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Alamat Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@domain.com"
                      autoComplete="email"
                      className="form-input text-xs sm:text-sm py-2.5 sm:py-3 rounded-2xl"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="login-password" className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                        <span>{showPassword ? 'Sembunyikan' : 'Tampilkan'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="form-input text-xs sm:text-sm py-2.5 sm:py-3 pr-10 rounded-2xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password Row (Matching Reference) */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 dark:text-gray-400 font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#70B325] focus:ring-[#70B325] border-gray-300 dark:border-white/20 bg-transparent"
                      />
                      <span>Ingat Saya</span>
                    </label>

                    <a
                      href="https://wa.me/6281234567890?text=Halo%20Admin%20Sebaris,%20saya%20butuh%20bantuan%20reset%20kata%20sandi%20akun%20saya"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#48781B] dark:text-[#8FE032] hover:underline"
                    >
                      Lupa Password?
                    </a>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={saving || googleLoading}
                    className="w-full py-3.5 px-5 rounded-2xl bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {saving ? (
                      <span>Memverifikasi Akun...</span>
                    ) : (
                      <>
                        <span>Masuk ke Akun</span>
                        <IconChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* =====================================================================
                    FORM 2: REGISTER MODE
                    ===================================================================== */
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
                      className="form-input text-xs sm:text-sm py-2.5 sm:py-3 rounded-2xl"
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
                      className="form-input text-xs sm:text-sm py-2.5 sm:py-3 rounded-2xl"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="reg-password" className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {showRegPassword ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                        <span>{showRegPassword ? 'Sembunyikan' : 'Tampilkan'}</span>
                      </button>
                    </div>
                    <input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      autoComplete="new-password"
                      className="form-input text-xs sm:text-sm py-2.5 sm:py-3 rounded-2xl"
                      minLength={6}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="reg-confirm-password" className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Konfirmasi Kata Sandi
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {showRegConfirmPassword ? <IconEyeOff className="w-3.5 h-3.5" /> : <IconEye className="w-3.5 h-3.5" />}
                        <span>{showRegConfirmPassword ? 'Sembunyikan' : 'Tampilkan'}</span>
                      </button>
                    </div>
                    <input
                      id="reg-confirm-password"
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi"
                      autoComplete="new-password"
                      className="form-input text-xs sm:text-sm py-2.5 sm:py-3 rounded-2xl"
                      minLength={6}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving || googleLoading}
                    className="w-full py-3.5 px-5 rounded-2xl bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {saving ? (
                      <span>Mendaftarkan Akun...</span>
                    ) : (
                      <>
                        <IconCheck className="w-4 h-4 stroke-[3]" />
                        <span>Daftar Akun Baru</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Switcher Prompt (Matches Reference Image) */}
            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/10 text-center text-xs text-gray-500 dark:text-gray-400">
              {authMode === 'login' ? (
                <p>
                  Belum punya akun pemilih?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register')
                      setError('')
                    }}
                    className="font-extrabold text-[#48781B] dark:text-[#8FE032] hover:underline cursor-pointer"
                  >
                    Daftar Akun Baru
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
                    className="font-extrabold text-[#48781B] dark:text-[#8FE032] hover:underline cursor-pointer"
                  >
                    Masuk ke Akun
                  </button>
                </p>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
