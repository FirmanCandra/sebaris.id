import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// Web Audio sound generator for crisp, futuristic UI sound effects
function playSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    if (type === 'click') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } else if (type === 'chime') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08) // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16) // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } else if (type === 'swoosh') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.18)
    } else if (type === 'pop') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.06)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.07)
    }
  } catch {
    // AudioContext blocked or not supported
  }
}

const SCENES = [
  {
    id: 1,
    title: 'The Evolution',
    label: 'Masalah vs Solusi',
    duration: 6500,
  },
  {
    id: 2,
    title: 'Instant Vote & QRIS',
    label: 'Vote & Bayar QRIS',
    duration: 7500,
  },
  {
    id: 3,
    title: 'Live Leaderboard',
    label: 'Tabulasi Real-Time',
    duration: 7000,
  },
  {
    id: 4,
    title: 'Real-Time Engagement',
    label: 'Live Ticker & Pesan',
    duration: 6500,
  },
  {
    id: 5,
    title: 'Official E-Receipt',
    label: 'Invoice ke Email',
    duration: 6500,
  },
  {
    id: 6,
    title: 'All-in-One Platform',
    label: 'Daftar Event & CTA',
    duration: 7500,
  },
]

export default function PromoMotionPage() {
  const [activeTab, setActiveTab] = useState('mp4') // 'mp4' | 'interactive'
  const [currentScene, setCurrentScene] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [viewMode, setViewMode] = useState('mobile') // 'mobile' | 'desktop'
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1) // 0.8 | 1 | 1.25

  // Simulation states inside scenes
  const [simVoteSelected, setSimVoteSelected] = useState('paid50')
  const [simPaidSuccess, setSimPaidSuccess] = useState(false)
  const [simCountSarah, setSimCountSarah] = useState(1200)
  const [simCountReza, setSimCountReza] = useState(980)

  const timerRef = useRef(null)
  const progressIntervalRef = useRef(null)

  // Audio helper respecting soundEnabled
  const triggerSound = (type) => {
    if (soundEnabled) playSound(type)
  }

  // Handle scene change and progress bar
  useEffect(() => {
    if (!isPlaying) return

    const sceneDuration = SCENES[currentScene].duration / speed
    const stepTime = 50
    const increment = (stepTime / sceneDuration) * 100

    setProgress(0)
    triggerSound('swoosh')

    // Reset sub-scene animation triggers
    setSimPaidSuccess(false)
    if (currentScene === 1) {
      // Scene 2: QRIS simulation
      setTimeout(() => {
        triggerSound('click')
        setSimVoteSelected('paid50')
      }, 1200 / speed)
      setTimeout(() => {
        triggerSound('chime')
        setSimPaidSuccess(true)
      }, 4000 / speed)
    } else if (currentScene === 2) {
      // Scene 3: Counter rising animation
      setSimCountSarah(1200)
      setSimCountReza(980)
      let currentS = 1200
      let currentR = 980
      const counterTimer = setInterval(() => {
        currentS += 45
        currentR += 30
        if (currentS >= 3450) {
          currentS = 3450
          currentR = 2310
          clearInterval(counterTimer)
          triggerSound('chime')
        }
        setSimCountSarah(currentS)
        setSimCountReza(currentR)
      }, 40 / speed)
      return () => clearInterval(counterTimer)
    } else if (currentScene === 3) {
      setTimeout(() => triggerSound('pop'), 800 / speed)
      setTimeout(() => triggerSound('pop'), 2800 / speed)
    } else if (currentScene === 4) {
      setTimeout(() => triggerSound('chime'), 1500 / speed)
    }

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current)
          return 100
        }
        return prev + increment
      })
    }, stepTime)

    timerRef.current = setTimeout(() => {
      setCurrentScene((prev) => (prev + 1) % SCENES.length)
    }, sceneDuration)

    return () => {
      clearTimeout(timerRef.current)
      clearInterval(progressIntervalRef.current)
    }
  }, [currentScene, isPlaying, speed])

  const handleNext = () => {
    triggerSound('click')
    setCurrentScene((prev) => (prev + 1) % SCENES.length)
  }

  const handlePrev = () => {
    triggerSound('click')
    setCurrentScene((prev) => (prev - 1 + SCENES.length) % SCENES.length)
  }

  const handleSelectScene = (idx) => {
    triggerSound('click')
    setCurrentScene(idx)
  }

  return (
    <div className="min-h-screen bg-[#0A0D09] text-gray-100 flex flex-col items-center justify-between p-3 sm:p-6 overflow-hidden select-none font-sans relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#70B325]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#D0FE15]/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP BAR / CONTROL HEADER */}
      <header className="w-full max-w-5xl flex items-center justify-between gap-3 py-2 z-20">
        <Link to="/" className="flex items-center gap-2 group no-underline">
          <div className="w-8 h-8 rounded-lg bg-[#142312] border border-[#70B325]/40 flex items-center justify-center text-[#D0FE15] font-black text-sm shadow-[0_0_15px_rgba(208,254,21,0.25)]">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#D0FE15] transition-colors">
              sebaris<span className="text-[#D0FE15]">.id</span>
            </span>
            <span className="text-[9px] font-semibold tracking-widest uppercase text-gray-400">
              Promo Motion Showcase
            </span>
          </div>
        </Link>

        {/* Tab & Format Controls */}
        <div className="flex items-center gap-2 bg-[#121611]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg flex-wrap sm:flex-nowrap">
          {/* Active Mode Switcher */}
          <div className="flex items-center bg-black/50 p-0.5 rounded-full border border-white/10 text-xs font-bold">
            <button
              onClick={() => {
                triggerSound('click')
                setActiveTab('mp4')
              }}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'mp4'
                  ? 'bg-[#70B325] text-black font-extrabold shadow-[0_0_12px_rgba(112,179,37,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🎬</span>
              <span>Video MP4</span>
            </button>
            <button
              onClick={() => {
                triggerSound('click')
                setActiveTab('interactive')
              }}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === 'interactive'
                  ? 'bg-[#70B325] text-black font-extrabold shadow-[0_0_12px_rgba(112,179,37,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>⚡</span>
              <span>Interaktif</span>
            </button>
          </div>

          {/* Download Direct MP4 Link */}
          <a
            href="/sebaris_promo_motion.mp4"
            download="Sebaris_Official_Promo_1080x1920.mp4"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#D0FE15] text-black hover:bg-white transition-all shadow-[0_0_14px_rgba(208,254,21,0.35)] no-underline"
            title="Unduh File Video Asli Full HD MP4 (1080x1920, 20 Detik)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Unduh MP4</span>
          </a>

          {/* Sound Toggle (for Interactive Mode) */}
          {activeTab === 'interactive' && (
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled)
                if (!soundEnabled) playSound('chime')
              }}
              className={`p-1.5 rounded-full transition-colors ${
                soundEnabled ? 'text-[#D0FE15] bg-[#70B325]/20' : 'text-gray-500 hover:text-gray-300'
              }`}
              title={soundEnabled ? 'Suara Aktif (SFX Nyala)' : 'Suara Mati'}
            >
              {soundEnabled ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      {/* STORY PROGRESS BAR (WHEN INTERACTIVE MODE ACTIVE) */}
      {activeTab === 'interactive' && (
        <div className="w-full max-w-4xl grid grid-cols-6 gap-1.5 py-1 z-20">
          {SCENES.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => handleSelectScene(idx)}
              className="group flex flex-col text-left cursor-pointer"
            >
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 rounded-full ${
                    idx === currentScene
                      ? 'bg-[#D0FE15] shadow-[0_0_8px_#D0FE15]'
                      : idx < currentScene
                      ? 'bg-[#70B325]'
                      : 'bg-transparent'
                  }`}
                  style={{
                    width: idx === currentScene ? `${progress}%` : idx < currentScene ? '100%' : '0%',
                  }}
                />
              </div>
              <span
                className={`hidden sm:inline text-[10px] font-bold mt-1.5 truncate transition-colors ${
                  idx === currentScene ? 'text-[#D0FE15]' : 'text-gray-500 group-hover:text-gray-300'
                }`}
              >
                0{scene.id}. {scene.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* MAIN MOTION STAGE CONTAINER */}
      <main className="flex-1 w-full flex items-center justify-center my-auto py-2 z-10">
        <div
          className={`transition-all duration-500 ease-out relative flex items-center justify-center ${
            viewMode === 'mobile'
              ? 'w-[360px] sm:w-[390px] h-[680px] sm:h-[730px] rounded-[48px] p-3 sm:p-3.5 bg-[#1B2219] shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_35px_rgba(112,179,37,0.2)] border-[4px] border-[#2A3527] ring-1 ring-white/10'
              : 'w-full max-w-4xl aspect-[16/9] rounded-3xl p-6 bg-[#111710] shadow-[0_20px_70px_rgba(0,0,0,0.8)] border border-white/10'
          }`}
        >
          {/* Smartphone Bezel Speaker & Dynamic Island for Mobile Mode */}
          {viewMode === 'mobile' && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-end px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse mr-1" />
              <div className="w-2 h-2 rounded-full bg-blue-500/40" />
            </div>
          )}

          {/* INNER SCREEN STAGE */}
          {activeTab === 'mp4' ? (
            <div className="w-full h-full rounded-[38px] bg-black overflow-hidden relative flex flex-col items-center justify-center border border-white/10">
              <video
                src="/sebaris_promo_motion.mp4"
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover rounded-[36px]"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center justify-between text-[10px] text-gray-300 pointer-events-none">
                <span className="text-[#D0FE15] font-bold">1080x1920 Full HD</span>
                <span>30 FPS • 20 Detik • 100% Asli</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full rounded-[38px] bg-gradient-to-b from-[#0F140E] to-[#070906] border border-white/5 overflow-hidden relative flex flex-col justify-between p-5 sm:p-6 text-white shadow-inner">
            {/* Top Scene Label */}
            <div className="flex items-center justify-between z-20 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-black/50 border border-white/15 text-[#D0FE15] backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D0FE15] animate-ping" />
                Scene 0{SCENES[currentScene].id} • {SCENES[currentScene].label}
              </span>
              <span className="text-[11px] font-bold text-gray-400">
                sebarisproject.id
              </span>
            </div>

            {/* ============================================================== */}
            {/* SCENE 1: THE EVOLUTION (MASALAH VS SOLUSI)                      */}
            {/* ============================================================== */}
            {currentScene === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4 animate-fadeIn">
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#123E2A] to-[#2E6B47] border border-[#D0FE15]/40 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(208,254,21,0.3)] animate-bounce">
                    🗳️
                  </div>
                  <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-[#D0FE15] text-[#123E2A] font-black text-[9px] uppercase tracking-wider shadow-md">
                    Modern
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2 tracking-tight">
                  Revolusi Pemilihan Digital: <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#D0FE15] to-[#70B325]">
                    Akurat, Cepat & Bebas Manipulasi
                  </span>
                </h2>
                <p className="text-xs text-gray-400 max-w-xs mb-5 leading-relaxed">
                  Tinggalkan hitungan kertas manual yang lambat dan rawan sengketa. Beralih ke platform e-voting berstandar industri.
                </p>

                {/* Compare Pill */}
                <div className="w-full max-w-xs grid grid-cols-2 gap-2 text-left">
                  <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-2.5">
                    <span className="text-[9px] font-black text-red-400 uppercase tracking-wider block mb-1">
                      ❌ Cara Lama
                    </span>
                    <p className="text-[11px] text-gray-300 font-semibold leading-tight">
                      Biaya cetak jutaan, hitung 14 hari, rentan curang.
                    </p>
                  </div>
                  <div className="bg-[#142312] border border-[#70B325]/50 rounded-2xl p-2.5 shadow-[0_0_20px_rgba(112,179,37,0.15)]">
                    <span className="text-[9px] font-black text-[#D0FE15] uppercase tracking-wider block mb-1">
                      ✅ Sebaris.id
                    </span>
                    <p className="text-[11px] text-gray-200 font-semibold leading-tight">
                      100% Real-time, instan QRIS & proteksi suara anti-ganda.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SCENE 2: INSTANT VOTE & DYNAMIC QRIS                            */}
            {/* ============================================================== */}
            {currentScene === 1 && (
              <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn py-2">
                {/* Candidate Mockup Card */}
                <div className="w-full max-w-xs bg-[#151D14] border border-[#70B325]/40 rounded-2xl p-3.5 mb-3 shadow-lg relative">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-xl font-bold shadow-md">
                      👑
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#D0FE15] uppercase tracking-wider">
                        Kandidat Favorit #01
                      </span>
                      <h3 className="text-sm font-extrabold text-white">Sarah Aurelia</h3>
                      <p className="text-[11px] text-gray-400">Duta Kampus Indonesia 2026</p>
                    </div>
                  </div>
                </div>

                {/* Simulated QRIS Modal Card */}
                <div className="w-full max-w-xs bg-black/70 border border-white/20 rounded-3xl p-4 backdrop-blur-md relative overflow-hidden shadow-2xl">
                  {/* Glowing Laser Scan Bar */}
                  {!simPaidSuccess && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D0FE15] to-transparent shadow-[0_0_15px_#D0FE15] animate-bounce top-16" />
                  )}

                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      QRIS Nasional Instan
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#70B325]/20 text-[#D0FE15] text-[10px] font-bold">
                      Ref: SVT-2026-9821
                    </span>
                  </div>

                  {/* QRIS Visual Mock */}
                  <div className="w-32 h-32 mx-auto bg-white rounded-2xl p-2 flex flex-col items-center justify-center shadow-lg relative mb-3">
                    <div className="w-full h-full border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center p-2 text-center text-black font-black text-xs tracking-tighter">
                      [ QRIS CODE ]
                    </div>
                    {simPaidSuccess && (
                      <div className="absolute inset-0 bg-emerald-600/95 rounded-2xl flex flex-col items-center justify-center text-white animate-scaleUp">
                        <span className="text-3xl mb-1">✓</span>
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          LUNAS TERVERIFIKASI
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <span className="text-xs text-gray-400 block mb-0.5">Paket Terpilih:</span>
                    <span className="text-base font-black text-[#D0FE15]">
                      50 Suara • Rp 50.000
                    </span>
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">
                      {simPaidSuccess ? '🎉 50 Suara berhasil ditambahkan ke finalis!' : '⚡ Scan via BCA, Mandiri, GoPay, OVO, Dana'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SCENE 3: REAL-TIME TABULATION / LEADERBOARD RACE                 */}
            {/* ============================================================== */}
            {currentScene === 2 && (
              <div className="flex-1 flex flex-col justify-center animate-fadeIn py-2 w-full max-w-xs mx-auto">
                <div className="text-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#D0FE15] bg-[#70B325]/20 px-3 py-1 rounded-full border border-[#70B325]/30">
                    🔴 Live Real-Time Tabulation
                  </span>
                  <h2 className="text-lg font-black text-white mt-2">
                    Leaderboard Perolehan Suara
                  </h2>
                </div>

                {/* Candidate 1 (Sarah) */}
                <div className="bg-[#151D14] border border-[#D0FE15]/40 rounded-2xl p-3 mb-2.5 shadow-md">
                  <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-white">
                      <span className="text-sm">🥇</span> 1. Sarah Aurelia
                    </span>
                    <span className="text-[#D0FE15] font-black font-mono">
                      {simCountSarah.toLocaleString('id-ID')} Suara (59.8%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#70B325] to-[#D0FE15] rounded-full transition-all duration-300 shadow-[0_0_10px_#D0FE15]"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>

                {/* Candidate 2 (Reza) */}
                <div className="bg-[#121611] border border-white/10 rounded-2xl p-3 mb-2.5">
                  <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <span className="text-sm">🥈</span> 2. Reza Pratama
                    </span>
                    <span className="text-gray-300 font-black font-mono">
                      {simCountReza.toLocaleString('id-ID')} Suara (40.2%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-400 rounded-full transition-all duration-300"
                      style={{ width: '40%' }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-center">
                  <span className="text-[10px] text-gray-400 block font-medium">
                    Total Suara Masuk: <strong className="text-white font-mono">{(simCountSarah + simCountReza).toLocaleString('id-ID')} Suara</strong>
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold">
                    🛡️ Database Locking: 100% Anti Suara Ganda
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SCENE 4: LIVE VOTE TICKER & WALL OF SUPPORT                      */}
            {/* ============================================================== */}
            {currentScene === 3 && (
              <div className="flex-1 flex flex-col justify-center animate-fadeIn py-2 w-full max-w-xs mx-auto">
                <div className="text-center mb-3">
                  <span className="text-[10px] font-bold text-[#D0FE15] uppercase tracking-widest">
                    Transparansi & Interaktivitas
                  </span>
                  <h2 className="text-base font-black text-white">
                    Live Vote Ticker & Pesan Dukungan
                  </h2>
                </div>

                {/* Floating Notification Ticker 1 */}
                <div className="bg-[#142312] border border-[#70B325]/50 rounded-2xl p-3 mb-2.5 flex items-center gap-3 shadow-[0_5px_20px_rgba(0,0,0,0.4)] animate-slideDown">
                  <div className="w-10 h-10 rounded-xl bg-[#70B325] text-black font-black flex items-center justify-center text-lg shadow-md">
                    ⚡
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white truncate">Dimas Prasetyo</span>
                      <span className="text-[9px] text-[#D0FE15] font-bold">Baru Saja</span>
                    </div>
                    <p className="text-[11px] text-gray-300 truncate">
                      Memberikan <strong className="text-[#D0FE15]">20 Suara</strong> untuk Sarah Aurelia
                    </p>
                  </div>
                </div>

                {/* Floating Support Message Bubble */}
                <div className="bg-[#161B14] border border-white/10 rounded-2xl p-3 mb-2.5 shadow-md">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-bold">
                      A
                    </div>
                    <span className="text-xs font-bold text-white">Alika — BEM Fakultas</span>
                    <span className="text-[10px] text-gray-500">• 1m lalu</span>
                  </div>
                  <p className="text-xs text-gray-200 italic font-medium leading-relaxed bg-black/30 p-2 rounded-xl">
                    "Semangat kak Sarah! Pasti juara 1! Seluruh angkatan mendukungmu! 🔥🏆"
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center text-[10px] text-gray-400">
                  💬 Pengunjung dapat mengirim pesan langsung saat voting
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SCENE 5: INSTANT EMAIL INVOICE                                   */}
            {/* ============================================================== */}
            {currentScene === 4 && (
              <div className="flex-1 flex flex-col items-center justify-center animate-fadeIn py-2 w-full max-w-xs mx-auto">
                <div className="text-center mb-3">
                  <span className="text-[10px] font-bold text-[#D0FE15] uppercase tracking-widest">
                    Bukti Resmi & Kredibilitas
                  </span>
                  <h2 className="text-base font-black text-white">
                    E-Receipt Otomatis ke Email
                  </h2>
                </div>

                {/* Email Mockup Card */}
                <div className="w-full bg-white text-[#262A25] rounded-3xl p-4 shadow-2xl border border-gray-100 relative overflow-hidden animate-scaleUp">
                  {/* Email Sender Bar */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#123E2A] text-[#D0FE15] font-black text-xs flex items-center justify-center flex-shrink-0">
                        S
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black block truncate text-[#123E2A]">
                          info@sebarisproject.id
                        </span>
                        <span className="text-[9px] text-gray-500 block truncate">
                          Konfirmasi Vote Berhasil — Duta Kampus 2026
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-md flex-shrink-0">
                      Resmi
                    </span>
                  </div>

                  {/* Receipt Items */}
                  <div className="bg-[#F4F9EE] border border-[#CADDB8] rounded-xl p-2.5 mb-2 text-xs">
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-600">ID Referensi:</span>
                      <strong className="font-mono text-[#123E2A]">SVT-20261023-8912</strong>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-600">Finalis:</span>
                      <strong>Sarah Aurelia</strong>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-600">Jumlah Suara:</span>
                      <strong className="text-emerald-700">50 Suara</strong>
                    </div>
                    <div className="flex justify-between py-0.5 border-t border-emerald-200 mt-1 pt-1">
                      <span className="font-bold">Total Pembayaran:</span>
                      <strong className="font-bold text-[#123E2A]">Rp 50.000 (QRIS)</strong>
                    </div>
                  </div>

                  <p className="text-[9px] text-gray-500 text-center m-0">
                    🛡️ Dikirim instan dari server mail resmi Sebaris.id
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SCENE 6: CALL TO ACTION / OUTRO                                 */}
            {/* ============================================================== */}
            {currentScene === 5 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4 animate-fadeIn">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D0FE15]/10 border border-[#D0FE15]/30 text-[#D0FE15] text-[10px] font-extrabold uppercase tracking-widest mb-3">
                  ⚡ Siap untuk Segala Event
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-3">
                  Wujudkan Pemilihan <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#D0FE15] to-[#70B325]">
                    Modern di Kampus & Sekolahmu!
                  </span>
                </h2>

                {/* Event Tags Badge Grid */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-5 max-w-xs">
                  <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-gray-200">
                    🎓 BEM & DEMA
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-gray-200">
                    🏫 OSIS & MPK
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-gray-200">
                    👑 Duta & Pageant
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-gray-200">
                    🎸 Festival Musik
                  </span>
                </div>

                {/* Big CTA */}
                <Link
                  to="/"
                  className="w-full max-w-xs block py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#70B325] to-[#D0FE15] text-black font-black text-sm tracking-wide shadow-[0_0_30px_rgba(208,254,21,0.5)] hover:scale-105 active:scale-95 transition-transform no-underline"
                >
                  Kunjungi sebarisproject.id 🚀
                </Link>
                <span className="text-[10px] text-gray-500 mt-2 block font-medium">
                  Atau daftarkan proposal event Anda dalam hitungan menit
                </span>
              </div>
            )}

            {/* Bottom Brand Watermark */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-2 z-20">
              <span>&copy; {new Date().getFullYear()} Sebaris.id</span>
              <span className="text-[#D0FE15] font-bold">Platform E-Voting #1</span>
            </div>
          </div>
          )}
        </div>
      </main>

      {/* BOTTOM CONTROLLER BAR */}
      <footer className="w-full max-w-xl bg-[#121611]/90 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 shadow-2xl flex items-center justify-between gap-2 z-20 mt-2">
        {activeTab === 'interactive' ? (
          <>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                title="Scene Sebelumnya"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => {
                  triggerSound('click')
                  setIsPlaying(!isPlaying)
                }}
                className="px-4 py-2 rounded-xl bg-[#70B325] text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:bg-[#D0FE15] transition-colors"
              >
                {isPlaying ? (
                  <>
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                    <span>Jeda (Pause)</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Putar (Play)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleNext}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                title="Scene Selanjutnya"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Speed Controls */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 text-[11px] font-bold">
              <span className="text-gray-500 px-1 text-[10px]">Speed:</span>
              {[0.8, 1, 1.25].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    triggerSound('click')
                    setSpeed(s)
                  }}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    speed === s ? 'bg-[#70B325] text-black font-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D0FE15] animate-ping" />
              <span className="text-xs font-bold text-gray-200">
                Official Motion Clip <span className="text-[#D0FE15]">(1080x1920 Full HD)</span>
              </span>
            </div>
            <a
              href="/sebaris_promo_motion.mp4"
              download="Sebaris_Official_Promo_1080x1920.mp4"
              className="text-xs font-black text-black bg-[#D0FE15] hover:bg-white px-3 py-1.5 rounded-xl transition-all shadow-md no-underline flex items-center gap-1"
            >
              <span>⬇ Simpan Video</span>
            </a>
          </div>
        )}

        {/* Back to Home Link */}
        <Link
          to="/"
          className="text-xs font-bold text-gray-400 hover:text-[#D0FE15] transition-colors no-underline px-2 hidden sm:inline"
        >
          Tutup & Kembali →
        </Link>
      </footer>
    </div>
  )
}
