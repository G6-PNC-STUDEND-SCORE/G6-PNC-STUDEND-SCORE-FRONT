<template>
  <div :class="['al-page', { 'dark-mode': isDark }]">
    <div v-if="error" class="al-error">
      <AlertTriangle :size="16" />
      <span>{{ error }}</span>
      <button class="al-error-retry" @click="loadLogs"><RefreshCw :size="13" /> Retry</button>
    </div>

    <div class="al-card">
      <div class="al-toolbar">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
:placeholder="t('activityLog.searchPlaceholder')"
            @input="applyFilters"
          />
        </div>

        <div class="al-filter-group">
          <label class="al-filter">
            <select v-model="moduleFilter" class="al-select" @change="applyFilters">
              <option value="">{{ t('activityLog.allModules') }}</option>
              <option v-for="m in filterOptions.modules" :key="m" :value="m">{{ m }}</option>
            </select>
          </label>
          <label class="al-filter">
            <select v-model="actionFilter" class="al-select" @change="applyFilters">
              <option value="">{{ t('activityLog.allActions') }}</option>
              <option v-for="a in filterOptions.actions" :key="a" :value="a">{{ a }}</option>
            </select>
          </label>
          <label class="al-filter">
            <input v-model="dateFrom" type="date" class="al-select" @change="applyFilters" />
          </label>
          <label class="al-filter">
            <input v-model="dateTo" type="date" class="al-select" @change="applyFilters" />
          </label>
          <div class="export-dropdown" ref="exportBtnRef">
            <button class="al-btn al-btn-export" :disabled="logs.length === 0" @click="toggleExportMenu" title="Export">
              <Download :size="14" /> <span>{{ t('activityLog.export') }}</span>
              <ChevronDown :size="10" style="margin-left:2px" />
            </button>
            <div v-if="showExportMenu" class="export-menu">
              <div class="export-menu-item" @click="exportLogsAsCSV">
                <FileText :size="15" /> {{ t('activityLog.exportCsv') }}
              </div>
              <div class="export-menu-item" @click="exportLogsAsExcel">
                <FileSpreadsheet :size="15" /> {{ t('activityLog.exportExcel') }}
              </div>
              <div class="export-menu-item" @click="exportLogsAsPDF">
                <FileType :size="15" /> {{ t('activityLog.exportPdf') }}
              </div>
            </div>
          </div>
          <button v-if="hasActiveFilters" class="al-clear" @click="clearFilters">
            <XCircle :size="14" /> {{ t('activityLog.clear') }}
          </button>
        </div>
      </div>

      <div v-if="canDelete && selectedIds.length > 0" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} selected</span>
        <button class="bulk-delete-btn" @click="showDeleteModal = true">
          <Trash2 :size="16" />
          {{ t('common.deleteSelected') }}
        </button>
        <button class="bulk-clear-btn" @click="selectedIds = []">{{ t('common.clearSelection') }}</button>
      </div>

      <LoadingState v-if="loading && logs.length === 0" :message="t('activityLog.loading')" />

      <EmptyState
        v-else-if="logs.length === 0"
        :title="t('activityLog.noActivity')"
        :message="hasActiveFilters ? t('activityLog.tryDifferent') : t('activityLog.nothingYet')"
      />

      <div v-else class="table-wrap">
        <table class="al-table data-table-base">
          <thead>
            <tr>
              <th v-if="canDelete" class="col-check">
                <input
                  type="checkbox"
                  class="table-checkbox"
                  :checked="isAllPageSelected"
                  :indeterminate="isIndeterminate"
                  @change="toggleSelectAll"
                />
              </th>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Description</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" :class="{ 'row-selected': canDelete && selectedIds.includes(log.id) }">
              <td v-if="canDelete" class="col-check" @click.stop>
                <input
                  type="checkbox"
                  class="table-checkbox"
                  :checked="selectedIds.includes(log.id)"
                  @change="toggleSelectLog(log.id)"
                />
              </td>
              <td>
                <div class="user-cell">
                  <div class="avatar">{{ getUserInitials(log.user_name) }}</div>
                  <span class="user-name">{{ log.user_name }}</span>
                </div>
              </td>
              <td>
                <span class="action-badge" :class="getActionBadgeClass(log.action)">{{ log.action }}</span>
              </td>
              <td><span class="module-badge">{{ log.module }}</span></td>
              <td class="description-cell" :title="log.description" @click="showDetail(log)">
                <span class="desc-text">{{ log.description }}</span>
              </td>
              <td class="time-cell" :title="new Date(log.created_at_raw).toLocaleString()">{{ log.created_at }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="logs.length > 0" class="pagination-bar">
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
          <button class="page-nav" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)" aria-label="Previous page">
            <ChevronLeft :size="16" />
          </button>
          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="page !== '...'"
              class="page-btn"
              :class="{ active: currentPage === page }"
              @click="changePage(page as number)"
            >
              {{ page }}
            </button>
            <span v-else class="page-dots">…</span>
          </template>
          <button class="page-nav" :disabled="currentPage >= lastPage" @click="changePage(currentPage + 1)" aria-label="Next page">
            <ChevronRight :size="16" />
          </button>
        </div>

        <div class="pagination-total">{{ total === 0 ? 0 : from }}-{{ to }} of {{ total }}</div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="detailLog" class="modal-overlay" @click.self="detailLog = null">
          <div class="modal-card modal-detail">
            <div class="modal-head">
              <div>
                <h3>Activity Detail</h3>
                <p>Full information for this log entry</p>
              </div>
              <button class="modal-x" @click="detailLog = null">&times;</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-field">
                  <span class="detail-label">User</span>
                  <span class="detail-value">{{ detailLog.user_name }}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Action</span>
                  <span class="detail-value">
                    <span class="action-badge" :class="getActionBadgeClass(detailLog.action)">{{ detailLog.action }}</span>
                  </span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Module</span>
                  <span class="detail-value"><span class="module-badge">{{ detailLog.module }}</span></span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Time</span>
                  <span class="detail-value">{{ new Date(detailLog.created_at_raw).toLocaleString() }}</span>
                </div>
                <div class="detail-field detail-field-full">
                  <span class="detail-label">Description</span>
                  <p class="detail-desc">{{ detailLog.description }}</p>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="detailLog = null">Close</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
          <div class="modal-card modal-sm">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>{{ t('activityLog.deleteLogs') }}</h3>
                <p>{{ t('students.cannotUndo') }}</p>
              </div>
              <button class="modal-x" @click="showDeleteModal = false">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">Are you sure you want to delete <strong>{{ selectedIds.length }} log(s)</strong>?</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="showDeleteModal = false">Cancel</button>
              <button class="btn btn-danger" @click="handleDeleteLogs" :disabled="deleting">
                <span v-if="deleting" class="spinner-sm"></span>
                Delete {{ selectedIds.length }} log(s)
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import {
  AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, Download,
  FileSpreadsheet, FileText, FileType,
  RefreshCw, Search, Trash2, XCircle,
} from '@lucide/vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingState from '@/components/LoadingState.vue'
import { activityLogService } from '@/services/activityLogService'
import { exportTableToPdf } from '@/utils/reportExport'
import { useAuthStore } from '@/stores/auth'
import { extractErrorMessage, getUserInitials, debounce } from '@/utils'
import { DEBOUNCE } from '@/constants'
import type { ActivityLogEntry, ActivityLogFilterOptions } from '@/types'

const { t } = useI18n()
const auth = useAuthStore()
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.isDark)

const loading = ref(true)
const showExportMenu = ref(false)
const exportBtnRef = ref<HTMLElement | null>(null)

function onDocumentClick(e: MouseEvent) {
  if (showExportMenu.value && exportBtnRef.value && !exportBtnRef.value.contains(e.target as Node)) {
    showExportMenu.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

function toggleExportMenu() {
  showExportMenu.value = !showExportMenu.value
}

function escapeCsvField(value: string): string {
  const str = value || ''
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function exportLogsAsCSV() {
  showExportMenu.value = false
  const headers = ['User', 'Action', 'Module', 'Description', 'Time']
  const rows = logs.value.map(log => [
    escapeCsvField(log.user_name),
    escapeCsvField(log.action),
    escapeCsvField(log.module),
    escapeCsvField(log.description),
    escapeCsvField(log.created_at),
  ])
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function exportLogsAsExcel() {
  showExportMenu.value = false
  try {
    const { utils, writeFile } = await import('xlsx')
    const headers = ['User', 'Action', 'Module', 'Description', 'Time']
    const data = logs.value.map(log => ({
      User: log.user_name,
      Action: log.action,
      Module: log.module,
      Description: log.description,
      Time: log.created_at,
    }))
    const ws = utils.json_to_sheet(data, { header: headers })
    ws['!cols'] = headers.map(() => ({ wch: 30 }))
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Activity Log')
    writeFile(wb, `activity-log-${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (e) {
    console.error('Excel export failed:', e)
  }
}

async function exportLogsAsPDF() {
  showExportMenu.value = false
  try {
    await exportTableToPdf({
      title: 'Activity Log',
      subtitle: `${logs.value.length} entries`,
      head: ['User', 'Action', 'Module', 'Description', 'Time'],
      body: logs.value.map(log => [log.user_name, log.action, log.module, log.description, log.created_at]),
      filename: `activity-log-${new Date().toISOString().slice(0, 10)}`,
      orientation: 'landscape',
    })
  } catch (e) {
    console.error('PDF export failed:', e)
  }
}

const error = ref('')
const deleting = ref(false)

const canDelete = computed(() => auth.user?.role === 'admin')
const selectedIds = ref<number[]>([])
const showDeleteModal = ref(false)
const detailLog = ref<ActivityLogEntry | null>(null)

function showDetail(log: ActivityLogEntry) {
  detailLog.value = log
}

const isAllPageSelected = computed(() =>
  logs.value.length > 0 && logs.value.every(l => selectedIds.value.includes(l.id))
)
const isIndeterminate = computed(() => {
  const some = logs.value.some(l => selectedIds.value.includes(l.id))
  return some && !isAllPageSelected.value
})

function toggleSelectAll() {
  if (isAllPageSelected.value) {
    const pageIds = new Set(logs.value.map(l => l.id))
    selectedIds.value = selectedIds.value.filter(id => !pageIds.has(id))
  } else {
    const currentIds = new Set(selectedIds.value)
    logs.value.forEach(l => currentIds.add(l.id))
    selectedIds.value = Array.from(currentIds)
  }
}

function toggleSelectLog(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)
}

async function handleDeleteLogs() {
  if (selectedIds.value.length === 0) return
  deleting.value = true
  try {
    await activityLogService.deleteLogs(selectedIds.value)
    selectedIds.value = []
    showDeleteModal.value = false
    await loadLogs()
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    deleting.value = false
  }
}

const searchQuery = ref('')
const moduleFilter = ref('')
const actionFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const currentPage = ref(1)
const perPage = ref(20)
const pageSizeOptions = [10, 20, 50, 100]

const logs = ref<ActivityLogEntry[]>([])
const filterOptions = ref<ActivityLogFilterOptions>({ modules: [], actions: [] })
const total = ref(0)
const lastPage = ref(1)
const from = ref(0)
const to = ref(0)

const hasActiveFilters = computed(
  () => !!(searchQuery.value || moduleFilter.value || actionFilter.value || dateFrom.value || dateTo.value),
)

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const totalPages = lastPage.value
  const current = currentPage.value

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
    return pages
  }
  pages.push(1)
  if (current > 3) pages.push('...')
  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < totalPages - 2) pages.push('...')
  pages.push(totalPages)
  return pages
})

async function loadLogs() {
  loading.value = true
  error.value = ''
  try {
    const data = await activityLogService.getLogs({
      search: searchQuery.value || undefined,
      module: moduleFilter.value || undefined,
      action: actionFilter.value || undefined,
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
      page: currentPage.value,
      per_page: perPage.value,
    })
    logs.value = data.logs.data
    total.value = data.logs.total
    lastPage.value = data.logs.last_page
    from.value = data.logs.from ?? 0
    to.value = data.logs.to ?? 0
    filterOptions.value = data.filters
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

const debouncedLoad = debounce(() => loadLogs(), DEBOUNCE.SEARCH)

function applyFilters() {
  currentPage.value = 1
  selectedIds.value = []
  debouncedLoad()
}

function clearFilters() {
  searchQuery.value = ''
  moduleFilter.value = ''
  actionFilter.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  currentPage.value = 1
  selectedIds.value = []
  loadLogs()
}

function changePage(page: number) {
  if (page < 1 || page > lastPage.value) return
  currentPage.value = page
  loadLogs()
}

function changePerPage(size: number) {
  perPage.value = size
  currentPage.value = 1
  loadLogs()
}

function getActionBadgeClass(action: string): string {
  const map: Record<string, string> = {
    Create: 'act-create', Update: 'act-update', Delete: 'act-delete',
    Login: 'act-login', Logout: 'act-logout', Export: 'act-export', Import: 'act-import',
  }
  return map[action] || 'act-default'
}

onMounted(loadLogs)
</script>

<style scoped>
.al-page {
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  height: calc(100vh - 96px);
  width: calc(100% + 12px);
  margin-top: -6px;
  margin-left: -6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.al-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  border-radius: 10px;
  padding: 0.45rem 0.8rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.al-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
.al-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.al-btn-export {
  position: relative;
}
.spinning { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ════════════════════════════════════════
   DARK MODE — ACTIVITY LOG PAGE
   ════════════════════════════════════════ */
.dark-mode .al-card {
  background: #1e293b;
  border-color: #334155;
}

.dark-mode .al-toolbar {
  border-bottom-color: #334155;
}

.dark-mode .search-input {
  background: #1e293b;
  border-color: #475569;
  color: #e2e8f0;
}

.dark-mode .search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.dark-mode .al-select {
  background: #1e293b;
  border-color: #475569;
  color: #e2e8f0;
}

.dark-mode .al-select:focus {
  border-color: #3b82f6;
}

.dark-mode .al-btn {
  background: rgba(30, 41, 59, 0.9);
  border-color: #475569;
  color: #cbd5e1;
}

.dark-mode .al-btn:hover:not(:disabled) {
  background: rgba(51, 65, 85, 0.6);
  border-color: #64748b;
}

.dark-mode .export-menu {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.dark-mode .export-menu-item {
  color: #cbd5e1;
}

.dark-mode .export-menu-item:hover {
  background: rgba(51, 65, 85, 0.5);
  color: #60a5fa;
}

.dark-mode .al-clear {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.dark-mode .user-name {
  color: #f1f5f9;
}

.dark-mode .description-cell {
  color: #cbd5e1;
}

.dark-mode .time-cell {
  color: #94a3b8;
}

.dark-mode .module-badge {
  background: rgba(51, 65, 85, 0.6);
  color: #94a3b8;
}

.al-error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 0.7rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.82rem;
  color: #991b1b;
}
.al-error :deep(svg) { color: #ef4444; }
.al-error-retry {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.al-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  flex: 1;
  height: 1px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.al-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.search-box { position: relative; width: 260px; flex-shrink: 0; }
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
.search-input:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }

.al-filter-group { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
.al-filter { display: flex; flex-direction: column; gap: 0.2rem; }
.al-filter span {
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}
.al-select {
  font-size: 0.8rem;
  padding: 0.4rem 0.55rem;
  border-radius: 9px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #0f172a;
  cursor: pointer;
  font-family: inherit;
}
.al-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15); }

/* Export dropdown */
.export-dropdown {
  position: relative;
}
.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 100;
  min-width: 180px;
  overflow: hidden;
}
.export-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 0.82rem;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  transition: all 0.12s;
}
.export-menu-item:hover {
  background: #f8fafc;
  color: #2563eb;
}

.al-clear {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 9px;
  padding: 0.45rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

/* Bulk action bar */
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
}
.bulk-count { font-size: 0.8rem; font-weight: 600; color: #991b1b; }
.bulk-delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: none;
  background: #ef4444;
  color: #fff;
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.bulk-delete-btn:hover { background: #dc2626; }
.bulk-clear-btn {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0.5rem;
  font-family: inherit;
}
.bulk-clear-btn:hover { color: #334155; text-decoration: underline; }

/* Checkbox column */
.col-check {
  width: 48px;
  text-align: center;
  padding: 10px 8px !important;
}
.al-table thead th.col-check,
.al-table tbody td.col-check {
  text-align: center;
  padding: 10px 8px !important;
  vertical-align: middle;
}
.table-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
  cursor: pointer;
  display: block;
  margin: 0 auto;
}
.al-table tbody tr.row-selected { background: #fef2f2; }
.al-table tbody tr.row-selected:hover { background: #fee2e2; }

.table-wrap { width: 100%; overflow-x: auto; overflow-y: auto; flex: 1; min-height: 0; }
.al-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.8125rem; }
.al-table thead th {
  background: #f8fafc;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}
.al-table tbody td {
  padding: 10px 16px;
  border-bottom: 1px solid #f1f3f5;
  color: #475569;
  vertical-align: middle;
}
.al-table tbody tr:last-child td { border-bottom: none; }
.al-table tbody tr:hover { background: #f8fafc; }

.user-cell { display: flex; align-items: center; gap: 8px; }
.avatar {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  background: #2563eb;
}
.user-name { font-weight: 600; color: #0f172a; white-space: nowrap; }

.action-badge, .module-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  white-space: nowrap;
}
.module-badge { background: rgba(148, 163, 184, 0.12); color: #475569; }

.act-create { background: rgba(16,185,129,0.1); color: #10b981; }
.act-update { background: rgba(59,130,246,0.1); color: #3b82f6; }
.act-delete { background: rgba(239,68,68,0.1); color: #ef4444; }
.act-login { background: rgba(14,165,233,0.1); color: #0ea5e9; }
.act-logout { background: rgba(148,163,184,0.1); color: #94a3b8; }
.act-export { background: rgba(139,92,246,0.1); color: #8b5cf6; }
.act-import { background: rgba(245,158,11,0.1); color: #f59e0b; }
.act-default { background: rgba(148,163,184,0.1); color: #94a3b8; }

.description-cell {
  max-width: 360px;
  color: #334155;
  cursor: pointer;
}
.description-cell:hover .desc-text {
  color: #2563eb;
}
.desc-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  transition: color 0.15s;
}
.time-cell { color: #94a3b8; white-space: nowrap; }

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
  font-size: 0.8125rem;
  gap: 12px;
  flex-wrap: wrap;
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
.page-btn.active { background: #2563eb; color: #fff; font-weight: 600; }
.page-dots { width: 24px; text-align: center; color: #94a3b8; }
.pagination-total { color: #64748b; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }

/* Delete confirmation modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 16px;
}
.modal-card {
  background: #fff; border-radius: 16px; width: 100%; max-width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  overflow: hidden; animation: modal-in 0.25s ease-out;
}
.modal-sm { max-width: 380px; }
.modal-detail { max-width: 520px; }
.modal-head {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 20px 24px 0;
}
.modal-head h3 {
  margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a;
}
.modal-head p {
  margin: 2px 0 0; font-size: 0.8rem; color: #64748b;
}
.modal-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.icon-danger { background: #fee2e2; color: #ef4444; }
.icon-info { background: #dbeafe; color: #2563eb; }
.modal-x {
  margin-left: auto;
  background: none; border: none;
  font-size: 1.4rem; color: #94a3b8;
  cursor: pointer; padding: 0 4px; line-height: 1;
}
.modal-x:hover { color: #475569; }
.modal-body {
  padding: 16px 24px;
}
.del-text {
  font-size: 0.9rem; color: #475569; margin: 0;
}
.modal-foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 0 24px 20px;
}
.btn {
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  font-family: inherit;
}
.btn-ghost {
  background: #f1f5f9;
  color: #475569;
}
.btn-ghost:hover { background: #e2e8f0; }
.btn-danger {
  background: #ef4444;
  color: #fff;
}
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.detail-field-full {
  grid-column: 1 / -1;
}
.detail-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  margin-bottom: 4px;
}
.detail-value {
  font-size: 0.88rem;
  color: #0f172a;
  font-weight: 500;
}
.detail-desc {
  font-size: 0.88rem;
  color: #334155;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.spinner-sm {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.92) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card, .modal-leave-to .modal-card { transform: scale(0.92) translateY(10px); }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 767.98px) {
  .al-toolbar { flex-direction: column; align-items: stretch; }
  .search-box { width: 100%; }
  .pagination-bar { flex-direction: column; align-items: center; }
}
</style>
