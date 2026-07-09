import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined

if (!baseURL) {
  // Helps developers catch misconfigured .env quickly
  // eslint-disable-next-line no-console
  console.warn('VITE_API_BASE_URL is not set. Please create frontend/.env')
}

export const http = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function setAuthToken(token: string | null) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete http.defaults.headers.common.Authorization
  }
}

export function clearAuthToken() {
  delete http.defaults.headers.common.Authorization
}

export function storageUrl(path?: string | null): string {
  if (!path) return ''
  const base = (http.defaults.baseURL || '').replace(/\/api\/?$/, '')
  return base + '/storage/' + path.replace(/^\//, '')
}

