// Dynamically resolve API URL:
// 1. In Local Development (npm run dev): uses VITE_API_URL or defaults to 'http://127.0.0.1:8000/api'
// 2. In Production (Hostinger / web): uses current browser origin + '/api' dynamically,
//    ensuring it seamlessly binds to whatever domain the app is running on without hardcoding!
const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
  }

  // If in browser (production)
  if (typeof window !== 'undefined' && window.location?.origin) {
    // If VITE_API_URL is explicitly set to an external URL that isn't the old legacy domain
    const envUrl = import.meta.env.VITE_API_URL
    if (envUrl && !envUrl.includes('pojoktungu59.com') && envUrl !== '/api') {
      return envUrl
    }
    return `${window.location.origin}/api`
  }

  return '/api'
}

const API_URL = getApiBaseUrl()
export const BACKEND_URL = typeof window !== 'undefined' && window.location?.origin
  ? window.location.origin
  : API_URL.replace(/\/api\/?$/, '')

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

  const currentOrigin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : BACKEND_URL

  // If already a full URL
  if (str.startsWith('http://') || str.startsWith('https://')) {
    // If it points to localhost/storage or 127.0.0.1/storage without port 8000, repair it to backend host
    if (str.includes('localhost/storage') || str.includes('127.0.0.1/storage')) {
      return str.replace(/^(https?:\/\/[^/:]+)(\/storage\/)/, `${currentOrigin}$2`)
    }
    // If it points to legacy domain pojoktungu59.com, automatically repair to current domain!
    if (str.includes('pojoktungu59.com/storage')) {
      return str.replace(/^(https?:\/\/[^/]+)(\/storage\/)/, `${currentOrigin}$2`)
    }
    return str
  }

  // If it's a relative path like "finalists/xyz.png" or "/storage/finalists/xyz.png"
  const clean = str.startsWith('/storage') ? str : `/storage/${str.replace(/^\/+/, '')}`
  return `${currentOrigin}${clean}`
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

export async function downloadExport(path, defaultFilename = 'laporan.csv', token) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let msg = 'Gagal mengunduh file laporan'
    try {
      const parsed = JSON.parse(errorText)
      if (parsed.message) msg = parsed.message
    } catch {
      if (errorText) msg = errorText
    }
    throw new Error(msg)
  }

  const blob = await response.blob()
  let filename = defaultFilename
  const disposition = response.headers.get('content-disposition')
  if (disposition) {
    const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i)
    if (filenameMatch && filenameMatch[1]) {
      filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''))
    }
  }

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
