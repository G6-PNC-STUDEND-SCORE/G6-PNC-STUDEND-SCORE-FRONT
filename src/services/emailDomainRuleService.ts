import { http } from './apiHttp'
import type { EmailDomainRule, ApiResponse } from '@/types'

export type { EmailDomainRule }

export async function getEmailDomainRules(): Promise<EmailDomainRule[]> {
  const res = await http.get<ApiResponse<EmailDomainRule[]>>('/email-domain-rules')
  return res.data.data
}

export async function createEmailDomainRule(data: {
  domain: string
  role_id: number
}): Promise<EmailDomainRule> {
  const res = await http.post<ApiResponse<EmailDomainRule>>('/email-domain-rules', data)
  return res.data.data
}

export async function updateEmailDomainRule(
  id: number,
  data: { domain: string; role_id: number; is_active?: boolean },
): Promise<EmailDomainRule> {
  const res = await http.put<ApiResponse<EmailDomainRule>>(
    `/email-domain-rules/${id}`,
    data,
  )
  return res.data.data
}

export async function deleteEmailDomainRule(id: number): Promise<void> {
  await http.delete(`/email-domain-rules/${id}`)
}

export interface StudentEmailDomain {
  id: number
  domain: string
}

// Active Sign-in Domains configured for the student role — used to let the importing
// user pick which domain new student accounts get, instead of a synthetic placeholder email.
export async function getStudentEmailDomains(): Promise<StudentEmailDomain[]> {
  const res = await http.get<ApiResponse<StudentEmailDomain[]>>('/email-domain-rules/student-domains')
  return res.data.data
}
