import { http } from './api'

export type GoogleLoginResponse = {
  user: unknown
  token: string
  message?: string
}

export async function googleLogin(credential: string): Promise<GoogleLoginResponse> {
  const res = await http.post<GoogleLoginResponse>('/google-login', { credential })
  return res.data
}

export function initGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '213370047582-omlbf5s59ccocfseu1ruib12i2rhuuvv.apps.googleusercontent.com'
}
