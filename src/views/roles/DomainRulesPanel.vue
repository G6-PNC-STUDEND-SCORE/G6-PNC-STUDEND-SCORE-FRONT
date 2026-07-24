<template>
  <div class="domain-rules-panel">
    <div v-if="error" class="alert-banner">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <div class="panel-intro">
      <p>
        When someone signs in with Google for the first time, their role is decided by their
        email's domain. Unrecognized domains are rejected. Add a rule here whenever a new
        cohort's email pattern needs to be recognized automatically.
      </p>
    </div>

    <div class="table-wrap">
      <table class="rules-table">
        <thead>
          <tr>
            <th>Email Domain</th>
            <th>Assigned Role</th>
            <th class="col-active">Active</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rule in rules" :key="rule.id" class="rule-row">
            <td>
              <div v-if="editingDomainId === rule.id" class="domain-edit-wrap">
                <span class="domain-prefix">@</span>
                <input
                  v-model="editingDomainValue"
                  class="domain-edit-input"
                  @keyup.enter="onDomainSave(rule)"
                  @keyup.escape="onDomainCancel"
                  @blur="onDomainSave(rule)"
                />
              </div>
              <span v-else class="domain-text" @dblclick="onDomainEditStart(rule)">
                <span class="domain-prefix">@</span>{{ rule.domain }}
                <button
                  class="btn-edit-domain"
                  title="Edit domain"
                  @click="onDomainEditStart(rule)"
                >
                  <Pencil :size="13" />
                </button>
              </span>
            </td>
            <td>
              <select
                class="role-select"
                :value="rule.role_id"
                @change="onRoleChange(rule, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
            </td>
            <td class="col-active">
              <input
                type="checkbox"
                class="active-checkbox"
                :checked="rule.is_active"
                @change="onActiveChange(rule, ($event.target as HTMLInputElement).checked)"
              />
            </td>
            <td class="col-actions">
              <button class="btn-icon-danger" title="Delete rule" @click="confirmDelete = rule">
                <Trash2 :size="15" />
              </button>
            </td>
          </tr>
          <tr v-if="rules.length === 0">
            <td colspan="4" class="empty-row">No sign-in domain rules yet.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <form class="add-rule-form" @submit.prevent="submitAdd">
      <input
        v-model="newDomain"
        class="form-input domain-input"
        placeholder="e.g. kilo.passerellesnumeriques.org"
        required
      />
      <select v-model.number="newRoleId" class="form-input role-input" required>
        <option :value="null" disabled>Assign role...</option>
        <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
      </select>
      <button class="btn-add-role" type="submit" :disabled="adding || !newDomain.trim() || !newRoleId">
        <Plus :size="15" />
        {{ adding ? 'Adding...' : 'Add Rule' }}
      </button>
    </form>

    <!-- Delete Confirm Modal -->
    <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = null">
      <div class="confirm-modal">
        <h5>Delete sign-in rule for "@{{ confirmDelete.domain }}"?</h5>
        <p class="text-secondary">
          New Google sign-ins from this domain will be rejected until another rule is added.
        </p>
        <div class="confirm-modal-actions">
          <button class="btn-cancel" @click="confirmDelete = null">Cancel</button>
          <button class="btn-delete-confirm" :disabled="deleting" @click="doDelete">
            {{ deleting ? 'Deleting...' : 'Delete Rule' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { AlertTriangle, Plus, Trash2, Pencil } from '@lucide/vue'
import {
  getEmailDomainRules, createEmailDomainRule, updateEmailDomainRule, deleteEmailDomainRule,
  type EmailDomainRule,
} from '@/services/emailDomainRuleService'
import { getRoles, type Role } from '@/services/permissionService'

const rules = ref<EmailDomainRule[]>([])
const roles = ref<Role[]>([])
const error = ref('')

const newDomain = ref('')
const newRoleId = ref<number | null>(null)
const adding = ref(false)

const confirmDelete = ref<EmailDomainRule | null>(null)
const deleting = ref(false)

// ─── Inline domain editing ───────────────────────────────────────────
const editingDomainId = ref<number | null>(null)
const editingDomainValue = ref('')

async function onDomainEditStart(rule: EmailDomainRule) {
  editingDomainId.value = rule.id
  editingDomainValue.value = rule.domain
  await nextTick()
  // Query the input directly — template refs inside v-if + v-for are unreliable
  document.querySelector<HTMLInputElement>('.domain-edit-input')?.focus()
}

function onDomainCancel() {
  editingDomainId.value = null
  editingDomainValue.value = ''
}

async function onDomainSave(rule: EmailDomainRule) {
  if (editingDomainId.value !== rule.id) return
  const newDomain = editingDomainValue.value.trim().toLowerCase()
  if (!newDomain || newDomain === rule.domain) {
    onDomainCancel()
    return
  }
  
  const oldDomain = rule.domain
  rule.domain = newDomain
  editingDomainId.value = null
  
  try {
    await updateEmailDomainRule(rule.id, { domain: newDomain, role_id: rule.role_id, is_active: rule.is_active })
  } catch (e: any) {
    rule.domain = oldDomain
    error.value = e?.response?.data?.message || 'Failed to update domain.'
  }
}

async function loadAll() {
  error.value = ''
  try {
    const [ruleList, roleList] = await Promise.all([getEmailDomainRules(), getRoles()])
    rules.value = ruleList
    roles.value = roleList
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load sign-in domain rules.'
  }
}

async function onRoleChange(rule: EmailDomainRule, roleId: string) {
  const oldRoleId = rule.role_id
  rule.role_id = Number(roleId)
  try {
    await updateEmailDomainRule(rule.id, { domain: rule.domain, role_id: rule.role_id, is_active: rule.is_active })
  } catch (e: any) {
    rule.role_id = oldRoleId
    error.value = e?.response?.data?.message || 'Failed to update rule.'
  }
}

async function onActiveChange(rule: EmailDomainRule, active: boolean) {
  const old = rule.is_active
  rule.is_active = active
  try {
    await updateEmailDomainRule(rule.id, { domain: rule.domain, role_id: rule.role_id, is_active: active })
  } catch (e: any) {
    rule.is_active = old
    error.value = e?.response?.data?.message || 'Failed to update rule.'
  }
}

async function submitAdd() {
  if (!newDomain.value.trim() || !newRoleId.value) return
  adding.value = true
  error.value = ''
  try {
    const created = await createEmailDomainRule({ domain: newDomain.value.trim(), role_id: newRoleId.value })
    rules.value.push(created)
    newDomain.value = ''
    newRoleId.value = null
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to add rule.'
  } finally {
    adding.value = false
  }
}

async function doDelete() {
  if (!confirmDelete.value) return
  deleting.value = true
  error.value = ''
  try {
    await deleteEmailDomainRule(confirmDelete.value.id)
    rules.value = rules.value.filter(r => r.id !== confirmDelete.value!.id)
    confirmDelete.value = null
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to delete rule.'
  } finally {
    deleting.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.domain-rules-panel { display: flex; flex-direction: column; flex: 1; min-height: 0; }

.alert-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 0.65rem 0.9rem;
  font-size: 0.8125rem;
  margin: 16px 20px 0;
}

.panel-intro { padding: 16px 20px 0; }
.panel-intro p { margin: 0; font-size: 0.8125rem; color: #64748b; line-height: 1.5; }

.table-wrap { width: 100%; flex: 1; min-height: 120px; overflow-y: auto; padding: 16px 20px 0; }

.rules-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.875rem; }
.rules-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f8fafc;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
}
.rules-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f3f5;
  color: #475569;
  vertical-align: middle;
}
.rules-table tbody tr:last-child td { border-bottom: none; }
.rule-row:hover { background: #f8fafc; }

.domain-prefix { color: #94a3b8; font-weight: 600; }

.domain-text { cursor: default; padding: 0.2rem 0.4rem; border-radius: 6px; transition: background 0.15s; display: inline-flex; align-items: center; gap: 4px; }
.domain-text:hover { background: #f1f5f9; }

.btn-edit-domain {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  color: #94a3b8;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  opacity: 0;
}
.domain-text:hover .btn-edit-domain { opacity: 1; }
.btn-edit-domain:hover { background: #e2e8f0; color: #2563eb; }

.domain-edit-wrap { display: inline-flex; align-items: center; gap: 2px; }
.domain-edit-input {
  padding: 0.25rem 0.45rem;
  font-size: 0.85rem;
  font-family: inherit;
  font-weight: 500;
  color: #0f172a;
  border: 1.5px solid #2563eb;
  border-radius: 6px;
  outline: none;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  min-width: 200px;
}

.col-active { text-align: center; width: 80px; }
.col-actions { text-align: right; width: 60px; }

.role-select {
  padding: 0.35rem 0.6rem;
  font-size: 0.8125rem;
  font-family: inherit;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  color: #334155;
  outline: none;
}
.role-select:focus { border-color: #3b82f6; }

.active-checkbox { width: 17px; height: 17px; accent-color: #2563eb; cursor: pointer; }

.empty-row { text-align: center; color: #94a3b8; padding: 2rem !important; }

.btn-icon-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  color: #dc2626;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-icon-danger:hover { background: #fef2f2; color: #b91c1c; }

.add-rule-form {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  flex-wrap: wrap;
}
.form-input { padding: 0.55rem 0.75rem; font-size: 0.85rem; border: 1.5px solid #e5e7eb; border-radius: 10px; outline: none; font-family: inherit; }
.form-input:focus { border-color: #3b82f6; }
.domain-input { flex: 1; min-width: 220px; }
.role-input { min-width: 160px; }

.btn-add-role {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 0.9rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-add-role:hover:not(:disabled) { background: #1d4ed8; }
.btn-add-role:disabled { opacity: 0.5; cursor: not-allowed; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  padding: 1rem;
}
.confirm-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 420px; padding: 1.5rem; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); }
.confirm-modal h5 { margin: 0 0 0.5rem; font-weight: 700; color: #0f172a; }
.confirm-modal p { font-size: 0.85rem; margin-bottom: 1.25rem; color: #64748b; }
.confirm-modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
.btn-cancel { background: #f1f5f9; color: #475569; border: none; border-radius: 10px; padding: 0.55rem 1.1rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #e2e8f0; }
.btn-delete-confirm { background: #dc2626; color: #fff; border: none; border-radius: 10px; padding: 0.55rem 1.1rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
.btn-delete-confirm:hover:not(:disabled) { background: #b91c1c; }
.btn-delete-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
