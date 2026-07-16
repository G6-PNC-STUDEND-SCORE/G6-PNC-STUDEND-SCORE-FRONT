import { http } from './api'

export interface UserProfile {
  id: number
  name: string
  email: string
  phone: string | null
  department: string | null
  school: string | null
  role: string
  avatar: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface ProfileUpdatePayload {
  name?: string
  email?: string
  phone?: string
  department?: string
  school?: string
  bio?: string
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  errors?: Record<string, string[]>
}

export interface AvatarResponse {
  avatar_url: string
  avatar: string
}

export async function getProfile(): Promise<UserProfile> {
  const res = await http.get<ApiResponse<UserProfile>>('/profile')
  return res.data.data
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<UserProfile> {
  const res = await http.put<ApiResponse<UserProfile>>('/profile', payload)
  return res.data.data
}

export async function uploadAvatar(file: File): Promise<AvatarResponse> {
  const formData = new FormData()
  formData.append('avatar', file)

  const res = await http.post<ApiResponse<AvatarResponse>>('/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data.data
}
