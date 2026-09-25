const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

export class ApiError extends Error {
  constructor(message, errors = {}) {
    super(message)
    this.errors = errors
  }
}

export async function api(path, { token, body, method = 'GET' } = {}) {
  const headers = { Accept: 'application/json' }
  const options = { method, headers }

  if (token) headers.Authorization = `Bearer ${token}`

  if (body instanceof FormData) {
    options.body = body
  } else if (body) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_URL}${path}`, options)
  if (response.status === 204) return null

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(payload.message ?? 'Permintaan tidak dapat diproses.', payload.errors)
  }

  return payload
}
