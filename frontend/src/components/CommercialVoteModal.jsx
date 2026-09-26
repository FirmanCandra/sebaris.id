import { useState, useEffect } from 'react'
import { api, ApiError, resolveStorageUrl } from '../api/client'
import { useUserAuth } from '../auth/AuthProvider'
import GoogleSignInButton from './GoogleSignInButton'
import {
  IconClose,
  IconCheck,
  IconZap,
  IconClock,
  IconCheckVote,
} from './Icons'

// Common fallback voting packages if category does not define custom packages
const DEFAULT_PACKAGES = [
  { amount: 2, price: 10000, label: '2 Suara', popular: false },
  { amount: 5, price: 25000, label: '5 Suara', popular: false },
  { amount: 10, price: 50000, label: '10 Suara', popular: true },
  { amount: 20, price: 100000, label: '20 Suara', popular: false },
  { amount: 50, price: 250000, label: '50 Suara', popular: false },
  { amount: 100, price: 500000, label: '100 Suara', popular: false },
]

const PAYMENT_METHODS = [
  { id: 'qris', name: 'QRIS Dinamis', badge: 'Instan & Otomatis', desc: 'GoPay, OVO, Dana, ShopeePay, BCA, dll' },
  { id: 'bca_va', name: 'BCA Virtual Account', badge: 'Bank Transfer', desc: 'Transfer dari m-BCA / KlikBCA' },
  { id: 'bri_va', name: 'BRI Virtual Account', badge: 'Bank Transfer', desc: 'Transfer dari BRImo / ATM BRI' },
  { id: 'mandiri_va', name: 'Mandiri Virtual Account', badge: 'Bank Transfer', desc: 'Livin by Mandiri' },
]

export default function CommercialVoteModal({
  isOpen,
  onClose,
  finalist,
  category,
  onVoteSuccess,
}) {
  const { user, userToken, loginUserWithGoogle, loadUserVotes } = useUserAuth()

  // Dynamic vote packages from category or fallback to defaults
  const activePackages = Array.isArray(category?.vote_packages) && category.vote_packages.length > 0
    ? category.vote_packages
    : DEFAULT_PACKAGES

  const defaultPackageAmount = activePackages.find(p => p.popular)?.amount || activePackages[0]?.amount || 10

  // Steps: 'select' -> 'payment'
  const [step, setStep] = useState('select')
  const [voteMode, setVoteMode] = useState(category?.allow_free_vote === false ? 'paid' : 'free')
  const [selectedPackage, setSelectedPackage] = useState(defaultPackageAmount)
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('qris')

  // Voter Details
  const [form, setForm] = useState({
    voter_name: user?.name || '',
    voter_contact: user?.email || '',
    message: '',
    is_anonymous: false,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Payment Active Session State
  const [paymentSession, setPaymentSession] = useState(null)
  const [paymentTimer, setPaymentTimer] = useState(900) // 15 mins
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [simulating, setSimulating] = useState(false)

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep('select')
      setFieldErrors({})
      setPaymentSession(null)
      setSelectedPackage(defaultPackageAmount)
      setCustomAmount('')
      if (category?.allow_free_vote === false) {
        setVoteMode('paid')
      } else {
        setVoteMode('free')
      }
      setForm({
        voter_name: user?.name || '',
        voter_contact: user?.email || '',
        message: '',
        is_anonymous: false,
      })
    }
  }, [isOpen, category, user, defaultPackageAmount])

  // Payment Countdown Timer
  useEffect(() => {
    if (step === 'payment' && paymentSession && paymentTimer > 0) {
      const interval = setInterval(() => {
        setPaymentTimer((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [step, paymentSession, paymentTimer])

  // Realtime Auto-Polling Payment Status
  useEffect(() => {
    if (step !== 'payment' || !paymentSession?.reference_id) return

    let isMounted = true
    const interval = setInterval(async () => {
      try {
        const res = await api(`/votes/${paymentSession.reference_id}/status`)
        if (res.is_confirmed && isMounted) {
          clearInterval(interval)
          if (userToken) loadUserVotes()
          onVoteSuccess({
            ...res.data,
            finalist_name: finalist.name,
            category_name: category?.name,
          })
          onClose()
        }
      } catch {
        // Silently retry on polling network glitches
      }
    }, 3500)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [step, paymentSession?.reference_id, userToken, finalist.name, category?.name, loadUserVotes, onVoteSuccess, onClose])

  if (!isOpen || !finalist) return null

  const pricePerVote = category?.price_per_vote || 1000
  const activeAmount = customAmount ? Math.max(1, parseInt(customAmount) || 1) : selectedPackage
  const activeTotalPrice = voteMode === 'free' ? 0 : (customAmount ? activeAmount * pricePerVote : (activePackages.find(p => p.amount === selectedPackage)?.price || activeAmount * pricePerVote))

  async function handleSubmitOrder(e) {
    e.preventDefault()
    setSubmitting(true)
    setFieldErrors({})

    try {
      const payload = {
        finalist_id: finalist.id,
        voter_name: form.voter_name,
        voter_contact: form.voter_contact,
        message: form.message?.trim() || null,
        is_anonymous: form.is_anonymous ? 1 : 0,
        type: voteMode,
        vote_amount: voteMode === 'free' ? 1 : activeAmount,
        payment_method: voteMode === 'free' ? 'free' : paymentMethod,
      }

      const res = await api('/votes', {
        method: 'POST',
        token: userToken || undefined,
        body: payload,
      })

      if (voteMode === 'free') {
        // Free vote: instant success
        if (userToken) loadUserVotes()
        onVoteSuccess({
          ...res.data,
          finalist_name: finalist.name,
          category_name: category?.name,
          voter_name: form.voter_name,
          voter_contact: form.voter_contact,
          vote_amount: 1,
          type: 'free',
          total_price: 0,
        })
        onClose()
      } else {
        // Paid vote: advance to payment screen
        setPaymentSession(res.payment)
        setPaymentTimer(900) // 15 mins
        setStep('payment')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors || {})
        if (err.message) {
          setFieldErrors((prev) => ({ ...prev, general: err.message }))
        }
      } else {
        setFieldErrors({ general: err.message })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCheckPaymentStatus() {
    if (!paymentSession?.reference_id) return
    setCheckingPayment(true)
    try {
      const res = await api(`/votes/${paymentSession.reference_id}/status`)
      if (res.is_confirmed) {
        if (userToken) loadUserVotes()
        onVoteSuccess({
          ...res.data,
          finalist_name: finalist.name,
          category_name: category?.name,
        })
        onClose()
      } else {
        setFieldErrors({
          payment: 'Pembayaran belum terdeteksi. Silakan selesaikan transfer atau scan QRIS.',
        })
      }
    } catch (err) {
      setFieldErrors({ payment: err.message || 'Gagal memeriksa status pembayaran' })
    } finally {
      setCheckingPayment(false)
    }
  }

  async function handleSimulatePayment() {
    if (!paymentSession?.reference_id) return
    setSimulating(true)
    try {
      const res = await api(`/votes/${paymentSession.reference_id}/simulate-pay`, {
        method: 'POST',
      })
      if (userToken) loadUserVotes()
      onVoteSuccess({
        ...res.data,
        finalist_name: finalist.name,
        category_name: category?.name,
      })
      onClose()
    } catch (err) {
      setFieldErrors({ payment: err.message || 'Gagal memverifikasi simulasi pembayaran' })
    } finally {
      setSimulating(false)
    }
  }

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative my-auto max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <IconClose className="w-5 h-5" />
        </button>

        {/* Candidate Summary Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
          {finalist.photo_url || finalist.photo ? (
            <img
              src={resolveStorageUrl(finalist.photo_url || finalist.photo)}
              alt={finalist.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#70B325] flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-[#E9F3DF] text-[#558223] font-black text-xl flex items-center justify-center flex-shrink-0">
              {finalist.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase text-[#70B325] tracking-wider block">
              Dukung Kandidat Pilihan
            </span>
            <h3 className="text-base sm:text-lg font-black text-[#262A25] truncate">
              {finalist.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {category?.name || 'Ajang Voting'}
            </p>
          </div>
        </div>

        {/* STEP 1: FORM PEMILIHAN SUARA & CHECKOUT */}
        {step === 'select' && (
          <form onSubmit={handleSubmitOrder} className="mt-5 space-y-5">
            {/* Mode Switch: Free vs Paid */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                Pilih Jenis Dukungan
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
                {category?.allow_free_vote !== false && (
                  <button
                    type="button"
                    onClick={() => {
                      setVoteMode('free')
                      setFieldErrors({})
                    }}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      voteMode === 'free'
                        ? 'bg-white text-[#70B325] shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <span>🎁 Vote Gratis (1x)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setVoteMode('paid')
                    setFieldErrors({})
                  }}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    voteMode === 'paid' || category?.allow_free_vote === false
                      ? 'bg-white text-[#70B325] shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  } ${category?.allow_free_vote === false ? 'col-span-2' : ''}`}
                >
                  <IconZap className="w-3.5 h-3.5 text-amber-500" />
                  <span>⭐ Paket Suara (Beli)</span>
                </button>
              </div>
            </div>

            {/* PAID PACKAGES SELECTION */}
            {voteMode === 'paid' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
                    Pilih Paket Suara
                  </label>
                  <span className="text-[11px] font-bold text-[#70B325]">
                    Rp {pricePerVote.toLocaleString('id-ID')} / suara
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {activePackages.map((pkg) => {
                    const isSelected = !customAmount && selectedPackage === pkg.amount
                    return (
                      <button
                        key={pkg.amount}
                        type="button"
                        onClick={() => {
                          setSelectedPackage(pkg.amount)
                          setCustomAmount('')
                        }}
                        className={`relative p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#70B325] bg-[#F4F9EE] ring-2 ring-[#70B325]/30'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {pkg.popular && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 font-black text-[9px] px-2 py-0.2 rounded-full uppercase tracking-wider shadow-xs">
                            Favorit
                          </span>
                        )}
                        <span className="block font-black text-sm text-[#262A25]">
                          {pkg.label}
                        </span>
                        <span className="block text-xs font-bold text-[#70B325] mt-0.5">
                          Rp {pkg.price.toLocaleString('id-ID')}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Custom Votes Input */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    Atau tentukan jumlah suara sendiri:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="Masukkan jumlah suara, misal 25"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full h-10 px-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#70B325] focus:outline-none"
                    />
                    {customAmount && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-[#70B325]">
                        = Rp {(parseInt(customAmount || 0) * pricePerVote).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                    Metode Pembayaran
                  </label>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map((pm) => (
                      <label
                        key={pm.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                          paymentMethod === pm.id
                            ? 'border-[#70B325] bg-[#F4F9EE]'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment_method"
                            value={pm.id}
                            checked={paymentMethod === pm.id}
                            onChange={() => setPaymentMethod(pm.id)}
                            className="text-[#70B325] focus:ring-[#70B325]"
                          />
                          <div>
                            <span className="font-extrabold text-xs text-gray-800 block">
                              {pm.name}
                            </span>
                            <span className="text-[10px] text-gray-400 block">
                              {pm.desc}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#558223] bg-[#E9F4DE] px-2 py-0.5 rounded-full">
                          {pm.badge}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VOTER CONTACT INFO */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                Informasi Pemilih
              </label>

              {user ? (
                <div className="flex items-center gap-2.5 p-2.5 bg-[#F4F9EE] border border-[#D5E6C4] rounded-xl text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#70B325]" />
                  <span className="font-bold text-gray-700">
                    Masuk sebagai: <strong>{user.name}</strong> ({user.email})
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-medium">
                    Autofill dengan Google:
                  </span>
                  <GoogleSignInButton
                    onCredentialResponse={async (credential) => {
                      try {
                        const payload = await loginUserWithGoogle(credential)
                        const u = payload.user?.data || payload.user
                        setForm({
                          voter_name: u.name || '',
                          voter_contact: u.email || '',
                        })
                      } catch (e) {
                        setFieldErrors({ general: e.message })
                      }
                    }}
                    width={180}
                    size="small"
                  />
                </div>
              )}

              <div className="space-y-1">
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Pemilih"
                  value={form.voter_name}
                  onChange={(e) => setForm({ ...form, voter_name: e.target.value })}
                  className="w-full h-11 px-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#70B325] focus:outline-none"
                />
                {fieldErrors.voter_name && (
                  <p className="text-[11px] text-red-600 font-bold">
                    {fieldErrors.voter_name[0] || fieldErrors.voter_name}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  required
                  placeholder="Nomor WhatsApp atau Email"
                  value={form.voter_contact}
                  onChange={(e) => setForm({ ...form, voter_contact: e.target.value })}
                  className="w-full h-11 px-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#70B325] focus:outline-none"
                />
                {fieldErrors.voter_contact && (
                  <p className="text-[11px] text-red-600 font-bold">
                    {fieldErrors.voter_contact[0] || fieldErrors.voter_contact}
                  </p>
                )}
              </div>

              {/* Wall of Support Message (Optional) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-700">
                    Pesan Semangat / Doa (Wall of Support):
                  </label>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    {(form.message || '').length}/500
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder={`Tuliskan doa atau pesan semangat untuk ${finalist.name.split(' ')[0]} (akan muncul di Wall of Support)...`}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#70B325] focus:outline-none resize-none"
                />
                <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={form.is_anonymous}
                    onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
                    className="rounded text-[#70B325] focus:ring-[#70B325] w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-gray-500">
                    Kirim sebagai Anonim (sembunyikan nama Anda)
                  </span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {fieldErrors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold">
                {fieldErrors.general}
              </div>
            )}

            {/* Total Summary & Checkout Button */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">
                  Total Suara / Tagihan
                </span>
                <span className="text-base font-black text-[#262A25]">
                  {voteMode === 'free' ? '1 Suara (GRATIS)' : `${activeAmount} Suara • Rp ${activeTotalPrice.toLocaleString('id-ID')}`}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="py-3 px-6 bg-[#70B325] hover:bg-[#5F9A1E] disabled:bg-gray-300 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <IconCheck className="w-4 h-4 stroke-3" />
                    <span>{voteMode === 'free' ? 'Konfirmasi Vote' : 'Lanjut Bayar →'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: INVOICE / PAYMENT GATEWAY SCREEN */}
        {step === 'payment' && paymentSession && (
          <div className="mt-5 space-y-5 animate-fadeIn">
            {/* Countdown Badge */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-900 font-bold">
              <div className="flex items-center gap-2">
                <IconClock className="w-4 h-4 text-amber-600" />
                <span>Batas Waktu Pembayaran:</span>
              </div>
              <span className="font-mono text-sm font-black bg-white px-2.5 py-0.5 rounded-lg border border-amber-300 text-amber-700">
                {formatTimer(paymentTimer)}
              </span>
            </div>

            {/* Bill Summary */}
            <div className="bg-[#F8FAF7] border border-[#E1ECD7] rounded-2xl p-4 text-center space-y-1">
              <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">
                Total Tagihan Voting ({paymentSession.vote_amount} Suara)
              </span>
              <div className="text-2xl font-black text-[#70B325]">
                Rp {Number(paymentSession.total_price).toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-gray-500 font-mono block">
                Order ID: {paymentSession.reference_id}
              </span>
            </div>

            {/* QRIS Display or Virtual Account */}
            {paymentSession.payment_method === 'qris' ? (
              <div className="bg-white border-2 border-dashed border-[#CADDB8] rounded-2xl p-5 text-center space-y-3">
                <span className="inline-block text-[11px] font-black uppercase tracking-wider text-[#123E2A] bg-[#E9F4DE] px-3 py-1 rounded-full">
                  Scan QRIS dengan Aplikasi Apapun
                </span>

                {/* SVG/QR Graphic simulation */}
                <div className="w-48 h-48 mx-auto bg-gray-50 rounded-2xl border border-gray-200 p-2 flex flex-col items-center justify-center shadow-inner relative group">
                  {/* Clean Mock QR Code Visual */}
                  <div className="w-full h-full bg-white rounded-xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        paymentSession.qris_payload || paymentSession.reference_id
                      )}`}
                      alt="QRIS Sebaris.id"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                  Buka mobile banking (BCA, Mandiri, BRI) atau e-wallet (GoPay, OVO, ShopeePay, DANA) lalu scan kode di atas.
                </p>
              </div>
            ) : (
              <div className="bg-white border-2 border-[#CADDB8] rounded-2xl p-5 text-center space-y-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Nomor Virtual Account {paymentSession.payment_method.toUpperCase()}
                </span>
                <div className="font-mono text-xl sm:text-2xl font-black text-gray-800 tracking-wider bg-gray-50 py-3 rounded-xl border border-gray-200">
                  {paymentSession.va_number || '88019928172901'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentSession.va_number || '88019928172901')
                    alert('Nomor Virtual Account berhasil disalin!')
                  }}
                  className="text-xs font-bold text-[#70B325] hover:underline"
                >
                  📋 Salin Nomor Virtual Account
                </button>
              </div>
            )}

            {/* Error in Payment */}
            {fieldErrors.payment && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-semibold text-center">
                {fieldErrors.payment}
              </div>
            )}

            {/* Real-time Payment Status Indicator */}
            <div className="flex items-center justify-center gap-2 py-2 px-3.5 bg-[#F4F9EE] border border-[#D5E6C4] rounded-xl text-xs text-[#446F19] font-medium text-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#70B325] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#70B325]" />
              </span>
              <span>Menunggu pembayaran... Terkonfirmasi otomatis setelah transfer/scan.</span>
            </div>

            {/* Actions: Real Check and Client Demo Simulation */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCheckPaymentStatus}
                disabled={checkingPayment}
                className="w-full h-11 bg-[#70B325] hover:bg-[#5F9A1E] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {checkingPayment ? (
                  <span>Mengecek status di payment gateway...</span>
                ) : (
                  <>
                    <IconCheckVote className="w-4 h-4 text-white" />
                    <span>Cek Status Pembayaran</span>
                  </>
                )}
              </button>

              {/* Demo Mode for Client Presentation */}
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={simulating}
                className="w-full h-10 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Gunakan tombol ini saat demo/presentasi ke klien untuk konfirmasi bayar instan"
              >
                <IconZap className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {simulating
                    ? 'Memverifikasi Pembayaran Demo...'
                    : '⚡ Simulasikan Pembayaran Sukses (Mode Demo Klien)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStep('select')}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1"
              >
                ← Ubah Paket atau Metode Lain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
