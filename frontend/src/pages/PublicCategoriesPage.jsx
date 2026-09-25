import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function PublicCategoriesPage() {
  const { eventId } = useParams()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/events/${eventId}/categories`)
      .then(({ data }) => setCategories(data))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [eventId])

  return (
    <main className="public-page">
      <header className="public-header"><Link to="/" className="wordmark">sebaris.id</Link><Link className="admin-link" to="/login">Admin</Link></header>
      <section className="compact-intro"><Link className="back-link" to="/">Semua event</Link><h1>Pilih kategori</h1><p>Setiap kategori memiliki daftar finalis dan satu kesempatan vote gratis untuk setiap kontak.</p></section>
      <section className="event-list" aria-live="polite">
        {loading && <p className="state">Memuat kategori...</p>}
        {error && <div className="notice error">{error}<Link to="/">Kembali ke event</Link></div>}
        {!loading && !error && categories.length === 0 && <p className="state">Belum ada kategori untuk event ini.</p>}
        {!loading && !error && categories.map((category) => <Link className="public-event" to={`/categories/${category.id}`} key={category.id}><div><h2>{category.name}</h2><p>{category.finalists_count} finalis tersedia</p></div><span className="event-status">Buka</span></Link>)}
      </section>
    </main>
  )
}
