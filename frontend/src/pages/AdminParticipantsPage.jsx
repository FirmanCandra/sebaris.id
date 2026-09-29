import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import {
  IconUsers,
  IconSearch,
  IconChat,
  IconFlame,
  IconTrophy,
  IconClose,
  IconCheck,
  IconClock,
  IconCoins,
  IconFilter,
} from '../components/Icons'

function ParticipantAvatar({ user, size = 'md' }) {
  const sizeClasses = size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-xs'

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name || 'User'}
        className={`${sizeClasses} rounded-full object-cover border border-[var(--neutral-border)] flex-shrink-0`}
        onError={(e) => {
          e.target.style.display = 'none'
        }}
      />
    )
  }

  const initials = (user?.name || 'P')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={`${sizeClasses} rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-black flex items-center justify-center flex-shrink-0 border border-[var(--brand-primary)]/20 shadow-2xs`}
    >
      {initials}
    </div>
  )
}

export default function AdminParticipantsPage() {
  const { token } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters & Tabs
  const [tab, setTab] = useState('all') // 'all' | 'voters' | 'commenters' | 'live_comments'
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  // Participant Detail Modal State
  const [selectedUser, setSelectedUser] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [detailTab, setDetailTab] = useState('votes') // 'votes' | 'comments'

  const loadParticipants = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        tab,
        page,
      })
      if (search) params.set('search', search)

      const res = await api(`/admin/participants?${params.toString()}`, { token })
      setData(res)
    } catch (err) {
      setError(err.message || 'Gagal memuat data partisipan')
    } finally {
      setLoading(false)
    }
  }, [token, tab, search, page])

  useEffect(() => {
    loadParticipants()
  }, [loadParticipants])

  function handleSearchSubmit(e) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function handleResetSearch() {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  async function openParticipantDetail(userId) {
    setSelectedUser(userId)
    setDetailLoading(true)
    setDetailTab('votes')
    try {
      const res = await api(`/admin/participants/${userId}`, { token })
      setDetailData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setDetailLoading(false)
    }
  }

  const kpi = data?.kpi ?? {}
  const participants = data?.participants?.data ?? []
  const pagination = data?.participants ?? {}
  const recentComments = data?.recent_comments ?? []

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--neutral-border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--neutral-text-main)] tracking-tight">
            Partisipan & Voter
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Direktori pengguna terdaftar, voter aktif, dan riwayat pesan dukungan (Wall of Support).
          </p>
        </div>
        <button
          type="button"
          onClick={loadParticipants}
          className="btn-outline text-xs py-2 px-3 self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Statistik Partisipan">
        <div className="bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-2xl p-5 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
              Pengguna Terdaftar
            </span>
            <span className="block text-2xl font-black text-[var(--brand-primary)] leading-none">
              {(kpi.total_registered ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="block text-[11px] text-gray-400 mt-1 font-semibold">
              {kpi.total_google_users ?? 0} via Google OAuth
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[var(--brand-primary-light)] text-[var(--brand-primary)] flex items-center justify-center flex-shrink-0">
            <IconUsers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-2xl p-5 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
              Total Voter Unik
            </span>
            <span className="block text-2xl font-black text-amber-500 leading-none">
              {(kpi.total_voters ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="block text-[11px] text-gray-400 mt-1 font-semibold">
              pernah memberikan suara sah
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center flex-shrink-0">
            <IconFlame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-2xl p-5 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
              Pesan & Komentar
            </span>
            <span className="block text-2xl font-black text-purple-500 leading-none">
              {(kpi.total_comments ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="block text-[11px] text-gray-400 mt-1 font-semibold">
              di Wall of Support finalis
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center flex-shrink-0">
            <IconChat className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-2xl p-5 shadow-xs flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
              Total Suara Terkumpul
            </span>
            <span className="block text-2xl font-black text-sky-500 leading-none">
              {(kpi.total_votes_cast ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="block text-[11px] text-gray-400 mt-1 font-semibold">
              Rp {((kpi.total_revenue ?? 0) / 1000).toLocaleString('id-ID')}rb transaksi
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center flex-shrink-0">
            <IconCoins className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* ── Main Container: Tabs, Search & Content ── */}
      <div className="bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-2xl shadow-subtle overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-[var(--neutral-border)] overflow-x-auto scrollbar-none bg-gray-50/60 dark:bg-black/20">
          <button
            type="button"
            onClick={() => {
              setTab('all')
              setPage(1)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'all'
                ? 'bg-white dark:bg-gray-800 text-[var(--brand-primary)] shadow-xs font-black'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <IconUsers className="w-4 h-4" />
            <span>Pengguna Terdaftar</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
              {kpi.total_registered ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('voters')
              setPage(1)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'voters'
                ? 'bg-white dark:bg-gray-800 text-[var(--brand-primary)] shadow-xs font-black'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <IconFlame className="w-4 h-4 text-amber-500" />
            <span>Voter Aktif</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('commenters')
              setPage(1)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'commenters'
                ? 'bg-white dark:bg-gray-800 text-[var(--brand-primary)] shadow-xs font-black'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <IconChat className="w-4 h-4 text-purple-500" />
            <span>Pemberi Dukungan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('live_comments')
              setPage(1)
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'live_comments'
                ? 'bg-white dark:bg-gray-800 text-[var(--brand-primary)] shadow-xs font-black'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <IconClock className="w-4 h-4 text-sky-500" />
            <span>Live Feed Komentar</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-extrabold">
              {kpi.total_comments ?? 0}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-[var(--neutral-border)]">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  tab === 'live_comments'
                    ? 'Cari nama voter, kontak, atau teks komentar...'
                    : 'Cari nama atau email pengguna...'
                }
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-[var(--neutral-border)] focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary)] text-[var(--neutral-text-main)]"
              />
            </div>
            <button type="submit" className="btn-primary text-xs py-2 px-3.5 cursor-pointer">
              Cari
            </button>
            {search && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="btn-outline text-xs py-2 px-3 cursor-pointer text-gray-500"
                title="Reset pencarian"
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {/* ── Table Content ── */}
        {loading ? (
          <div className="p-16 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Memuat data partisipan...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 space-y-2">
            <p className="text-xs font-bold">{error}</p>
            <button type="button" onClick={loadParticipants} className="btn-outline text-xs py-1.5 px-3">
              Coba Lagi
            </button>
          </div>
        ) : tab === 'live_comments' ? (
          /* Live Comments Feed View */
          <div className="divide-y divide-[var(--neutral-border)]">
            {recentComments.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <IconChat className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold">Belum ada pesan dukungan masuk.</p>
              </div>
            ) : (
              recentComments.map((comm) => (
                <div
                  key={comm.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-300 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {comm.voter_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-[var(--neutral-text-main)]">
                          {comm.voter_name}
                        </span>
                        {comm.is_registered && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                            Akun Terdaftar
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 font-medium">
                          {comm.voter_contact || 'Kontak tidak dicantumkan'}
                        </span>
                      </div>

                      {/* Comment Message Bubble */}
                      <p className="text-xs text-gray-800 dark:text-gray-200 italic bg-gray-50 dark:bg-white/5 p-2.5 rounded-xl border border-[var(--neutral-border)] max-w-2xl">
                        &quot;{comm.message}&quot;
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-0.5">
                        <span>Mendukung: <strong className="text-gray-700 dark:text-gray-300">{comm.finalist_name}</strong></span>
                        <span>•</span>
                        <span>{comm.category_name}</span>
                        {comm.event_name && (
                          <>
                            <span>•</span>
                            <span className="text-gray-500">{comm.event_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right flex-shrink-0 space-y-1 pl-12 sm:pl-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[var(--brand-primary)] bg-[var(--brand-primary-light)] px-2 py-0.5 rounded-full">
                      +{comm.vote_amount} suara
                    </span>
                    <span className="block text-[10px] text-gray-400">
                      {new Date(comm.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Users / Voters Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--neutral-border)] text-[10px] font-extrabold uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-white/5">
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Tipe Akun</th>
                  <th className="py-3 px-4">Total Suara Diberikan</th>
                  <th className="py-3 px-4">Pesan Dukungan</th>
                  <th className="py-3 px-4">Tanggal Bergabung</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neutral-border)] text-xs">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                      Tidak ada data pengguna yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  participants.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <ParticipantAvatar user={user} />
                          <div>
                            <span className="font-extrabold text-gray-900 dark:text-white block leading-tight">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium block">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Account Provider */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            user.provider === 'google'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {user.provider === 'google' ? 'Google Auth' : 'Email Manual'}
                        </span>
                      </td>

                      {/* Vote Stats */}
                      <td className="py-3.5 px-4">
                        {user.total_votes > 0 ? (
                          <div>
                            <span className="font-black text-gray-900 dark:text-white block">
                              {user.total_votes.toLocaleString('id-ID')} suara
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">
                              Rp {user.total_spent.toLocaleString('id-ID')} ({user.confirmed_transactions}x transaksi)
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Belum pernah vote</span>
                        )}
                      </td>

                      {/* Comments Stats */}
                      <td className="py-3.5 px-4">
                        {user.comments_count > 0 ? (
                          <span className="inline-flex items-center gap-1 font-extrabold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md">
                            <IconChat className="w-3.5 h-3.5" />
                            <span>{user.comments_count} pesan</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">0 pesan</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">
                        {new Date(user.joined_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Action Detail */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openParticipantDetail(user.id)}
                          className="btn-outline text-xs py-1.5 px-3 cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Riwayat & Komen</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {tab !== 'live_comments' && pagination.last_page > 1 && (
          <div className="p-4 border-t border-[var(--neutral-border)] flex items-center justify-between gap-3 text-xs">
            <span className="text-gray-400 font-medium">
              Menampilkan halaman {pagination.current_page} dari {pagination.last_page} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-outline py-1 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="btn-outline py-1 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── PARTICIPANT DETAIL MODAL / DRAWER ── */}
      {selectedUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--neutral-border)] flex items-center justify-between gap-3 bg-gray-50/50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <ParticipantAvatar user={detailData?.user} size="lg" />
                <div>
                  <h3 className="font-extrabold text-base text-[var(--neutral-text-main)]">
                    {detailData?.user?.name || 'Detail Partisipan'}
                  </h3>
                  <p className="text-xs text-gray-400">{detailData?.user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {detailLoading ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="w-8 h-8 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold">Memuat riwayat aktivitas...</p>
                </div>
              ) : (
                <>
                  {/* Quick Summary Pill Row */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-[var(--neutral-border)] text-center">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Total Suara</span>
                      <span className="text-base font-black text-[var(--brand-primary)]">
                        {detailData?.user?.total_votes?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Total Transaksi</span>
                      <span className="text-base font-black text-amber-500">
                        Rp {detailData?.user?.total_spent?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Komentar Dikirim</span>
                      <span className="text-base font-black text-purple-500">
                        {detailData?.user?.messages_count ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Detail Tabs: Votes vs Comments */}
                  <div className="flex border-b border-[var(--neutral-border)] gap-4 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setDetailTab('votes')}
                      className={`pb-2 border-b-2 cursor-pointer transition-all ${
                        detailTab === 'votes'
                          ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-black'
                          : 'border-transparent text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      Riwayat Voting ({detailData?.votes?.length ?? 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailTab('comments')}
                      className={`pb-2 border-b-2 cursor-pointer transition-all ${
                        detailTab === 'comments'
                          ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] font-black'
                          : 'border-transparent text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      Pesan Dukungan ({detailData?.votes?.filter((v) => v.message).length ?? 0})
                    </button>
                  </div>

                  {detailTab === 'votes' ? (
                    <div className="space-y-3">
                      {detailData?.votes?.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">Belum ada riwayat voting.</p>
                      ) : (
                        detailData?.votes?.map((v) => (
                          <div
                            key={v.id}
                            className="p-3.5 bg-gray-50/70 dark:bg-white/5 rounded-xl border border-[var(--neutral-border)] flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <span className="font-extrabold text-gray-900 dark:text-white block">
                                {v.finalist_name}
                              </span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                                {v.category_name} {v.event_name ? `• ${v.event_name}` : ''}
                              </span>
                              <span className="text-[10px] text-gray-400 mt-1 block">
                                Ref: #{v.reference_id} • {new Date(v.created_at).toLocaleDateString('id-ID')}
                              </span>
                            </div>
                            <div className="text-right flex-shrink-0 space-y-1">
                              <span className="font-black text-[var(--brand-primary)] block">
                                +{v.vote_amount} suara
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  v.status === 'confirmed'
                                    ? 'bg-[#EBF7E3] text-[#48781B]'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {v.status === 'confirmed' ? 'Sukses' : v.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {detailData?.votes?.filter((v) => v.message).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">
                          Pengguna belum pernah meninggalkan pesan komentar dukungan.
                        </p>
                      ) : (
                        detailData?.votes
                          ?.filter((v) => v.message)
                          .map((v) => (
                            <div
                              key={v.id}
                              className="p-3.5 bg-gray-50/70 dark:bg-white/5 rounded-xl border border-[var(--neutral-border)] space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-gray-700 dark:text-gray-300">
                                  Untuk: {v.finalist_name} ({v.category_name})
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(v.created_at).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                              <p className="italic text-gray-800 dark:text-gray-200 bg-white dark:bg-black/30 p-2.5 rounded-lg border border-[var(--neutral-border)]">
                                &quot;{v.message}&quot;
                              </p>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--neutral-border)] text-right bg-gray-50/50 dark:bg-white/5">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="btn-primary text-xs py-2 px-5 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
