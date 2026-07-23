import { http } from './api'
import type { Role } from './permissionService'

export interface EmailDomainRule {
  id: number
  domain: string
  role_id: number
  role?: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getEmailDomainRules(): Promise<EmailDomainRule[]> {
  const res = await http.get<{ success: boolean; data: EmailDomainRule[] }>('/email-domain-rules')
  return res.data.data
}

export async function createEmailDomainRule(data: { domain: string; role_id: number }): Promise<EmailDomainRule> {
  const res = await http.post<{ success: boolean; data: EmailDomainRule }>('/email-domain-rules', data)
  return res.data.data
}

export async function updateEmailDomainRule(
  id: number,
  data: { domain: string; role_id: number; is_active?: boolean },
): Promise<EmailDomainRule> {
  const res = await http.put<{ success: boolean; data: EmailDomainRule }>(`/email-domain-rules/${id}`, data)
  return res.data.data
}

export async function deleteEmailDomainRule(id: number): Promise<void> {
  await http.delete(`/email-domain-rules/${id}`)
}
