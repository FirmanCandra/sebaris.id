import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await login({ email, password })
      navigate('/admin/events')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return <main className="login-page"><form className="login-form" onSubmit={submit}><p className="wordmark">sebaris.id</p><h1>Masuk ke ruang admin</h1><p>Kelola event, kategori, dan finalis dalam satu tempat.</p>{error && <p className="notice error">{error}</p>}<label htmlFor="email">Email<input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label htmlFor="password">Kata sandi<input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label><button className="primary-button" disabled={saving}>{saving ? 'Memeriksa akses' : 'Masuk sebagai admin'}</button></form></main>
}
