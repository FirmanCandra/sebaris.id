import { useState } from 'react'
import { IconClose, IconCheck, IconCheckVote } from './Icons'
import { resolveStorageUrl } from '../api/client'
import SebarisLogo from './SebarisLogo'

export default function EReceiptModal({ isOpen, onClose, data }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !data) return null

  const referenceId = data.reference_id || data.receiptCode || `SVT-2026-${Math.floor(100000 + Math.random() * 900000)}`
  const voterName = data.voter_name || data.voterName || 'Pemilih Terdaftar'
  const contact = data.voter_contact || data.contact || '-'
  const finalistName = data.finalist_name || data.finalist?.name || data.finalist || '-'
  const categoryName = data.category_name || data.category || 'Voting Sebaris.id'
  const voteAmount = data.vote_amount || (data.type === 'free' ? 1 : 1)
  const isFree = data.type === 'free' || !data.total_price
  const totalPrice = data.total_price ? `Rp ${Number(data.total_price).toLocaleString('id-ID')}` : 'GRATIS'
  const paymentMethod = data.payment_method ? data.payment_method.toUpperCase() : (isFree ? 'VOTE GRATIS' : 'QRIS')
  const timestamp = data.paid_at
    ? new Date(data.paid_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  function handlePrint() {
    window.print()
  }

  function handleShareWhatsApp() {
    const text = `Saya baru saja memberikan ${voteAmount} suara resmi untuk *${finalistName}* di ajang *${categoryName}* melalui sebaris.id! 🌟\n\nNo. Tiket: ${referenceId}\nStatus: Sah & Terhitung\n\nYuk ikutan dukung juga!`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function handleCopyReference() {
    navigator.clipboard.writeText(referenceId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative my-auto print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Close Button (hidden on print) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors print:hidden"
        >
          <IconClose className="w-5 h-5" />
        </button>

        {/* Printable Ticket Receipt Container */}
        <div id="printable-receipt" className="space-y-5">
          {/* Header Branding */}
          <div className="text-center pb-4 border-b border-dashed border-gray-200">
            <div className="flex justify-center mb-2">
              <SebarisLogo className="h-8 w-auto" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#70B325] bg-[#F2F9EC] px-3 py-1 rounded-full border border-[#D3E8C3] inline-block">
              Bukti Resmi E-Voting
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Dokumen Sah Pemungutan Suara Digital
            </p>
          </div>

          {/* Success Badge & Reference ID */}
          <div className="bg-[#F4F9EE] border border-[#CADDB8] rounded-2xl p-4 text-center space-y-1 relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#70B325] text-white text-xs font-black shadow-xs mb-1">
              <IconCheck className="w-3.5 h-3.5 stroke-3" />
              <span>SUARA TERVERIFIKASI & SAH</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-sm sm:text-base font-black text-[#262A25] tracking-wider">
                {referenceId}
              </span>
              <button
                type="button"
                onClick={handleCopyReference}
                className="text-[10px] font-bold text-[#70B325] hover:underline print:hidden cursor-pointer"
              >
                {copied ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
            <span className="text-[10px] text-gray-500 block">
              Waktu Transaksi: {timestamp} WIB
            </span>
          </div>

          {/* Ticket Information Table */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-400 font-semibold">Ajang / Kategori</span>
              <span className="font-bold text-gray-800 text-right max-w-[200px] truncate">
                {categoryName}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-400 font-semibold">Kandidat Pilihan</span>
              <span className="font-black text-[#70B325] text-right text-sm">
                {finalistName}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-400 font-semibold">Nama Pemilih</span>
              <span className="font-bold text-gray-800">{voterName}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-400 font-semibold">Kontak Terverifikasi</span>
              <span className="font-mono font-bold text-gray-700">{contact}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-400 font-semibold">Jumlah Suara</span>
              <span className="font-black text-[#262A25] text-sm bg-gray-100 px-2 py-0.5 rounded-md">
                +{voteAmount} Suara
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
              <span className="text-gray-400 font-semibold">Metode Pembayaran</span>
              <span className="font-bold text-gray-700">{paymentMethod}</span>
            </div>

            <div className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded-xl">
              <span className="text-gray-700 font-black">Total Pembayaran</span>
              <span className="font-black text-sm text-[#70B325]">{totalPrice}</span>
            </div>
          </div>

          {/* Verification QR Emblem */}
          <div className="pt-2 flex items-center justify-center gap-3 text-center border-t border-dashed border-gray-200">
            <div className="w-10 h-10 rounded-xl bg-[#123E2A] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <IconCheckVote className="w-6 h-6 text-amber-300" />
            </div>
            <div className="text-left">
              <span className="text-[11px] font-black text-gray-800 block">
                Audited & Encrypted by Sebaris Engine
              </span>
              <span className="text-[9px] text-gray-400 block">
                Setiap suara terlindungi dari manipulasi data & manipulasi ganda.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons (hidden on print) */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🖨️ Cetak / Simpan PDF</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full sm:flex-1 h-11 bg-[#25D366] hover:bg-[#20BE5C] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span>💬 Bagikan WA</span>
          </button>
        </div>
      </div>
    </div>
  )
}
