import { http } from './apiHttp'
import type { User } from '@/types'

export interface GoogleLoginResponse {
  user: User
  token: string
  message?: string
}

export async function googleLogin(credential: string): Promise<GoogleLoginResponse> {
  const res = await http.post<GoogleLoginResponse>('/google-login', { credential })
  return res.data
}

export function initGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
}
