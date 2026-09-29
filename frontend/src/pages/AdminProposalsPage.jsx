import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { api } from '../api/client'
import {
  IconSearch,
  IconClose,
  IconCheck,
  IconExternal,
  IconCalendar,
  IconTrophy,
  IconLayers,
  IconUsers,
} from '../components/Icons'

export default function AdminProposalsPage() {
  const { token } = useAuth()

  const [proposals, setProposals] = useState([])
  const [counts, setCounts] = useState({ all: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  const fetchProposals = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      let url = `/admin/event-registrations?`
      if (statusFilter !== 'all') url += `status=${statusFilter}&`
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`

      const res = await api(url, { token })
      setProposals(res.data || [])
      if (res.counts) setCounts(res.counts)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [token, statusFilter, search])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  // Update Status & Notes
  async function handleUpdateStatus(newStatus) {
    if (!selectedProposal) return
    setActionLoading(true)
    try {
      await api(`/admin/event-registrations/${selectedProposal.id}`, {
        method: 'PATCH',
        token,
        body: {
          status: newStatus,
          admin_notes: adminNotes,
        },
      })
      setToastMsg(`Status berhasil diubah menjadi ${newStatus}!`)
      setTimeout(() => setToastMsg(''), 3000)
      setSelectedProposal(null)
      fetchProposals()
    } catch (err) {
      alert(err.message || 'Gagal memperbarui status pengajuan.')
    } finally {
      setActionLoading(false)
    }
  }

  // Approve & Convert to Official Event
  async function handleApproveToEvent() {
    if (!selectedProposal) return
    if (!window.confirm(`Setujui pengajuan ini dan buatkan Event '${selectedProposal.event_name}' secara otomatis di database?`)) {
      return
    }

    setActionLoading(true)
    try {
      const res = await api(`/admin/event-registrations/${selectedProposal.id}/approve`, {
        method: 'POST',
        token,
      })

      setToastMsg(res.message || 'Event berhasil dibuat!')
      setTimeout(() => setToastMsg(''), 4000)
      setSelectedProposal(null)
      fetchProposals()
    } catch (err) {
      alert(err.message || 'Gagal menyetujui dan membuat event.')
    } finally {
      setActionLoading(false)
    }
  }

  function formatPhoneWhatsApp(phone) {
    let clean = phone.replace(/[^0-9]/g, '')
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1)
    }
    return clean
  }

  function renderStatusBadge(status) {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Disetujui
          </span>
        )
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Ditinjau
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-300 dark:border-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Ditolak
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Menunggu Review
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-black text-xs shadow-lg animate-fadeIn flex items-center justify-between">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg('')} className="cursor-pointer">
            <IconClose className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--neutral-text-main)]">
            Pengajuan Event (Self-Service Organizer)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Daftar permohonan pembukaan sistem e-voting baru dari panitia, kampus, atau organisasi publik.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#70B325] text-white shadow-xs'
                : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            Semua ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <span>Menunggu Review</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px] font-black">
              {counts.pending}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_review')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              statusFilter === 'in_review'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            Ditinjau ({counts.in_review})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            Disetujui ({counts.approved})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            Ditolak ({counts.rejected})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari event, PIC, organisasi..."
            className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] focus:outline-none transition-colors text-xs text-[var(--neutral-text-main)] placeholder-gray-400"
          />
          <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Proposals Table */}
      <div className="rounded-3xl bg-[var(--neutral-surface)] border border-[var(--neutral-border)] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-400">
            Memuat daftar pengajuan event...
          </div>
        ) : proposals.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-gray-400">
            <p className="text-sm font-bold">Belum ada pengajuan event.</p>
            <p className="text-xs">
              Pengajuan dari formulir publik 'Daftarkan Vote' akan otomatis masuk ke sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--neutral-border)] bg-gray-50/50 dark:bg-white/5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">No. Registrasi</th>
                  <th className="py-3 px-4">Nama Event &amp; Organisasi</th>
                  <th className="py-3 px-4">Kontak PIC</th>
                  <th className="py-3 px-4">Model Voting</th>
                  <th className="py-3 px-4">Target Waktu</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neutral-border)] font-medium">
                {proposals.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-[#70B325] dark:text-[#8FE032]">
                      #{item.registration_number}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-extrabold text-sm text-[var(--neutral-text-main)] block truncate">
                        {item.event_name}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 block truncate">
                        {item.organization_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-800 dark:text-gray-200 block">
                        {item.pic_name}
                      </span>
                      <a
                        href={`https://wa.me/${formatPhoneWhatsApp(item.pic_phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#25D366] hover:underline font-bold inline-flex items-center gap-1"
                        title="Chat WhatsApp PIC"
                      >
                        <span>{item.pic_phone}</span>
                        <IconExternal className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="font-bold block">
                        {item.voting_type === 'free' ? 'Gratis' : item.voting_type === 'paid' ? 'Donasi/QRIS' : 'Hybrid'}
                      </span>
                      <span className="text-[10px] text-gray-400 block">{item.estimated_finalists}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 text-[11px]">
                      {item.target_start_date ? (
                        <span>
                          {new Date(item.target_start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d{' '}
                          {item.target_end_date ? new Date(item.target_end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                        </span>
                      ) : (
                        <span className="italic text-gray-400">Belum ditentukan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{renderStatusBadge(item.status)}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProposal(item)
                          setAdminNotes(item.admin_notes || '')
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Detail &amp; Review
                      </button>

                      {item.created_event_id && (
                        <Link
                          to={`/admin/events/${item.created_event_id}`}
                          className="px-3 py-1.5 rounded-xl bg-[#70B325] hover:bg-[#5F9A1E] text-white font-bold text-xs transition-colors no-underline inline-block"
                        >
                          Buka Event
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedProposal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedProposal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#151C14] text-[var(--neutral-text-main)] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-white/10 space-y-6 my-auto max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
              <div>
                <span className="text-[10px] font-mono font-black text-[#70B325] dark:text-[#8FE032] uppercase">
                  #{selectedProposal.registration_number}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                  {selectedProposal.event_name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Lembaga: <strong>{selectedProposal.organization_name}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 space-y-1">
                <span className="text-gray-400 font-semibold block text-[11px]">Penanggung Jawab (PIC)</span>
                <span className="font-extrabold text-sm text-gray-900 dark:text-white block">
                  {selectedProposal.pic_name}
                </span>
                <span className="text-gray-600 dark:text-gray-300 block">{selectedProposal.pic_email}</span>
                <a
                  href={`https://wa.me/${formatPhoneWhatsApp(selectedProposal.pic_phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] font-bold hover:underline inline-flex items-center gap-1 pt-1"
                >
                  <span>Chat WhatsApp ({selectedProposal.pic_phone})</span>
                  <IconExternal className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 space-y-1">
                <span className="text-gray-400 font-semibold block text-[11px]">Konfigurasi Voting</span>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Model:</span>
                  <span className="font-black text-[#70B325] dark:text-[#8FE032] capitalize">
                    {selectedProposal.voting_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Estimasi Finalis:</span>
                  <span className="font-bold">{selectedProposal.estimated_finalists}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Target Tanggal:</span>
                  <span className="font-bold">
                    {selectedProposal.target_start_date || '-'} s/d {selectedProposal.target_end_date || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Description */}
            {selectedProposal.event_description && (
              <div className="text-xs space-y-1">
                <span className="font-bold text-gray-700 dark:text-gray-300 block">
                  Deskripsi / Tujuan Event:
                </span>
                <p className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {selectedProposal.event_description}
                </p>
              </div>
            )}

            {/* Requested Categories */}
            {selectedProposal.category_names && selectedProposal.category_names.length > 0 && (
              <div className="text-xs space-y-1.5">
                <span className="font-bold text-gray-700 dark:text-gray-300 block">
                  Kategori yang Diajukan ({selectedProposal.category_names.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedProposal.category_names.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-bold bg-[#EBF7E3] text-[#48781B] dark:bg-[#70B325]/20 dark:text-[#8FE032] border border-[#70B325]/20"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Requested Addons */}
            {selectedProposal.addons && (
              <div className="text-xs space-y-1.5">
                <span className="font-bold text-gray-700 dark:text-gray-300 block">
                  Fitur Tambahan yang Diminta:
                </span>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {selectedProposal.addons.live_stage && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200">
                      ✓ Layar Panggung Proyektor
                    </span>
                  )}
                  {selectedProposal.addons.pdf_report && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                      ✓ Berita Acara Rekapitulasi PDF
                    </span>
                  )}
                  {selectedProposal.addons.anti_bot && (
                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200">
                      ✓ Proteksi Anti-Bot
                    </span>
                  )}
                  {selectedProposal.addons.wall_of_support && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200">
                      ✓ Wall of Support
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Admin Notes Input */}
            <div className="text-xs space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/10">
              <label className="font-bold text-gray-800 dark:text-gray-200 block">
                Catatan Admin untuk Panitia:
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows="2"
                placeholder="Tuliskan catatan arahan, verifikasi, atau alasan penolakan jika ada..."
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#70B325] focus:outline-none transition-colors text-xs text-[var(--neutral-text-main)] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-white/10">
              {/* Quick Status Changers */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('in_review')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                >
                  Set Ditinjau
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('rejected')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 transition-colors cursor-pointer"
                >
                  Tolak Pengajuan
                </button>
              </div>

              {/* Approve & Create Event */}
              <div>
                {!selectedProposal.created_event_id ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleApproveToEvent}
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#70B325] hover:bg-[#5F9A1E] text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <IconCheck className="w-4 h-4 stroke-3" />
                    <span>Setujui &amp; Buat Event Resmi Otomatis</span>
                  </button>
                ) : (
                  <Link
                    to={`/admin/events/${selectedProposal.created_event_id}`}
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#262A25] text-white hover:bg-black transition-colors no-underline inline-flex items-center gap-2"
                  >
                    <span>Event Sudah Aktif (Buka Workspace)</span>
                    <IconExternal className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
