import { http } from './apiHttp'
import type { UserProfile, ProfileUpdatePayload, AvatarResponse, ProfileTeacherInfo, ProfileStudentInfo, ApiResponse } from '@/types'

export type { UserProfile, ProfileUpdatePayload, AvatarResponse, ProfileTeacherInfo, ProfileStudentInfo }

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
