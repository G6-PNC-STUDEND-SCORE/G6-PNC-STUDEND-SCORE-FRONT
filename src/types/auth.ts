export interface User {
  id: number
  name: string
  email: string
  role: string
  avatar?: string | null
  permissions?: string[]
  [key: string]: unknown
}
