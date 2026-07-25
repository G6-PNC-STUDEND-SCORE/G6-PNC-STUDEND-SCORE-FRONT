import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getPermissions, getRoles, getRolePermissions, syncRolePermissions,
  createRole, updateRole, deleteRole,
  type Role, type Permission, type PermissionsByGroup,
} from '@/services/permissionService'
import {
  getEmailDomainRules, createEmailDomainRule, updateEmailDomainRule, deleteEmailDomainRule,
  type EmailDomainRule,
} from '@/services/emailDomainRuleService'

export const useRoleStore = defineStore('role', () => {
  // ─── State ──────────────────────────────────────────────────────────
  const roles = ref<Role[]>([])
  const permissionsByGroup = ref<PermissionsByGroup>({})
  const domainRules = ref<EmailDomainRule[]>([])
  const error = ref('')

  // ─── Helpers ──────────────────────────────────────────────────────
  function clearError() {
    error.value = ''
  }

  // ─── Load all (roles + permissions) ─────────────────────────────
  async function loadRolesAndPermissions() {
    clearError()
    try {
      const [perms, roleList] = await Promise.all([getPermissions(), getRoles()])
      permissionsByGroup.value = perms
      roles.value = roleList
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Failed to load roles & permissions.'
    }
  }

  // ─── Get role permissions ───────────────────────────────────────
  async function loadRolePermissions(roleId: number): Promise<PermissionsByGroup> {
    clearError()
    const { permissions } = await getRolePermissions(roleId)
    return permissions
  }

  // ─── Create role ────────────────────────────────────────────────
  async function createRoleAction(data: { name: string; description?: string; permission_ids?: number[] }): Promise<Role> {
    clearError()
    const created = await createRole(data)
    return created
  }

  // ─── Update role ────────────────────────────────────────────────
  async function updateRoleAction(roleId: number, data: { name: string; description?: string }): Promise<Role> {
    clearError()
    const updated = await updateRole(roleId, data)
    return updated
  }

  // ─── Delete role ────────────────────────────────────────────────
  async function deleteRoleAction(roleId: number): Promise<void> {
    clearError()
    await deleteRole(roleId)
    roles.value = roles.value.filter(r => r.id !== roleId)
  }

  // ─── Sync permissions ───────────────────────────────────────────
  async function syncPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    clearError()
    await syncRolePermissions(roleId, permissionIds)
  }

  // ─── Email domain rules ─────────────────────────────────────────
  async function loadDomainRules() {
    clearError()
    try {
      const ruleList = await getEmailDomainRules()
      domainRules.value = ruleList
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Failed to load sign-in domain rules.'
    }
  }

  async function createDomainRuleAction(data: { domain: string; role_id: number }): Promise<EmailDomainRule> {
    clearError()
    const created = await createEmailDomainRule(data)
    return created
  }

  async function updateDomainRuleAction(id: number, data: { domain: string; role_id: number; is_active?: boolean }): Promise<EmailDomainRule> {
    clearError()
    const updated = await updateEmailDomainRule(id, data)
    return updated
  }

  async function deleteDomainRuleAction(id: number): Promise<void> {
    clearError()
    await deleteEmailDomainRule(id)
    domainRules.value = domainRules.value.filter(r => r.id !== id)
  }

  // ─── Init ───────────────────────────────────────────────────────
  async function init() {
    await Promise.all([loadRolesAndPermissions(), loadDomainRules()])
  }

  return {
    roles,
    permissionsByGroup,
    domainRules,
    error,
    clearError,
    loadRolesAndPermissions,
    loadRolePermissions,
    createRole: createRoleAction,
    updateRole: updateRoleAction,
    deleteRole: deleteRoleAction,
    syncPermissions,
    loadDomainRules,
    createDomainRule: createDomainRuleAction,
    updateDomainRule: updateDomainRuleAction,
    deleteDomainRule: deleteDomainRuleAction,
    init,
  }
})
