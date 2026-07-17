import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined

if (!baseURL) {
   
  console.warn('VITE_API_BASE_URL is not set. Please create frontend/.env')
}

export const http = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Hard redirect to reset Vue/Pinia state on expired tokens
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

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
