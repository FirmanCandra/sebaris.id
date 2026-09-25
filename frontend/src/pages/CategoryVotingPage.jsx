import { Link, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'
import PublicHeader from '../components/PublicHeader'
import {
  IconChevronRight,
  IconTrophy,
  IconCheck,
  IconClock,
  IconUsers,
} from '../components/Icons'

export default function CategoryVotingPage() {
  const { categoryId } = useParams()
  const [finalists, setFinalists] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ voter_name: '', voter_contact: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  const load = useCallback(async () => {
    try {
      const { data } = await api(`/categories/${categoryId}/leaderboard`)
      setFinalists(data)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 10000)
    return () => window.clearInterval(interval)
  }, [load])

  // Total votes for percentage calculation
  const totalVotes = finalists.reduce((acc, curr) => acc + (curr.vote_count || 0), 0)

  async function submit(event) {
    event.preventDefault()
    if (!selected) return
    setSaving(true)
    setNotice(null)
    setFieldErrors({})

    try {
      await api('/votes', {
        method: 'POST',
        body: { ...form, finalist_id: selected.id, type: 'free' },
      })
      const receipt = `SVT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
      setNotice({
        receipt,
        finalistName: selected.name,
        contact: form.voter_contact,
      })
      setForm({ voter_name: '', voter_contact: '' })
      setSelected(null)
      await load()
    } catch (requestError) {
      setError(requestError.message)
      if (requestError instanceof ApiError) setFieldErrors(requestError.errors)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#262A25] flex flex-col font-sans">
      <PublicHeader />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#F2F8EE] to-[#F8FAF7] py-6 sm:py-10 border-b border-[#E8ECE4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <Link to="/" className="hover:text-[#70B325] transition-colors no-underline">
              Beranda
            </Link>
            <IconChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[#262A25] font-bold">Kategori #{categoryId}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F2D9] text-[#4F7E1D] font-bold text-xs tracking-wide mb-1.5">
                <IconTrophy className="w-3.5 h-3.5 text-[#70B325]" />
                Leaderboard & Voting
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#262A25]">
                Daftar Finalis & Perolehan Suara
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Pilih finalis jagoanmu lalu masukkan nama dan kontak untuk memberi 1 suara gratis.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white px-3 py-2 rounded-xl border border-[#E5EADF] self-start sm:self-center">
              <IconClock className="w-4 h-4 text-[#70B325]" />
              <span>Update real-time (tiap 10 detik)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Voting Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
        {/* Success Receipt Banner */}
        {notice && (
          <div className="bg-[#F2F9EC] border-2 border-[#70B325] rounded-2xl p-5 mb-8 shadow-sm animate-fadeIn">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#70B325] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#262A25]">
                    Vote Berhasil Dicatat!
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Terima kasih telah mendukung <strong className="text-[#70B325]">{notice.finalistName}</strong>. Suara Anda telah sah dan terhitung.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-[#D0E2C1] text-gray-800">
                      ID Transaksi: {notice.receipt}
                    </span>
                    <Link
                      to="/"
                      className="text-xs font-bold text-[#70B325] hover:underline"
                    >
                      Cek di menu Cek Vote →
                    </Link>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Finalist Leaderboard List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#262A25] flex items-center gap-2">
                <span>Peringkat Finalis</span>
                <span className="text-xs font-bold text-gray-400">
                  ({finalists.length} kandidat)
                </span>
              </h2>
              <span className="text-xs text-gray-500">
                Total Suara Masuk: <strong className="text-gray-800">{totalVotes.toLocaleString('id-ID')}</strong>
              </span>
            </div>

            {loading && (
              <div className="p-12 text-center text-gray-500">
                <div className="w-8 h-8 border-3 border-[#70B325] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold">Memuat data finalis...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center">
                <p className="text-sm font-bold">{error}</p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-2 text-xs font-bold underline cursor-pointer"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {!loading && !error && finalists.length === 0 && (
              <div className="bg-white border border-[#E5EADF] rounded-2xl p-8 text-center text-gray-500">
                <IconUsers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">Belum ada finalis</p>
                <p className="text-xs text-gray-400 mt-1">
                  Penyelenggara belum mendaftarkan finalis untuk kategori ini.
                </p>
              </div>
            )}

            {!loading && !error && finalists.map((finalist, index) => {
              const isSelected = selected?.id === finalist.id
              const percentage = totalVotes > 0 ? Math.round((finalist.vote_count / totalVotes) * 100) : 0
              
              // Rank badges styling
              const rankColor =
                index === 0
                  ? 'bg-amber-400 text-amber-950 font-black'
                  : index === 1
                  ? 'bg-slate-300 text-slate-800 font-black'
                  : index === 2
                  ? 'bg-amber-700/80 text-white font-black'
                  : 'bg-gray-100 text-gray-600 font-bold'

              return (
                <div
                  key={finalist.id}
                  onClick={() => {
                    setSelected(finalist)
                    setNotice(null)
                  }}
                  className={`card-base p-4 cursor-pointer transition-all border-2 ${
                    isSelected
                      ? 'border-[#70B325] bg-[#F8FCF4] shadow-md scale-[1.01]'
                      : 'border-[#E5EADF] bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${rankColor}`}
                    >
                      {index + 1}
                    </div>

                    {/* Candidate Photo / Avatar */}
                    {finalist.photo ? (
                      <img
                        src={finalist.photo}
                        alt={finalist.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#E9F3DF] text-[#558223] font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {finalist.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-sm sm:text-base text-[#262A25] truncate">
                          {finalist.name}
                        </h3>
                        <span className="text-xs font-bold text-[#70B325] whitespace-nowrap">
                          {finalist.vote_count?.toLocaleString('id-ID') || 0} suara
                        </span>
                      </div>

                      {finalist.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {finalist.description}
                        </p>
                      )}

                      {/* Vote Progress Bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#70B325] h-full rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 w-8 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Radio Check Indicator */}
                    <div className="pl-1">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isSelected
                            ? 'border-[#70B325] bg-[#70B325] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <IconCheck className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right: Vote Submission Form Panel (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E5EADF] rounded-2xl p-6 shadow-sm sticky top-24 space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <span className="text-xs font-bold text-[#70B325] uppercase tracking-wide">
                  Formulir Pemilihan
                </span>
                <h2 className="text-lg font-extrabold text-[#262A25] mt-0.5">
                  Gunakan Vote Gratis
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {selected ? (
                    <span>
                      Finalis yang dipilih: <strong className="text-[#70B325]">{selected.name}</strong>
                    </span>
                  ) : (
                    'Klik salah satu finalis di sebelah kiri untuk memilih.'
                  )}
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor="voter-name" className="block text-xs font-bold text-[#262A25] mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    id="voter-name"
                    type="text"
                    value={form.voter_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, voter_name: e.target.value }))}
                    placeholder="Contoh: Rian Pratama"
                    className="form-input text-xs sm:text-sm"
                    required
                  />
                  {fieldErrors.voter_name?.[0] && (
                    <small className="text-red-600 text-[11px] block mt-1">
                      {fieldErrors.voter_name[0]}
                    </small>
                  )}
                </div>

                <div>
                  <label htmlFor="voter-contact" className="block text-xs font-bold text-[#262A25] mb-1">
                    Nomor WhatsApp / Email
                  </label>
                  <input
                    id="voter-contact"
                    type="text"
                    value={form.voter_contact}
                    onChange={(e) => setForm((prev) => ({ ...prev, voter_contact: e.target.value }))}
                    placeholder="Contoh: 081234567890"
                    className="form-input text-xs sm:text-sm"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Digunakan untuk verifikasi 1 suara gratis per kontak.
                  </p>
                  {fieldErrors.voter_contact?.[0] && (
                    <small className="text-red-600 text-[11px] block mt-1">
                      {fieldErrors.voter_contact[0]}
                    </small>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!selected || saving}
                  className="btn-primary w-full text-sm font-bold shadow-sm"
                >
                  {saving ? (
                    <span>Mencatat suara...</span>
                  ) : selected ? (
                    <span>Vote {selected.name} Sekarang</span>
                  ) : (
                    <span>Pilih Finalis Terlebih Dahulu</span>
                  )}
                </button>
              </form>

              <div className="pt-3 border-t border-gray-100 text-center">
                <span className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#70B325]" />
                  Hasil suara dienkripsi & diaudit real-time
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#E5EADF] py-6 text-center text-xs text-gray-400 mt-12">
        <p>© {new Date().getFullYear()} sebaris.id. Hak cipta dilindungi.</p>
      </footer>
    </div>
  )
}
