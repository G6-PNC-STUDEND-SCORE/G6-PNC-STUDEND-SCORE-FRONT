import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function usePermission() {
  const auth = useAuthStore()

  const isAdmin = computed(() => auth.user?.role === 'admin')
  const isTeacher = computed(() => auth.user?.role === 'teacher')
  const isStudent = computed(() => auth.user?.role === 'student')

  function hasPermission(permission: string): boolean {
    return auth.hasPermission(permission)
  }

  function hasAnyPermission(...permissions: string[]): boolean {
    return permissions.some((p) => auth.hasPermission(p))
  }

  function hasAllPermissions(...permissions: string[]): boolean {
    return permissions.every((p) => auth.hasPermission(p))
  }

  return {
    isAdmin,
    isTeacher,
    isStudent,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}
