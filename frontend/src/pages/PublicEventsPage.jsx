import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`))
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/events')
      .then(({ data }) => setEvents(data))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="public-page">
      <header className="public-header">
        <Link to="/" className="wordmark">sebaris.id</Link>
        <Link className="admin-link" to="/login">Admin</Link>
      </header>
      <section className="event-intro">
        <p className="intro-kicker">Voting publik</p>
        <h1>Pilih event yang sedang berlangsung</h1>
        <p>Temukan event aktif dan lihat kategori finalisnya.</p>
      </section>
      <section className="event-list" aria-live="polite">
        {loading && <p className="state">Memuat event aktif...</p>}
        {error && <div className="notice error">{error}<button type="button" onClick={() => window.location.reload()}>Coba lagi</button></div>}
        {!loading && !error && events.length === 0 && <p className="state">Belum ada event aktif. Silakan kembali saat penyelenggara membuka voting.</p>}
        {!loading && !error && events.map((event) => (
          <Link className="public-event" to={`/events/${event.id}`} key={event.id}>
            <div>
              <h2>{event.name}</h2>
              <p>{formatDate(event.start_date)} sampai {formatDate(event.end_date)}</p>
            </div>
            <span className="event-status">Aktif</span>
          </Link>
        ))}
      </section>
    </main>
  )
}
