// import { log } from 'console'
import { http } from './api'

export interface Student {
  id: number
  class_id: number | null
  name: string
  photo: string | null
  gender: 'Male' | 'Female'
  created_at: string
  updated_at: string
  class?: {
    id: number
    name: string
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
  // const res = await http.get<StudentsResponse>('/students')
  // return res.data
  return {
    students: [
      {
        id: 1,
        class_id: 1,
        name: 'John Doe',
        photo: null,
        gender: 'Male',
        created_at: '2022-01-01',
        updated_at: '2022-01-01',
        class: { id: 1, name: 'Class 1' },
      },
    ],
  }
}


export async function getStudent(id: number): Promise<StudentResponse> {
  const res = await http.get<StudentResponse>(`/students/${id}`)
  return res.data
}

export async function createStudent(data: {
  name: string
  gender: 'Male' | 'Female'
  class_id?: number | null
  photo?: string | null
}): Promise<StudentResponse> {
  const res = await http.post<StudentResponse>('/students', data)
  return res.data
}

export async function updateStudent(
  id: number,
  data: {
    name?: string
    gender?: 'Male' | 'Female'
    class_id?: number | null
    photo?: string | null
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
