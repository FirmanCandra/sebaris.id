import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import {
  IconFlame,
  IconLayers,
  IconUsers,
  IconTrophy,
  IconSearch,
  IconCheckVote,
  IconClock,
  IconClose,
} from '../components/Icons'

// ─── Tiny inline bar chart (no external lib) ──────────────────────────────────
function MiniBarChart({ data, valueKey, labelKey, color = '#70B325', formatValue = (v) => v }) {
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1)
  return (
    <div className="flex items-end gap-0.5 h-14 w-full" aria-label="Grafik batang">
      {data.map((point, i) => {
        const pct = Math.round(((point[valueKey] || 0) / max) * 100)
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative"
            title={`${point[labelKey]}: ${formatValue(point[valueKey] || 0)}`}
          >
            <div
              className="w-full rounded-t-sm transition-all duration-300"
              style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: color, opacity: pct === 0 ? 0.2 : 0.85 }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Sparkline (single line SVG path) ─────────────────────────────────────────
function Sparkline({ data, valueKey, color = '#70B325', height = 40, strokeWidth = 2 }) {
  const width = 160
  const values = data.map((d) => d[valueKey] || 0)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const pad = strokeWidth

  const points = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2)
    const y = pad + ((max - v) / range) * (height - pad * 2)
    return `${x},${y}`
  })

  const d = points.length > 0 ? `M ${points.join(' L ')}` : ''

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Fill out 14-day date array with zeros ─────────────────────────────────────
function fill14Days(data, valueKey, labelKey) {
  const result = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const found = data.find((r) => r[labelKey] === dateStr)
    result.push({
      [labelKey]: dateStr,
      label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      [valueKey]: found ? found[valueKey] : 0,
    })
  }
  return result
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, iconBg, icon: Icon, accent }) {
  return (
    <div className="bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-2xl p-5 flex items-center justify-between gap-3 shadow-[var(--shadow-subtle)]">
      <div className="min-w-0">
        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">{label}</span>
        <span className={`block text-2xl font-black leading-none ${accent ?? 'text-[var(--neutral-text-main)]'}`}>
          {value}
        </span>
        {sub && <span className="block text-[11px] text-gray-400 mt-1 font-semibold">{sub}</span>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}

// ─── Main Dashboard Page ───────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { token } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Voter table filter state
  const [voterCategoryId, setVoterCategoryId] = useState('')
  const [voterSearch, setVoterSearch] = useState('')
  const [voterSearchInput, setVoterSearchInput] = useState('')
  const [voterPage, setVoterPage] = useState(1)
  const [voterLoading, setVoterLoading] = useState(false)
  const [voterData, setVoterData] = useState(null)

  // Active chart tab: 'votes' | 'revenue'
  const [chartTab, setChartTab] = useState('votes')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api('/admin/dashboard', { token })
      setData(res)
      setVoterData({ data: res.voters?.data ?? [], meta: res.voters?.meta ?? {} })
    } catch (e) {
      setError(e.message || 'Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }, [token])

  const loadVoters = useCallback(async () => {
    setVoterLoading(true)
    try {
      const params = new URLSearchParams({ page: voterPage })
      if (voterCategoryId) params.set('category_id', voterCategoryId)
      if (voterSearch) params.set('search', voterSearch)
      const res = await api(`/admin/dashboard?${params.toString()}`, { token })
      setVoterData({ data: res.voters?.data ?? [], meta: res.voters?.meta ?? {} })
    } catch {
      /* silently ignore; KPI already loaded */
    } finally {
      setVoterLoading(false)
    }
  }, [token, voterCategoryId, voterSearch, voterPage])

  useEffect(() => { loadDashboard() }, [loadDashboard])
  useEffect(() => {
    if (!loading) loadVoters()
  }, [voterCategoryId, voterSearch, voterPage]) // eslint-disable-line

  // Chart data with 14-day fill
  const votesChart = useMemo(() => fill14Days(data?.votes_per_day ?? [], 'total_votes', 'date'), [data])
  const revenueChart = useMemo(() => fill14Days(data?.revenue_per_day ?? [], 'revenue', 'date'), [data])

  const kpi = data?.kpi ?? {}
  const categories = data?.category_stats ?? []
  const voters = voterData?.data ?? []
  const voterMeta = voterData?.meta ?? {}

  function handleVoterSearch(e) {
    e.preventDefault()
    setVoterSearch(voterSearchInput)
    setVoterPage(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Memuat data dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <p className="text-sm font-bold text-red-600">{error}</p>
          <button type="button" onClick={loadDashboard} className="btn-primary text-xs py-2 px-4">
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* ── Page Title ── */}
      <div className="pb-2 border-b border-[var(--neutral-border)]">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--neutral-text-main)] tracking-tight">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Statistik real-time, tren suara, dan daftar voter seluruh ajang voting.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" aria-label="Ringkasan statistik">
        <KpiCard
          label="Total Suara Sah"
          value={(kpi.total_votes ?? 0).toLocaleString('id-ID')}
          icon={IconFlame}
          iconBg="bg-orange-50 text-orange-500"
          accent="text-[var(--brand-primary)]"
        />
        <KpiCard
          label="Total Revenue"
          value={`Rp ${((kpi.total_revenue ?? 0) / 1000).toLocaleString('id-ID')}rb`}
          sub="dari vote berbayar"
          icon={IconTrophy}
          iconBg="bg-amber-50 text-amber-500"
        />
        <KpiCard
          label="Kategori Aktif"
          value={kpi.active_categories ?? 0}
          sub={`dari ${kpi.total_categories ?? 0} total`}
          icon={IconLayers}
          iconBg="bg-[#F4F9EE] text-[#70B325]"
        />
        <KpiCard
          label="Total Finalis"
          value={kpi.total_finalists ?? 0}
          icon={IconUsers}
          iconBg="bg-purple-50 text-purple-500"
        />
        <KpiCard
          label="Pembayaran Pending"
          value={kpi.pending_payments ?? 0}
          sub="menunggu konfirmasi"
          icon={IconClock}
          iconBg="bg-sky-50 text-sky-500"
          accent={kpi.pending_payments > 0 ? 'text-sky-600' : undefined}
        />
        <KpiCard
          label="Total Kategori"
          value={kpi.total_categories ?? 0}
          icon={IconCheckVote}
          iconBg="bg-[#F4F9EE] text-[#819C65]"
        />
      </section>

      {/* ── Trend Chart + Category Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-2xl p-5 shadow-[var(--shadow-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-[var(--neutral-text-main)]">
                {chartTab === 'votes' ? 'Tren Suara Masuk' : 'Tren Revenue Berbayar'}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">14 hari terakhir (vote terverifikasi)</p>
            </div>
            <div className="flex rounded-xl border border-[var(--neutral-border)] overflow-hidden">
              <button
                type="button"
                onClick={() => setChartTab('votes')}
                className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  chartTab === 'votes'
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'text-gray-500 hover:text-gray-800 bg-transparent'
                }`}
              >
                Suara
              </button>
              <button
                type="button"
                onClick={() => setChartTab('revenue')}
                className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  chartTab === 'revenue'
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'text-gray-500 hover:text-gray-800 bg-transparent'
                }`}
              >
                Revenue
              </button>
            </div>
          </div>

          {/* Bar chart */}
          <div className="h-24 w-full mb-2">
            {chartTab === 'votes' ? (
              <MiniBarChart
                data={votesChart}
                valueKey="total_votes"
                labelKey="label"
                color="#70B325"
                formatValue={(v) => `${v} suara`}
              />
            ) : (
              <MiniBarChart
                data={revenueChart}
                valueKey="revenue"
                labelKey="label"
                color="#F59E0B"
                formatValue={(v) => `Rp ${v.toLocaleString('id-ID')}`}
              />
            )}
          </div>

          {/* X-axis labels (first, middle, last) */}
          <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
            <span>{chartTab === 'votes' ? votesChart[0]?.label : revenueChart[0]?.label}</span>
            <span>{chartTab === 'votes' ? votesChart[6]?.label : revenueChart[6]?.label}</span>
            <span>{chartTab === 'votes' ? votesChart[13]?.label : revenueChart[13]?.label}</span>
          </div>

          {/* Summary Row */}
          <div className="mt-5 pt-4 border-t border-[var(--neutral-border)] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                {chartTab === 'votes' ? 'Total 14 hari' : 'Total revenue 14 hari'}
              </span>
              <span className="text-lg font-black text-[var(--brand-primary)]">
                {chartTab === 'votes'
                  ? `${votesChart.reduce((a, d) => a + d.total_votes, 0).toLocaleString('id-ID')} suara`
                  : `Rp ${revenueChart.reduce((a, d) => a + d.revenue, 0).toLocaleString('id-ID')}`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Kemarin</span>
              <span className="text-sm font-bold text-[var(--neutral-text-main)]">
                {chartTab === 'votes'
                  ? `${(votesChart[12]?.total_votes ?? 0).toLocaleString('id-ID')} suara`
                  : `Rp ${(revenueChart[12]?.revenue ?? 0).toLocaleString('id-ID')}`}
              </span>
            </div>
          </div>
        </div>

        {/* Per-Category Leaderboard */}
        <div className="bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-2xl p-5 shadow-[var(--shadow-subtle)]">
          <h2 className="text-sm font-extrabold text-[var(--neutral-text-main)] mb-1">Performa per Kategori</h2>
          <p className="text-[11px] text-gray-400 mb-4">Suara & revenue per ajang</p>

          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <IconLayers className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Belum ada kategori</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const maxVotes = Math.max(...categories.map((c) => c.total_votes), 1)
                const pct = Math.round((cat.total_votes / maxVotes) * 100)
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-[var(--neutral-text-main)] block truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {cat.total_votes.toLocaleString('id-ID')} suara
                          {cat.total_revenue > 0 && ` · Rp ${cat.total_revenue.toLocaleString('id-ID')}`}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          cat.status === 'active'
                            ? 'bg-[#EBF7E3] text-[#48781B]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {cat.status === 'active' ? 'Aktif' : 'Selesai'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Category Breakdown Cards (top finalists) ── */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-sm font-extrabold text-[var(--neutral-text-main)] mb-4">
            Rincian Per Kategori
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-2xl p-5 shadow-[var(--shadow-subtle)] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-[var(--neutral-text-main)] truncate">{cat.name}</h3>
                    <span className="text-[10px] text-gray-400">{cat.finalists_count} finalis terdaftar</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                      cat.status === 'active'
                        ? 'bg-[#EBF7E3] text-[#48781B]'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                    }`}
                  >
                    {cat.status === 'active' ? 'Aktif' : 'Selesai'}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[var(--neutral-bg)] rounded-lg p-2">
                    <span className="block text-sm font-black text-[var(--brand-primary)]">
                      {cat.total_votes.toLocaleString('id-ID')}
                    </span>
                    <span className="block text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Suara</span>
                  </div>
                  <div className="bg-[var(--neutral-bg)] rounded-lg p-2">
                    <span className="block text-sm font-black text-amber-600">
                      {cat.paid_count.toLocaleString('id-ID')}
                    </span>
                    <span className="block text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Berbayar</span>
                  </div>
                  <div className="bg-[var(--neutral-bg)] rounded-lg p-2">
                    <span className="block text-sm font-black text-sky-600">
                      {cat.free_count.toLocaleString('id-ID')}
                    </span>
                    <span className="block text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Gratis</span>
                  </div>
                </div>

                {/* Revenue */}
                {cat.total_revenue > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/30 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Revenue</span>
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                      Rp {cat.total_revenue.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                {/* Top 3 Finalists mini-leaderboard */}
                {cat.top_finalists.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Top Finalis</span>
                    {cat.top_finalists.map((f, idx) => (
                      <div key={f.id} className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                          idx === 0 ? 'bg-amber-400 text-amber-950' :
                          idx === 1 ? 'bg-gray-300 text-gray-700' :
                          'bg-amber-700/60 text-white'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-[var(--neutral-text-main)] truncate flex-1 min-w-0">
                          {f.name}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--brand-primary)] flex-shrink-0">
                          {f.vote_count.toLocaleString('id-ID')} suara
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Voter Table ── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-[var(--neutral-text-main)]">Daftar Voter</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Semua voter terverifikasi, dapat difilter per kategori.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              id="voter-category-filter"
              value={voterCategoryId}
              onChange={(e) => { setVoterCategoryId(e.target.value); setVoterPage(1) }}
              className="h-9 px-3 text-xs font-semibold bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-xl focus:border-[var(--brand-primary)] focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <form onSubmit={handleVoterSearch} className="flex gap-1.5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <IconSearch className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={voterSearchInput}
                  onChange={(e) => setVoterSearchInput(e.target.value)}
                  placeholder="Nama / kontak / ID referensi..."
                  className="h-9 pl-8 pr-3 text-xs bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-xl focus:border-[var(--brand-primary)] focus:outline-none w-52"
                />
                {voterSearchInput && (
                  <button
                    type="button"
                    onClick={() => { setVoterSearchInput(''); setVoterSearch(''); setVoterPage(1) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <IconClose className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button type="submit" className="btn-primary text-xs py-0 px-3 h-9 min-h-0">Cari</button>
            </form>
          </div>
        </div>

        <div className="data-table-container">
          {voterLoading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="w-6 h-6 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Memuat daftar voter...</p>
            </div>
          ) : voters.length === 0 ? (
            <div className="p-10 text-center text-gray-400 space-y-2">
              <IconUsers className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm font-bold text-gray-500">Belum ada voter</p>
              <p className="text-xs">
                {voterSearch || voterCategoryId
                  ? 'Tidak ada hasil yang cocok dengan filter yang dipilih.'
                  : 'Voter akan muncul di sini setelah ada vote yang terverifikasi.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama Voter</th>
                    <th>Kontak</th>
                    <th>Kandidat</th>
                    <th>Kategori</th>
                    <th>Suara</th>
                    <th>Tipe</th>
                    <th>Nominal</th>
                    <th>Waktu</th>
                    <th>ID Referensi</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <span className="font-semibold text-sm text-[var(--neutral-text-main)]">{v.voter_name}</span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500">{v.voter_contact}</span>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-[var(--neutral-text-main)]">{v.finalist_name ?? '-'}</span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500 truncate max-w-[120px] block">{v.category_name ?? '-'}</span>
                      </td>
                      <td>
                        <span className="text-xs font-extrabold text-[var(--brand-primary)]">
                          {v.vote_amount} suara
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.type === 'free'
                              ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {v.type === 'free' ? 'Gratis' : 'Berbayar'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          {v.total_price > 0 ? `Rp ${v.total_price.toLocaleString('id-ID')}` : '-'}
                        </span>
                      </td>
                      <td>
                        <span className="text-[11px] text-gray-400">
                          {v.voted_at ? new Date(v.voted_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </td>
                      <td>
                        <span className="text-[11px] font-mono text-gray-500">{v.reference_id}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {voterMeta.last_page > 1 && (
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-xs text-gray-400">
              Halaman {voterMeta.current_page} dari {voterMeta.last_page} ({voterMeta.total?.toLocaleString('id-ID')} voter)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={voterPage <= 1}
                onClick={() => setVoterPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs font-bold bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-lg disabled:opacity-40 hover:border-[var(--brand-primary)] transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={voterPage >= voterMeta.last_page}
                onClick={() => setVoterPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs font-bold bg-[var(--neutral-surface)] border border-[var(--neutral-border)] rounded-lg disabled:opacity-40 hover:border-[var(--brand-primary)] transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
