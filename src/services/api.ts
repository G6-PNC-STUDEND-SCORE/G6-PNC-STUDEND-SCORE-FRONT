import { http, setAuthToken, clearAuthToken } from './apiHttp'

export type ApiResponse<T> = T

// Central place to add interceptors / common config later.
export { http, setAuthToken, clearAuthToken }


