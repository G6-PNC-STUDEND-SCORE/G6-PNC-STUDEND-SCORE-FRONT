export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  errors?: Record<string, string[]>
}

export type ApiResponseWithMessage = ApiResponse<unknown>

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface UserRole {
  id: number
  name: string
  slug: string
}

export interface UserListItem {
  id: number
  name: string
  email: string
  phone: string | null
  gender: string | null
  status: string
  role: UserRole | null
  avatar: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role_id: number
  phone?: string
  gender?: string
  status?: string
}

export interface UpdateUserPayload {
  name: string
  email: string
  password?: string
  role_id: number
  phone?: string
  gender?: string
  status?: string
}

export interface SchoolClass {
  id: number
  name: string
  code: string
  teacher_id: number | null
  generation_id: number | null
  academic_year_id: number | null
  description: string | null
  is_active: boolean
  room: string | null
  created_at: string
  updated_at: string
  teacher?: { id: number; name: string } | null
  academicYear?: { id: number; name: string } | null
  generation?: { id: number; year: string; name: string } | null
  students?: number | null
}

export interface Student {
  id: number
  user_id: number
  student_id_number: string | null
  student_number_sequence_id: number | null
  generation_id: number | null
  profile_photo: string | null
  profile_photo_url: string | null
  class_id?: number | null
  academic_year_id?: number | null
  enrollment_date?: string | null
  gender?: string | null
  created_at: string
  updated_at: string
  user?: {
    id: number
    name: string
    email: string
    gender: string | null
    status: string
    avatar: string | null
  } | null
  classHistories?: Array<{
    id: number
    class_id: number
    status: string
    class?: { id: number; name: string } | null
  }> | null
  class?: { id: number; name: string } | null
  generation?: { id: number; name: string } | null
  studentNumberSequence?: {
    id: number
    student_number: string
    intake_year: number
  } | null
}

export interface Subject {
  id: number
  subject_code?: string
  name: string
  teacher_id?: number | null
  class_id?: number | null
  status: 'Active' | 'Inactive'
  created_at?: string
  updated_at?: string
  teacher?: {
    id: number
    user?: { name: string; email?: string } | null
  } | null
  class?: { id: number; name: string } | null
  offerings?: SubjectOffering[]
  teachers?: Array<{ id: number; user?: { name?: string | null } | null }>
  teacher_ids?: number[]
  term_ids?: number[]
}

export interface SubjectPayload {
  subject_code?: string
  name: string
  teacher_id?: number | null
  class_id?: number | null
  class_ids?: number[]
  status: 'Active' | 'Inactive'
  teacher_ids?: number[]
  term_ids?: number[]
}

export interface SubjectOffering {
  id: number
  subject_id: number
  teacher_id: number | null
  class_id: number
  generation_id: number
  term_id: number
  status: string
  teacher?: {
    id: number
    user_id: number
    user?: { name: string; email: string }
  } | null
  class?: { id: number; name: string } | null
  term?: { id: number; name: string } | null
}

export interface Role {
  id: number
  name: string
  slug: string
  description: string | null
  is_active: boolean
  permissions?: Permission[]
  created_at: string
  updated_at: string
}

export interface Permission {
  id: number
  name: string
  slug: string
  group: string
  description: string | null
}

export type PermissionsByGroup = Record<string, Permission[]>

export interface EmailDomainRule {
  id: number
  domain: string
  role_id: number
  role?: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

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

export interface AvatarResponse {
  avatar_url: string
  avatar: string
}

export interface AcademicYear {
  id: number
  name: string
}

export interface Teacher {
  id: number
  name: string
}

export interface Term {
  id: number
  name: string
}
