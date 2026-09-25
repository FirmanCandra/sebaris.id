const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
export const BACKEND_URL = API_URL.replace(/\/api\/?$/, '')

export class ApiError extends Error {
  constructor(message, errors = {}) {
    super(message)
    this.errors = errors
  }
}

export function resolveStorageUrl(pathOrUrl) {
  if (!pathOrUrl) return ''
  const str = String(pathOrUrl).trim()
  if (!str) return ''

  // If already a full URL
  if (str.startsWith('http://') || str.startsWith('https://')) {
    // If it points to localhost/storage or 127.0.0.1/storage without port 8000, repair it to backend host
    if (str.includes('localhost/storage') || str.includes('127.0.0.1/storage')) {
      return str.replace(/^(https?:\/\/[^/:]+)(\/storage\/)/, `${BACKEND_URL}$2`)
    }
    return str
  }

  // If it's a relative path like "finalists/xyz.png" or "/storage/finalists/xyz.png"
  const clean = str.startsWith('/storage') ? str : `/storage/${str.replace(/^\/+/, '')}`
  return `${BACKEND_URL}${clean}`
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
