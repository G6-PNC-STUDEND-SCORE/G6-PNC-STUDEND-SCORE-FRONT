// import { log } from 'console'
import { http } from './api'

export interface Student {
  id: number
  user_id: number
  student_number_sequence_id: number | null
  generation_id: number | null
  class_id: number | null
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
  class?: {
    id: number
    name: string
  } | null
  generation?: {
    id: number
    name: string
  } | null
  studentNumberSequence?: {
    id: number
    student_number: string
    intake_year: number
  } | null
}

export interface SchoolClass {
  id: number
  name: string
}

export interface StudentsResponse {
  students: Student[]
}

export interface StudentResponse {
  student: Student
}

export interface ClassesResponse {
  classes: SchoolClass[]
}

export async function getStudents(): Promise<StudentsResponse> {
  const res = await http.get<StudentsResponse>('/students')
  return res.data
}


export async function getStudent(id: number): Promise<StudentResponse> {
  const res = await http.get<StudentResponse>(`/students/${id}`)
  return res.data
}

export async function createStudent(data: {
  user_id: number
  student_number: string
  intake_year: number
  sequence_number: number
  name?: string
  gender?: string
  status?: string
  class_id?: number | null
  academic_year_id?: number | null
  enrollment_date?: string | null
}): Promise<StudentResponse> {
  const res = await http.post<StudentResponse>('/students', data)
  return res.data
}

export async function updateStudent(
  id: number,
  data: {
    name?: string
    gender?: string
    status?: string
    class_id?: number | null
    academic_year_id?: number | null
    enrollment_date?: string | null
  }
): Promise<StudentResponse> {
  const res = await http.put<StudentResponse>(`/students/${id}`, data)
  return res.data
}

export async function deleteStudent(id: number): Promise<{ message: string }> {
  const res = await http.delete<{ message: string }>(`/students/${id}`)
  return res.data
}

export async function assignStudentToClass(
  id: number,
  classId: number
): Promise<StudentResponse> {
  const res = await http.put<StudentResponse>(`/students/${id}/assign-class`, {
    class_id: classId,
  })
  return res.data
}

// export async function getClasses(): Promise<ClassesResponse> {
//   log('getClasses')
//   // const res = await http.get<ClassesResponse>('/classes/list')
//   // return res.data
// }
