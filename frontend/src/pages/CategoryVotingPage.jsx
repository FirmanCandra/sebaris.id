import { Link, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../api/client'

export default function CategoryVotingPage() {
  const { categoryId } = useParams()
  const [finalists, setFinalists] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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

  async function submit(event) {
    event.preventDefault()
    if (!selected) return
    setSaving(true)
    setNotice('')
    setFieldErrors({})
    try {
      await api('/votes', { method: 'POST', body: { ...form, finalist_id: selected.id, type: 'free' } })
      setNotice(`Vote gratis untuk ${selected.name} sudah tercatat.`)
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
    <main className="public-page">
      <header className="public-header"><Link to="/" className="wordmark">sebaris.id</Link><Link className="admin-link" to="/login">Admin</Link></header>
      <section className="compact-intro"><Link className="back-link" to="/">Semua event</Link><h1>Finalis dan perolehan suara</h1><p>Pilih satu finalis untuk menggunakan vote gratis Anda di kategori ini.</p></section>
      <div className="voting-layout">
        <section className="leaderboard" aria-live="polite">
          <div className="section-title"><h2>Leaderboard</h2><span>Pembaruan setiap 10 detik</span></div>
          {loading && <p className="state">Memuat finalis...</p>}
          {error && <div className="notice error">{error}<button type="button" onClick={load}>Coba lagi</button></div>}
          {!loading && !error && finalists.length === 0 && <p className="state">Belum ada finalis di kategori ini.</p>}
          {!loading && !error && finalists.map((finalist, index) => <button className={`finalist-row ${selected?.id === finalist.id ? 'selected' : ''}`} type="button" key={finalist.id} onClick={() => { setSelected(finalist); setNotice('') }}><span className="rank">{index + 1}</span><span className="finalist-name">{finalist.name}</span><span className="vote-count">{finalist.vote_count} suara</span></button>)}
        </section>
        <aside className="vote-form-panel">
          <h2>Vote gratis</h2>
          <p>{selected ? `Pilihan Anda: ${selected.name}` : 'Pilih finalis dari daftar untuk melanjutkan.'}</p>
          {notice && <p className="success-notice">{notice}</p>}
          <form onSubmit={submit}>
            <label htmlFor="voter-name">Nama<input id="voter-name" value={form.voter_name} onChange={(event) => setForm((current) => ({ ...current, voter_name: event.target.value }))} placeholder="Nama Anda" required /></label>
            {fieldErrors.voter_name?.[0] && <small className="field-error">{fieldErrors.voter_name[0]}</small>}
            <label htmlFor="voter-contact">Nomor HP atau email<input id="voter-contact" value={form.voter_contact} onChange={(event) => setForm((current) => ({ ...current, voter_contact: event.target.value }))} placeholder="081234567890" required /></label>
            {fieldErrors.voter_contact?.[0] && <small className="field-error">{fieldErrors.voter_contact[0]}</small>}
            <button className="primary-button" type="submit" disabled={!selected || saving}>{saving ? 'Mencatat vote' : 'Gunakan vote gratis'}</button>
          </form>
        </aside>
      </div>
    </main>
  )
}
