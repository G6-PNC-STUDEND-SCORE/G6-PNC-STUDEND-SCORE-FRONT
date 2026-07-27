import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getPermissions, getRoles, getRolePermissions, syncRolePermissions,
  createRole, updateRole, deleteRole,
  type Role, type PermissionsByGroup,
} from '@/services/permissionService'
import {
  getEmailDomainRules, createEmailDomainRule, updateEmailDomainRule, deleteEmailDomainRule,
  type EmailDomainRule,
} from '@/services/emailDomainRuleService'
import { extractErrorMessage } from '@/utils'

export const useRoleStore = defineStore('role', () => {
  const roles = ref<Role[]>([])
  const permissionsByGroup = ref<PermissionsByGroup>({})
  const domainRules = ref<EmailDomainRule[]>([])
  const error = ref('')

  function clearError() {
    error.value = ''
  }

  async function loadRolesAndPermissions() {
    clearError()
    try {
      const [perms, roleList] = await Promise.all([getPermissions(), getRoles()])
      permissionsByGroup.value = perms
      roles.value = roleList
    } catch (e: unknown) {
      error.value = extractErrorMessage(e) || 'Failed to load roles & permissions.'
    }
  }

  async function loadRolePermissions(roleId: number): Promise<PermissionsByGroup> {
    clearError()
    const { permissions } = await getRolePermissions(roleId)
    return permissions
  }

  async function createRoleAction(data: { name: string; description?: string; permission_ids?: number[] }): Promise<Role> {
    clearError()
    const created = await createRole(data)
    return created
  }

  async function updateRoleAction(roleId: number, data: { name: string; description?: string }): Promise<Role> {
    clearError()
    const updated = await updateRole(roleId, data)
    return updated
  }

  async function deleteRoleAction(roleId: number): Promise<void> {
    clearError()
    await deleteRole(roleId)
    roles.value = roles.value.filter(r => r.id !== roleId)
  }

  async function syncPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    clearError()
    await syncRolePermissions(roleId, permissionIds)
  }

  async function loadDomainRules() {
    clearError()
    try {
      const ruleList = await getEmailDomainRules()
      domainRules.value = ruleList
    } catch (e: unknown) {
      error.value = extractErrorMessage(e) || 'Failed to load sign-in domain rules.'
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
