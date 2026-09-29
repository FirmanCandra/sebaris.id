import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import { useUserAuth } from '../auth/AuthProvider'
import { api } from '../api/client'
import {
  IconCheck,
  IconCheckVote,
  IconCalendar,
  IconClose,
  IconSearch,
  IconExternal,
  IconTrophy,
  IconLayers,
  IconUsers,
  IconArrowRight,
  IconChevronRight,
  IconCoins,
} from '../components/Icons'

export default function RegisterEventPage() {
  const { user } = useUserAuth()

  // Tab State: 'form' | 'check'
  const [activeTab, setActiveTab] = useState('form')

  // Form State
  const [formData, setFormData] = useState({
    organization_name: '',
    pic_name: user?.name || '',
    pic_email: user?.email || '',
    pic_phone: '',
    event_name: '',
    event_description: '',
    estimated_finalists: '6 - 10 Kandidat',
    voting_type: 'hybrid', // free, paid, hybrid
    target_start_date: '',
    target_end_date: '',
    notes: '',
  })

  // Dynamic Categories Plan
  const [categories, setCategories] = useState(['Kategori Utama'])
  const [newCatInput, setNewCatInput] = useState('')

  // Add-ons Plan
  const [addons, setAddons] = useState({
    live_stage: true,
    pdf_report: true,
    anti_bot: true,
    wall_of_support: true,
    whatsapp_notify: false,
  })

  // Submission State
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successData, setSuccessData] = useState(null)
  const [copied, setCopied] = useState(false)

  // Tracking / Check Status State
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState('')

  // Handle Form Change
  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle Category Add
  function handleAddCategory(e) {
    e.preventDefault()
    const trimmed = newCatInput.trim()
    if (!trimmed) return
    if (categories.includes(trimmed)) return
    setCategories((prev) => [...prev, trimmed])
    setNewCatInput('')
  }

  // Handle Category Remove
  function handleRemoveCategory(indexToRemove) {
    if (categories.length <= 1) return
    setCategories((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  // Handle Addon Toggle
  function handleToggleAddon(key) {
    setAddons((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Submit Handler
  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.organization_name.trim()) {
      setErrorMsg('Harap isi nama organisasi / lembaga penyelenggara.')
      return
    }
    if (!formData.pic_name.trim()) {
      setErrorMsg('Harap isi nama penanggung jawab (PIC).')
      return
    }
    if (!formData.pic_phone.trim()) {
      setErrorMsg('Harap cantumkan nomor WhatsApp PIC aktif.')
      return
    }
    if (!formData.event_name.trim()) {
      setErrorMsg('Harap isi nama ajang atau event voting Anda.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        category_names: categories,
        addons,
      }

      const res = await api('/event-registrations', {
        method: 'POST',
        body: payload,
      })

      if (res.status === 'success' || res.data) {
        setSuccessData(res.data)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setErrorMsg(res.message || 'Gagal mengajukan pendaftaran event.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Terjadi gangguan jaringan saat mengirim formulir.')
    } finally {
      setSubmitting(false)
    }
  }

  // Track / Check Status Handler
  async function handleSearchStatus(e) {
    e?.preventDefault()
    const query = searchQuery.trim()
    if (!query) return

    setSearching(true)
    setSearchError('')
    setSearchResult(null)

    try {
      // Jika formatnya nomor registrasi SBR-XXXX
      if (query.toUpperCase().startsWith('SBR-')) {
        const res = await api(`/event-registrations/${encodeURIComponent(query.toUpperCase())}`)
        setSearchResult(res.data ? [res.data] : [])
      } else {
        const res = await api(`/event-registrations/search?q=${encodeURIComponent(query)}`)
        if (res.data && res.data.length > 0) {
          setSearchResult(res.data)
        } else {
          setSearchError('Tidak ditemukan pengajuan event dengan nomor registrasi atau kontak tersebut.')
        }
      }
    } catch (err) {
      setSearchError('Pengajuan event tidak ditemukan. Mohon periksa kembali nomor registrasi Anda.')
    } finally {
      setSearching(false)
    }
  }

  function handleCopyNumber(num) {
    navigator.clipboard.writeText(num)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getWhatsAppAdminLink(regNumber, eventName, picName) {
    const text = `Halo Tim Sebaris.id, saya ${picName} ingin mengonfirmasi pendaftaran event e-voting kami:\n\n*Nama Event:* ${eventName}\n*No. Registrasi:* ${regNumber}\n\nMohon informasi langkah selanjutnya untuk peninjauan dan aktivasi sistem voting kami. Terima kasih!`
    return `https://wa.me/6281234567890?text=${encodeURIComponent(text)}`
  }

  function renderStatusBadge(status) {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Disetujui &amp; Event Aktif
          </span>
        )
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Sedang Ditinjau Tim Operasional
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-300 dark:border-red-800">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Perlu Penyesuaian
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Menunggu Verifikasi Tim
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-bg)] text-[var(--neutral-text-main)] transition-colors pb-20">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF7E3] dark:bg-[#70B325]/15 border border-[#CADDB8] dark:border-[#70B325]/30 text-[#48781B] dark:text-[#8FE032] text-xs font-black tracking-wide uppercase">
          <IconTrophy className="w-3.5 h-3.5" />
          <span>Layanan Self-Service Panitia &amp; Event</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--neutral-text-main)] leading-tight">
          Daftarkan Event E-Voting Anda di{' '}
          <span className="text-[#70B325] dark:text-[#8FE032] underline decoration-wavy decoration-[#70B325]/40">
            Sebaris.id
          </span>
        </h1>

        <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Platform pemungutan suara digital terpercaya untuk pemilihan ketua BEM, ajang penghargaan, duta kampus, dan komunitas. Tabulasi real-time, QRIS otomatis, dan proteksi anti-kecurangan.
        </p>

        {/* Feature Pills */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300">
          <span className="px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-2xs">
            ⚡ Siap dalam 2-6 Jam
          </span>
          <span className="px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-2xs">
            📊 Tabulasi Real-Time &amp; Layar Panggung
          </span>
          <span className="px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-2xs">
            🛡️ Proteksi 1 Akun 1 Suara
          </span>
          <span className="px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-2xs">
            💳 Terintegrasi QRIS Otomatis
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="pt-6 flex justify-center">
          <div className="inline-flex p-1 rounded-2xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setActiveTab('form')
                setSuccessData(null)
              }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-white dark:bg-[#151C14] text-[#70B325] dark:text-[#8FE032] shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Formulir Pendaftaran Event
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('check')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeTab === 'check'
                  ? 'bg-white dark:bg-[#151C14] text-[#70B325] dark:text-[#8FE032] shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Lacak Status Pendaftaran
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* SUCCESS POP-UP TICKET */}
        {successData && (
          <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#151C14] border-2 border-[#70B325] shadow-2xl space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#EBF7E3] dark:bg-[#70B325]/20 text-[#70B325] dark:text-[#8FE032] flex items-center justify-center mx-auto">
                <IconCheck className="w-8 h-8 stroke-3" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-[#70B325] dark:text-[#8FE032] bg-[#EBF7E3] dark:bg-[#70B325]/15 px-3 py-1 rounded-full inline-block">
                Pendaftaran Berhasil Diajukan
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Terima Kasih, Panitia {successData.organization_name}!
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                Permohonan sistem e-voting untuk <strong>{successData.event_name}</strong> telah masuk ke antrean verifikasi tim Sebaris.id.
              </p>
            </div>

            {/* Registration Ticket Card */}
            <div className="p-5 rounded-2xl bg-[#F8FAF7] dark:bg-white/5 border border-dashed border-[#CADDB8] dark:border-white/15 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200 dark:border-white/10">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Nomor Registrasi Resmi
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg sm:text-xl font-black text-[#262A25] dark:text-white">
                      {successData.registration_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyNumber(successData.registration_number)}
                      className="text-xs font-bold text-[#70B325] dark:text-[#8FE032] hover:underline cursor-pointer"
                    >
                      {copied ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                </div>
                <div>{renderStatusBadge(successData.status)}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Penanggung Jawab (PIC):</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {successData.pic_name} ({successData.pic_phone})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Model Voting:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                    {successData.voting_type === 'free'
                      ? 'Gratis Penuh (1 Akun 1 Suara)'
                      : successData.voting_type === 'paid'
                      ? 'Berbayar / Donasi QRIS'
                      : 'Hybrid (Gratis + Opsi Berbayar)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <a
                href={getWhatsAppAdminLink(
                  successData.registration_number,
                  successData.event_name,
                  successData.pic_name
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BE5C] text-white font-black text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Konfirmasi ke Admin via WhatsApp</span>
                <IconExternal className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery(successData.registration_number)
                  setActiveTab('check')
                  setSuccessData(null)
                  handleSearchStatus()
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white font-black text-xs sm:text-sm text-center transition-all cursor-pointer"
              >
                Lacak Status di Website
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: FORMULIR PENDAFTARAN */}
        {activeTab === 'form' && !successData && (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-9 rounded-3xl bg-white dark:bg-[#151C14] border border-gray-200/80 dark:border-white/10 shadow-xl space-y-8"
          >
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {/* Bagian 1: Data Organisasi & PIC */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                <span className="w-7 h-7 rounded-xl bg-[#EBF7E3] dark:bg-[#70B325]/20 text-[#48781B] dark:text-[#8FE032] font-black text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                  Identitas Organisasi &amp; Penanggung Jawab
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Nama Lembaga / Organisasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    placeholder="Contoh: BEM Fakultas Teknik, Yayasan Putera Kampus..."
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] dark:focus:border-[#70B325] focus:outline-none transition-colors text-xs text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Nama Ketua Panitia / PIC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pic_name"
                    value={formData.pic_name}
                    onChange={handleChange}
                    placeholder="Nama lengkap penanggung jawab"
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] dark:focus:border-[#70B325] focus:outline-none transition-colors text-xs text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Nomor WhatsApp PIC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="pic_phone"
                    value={formData.pic_phone}
                    onChange={handleChange}
                    placeholder="Contoh: 081234567890 (Untuk koordinasi panitia)"
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] dark:focus:border-[#70B325] focus:outline-none transition-colors text-xs text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Email Resmi PIC / Organisasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="pic_email"
                    value={formData.pic_email}
                    onChange={handleChange}
                    placeholder="email@kampus.ac.id atau email pribadi PIC"
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] dark:focus:border-[#70B325] focus:outline-none transition-colors text-xs text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Informasi Event */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                <span className="w-7 h-7 rounded-xl bg-[#EBF7E3] dark:bg-[#70B325]/20 text-[#48781B] dark:text-[#8FE032] font-black text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                  Detail &amp; Informasi Event Voting
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Nama Ajang / Event Voting <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="event_name"
                    value={formData.event_name}
                    onChange={handleChange}
                    placeholder="Contoh: Pemilihan Ketua BEM FT 2026, Putera Puteri Kampus 2026..."
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] dark:focus:border-[#70B325] focus:outline-none transition-colors text-xs text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Deskripsi Singkat / Tujuan Pemilihan
                  </label>
                  <textarea
                    name="event_description"
                    value={formData.event_description}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Jelaskan secara singkat mengenai event ini, siapa target pemilihnya, dan mekanisme umumnya..."
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] dark:focus:border-[#70B325] focus:outline-none transition-colors text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                      Target Tanggal Mulai Voting
                    </label>
                    <input
                      type="date"
                      name="target_start_date"
                      value={formData.target_start_date}
                      onChange={handleChange}
                      className="w-full h-11 px-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] dark:focus:border-[#70B325] focus:outline-none transition-colors text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                      Target Tanggal Selesai Voting
                    </label>
                    <input
                      type="date"
                      name="target_end_date"
                      value={formData.target_end_date}
                      onChange={handleChange}
                      className="w-full h-11 px-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] dark:focus:border-[#70B325] focus:outline-none transition-colors text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian 3: Model Pemungutan Suara */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                <span className="w-7 h-7 rounded-xl bg-[#EBF7E3] dark:bg-[#70B325]/20 text-[#48781B] dark:text-[#8FE032] font-black text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                  Model &amp; Mekanisme Suara
                </h3>
              </div>

              <div className="space-y-3">
                <label className="font-bold text-gray-700 dark:text-gray-300 block text-xs">
                  Pilih Model Voting yang Diinginkan:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Option 1: Hybrid */}
                  <div
                    onClick={() => setFormData((prev) => ({ ...prev, voting_type: 'hybrid' }))}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-1.5 ${
                      formData.voting_type === 'hybrid'
                        ? 'border-[#70B325] bg-[#F4F9EE] dark:bg-[#70B325]/10 shadow-xs'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-gray-900 dark:text-white">
                        1. Hybrid (Favorit)
                      </span>
                      {formData.voting_type === 'hybrid' && (
                        <IconCheck className="w-4 h-4 text-[#70B325] dark:text-[#8FE032]" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      1 Suara gratis pertama per akun Google + opsi membeli kuota suara kelipatan via QRIS untuk donasi kas panitia.
                    </p>
                  </div>

                  {/* Option 2: Free */}
                  <div
                    onClick={() => setFormData((prev) => ({ ...prev, voting_type: 'free' }))}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-1.5 ${
                      formData.voting_type === 'free'
                        ? 'border-[#70B325] bg-[#F4F9EE] dark:bg-[#70B325]/10 shadow-xs'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-gray-900 dark:text-white">
                        2. Gratis Penuh
                      </span>
                      {formData.voting_type === 'free' && (
                        <IconCheck className="w-4 h-4 text-[#70B325] dark:text-[#8FE032]" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Murni 1 orang 1 suara (One Person One Vote). Wajib login akun Google untuk verifikasi independen dan cegah bot.
                    </p>
                  </div>

                  {/* Option 3: Paid */}
                  <div
                    onClick={() => setFormData((prev) => ({ ...prev, voting_type: 'paid' }))}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-1.5 ${
                      formData.voting_type === 'paid'
                        ? 'border-[#70B325] bg-[#F4F9EE] dark:bg-[#70B325]/10 shadow-xs'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-gray-900 dark:text-white">
                        3. Donasi / QRIS
                      </span>
                      {formData.voting_type === 'paid' && (
                        <IconCheck className="w-4 h-4 text-[#70B325] dark:text-[#8FE032]" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                      Cocok untuk ajang apresiasi/charity berbayar. Suara dihitung dari paket donasi QRIS yang dibeli pendukung.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                      Perkiraan Jumlah Finalis / Kandidat
                    </label>
                    <select
                      name="estimated_finalists"
                      value={formData.estimated_finalists}
                      onChange={handleChange}
                      className="w-full h-11 px-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] focus:outline-none transition-colors text-xs text-gray-900 dark:text-white cursor-pointer"
                    >
                      <option value="2 - 5 Kandidat">2 - 5 Kandidat</option>
                      <option value="6 - 10 Kandidat">6 - 10 Kandidat</option>
                      <option value="11 - 20 Kandidat">11 - 20 Kandidat</option>
                      <option value="Lebih dari 20 Kandidat">Lebih dari 20 Kandidat</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                      Kategori yang Direncanakan
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        placeholder="Ketik kategori, misal: Juara Favorit..."
                        className="flex-1 h-11 px-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] focus:outline-none transition-colors text-xs text-gray-900 dark:text-white placeholder-gray-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddCategory(e)
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="h-11 px-4 rounded-xl bg-[#70B325] hover:bg-[#5F9A1E] text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>

                {/* Categories Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EBF7E3] text-[#48781B] dark:bg-[#70B325]/20 dark:text-[#8FE032] border border-[#70B325]/20"
                    >
                      <span>{cat}</span>
                      {categories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(idx)}
                          className="hover:text-red-500 cursor-pointer"
                        >
                          <IconClose className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bagian 4: Fitur Tambahan (Add-ons) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                <span className="w-7 h-7 rounded-xl bg-[#EBF7E3] dark:bg-[#70B325]/20 text-[#48781B] dark:text-[#8FE032] font-black text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                  Fitur Tambahan yang Dibutuhkan
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:border-[#70B325] transition-colors">
                  <input
                    type="checkbox"
                    checked={addons.live_stage}
                    onChange={() => handleToggleAddon('live_stage')}
                    className="mt-0.5 rounded text-[#70B325] focus:ring-[#70B325] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block">
                      Tampilan Layar Panggung (Live Stage Mode)
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                      Tampilan layar penuh untuk proyektor malam puncak penganugerahan &amp; reveal juara.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:border-[#70B325] transition-colors">
                  <input
                    type="checkbox"
                    checked={addons.pdf_report}
                    onChange={() => handleToggleAddon('pdf_report')}
                    className="mt-0.5 rounded text-[#70B325] focus:ring-[#70B325] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block">
                      Laporan Berita Acara Rekapitulasi PDF
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                      Dokumen rekapitulasi resmi siap cetak untuk ditandatangani dewan juri/saksi.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:border-[#70B325] transition-colors">
                  <input
                    type="checkbox"
                    checked={addons.anti_bot}
                    onChange={() => handleToggleAddon('anti_bot')}
                    className="mt-0.5 rounded text-[#70B325] focus:ring-[#70B325] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block">
                      Proteksi Ketat Anti-Bot &amp; VPN
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                      Deteksi otomatis script bot, manipulasi incognito, dan IP proxy anonim.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 cursor-pointer hover:border-[#70B325] transition-colors">
                  <input
                    type="checkbox"
                    checked={addons.wall_of_support}
                    onChange={() => handleToggleAddon('wall_of_support')}
                    className="mt-0.5 rounded text-[#70B325] focus:ring-[#70B325] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block">
                      Papan Pesan Dukungan (Wall of Support)
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                      Kolom interaktif bagi pendukung untuk menuliskan ucapan semangat kepada finalis.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Bagian 5: Catatan Khusus & Submit */}
            <div className="space-y-4">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block text-xs mb-1.5">
                  Catatan Khusus atau Permintaan Panitia (Opsional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Cantumkan jika ada request khusus terkait logo, batas waktu, atau ketentuan lain..."
                  className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] focus:outline-none transition-colors text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-[#70B325] hover:bg-[#5F9A1E] text-white font-black text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <span>Mengirimkan Pendaftaran Event...</span>
                  ) : (
                    <>
                      <span>Ajukan Pendaftaran Event Sekarang</span>
                      <IconArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 mt-2">
                  Setelah diajukan, tim Sebaris.id akan menghubungi WhatsApp PIC dalam kurun waktu 2-6 jam kerja.
                </p>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: LACAK STATUS PENDAFTARAN */}
        {activeTab === 'check' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#151C14] border border-gray-200/80 dark:border-white/10 shadow-xl space-y-4">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                Lacak Status Permohonan Event
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Masukkan Nomor Registrasi resmi Anda (contoh: <code>SBR-2026-XXXXX</code>) atau alamat email PIC yang didaftarkan.
              </p>

              <form onSubmit={handleSearchStatus} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Masukkan No. Registrasi atau Email PIC..."
                    required
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] focus:outline-none transition-colors text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400"
                  />
                  <IconSearch className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 h-12 rounded-xl bg-[#70B325] hover:bg-[#5F9A1E] text-white font-black text-xs sm:text-sm transition-colors cursor-pointer flex-shrink-0"
                >
                  {searching ? 'Mencari...' : 'Cari'}
                </button>
              </form>

              {searchError && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                  {searchError}
                </div>
              )}
            </div>

            {/* Result List */}
            {searchResult && searchResult.length > 0 && (
              <div className="space-y-4">
                {searchResult.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 rounded-3xl bg-white dark:bg-[#151C14] border border-gray-200/80 dark:border-white/10 shadow-lg space-y-5 animate-fadeIn"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm sm:text-base font-black text-[#70B325] dark:text-[#8FE032]">
                            #{item.registration_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyNumber(item.registration_number)}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                          >
                            {copied ? 'Tersalin' : 'Salin'}
                          </button>
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-0.5">
                          {item.event_name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Diselenggarakan oleh: <strong>{item.organization_name}</strong>
                        </p>
                      </div>

                      <div className="flex-shrink-0">{renderStatusBadge(item.status)}</div>
                    </div>

                    {/* Timeline Progress */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        Alur Persetujuan &amp; Aktivasi:
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs">
                        <div
                          className={`p-2.5 rounded-xl border font-bold ${
                            item.status
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                              : 'bg-gray-50 text-gray-400 border-gray-200'
                          }`}
                        >
                          1. Pengajuan Diterima
                        </div>
                        <div
                          className={`p-2.5 rounded-xl border font-bold ${
                            item.status === 'in_review' || item.status === 'approved'
                              ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 border-blue-300'
                              : 'bg-gray-50 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/10'
                          }`}
                        >
                          2. Peninjauan Tim
                        </div>
                        <div
                          className={`p-2.5 rounded-xl border font-bold ${
                            item.status === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                              : 'bg-gray-50 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/10'
                          }`}
                        >
                          3. Event Aktif
                        </div>
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#F8FAF7] dark:bg-white/5 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[11px]">PIC Terdaftar</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {item.pic_name}
                        </span>
                        <span className="text-gray-500 block text-[10px]">{item.pic_phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Model Voting</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                          {item.voting_type}
                        </span>
                        <span className="text-gray-500 block text-[10px]">
                          {item.estimated_finalists}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Tanggal Pengajuan</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Admin notes if any */}
                    {item.admin_notes && (
                      <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs">
                        <span className="font-bold text-blue-900 dark:text-blue-300 block mb-0.5">
                          Catatan dari Tim Sebaris.id:
                        </span>
                        <p className="text-blue-800 dark:text-blue-200 whitespace-pre-line text-[11px]">
                          {item.admin_notes}
                        </p>
                      </div>
                    )}

                    {/* Action Link if Approved */}
                    {item.status === 'approved' && item.created_event_id && (
                      <div className="pt-2">
                        <Link
                          to="/"
                          className="w-full py-3 px-4 rounded-xl bg-[#70B325] hover:bg-[#5F9A1E] text-white font-black text-xs text-center transition-all flex items-center justify-center gap-2"
                        >
                          <span>Buka Event Voting di Beranda</span>
                          <IconChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
