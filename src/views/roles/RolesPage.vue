<template>
  <div class="pt-0 pb-4 roles-page">
    <div v-if="error" class="alert-banner">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status" style="width: 2.25rem; height: 2.25rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else class="role-card">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <label class="filter-label">
            <ShieldCheck :size="16" />
            <span>Role</span>
            <select v-model.number="selectedRoleId" class="filter-select" @change="onRoleChange">
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </label>

          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search feature..."
              @input="currentPage = 1"
            />
          </div>
        </div>

        <div class="toolbar-right">
          <button
            v-if="selectedRole && selectedRole.slug !== 'admin'"
            class="btn-icon-danger"
            title="Delete role"
            @click="confirmDelete = selectedRole"
          >
            <Trash2 :size="15" />
          </button>
          <span class="count-badge">{{ featureRows.length }} feature{{ featureRows.length !== 1 ? 's' : '' }}</span>
          <button class="btn-add-role" @click="openCreateModal">
            <Plus :size="15" />
            New Role
          </button>
        </div>
      </div>

      <!-- Selected role info -->
      <div v-if="selectedRole" class="role-info-bar">
        <input
          v-model="editName"
          class="role-name-input"
          :disabled="selectedRole.slug === 'admin'"
          @change="renameRole"
        />
        <span class="role-slug-badge">{{ selectedRole.slug }}</span>
        <input
          v-model="editDescription"
          class="role-desc-input"
          placeholder="Add a description..."
          @change="renameRole"
        />
      </div>

      <!-- ── Empty State (no data) ── -->
      <div v-if="pagedRows.length === 0" class="empty-container">
        <div class="empty-box">
          <Inbox :size="40" />
          <h5>No features found</h5>
          <p>{{ searchQuery ? 'Try a different search term.' : 'No features match the current filter.' }}</p>
        </div>
      </div>

      <!-- ── Table (with data) ── -->
      <div v-else class="table-wrap">
        <table class="perm-table">
          <thead>
            <tr>
              <th class="col-all">All</th>
              <th class="col-feature">Feature</th>
              <th class="col-action">View</th>
              <th class="col-action">Create</th>
              <th class="col-action">Update</th>
              <th class="col-action">Delete</th>
              <th class="col-other">Other</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.group" class="perm-row">
              <td class="col-all">
                <input
                  type="checkbox"
                  class="perm-checkbox"
                  title="Select all for this feature"
                  :checked="isRowFullySelected(row, selectedPermissionIds)"
                  :indeterminate.prop="isRowPartiallySelected(row, selectedPermissionIds)"
                  @change="toggleRow(row, ($event.target as HTMLInputElement).checked)"
                />
              </td>
              <td class="col-feature">
                <span class="feature-name">{{ row.label }}</span>
              </td>
              <td class="col-action">
                <input
                  v-if="row.view"
                  type="checkbox"
                  class="perm-checkbox"
                  :checked="selectedPermissionIds.has(row.view.id)"
                  @change="togglePermission(row.view.id)"
                />
                <span v-else class="cell-na">—</span>
              </td>
              <td class="col-action">
                <input
                  v-if="row.create"
                  type="checkbox"
                  class="perm-checkbox"
                  :checked="selectedPermissionIds.has(row.create.id)"
                  @change="togglePermission(row.create!.id)"
                />
                <span v-else class="cell-na">—</span>
              </td>
              <td class="col-action">
                <input
                  v-if="row.update"
                  type="checkbox"
                  class="perm-checkbox"
                  :checked="selectedPermissionIds.has(row.update.id)"
                  @change="togglePermission(row.update!.id)"
                />
                <span v-else class="cell-na">—</span>
              </td>
              <td class="col-action">
                <input
                  v-if="row.delete"
                  type="checkbox"
                  class="perm-checkbox"
                  :checked="selectedPermissionIds.has(row.delete.id)"
                  @change="togglePermission(row.delete!.id)"
                />
                <span v-else class="cell-na">—</span>
              </td>
              <td class="col-other">
                <span v-if="row.other.length === 0" class="cell-na">—</span>
                <label v-for="perm in row.other" :key="perm.id" class="other-check">
                  <input
                    type="checkbox"
                    :checked="selectedPermissionIds.has(perm.id)"
                    @change="togglePermission(perm.id)"
                  />
                  <span>{{ actionLabel(perm, row.group) }}</span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filteredRows.length > 0" class="pagination-bar">
        <div class="pagination-info">
          <span class="rows-label">Rows per page:</span>
          <div class="rows-selector">
            <button
              v-for="size in pageSizeOptions"
              :key="size"
              class="rows-btn"
              :class="{ active: perPage === size }"
              @click="changePerPage(size)"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <div class="pagination-pages">
          <button class="page-nav" :disabled="currentPage <= 1" @click="currentPage--" aria-label="Previous page">
            <ChevronLeft :size="16" />
          </button>
          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="page !== '...'"
              class="page-btn"
              :class="{ active: currentPage === page }"
              @click="currentPage = page as number"
            >
              {{ page }}
            </button>
            <span v-else class="page-dots">…</span>
          </template>
          <button class="page-nav" :disabled="currentPage >= lastPage" @click="currentPage++" aria-label="Next page">
            <ChevronRight :size="16" />
          </button>
        </div>

        <div class="pagination-total">
          {{ filteredRows.length === 0 ? 0 : pagination.from }}-{{ pagination.to }} of {{ filteredRows.length }}
        </div>

        <div class="save-group">
          <span v-if="isDirty" class="dirty-hint">Unsaved changes</span>
          <button class="btn-save" :disabled="!isDirty || saving" @click="savePermissions">
            <span v-if="saving" class="spinner-sm"></span>
            <Check v-else :size="15" />
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create Role Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="create-modal">
        <div class="create-modal-header">
          <h5>New Role</h5>
          <button class="modal-close" @click="showCreateModal = false">&times;</button>
        </div>
        <div class="create-modal-body">
          <div class="form-group">
            <label>Role Name</label>
            <input v-model="newRole.name" class="form-input" placeholder="e.g. Coordinator" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <input v-model="newRole.description" class="form-input" placeholder="Optional" />
          </div>

          <div class="table-wrap modal-table-wrap">
            <table class="perm-table">
              <thead>
                <tr>
                  <th class="col-all">All</th>
                  <th class="col-feature">Feature</th>
                  <th class="col-action">View</th>
                  <th class="col-action">Create</th>
                  <th class="col-action">Update</th>
                  <th class="col-action">Delete</th>
                  <th class="col-other">Other</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in featureRows" :key="row.group" class="perm-row">
                  <td class="col-all">
                    <input
                      type="checkbox"
                      class="perm-checkbox"
                      title="Select all for this feature"
                      :checked="isRowFullySelected(row, newRole.permissionIds)"
                      :indeterminate.prop="isRowPartiallySelected(row, newRole.permissionIds)"
                      @change="toggleNewRoleRow(row, ($event.target as HTMLInputElement).checked)"
                    />
                  </td>
                  <td class="col-feature"><span class="feature-name">{{ row.label }}</span></td>
                  <td class="col-action">
                    <input v-if="row.view" type="checkbox" class="perm-checkbox"
                      :checked="newRole.permissionIds.has(row.view.id)" @change="toggleNewRolePermission(row.view!.id)" />
                    <span v-else class="cell-na">—</span>
                  </td>
                  <td class="col-action">
                    <input v-if="row.create" type="checkbox" class="perm-checkbox"
                      :checked="newRole.permissionIds.has(row.create.id)" @change="toggleNewRolePermission(row.create!.id)" />
                    <span v-else class="cell-na">—</span>
                  </td>
                  <td class="col-action">
                    <input v-if="row.update" type="checkbox" class="perm-checkbox"
                      :checked="newRole.permissionIds.has(row.update.id)" @change="toggleNewRolePermission(row.update!.id)" />
                    <span v-else class="cell-na">—</span>
                  </td>
                  <td class="col-action">
                    <input v-if="row.delete" type="checkbox" class="perm-checkbox"
                      :checked="newRole.permissionIds.has(row.delete.id)" @change="toggleNewRolePermission(row.delete!.id)" />
                    <span v-else class="cell-na">—</span>
                  </td>
                  <td class="col-other">
                    <span v-if="row.other.length === 0" class="cell-na">—</span>
                    <label v-for="perm in row.other" :key="perm.id" class="other-check">
                      <input type="checkbox" :checked="newRole.permissionIds.has(perm.id)" @change="toggleNewRolePermission(perm.id)" />
                      <span>{{ actionLabel(perm, row.group) }}</span>
                    </label>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="create-modal-footer">
          <button class="btn-cancel" @click="showCreateModal = false">Cancel</button>
          <button class="btn-save" :disabled="!newRole.name.trim() || creating" @click="submitCreateRole">
            <span v-if="creating" class="spinner-sm"></span>
            {{ creating ? 'Creating...' : 'Create Role' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = null">
      <div class="confirm-modal">
        <h5>Delete "{{ confirmDelete.name }}"?</h5>
        <p class="text-secondary">
          Users currently assigned this role will keep it, but it will no longer appear as an option.
          This can't be undone.
        </p>
        <div class="confirm-modal-actions">
          <button class="btn-cancel" @click="confirmDelete = null">Cancel</button>
          <button class="btn-delete-confirm" :disabled="deleting" @click="doDeleteRole">
            {{ deleting ? 'Deleting...' : 'Delete Role' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ShieldCheck, Inbox, Plus, Trash2, Check, AlertTriangle,
  Search, ChevronLeft, ChevronRight,
} from '@lucide/vue'
import {
  getPermissions, getRoles, getRolePermissions, syncRolePermissions,
  createRole, updateRole, deleteRole,
  type Role, type Permission, type PermissionsByGroup,
} from '@/services/permissionService'

interface FeatureRow {
  group: string
  label: string
  view: Permission | null
  create: Permission | null
  update: Permission | null
  delete: Permission | null
  other: Permission[]
}

const loading = ref(true)
const error = ref('')
const roles = ref<Role[]>([])
const permissionsByGroup = ref<PermissionsByGroup>({})

const selectedRoleId = ref<number | null>(null)
const selectedRole = ref<Role | null>(null)
const selectedPermissionIds = ref<Set<number>>(new Set())
const originalPermissionIds = ref<Set<number>>(new Set())
const editName = ref('')
const editDescription = ref('')
const saving = ref(false)

const searchQuery = ref('')
const currentPage = ref(1)
const perPage = ref(10)
const pageSizeOptions = [5, 10, 25, 50]

const showCreateModal = ref(false)
const creating = ref(false)
const newRole = ref<{ name: string; description: string; permissionIds: Set<number> }>({
  name: '', description: '', permissionIds: new Set(),
})

const confirmDelete = ref<Role | null>(null)
const deleting = ref(false)

function formatGroupName(group: string): string {
  return group.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function actionLabel(perm: Permission, group: string): string {
  const suffix = `-${group}`
  const action = perm.slug.endsWith(suffix) ? perm.slug.slice(0, -suffix.length) : perm.slug
  return action.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const featureRows = computed<FeatureRow[]>(() => {
  return Object.entries(permissionsByGroup.value).map(([group, perms]) => {
    const find = (action: string) => perms.find(p => p.slug === `${action}-${group}`) ?? null
    const view = find('view')
    const create = find('create')
    const update = find('update')
    const del = find('delete')
    const standardIds = new Set([view, create, update, del].filter((p): p is Permission => p !== null).map(p => p.id))
    const other = perms.filter(p => !standardIds.has(p.id))
    return { group, label: formatGroupName(group), view, create, update, delete: del, other }
  })
})

const filteredRows = computed(() => {
  if (!searchQuery.value.trim()) return featureRows.value
  const q = searchQuery.value.toLowerCase()
  return featureRows.value.filter(r => r.label.toLowerCase().includes(q))
})

const lastPage = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / perPage.value)))

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredRows.value.slice(start, start + perPage.value)
})

const pagination = computed(() => {
  const from = (currentPage.value - 1) * perPage.value + 1
  const to = Math.min(currentPage.value * perPage.value, filteredRows.value.length)
  return { from, to }
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = lastPage.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }
  pages.push(1)
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

function changePerPage(size: number) {
  perPage.value = size
  currentPage.value = 1
}

const isDirty = computed(() => {
  if (selectedPermissionIds.value.size !== originalPermissionIds.value.size) return true
  for (const id of selectedPermissionIds.value) {
    if (!originalPermissionIds.value.has(id)) return true
  }
  return false
})

function togglePermission(id: number) {
  if (selectedPermissionIds.value.has(id)) selectedPermissionIds.value.delete(id)
  else selectedPermissionIds.value.add(id)
  selectedPermissionIds.value = new Set(selectedPermissionIds.value)
}

function toggleNewRolePermission(id: number) {
  if (newRole.value.permissionIds.has(id)) newRole.value.permissionIds.delete(id)
  else newRole.value.permissionIds.add(id)
  newRole.value.permissionIds = new Set(newRole.value.permissionIds)
}

// ─── Per-feature "select all" (View + Create + Update + Delete + Other) ──
function rowPermissionIds(row: FeatureRow): number[] {
  return [row.view, row.create, row.update, row.delete, ...row.other]
    .filter((p): p is Permission => p !== null)
    .map(p => p.id)
}

function isRowFullySelected(row: FeatureRow, ids: Set<number>): boolean {
  const rowIds = rowPermissionIds(row)
  return rowIds.length > 0 && rowIds.every(id => ids.has(id))
}

function isRowPartiallySelected(row: FeatureRow, ids: Set<number>): boolean {
  const rowIds = rowPermissionIds(row)
  const selectedCount = rowIds.filter(id => ids.has(id)).length
  return selectedCount > 0 && selectedCount < rowIds.length
}

function toggleRow(row: FeatureRow, checked: boolean) {
  const rowIds = rowPermissionIds(row)
  rowIds.forEach(id => {
    if (checked) selectedPermissionIds.value.add(id)
    else selectedPermissionIds.value.delete(id)
  })
  selectedPermissionIds.value = new Set(selectedPermissionIds.value)
}

function toggleNewRoleRow(row: FeatureRow, checked: boolean) {
  const rowIds = rowPermissionIds(row)
  rowIds.forEach(id => {
    if (checked) newRole.value.permissionIds.add(id)
    else newRole.value.permissionIds.delete(id)
  })
  newRole.value.permissionIds = new Set(newRole.value.permissionIds)
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [perms, roleList] = await Promise.all([getPermissions(), getRoles()])
    permissionsByGroup.value = perms
    roles.value = roleList
    if (roleList.length > 0) {
      const toSelect = selectedRoleId.value ? roleList.find(r => r.id === selectedRoleId.value) ?? roleList[0]! : roleList[0]!
      await selectRole(toSelect)
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load roles & permissions.'
  } finally {
    loading.value = false
  }
}

async function selectRole(role: Role) {
  selectedRole.value = role
  selectedRoleId.value = role.id
  editName.value = role.name
  editDescription.value = role.description || ''
  currentPage.value = 1
  try {
    const { permissions } = await getRolePermissions(role.id)
    const ids = new Set<number>()
    Object.values(permissions).forEach(group => group.forEach(p => ids.add(p.id)))
    selectedPermissionIds.value = ids
    originalPermissionIds.value = new Set(ids)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to load permissions for this role.'
  }
}

function onRoleChange() {
  const role = roles.value.find(r => r.id === selectedRoleId.value)
  if (role) selectRole(role)
}

async function savePermissions() {
  if (!selectedRole.value) return
  saving.value = true
  error.value = ''
  try {
    const ids = Array.from(selectedPermissionIds.value)
    await syncRolePermissions(selectedRole.value.id, ids)
    originalPermissionIds.value = new Set(selectedPermissionIds.value)
    const role = roles.value.find(r => r.id === selectedRole.value!.id)
    if (role) role.permissions = ids.map(id => ({ id } as Permission))
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to save permissions.'
  } finally {
    saving.value = false
  }
}

async function renameRole() {
  if (!selectedRole.value || selectedRole.value.slug === 'admin') return
  if (!editName.value.trim()) { editName.value = selectedRole.value.name; return }
  if (editName.value === selectedRole.value.name && editDescription.value === (selectedRole.value.description || '')) return
  try {
    const updated = await updateRole(selectedRole.value.id, {
      name: editName.value.trim(),
      description: editDescription.value.trim() || undefined,
    })
    const idx = roles.value.findIndex(r => r.id === updated.id)
    if (idx !== -1) roles.value[idx] = { ...roles.value[idx], ...updated }
    if (selectedRole.value) { selectedRole.value.name = updated.name; selectedRole.value.description = updated.description }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to update role.'
  }
}

function openCreateModal() {
  newRole.value = { name: '', description: '', permissionIds: new Set() }
  showCreateModal.value = true
}

async function submitCreateRole() {
  if (!newRole.value.name.trim()) return
  creating.value = true
  error.value = ''
  try {
    const created = await createRole({
      name: newRole.value.name.trim(),
      description: newRole.value.description.trim() || undefined,
      permission_ids: Array.from(newRole.value.permissionIds),
    })
    showCreateModal.value = false
    await loadAll()
    const role = roles.value.find(r => r.id === created.id)
    if (role) await selectRole(role)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to create role.'
  } finally {
    creating.value = false
  }
}

async function doDeleteRole() {
  if (!confirmDelete.value) return
  deleting.value = true
  error.value = ''
  try {
    await deleteRole(confirmDelete.value.id)
    const wasSelected = selectedRole.value?.id === confirmDelete.value.id
    confirmDelete.value = null
    if (wasSelected) { selectedRole.value = null; selectedRoleId.value = null }
    await loadAll()
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to delete role.'
  } finally {
    deleting.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.roles-page {
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  /* Header is a fixed 72px. .main-content has 20px padding on all sides;
     trim that down to a 14px gap on top/left/right and a 10px gap on
     the bottom. Height is computed from the viewport (not a percentage
     of the parent, which doesn't reliably resolve through the flex
     chain) so the bottom edge always lands exactly 10px from the
     screen regardless of how tall the table's content is.
     .main-content has overflow-x: hidden as a safety net, so extending
     6px into the left/right padding here can never cause a page-wide
     horizontal scrollbar. */
  height: calc(100vh - 96px);
  width: calc(100% + 12px);
  margin-top: -6px;
  margin-left: -6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

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
  margin-bottom: 1rem;
}

.role-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.25s ease;
}

.role-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

/* Toolbar (mirrors Users page) */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}
.toolbar-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.toolbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.filter-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.4rem 0.5rem 0.4rem 0.75rem;
}
.filter-label :deep(svg) { color: #94a3b8; }
.filter-select {
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  font-family: inherit;
  font-weight: 600;
  color: #334155;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  outline: none;
}

.search-box { position: relative; width: 220px; }
.search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
.search-input {
  width: 100%;
  padding: 0.6rem 0.9rem 0.6rem 2.4rem;
  font-size: 0.8125rem;
  font-family: inherit;
  color: #1f2937;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
}
.search-input::placeholder { color: #9ca3af; }
.search-input:hover { border-color: #cbd5e1; }
.search-input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }

.count-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.4rem 0.85rem;
  border-radius: 100px;
  white-space: nowrap;
}

.btn-add-role {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.5rem 0.85rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-add-role:hover { background: #1d4ed8; }

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

/* Role info bar */
.role-info-bar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 12px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
  flex-wrap: wrap;
}
.role-name-input {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  border: none;
  background: transparent;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
}
.role-name-input:hover:not(:disabled), .role-name-input:focus:not(:disabled) { background: #f1f5f9; outline: none; }
.role-name-input:disabled { color: #64748b; cursor: not-allowed; }

.role-slug-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  flex-shrink: 0;
}

.role-desc-input {
  font-size: 0.8125rem;
  color: #64748b;
  border: none;
  background: transparent;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  flex: 1;
  min-width: 160px;
}
.role-desc-input:hover, .role-desc-input:focus { background: #f1f5f9; outline: none; }

/* Table */
.table-wrap { width: 100%; flex: 1; min-height: 160px; overflow-y: auto; overflow-x: auto; }
.table-wrap::-webkit-scrollbar { width: 4px; height: 4px; }
.table-wrap::-webkit-scrollbar-track { background: transparent; }
.table-wrap::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
.table-wrap::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

.perm-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.875rem; }
.perm-table thead th {
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
.perm-table thead th.col-action { text-align: center; }
.perm-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f3f5;
  color: #475569;
  vertical-align: middle;
}
.perm-table tbody tr:last-child td { border-bottom: none; }
.perm-row { transition: background 0.15s ease; }
.perm-table tbody tr:hover { background: #f8fafc; }

.col-all { text-align: center; width: 50px; }
.col-feature { min-width: 160px; }
.feature-name { font-weight: 600; color: #0f172a; }
.col-action { text-align: center; width: 90px; }
.col-other { min-width: 180px; }

.perm-checkbox {
  width: 17px;
  height: 17px;
  accent-color: #2563eb;
  cursor: pointer;
}
.cell-na { color: #cbd5e1; font-size: 0.8rem; }

.other-check {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #475569;
  font-weight: 500;
  margin: 0 0.5rem 0.25rem 0;
  cursor: pointer;
}
.other-check input { width: 14px; height: 14px; accent-color: #2563eb; cursor: pointer; }

.empty-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.empty-container .empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #94a3b8;
}

.empty-container .empty-box h5 {
  font-weight: 700;
  color: #64748b;
  margin: 0;
  font-size: 1rem;
}

.empty-container .empty-box p {
  font-size: 0.85rem;
  margin: 0;
}

/* Pagination (mirrors Users page) */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
  font-size: 0.8125rem;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.pagination-info { display: flex; align-items: center; gap: 8px; color: #64748b; }
.rows-label { font-weight: 500; white-space: nowrap; }
.rows-selector { display: flex; gap: 2px; background: #f1f5f9; border-radius: 8px; padding: 2px; }
.rows-btn {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.15s ease;
}
.rows-btn:hover { color: #334155; }
.rows-btn.active { background: #fff; color: #2563eb; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }

.pagination-pages { display: flex; align-items: center; gap: 2px; }
.page-nav {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
}
.page-nav:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; background: #f0f5ff; }
.page-nav:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn {
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #475569;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8125rem;
}
.page-btn:hover:not(.active) { background: #f1f5f9; color: #2563eb; }
.page-btn.active { background: #2563eb; color: #fff; font-weight: 600; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25); }
.page-dots { width: 24px; text-align: center; color: #94a3b8; font-size: 0.875rem; letter-spacing: 1px; }
.pagination-total { color: #64748b; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }

.save-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}
.dirty-hint { font-size: 0.78rem; color: #f59e0b; font-weight: 600; }
.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 1.1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-save:hover:not(:disabled) { background: #1d4ed8; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner-sm {
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Modals */
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
.create-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modal-in 0.25s ease-out;
}

@keyframes modal-in { 0%{opacity:0;transform:scale(0.92)translateY(10px)} 100%{opacity:1;transform:scale(1)translateY(0)} }
.create-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.4rem;
  border-bottom: 1px solid #f1f5f9;
}
.create-modal-header h5 { margin: 0; font-weight: 700; color: #0f172a; }
.modal-close { background: transparent; border: none; font-size: 1.4rem; line-height: 1; color: #94a3b8; cursor: pointer; }
.create-modal-body { padding: 1.4rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.1rem; }
.modal-table-wrap { border: 1px solid #f1f5f9; border-radius: 12px; max-height: 320px; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #374151; }
.form-input { padding: 0.55rem 0.75rem; font-size: 0.85rem; border: 1.5px solid #e5e7eb; border-radius: 10px; outline: none; }
.form-input:focus { border-color: #3b82f6; }
.create-modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.4rem; border-top: 1px solid #f1f5f9; }
.btn-cancel { background: #f1f5f9; color: #475569; border: none; border-radius: 10px; padding: 0.55rem 1.1rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #e2e8f0; }

.confirm-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 420px; padding: 1.5rem; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); animation: modal-in 0.25s ease-out; }
.confirm-modal h5 { margin: 0 0 0.5rem; font-weight: 700; color: #0f172a; }
.confirm-modal p { font-size: 0.85rem; margin-bottom: 1.25rem; }
.confirm-modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
.btn-delete-confirm { background: #dc2626; color: #fff; border: none; border-radius: 10px; padding: 0.55rem 1.1rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; }
.btn-delete-confirm:hover:not(:disabled) { background: #b91c1c; }
.btn-delete-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
