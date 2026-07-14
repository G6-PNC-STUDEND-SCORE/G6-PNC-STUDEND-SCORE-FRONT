<template>
  <div class="score-sheet">
    <!-- Toolbar -->
    <div class="sheet-toolbar">
      <button class="tb-btn" @click="goBack" title="Back">
        <i class="bi bi-arrow-left"></i>
      </button>
      <div class="offering-info">
        <strong>{{ data?.subject?.name || 'Subject' }}</strong>
        <span class="text-muted">
          <span class="term-badge">{{ data?.term?.name }}</span>
          <template v-if="data?.offerings?.length">
            · {{ data.offerings.map(o => o.teacher_name).filter(Boolean).join(', ') }}
          </template>
        </span>
      </div>

      <div class="toolbar-spacer"></div>

      <!-- ALL BUTTONS ON LEFT SIDE (moved from right) -->
      <div class="toolbar-actions">
        <div class="btn-group">
          <button class="tb-btn" @click="showAddColumn = true" title="Add Column">
            <i class="bi bi-plus-lg"></i> <span>Add</span>
          </button>
          <button class="tb-btn" @click="showWeights = true" title="Weight Configuration">
            <i class="bi bi-sliders"></i> <span>Weights</span>
          </button>
          <button class="tb-btn" @click="syncToGoogle" title="Export to Google Sheets" :disabled="syncing">
            <i :class="syncing ? 'bi bi-arrow-repeat spinning' : 'bi bi-google'"></i>
            <span>{{ syncing ? 'Exporting...' : 'Google Sheets' }}</span>
          </button>
          <button class="tb-btn" @click="importFromGoogle" title="Import from Google Sheets CSV">
            <i class="bi bi-cloud-download"></i> <span>Import</span>
          </button>
          <button class="tb-btn" @click="exportCSV" title="Export CSV">
            <i class="bi bi-download"></i> <span>Export</span>
          </button>
          <button class="tb-btn" @click="refreshData" title="Refresh">
            <i class="bi bi-arrow-clockwise" :class="{ spinning: loading }"></i>
          </button>
        </div>
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input v-model="searchQuery" type="text" placeholder="Search student..." />
        </div>
        <div class="save-status" :class="saveStatusClass" :title="saveStatusText">
          <i :class="saveStatusIcon"></i>
          <span class="status-text">{{ saveStatusText }}</span>
        </div>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="stats-bar" v-if="data">
      <div class="stat-item"><span class="stat-label">Students</span><span class="stat-value">{{ filteredRows.length }}</span></div>
      <div class="stat-item"><span class="stat-label">Avg Score</span><span class="stat-value">{{ averageScore.toFixed(1) }}</span></div>
      <div class="stat-item"><span class="stat-label">Pass Rate</span><span class="stat-value">{{ passRate.toFixed(1) }}%</span></div>
      <div class="stat-item"><span class="stat-label">Top</span><span class="stat-value">{{ topStudent }}</span></div>
      <div class="stat-item" v-if="data.offerings?.length">
        <span class="stat-label">Teachers</span>
        <span class="stat-value">{{ data.offerings.map(o => o.teacher_name).filter(Boolean).join(', ') }}</span>
      </div>
    </div>

    <!-- Spreadsheet Table -->
    <div class="sheet-wrapper" tabindex="0" @keydown="onGlobalKeydown" ref="sheetContainer">
      <div class="sheet-scroll">
        <table class="sheet-table">
          <thead>
            <tr>
              <th class="cell-header cell-frozen row-num-header">#</th>
              <th class="cell-header cell-frozen student-name-header">Student Name</th>
              <th class="cell-header cell-frozen student-id-header">ID</th>
              <th v-for="col in columns" :key="col.id" class="cell-header" :class="getColumnTypeClass(col.type)" :style="{ minWidth: '80px' }">
                <div class="header-content column-header-content">
                  <span class="column-label" :title="col.label" @dblclick.stop="startRenameColumn(col)">{{ col.label }}</span>
                  <span class="column-type-badge">{{ col.type }}</span>
                  <div class="column-actions">
                    <button class="col-action-btn" @click="startRenameColumn(col)" title="Rename"><i class="bi bi-pencil"></i></button>
                    <button class="col-action-btn text-danger" @click="confirmDeleteColumn(col)" title="Delete"><i class="bi bi-trash3"></i></button>
                  </div>
                </div>
                <div v-if="col.max_score" class="max-score-label">/ {{ col.max_score }}</div>
              </th>
              <th class="cell-header cell-total">Total</th>
              <th class="cell-header cell-grade">Grade</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in filteredRows" :key="row.enrollment_id"
              :class="{ 'row-selected': editingRow === null && selectedRowIndex === rowIndex }">
              <td class="cell cell-frozen row-num" @click="focusCell(rowIndex, -2)">{{ rowIndex + 1 }}</td>
              <td class="cell cell-frozen cell-student-name" @click="focusCell(rowIndex, -1)">{{ row.student_name }}</td>
              <td class="cell cell-frozen cell-student-id" @click="focusCell(rowIndex, 0)">{{ row.student_number }}</td>

              <td v-for="col in columns" :key="col.id"
                class="cell cell-score"
                :class="{
                  'cell-editing': editingRow === rowIndex && editingCol === col.id,
                  'cell-selected': editingRow === null && selectedRowIndex === rowIndex && selectedCol === col.id,
                  'cell-excellent': !isEditing(rowIndex, col.id) && getCellMark(row, col.id) !== null && getCellMark(row, col.id)! >= 90,
                  'cell-average': !isEditing(rowIndex, col.id) && getCellMark(row, col.id) !== null && getCellMark(row, col.id)! >= 70 && getCellMark(row, col.id)! < 90,
                  'cell-low': !isEditing(rowIndex, col.id) && getCellMark(row, col.id) !== null && getCellMark(row, col.id)! < 70,
                }"
                @click="startEditing(rowIndex, col.id)"
              >
                <div v-if="editingRow === rowIndex && editingCol === col.id" class="cell-editor-wrapper">
                  <input
                    ref="cellEditor"
                    v-model="editValue"
                    type="number"
                    step="any"
                    class="cell-editor"
                    @keydown="onEditKeydown"
                    @blur="saveEdit()"
                    @input="onEditInput"
                  />
                </div>
                <span v-else class="cell-value" :title="getCellTitle(col, row)">{{ formatCellValue(getCellMark(row, col.id)) }}</span>
              </td>

              <td class="cell cell-total"
                :class="{
                  'cell-excellent': row.total !== null && row.total >= 90,
                  'cell-average': row.total !== null && row.total >= 70 && row.total < 90,
                  'cell-low': row.total !== null && row.total < 70
                }">{{ row.total !== null ? row.total.toFixed(2) : '-' }}</td>
              <td class="cell cell-grade" :class="'grade-' + (row.grade?.toLowerCase().replace('+', '-plus') || 'none')">{{ row.grade || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <div v-if="renamingColumn" class="modal-overlay" @click.self="renamingColumn = null">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Rename Column</h5><button class="modal-close" @click="renamingColumn = null">&times;</button></div>
        <div class="modal-body">
          <div class="form-group"><label>New Label</label><input v-model="renameValue" class="form-input" ref="renameInput" @keydown.enter="doRenameColumn" /></div>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="renamingColumn = null">Cancel</button><button class="btn btn-primary" @click="doRenameColumn">Rename</button></div>
      </div>
    </div>

    <div v-if="showAddColumn" class="modal-overlay" @click.self="showAddColumn = false">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Add New Column</h5><button class="modal-close" @click="showAddColumn = false">&times;</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Type</label><select v-model="newColumn.type" class="form-input"><option value="quiz">Quiz</option><option value="assignment">Assignment</option><option value="project">Project</option><option value="midterm">Midterm</option><option value="final">Final</option></select></div>
          <div class="form-group"><label>Label</label><input v-model="newColumn.label" class="form-input" placeholder="e.g. Quiz 1" /></div>
          <div class="form-group"><label>Max Score</label><input v-model.number="newColumn.max_score" type="number" min="1" class="form-input" placeholder="100" /></div>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="showAddColumn = false">Cancel</button><button class="btn btn-primary" @click="doAddColumn">Add</button></div>
      </div>
    </div>

    <div v-if="showWeights" class="modal-overlay" @click.self="showWeights = false">
      <div class="modal-content">
        <div class="modal-header"><h5>Weight Configuration</h5><button class="modal-close" @click="showWeights = false">&times;</button></div>
        <div class="modal-body">
          <table class="weight-table" v-if="assessments.length">
            <thead><tr><th>Component</th><th>Weight (%)</th></tr></thead>
            <tbody>
              <tr v-for="at in assessments" :key="at.id">
                <td><span class="weight-name">{{ at.name }}</span><span class="weight-code">{{ at.code }}</span></td>
                <td><input v-model.number="weightEdits[at.id]" type="number" min="0" max="100" step="0.5" class="form-input weight-input" /></td>
              </tr>
            </tbody>
          </table>
          <div class="weight-total-bar" :class="{ 'weight-ok': totalWeight === 100, 'weight-warn': totalWeight !== 100 }">
            Total: {{ totalWeight.toFixed(1) }}% {{ totalWeight === 100 ? '✓' : '(must be 100%)' }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showWeights = false">Cancel</button>
          <button class="btn btn-primary" :disabled="totalWeight !== 100" @click="doUpdateWeights">Save & Recalculate</button>
        </div>
      </div>
    </div>

    <div v-if="deleteConfirm" class="modal-overlay" @click.self="deleteConfirm = null">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Delete Column</h5><button class="modal-close" @click="deleteConfirm = null">&times;</button></div>
        <div class="modal-body"><p>Delete "<strong>{{ deleteConfirm.label }}</strong>"? This removes it for all students.</p></div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="deleteConfirm = null">Cancel</button><button class="btn btn-danger" @click="doDeleteColumn">Delete</button></div>
      </div>
    </div>

    <div v-if="showImport" class="modal-overlay" @click.self="showImport = false">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Import from Google Sheets</h5><button class="modal-close" @click="showImport = false">&times;</button></div>
        <div class="modal-body">
          <div class="import-notice">
            <i class="bi bi-info-circle"></i>
            <div>
              <strong>How to sync with Google Sheets:</strong>
              <ol class="import-steps">
                <li>Click <strong>"Google Sheets"</strong> button to export data</li>
                <li>In Google Sheets, edit scores as needed</li>
                <li>Go to <strong>File → Download → CSV</strong></li>
                <li>Upload the downloaded CSV file here</li>
              </ol>
            </div>
          </div>
          <label class="btn btn-primary btn-block"><i class="bi bi-upload"></i> Choose CSV File<input type="file" accept=".csv" hidden @change="importCSV" /></label>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="showImport = false">Close</button></div>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay"><div class="spinner"></div><span>Loading scores...</span></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  getSpreadsheetBySubjectAndTerm,
  updateCellMark,
  addColumn,
  deleteColumn,
  renameColumn,
  updateWeights,
  syncToGoogleSheets,
  createGoogleSheet,
  importFromGoogleSheetsCSV,
  type SpreadsheetColumn,
  type SpreadsheetRow,
  type AssessmentTypeWeight,
  type SpreadsheetResponse,
} from '@/services/scoreService'

const router = useRouter()
const route = useRoute()

const subjectId = computed(() => Number(route.params.subjectId))
const termId = computed(() => Number(route.params.termId))

// ─── Core State ──────────────────────────────────────────────────────
const data = ref<SpreadsheetResponse | null>(null)
const loading = ref(false)
const syncing = ref(false)
const searchQuery = ref('')
const saveStatus = ref<'saving' | 'saved' | 'failed' | 'idle'>('idle')
const sheetContainer = ref<HTMLElement | null>(null)

// ─── Navigation & Editing State ──────────────────────────────────────
const selectedRowIndex = ref(0)    // Currently focused row (0-based)
const selectedCol = ref<number | null>(null)  // detailId of focused column
const editingRow = ref<number | null>(null)   // row being edited
const editingCol = ref<number | null>(null)   // col detailId being edited
const editValue = ref('')
const cellEditor = ref<HTMLInputElement | null>(null)

// ─── Modal State ─────────────────────────────────────────────────────
const showAddColumn = ref(false)
const showWeights = ref(false)
const showImport = ref(false)
const renamingColumn = ref<SpreadsheetColumn | null>(null)
const renameValue = ref('')
const deleteConfirm = ref<{ col: SpreadsheetColumn; label: string } | null>(null)

// ─── Form State ──────────────────────────────────────────────────────
const newColumn = reactive({ type: 'quiz', label: '', max_score: null as number | null })
const weightEdits = reactive<Record<number, number>>({})
const assessments = ref<AssessmentTypeWeight[]>([])

// ─── Undo/Redo ───────────────────────────────────────────────────────
const maxUndo = 50
const undoStack = ref<Array<{ enrollmentId: number; detailId: number; oldValue: number | null }>>([])
const redoStack = ref<Array<{ enrollmentId: number; detailId: number; oldValue: number | null }>>([])

// ─── Computed ────────────────────────────────────────────────────────
const columns = computed(() => data.value?.columns || [])
const rows = computed(() => data.value?.rows || [])

const filteredRows = computed(() => {
  if (!searchQuery.value) return rows.value
  const q = searchQuery.value.toLowerCase()
  return rows.value.filter(r => r.student_name.toLowerCase().includes(q) || r.student_number.toLowerCase().includes(q))
})

const columnList = computed(() => columns.value)  // alias

const averageScore = computed(() => {
  const withScores = filteredRows.value.filter(r => r.total !== null)
  if (!withScores.length) return 0
  return withScores.reduce((acc, r) => acc + (r.total || 0), 0) / withScores.length
})

const passRate = computed(() => {
  const graded = filteredRows.value.filter(r => r.grade !== null)
  if (!graded.length) return 0
  return (graded.filter(r => isPassing(r.grade!)).length / graded.length) * 100
})

const topStudent = computed(() => {
  const rows = filteredRows.value ?? []
  const withScores = rows.filter(r => r.total !== null)
  if (withScores.length === 0) return '-'
  const sorted = [...withScores].sort((a, b) => (b.total || 0) - (a.total || 0))
  const top = sorted[0]
  return top?.student_name ?? '-'
})

const totalWeight = computed(() => Object.values(weightEdits).reduce((s, v) => s + (v || 0), 0))

const saveStatusClass = computed(() => ({
  'status-saving': saveStatus.value === 'saving',
  'status-saved': saveStatus.value === 'saved',
  'status-failed': saveStatus.value === 'failed',
  'status-idle': saveStatus.value === 'idle',
}))

const saveStatusIcon = computed(() => ({
  saving: 'bi bi-arrow-repeat',
  saved: 'bi bi-check-circle-fill',
  failed: 'bi bi-exclamation-circle-fill',
  idle: 'bi bi-check-circle',
}[saveStatus.value]))

const saveStatusText = computed(() => ({
  saving: 'Saving...',
  saved: 'Saved',
  failed: 'Failed',
  idle: '',
}[saveStatus.value]))

// ─── Helper Functions ────────────────────────────────────────────────
function getCellMark(row: SpreadsheetRow, detailId: number): number | null {
  const details = row.details
  if (!details) return null
  if (detailId === null || detailId === undefined) return null
  const m = details[detailId]
  if (m === undefined) return null
  return m
}

function formatCellValue(value: number | null): string {
  if (value === null || value === undefined) return '-'
  return value % 1 === 0 ? String(value) : value.toFixed(1)
}

function getCellTitle(col: SpreadsheetColumn, row: SpreadsheetRow): string {
  const mark = getCellMark(row, col.id)
  if (mark !== null && col.max_score) return `${mark} / ${col.max_score} (${((mark / col.max_score) * 100).toFixed(1)}%)`
  return `${col.label}: ${mark !== null ? mark : '-'}`
}

function getColumnTypeClass(type: string): string { return `col-type-${type}` }
function isPassing(grade: string): boolean { return !['F', 'D'].includes(grade) }

function getColumnIndex(detailId: number): number {
  return columns.value.findIndex(c => c.id === detailId)
}

function isEditing(rowIdx: number, colId: number): boolean {
  return editingRow.value === rowIdx && editingCol.value === colId
}

// ─── Navigation ──────────────────────────────────────────────────────
function focusCell(rowIdx: number, colId: number) {
  if (editingRow.value !== null) {
    saveEdit()  // Save any pending edit first
  }
  // For frozen columns (-2, -1, 0), focus first actual column
  const cols = columns.value
  const firstCol = cols[0]
  const actualColId = (colId <= 0 && firstCol) ? firstCol.id : colId
  const rowCount = filteredRows.value?.length ?? 0
  selectedRowIndex.value = Math.max(0, Math.min(rowIdx, rowCount - 1))
  selectedCol.value = actualColId ?? null
}

function startEditing(rowIdx: number, detailId: number) {
  // Don't edit if columns not loaded or invalid column
  if (!columns.value.length) return
  if (detailId <= 0) return
  const col = columns.value.find(c => c.id === detailId)
  if (!col) return
  
  const row = filteredRows.value[rowIdx]
  if (!row) return

  const oldValue = getCellMark(row, detailId)
  
  // Use the filtered row index for editing
  editingRow.value = rowIdx
  editingCol.value = detailId
  selectedRowIndex.value = rowIdx
  selectedCol.value = detailId
  editValue.value = oldValue !== null ? String(oldValue) : ''

  nextTick(() => {
    if (cellEditor.value) {
      cellEditor.value.focus()
      cellEditor.value.select()
    }
  })
}

function saveEdit() {
  if (editingRow.value === null || editingCol.value === null) return

  const filteredRow = filteredRows.value[editingRow.value]
  if (!filteredRow) { cancelEdit(); return }

  const detailId = editingCol.value
  const oldValue = getCellMark(filteredRow, detailId)
  const newValue = editValue.value === '' ? null : parseFloat(editValue.value)

  // Validate
  if (newValue !== null) {
    if (isNaN(newValue)) { cancelEdit(); return }
    if (newValue < 0 || newValue > 100) { cancelEdit(); return }
  }

  if (oldValue === newValue) { cancelEdit(); return }

  // Find the actual row in the unfiltered rows array
  const actualRow = rows.value.find(r => r.enrollment_id === filteredRow.enrollment_id)
  if (!actualRow) { cancelEdit(); return }

  // Update local state immediately
  actualRow.details[detailId] = newValue

  // Save to undo stack
  undoStack.value.push({ enrollmentId: filteredRow.enrollment_id, detailId, oldValue })
  redoStack.value = []
  if (undoStack.value.length > maxUndo) undoStack.value.shift()

  cancelEdit()
  showSaveStatus('saving')

  // Save to backend
  updateCellMark(subjectId.value, termId.value, detailId, newValue)
    .then(() => {
      showSaveStatus('saved')
      // Don't refresh data immediately - it causes the row to jump
      // Just update the total and grade locally
      recalculateRowTotal(actualRow)
    })
    .catch(() => {
      showSaveStatus('failed')
      actualRow.details[detailId] = oldValue
    })
}

function recalculateRowTotal(row: SpreadsheetRow) {
  // Simple local recalculation of total and grade for display
  const columns_list = columns.value
  if (!columns_list || !columns_list.length) return

  let total = 0
  const typeGroups: Record<string, number[]> = {}

  const safeDetails = row.details ?? {}
  columns_list.forEach(col => {
    const mark = safeDetails[col.id]
    if (mark !== null && mark !== undefined) {
      const type = col.type ?? 'unknown'
      if (!typeGroups[type]) typeGroups[type] = []
      typeGroups[type].push(mark)
    }
  })

  // Get weights from assessments
  const assessmentsList = assessments.value ?? []
  const assessments_map = new Map(assessmentsList.map(a => [a.code ?? 'unknown', a.weight_percent]))

  Object.entries(typeGroups).forEach(([type, marks]) => {
    const avg = marks.reduce((a, b) => a + b, 0) / marks.length
    const weight = assessments_map.has(type) ? (assessments_map.get(type) || 0) / 100 : 0
    total += avg * weight
  })

  row.total = Math.round(total * 100) / 100
  row.grade = total >= 90 ? 'A' : total >= 80 ? 'B+' : total >= 75 ? 'B' : total >= 70 ? 'C+' : total >= 60 ? 'C' : total >= 50 ? 'D' : 'F'
}

function cancelEdit() {
  editingRow.value = null
  editingCol.value = null
  editValue.value = ''
}

// ─── Keyboard Navigation (like Google Sheets) ────────────────────────
function onGlobalKeydown(event: KeyboardEvent) {
  // If editing, handle edit keys
  if (editingRow.value !== null && editingCol.value !== null) {
    onEditKeydown(event)
    return
  }

  const cols = columns.value
  if (!cols.length || !filteredRows.value.length) return

  let currentRow = selectedRowIndex.value
  const colsList = cols ?? []
  let currentColIdx = selectedCol.value !== null ? colsList.findIndex(c => c.id === selectedCol.value) : 0
  if (currentColIdx < 0) currentColIdx = 0

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      const downLen = filteredRows.value?.length ?? 0
      if (currentRow < downLen - 1) {
        selectedRowIndex.value = currentRow + 1
        scrollToCell(currentRow + 1, currentColIdx)
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (currentRow > 0) {
        selectedRowIndex.value = currentRow - 1
        scrollToCell(currentRow - 1, currentColIdx)
      }
      break
    case 'ArrowLeft':
      event.preventDefault()
      if (currentColIdx > 0 && colsList[currentColIdx - 1] !== undefined) {
        currentColIdx--
        const col = colsList[currentColIdx]
        if (col) {
          selectedCol.value = col.id
          scrollToCell(currentRow, currentColIdx)
        }
      }
      break
    case 'ArrowRight':
      event.preventDefault()
      if (currentColIdx < colsList.length - 1 && colsList[currentColIdx + 1] !== undefined) {
        currentColIdx++
        const col = colsList[currentColIdx]
        if (col) {
          selectedCol.value = col.id
          scrollToCell(currentRow, currentColIdx)
        }
      }
      break
    case 'Tab':
      event.preventDefault()
      if (event.shiftKey) {
        if (currentColIdx > 0 && colsList[currentColIdx - 1] !== undefined) {
          currentColIdx--
          const col = colsList[currentColIdx]
          if (col) selectedCol.value = col.id
        } else if (currentRow > 0) {
          currentRow--
          selectedRowIndex.value = currentRow
          currentColIdx = colsList.length - 1
          const col = colsList[currentColIdx]
          if (col) selectedCol.value = col.id
        }
      } else {
        if (currentColIdx < colsList.length - 1 && colsList[currentColIdx + 1] !== undefined) {
          currentColIdx++
          const col = colsList[currentColIdx]
          if (col) selectedCol.value = col.id
        } else if (currentRow < (filteredRows.value?.length ?? 0) - 1) {
          currentRow++
          selectedRowIndex.value = currentRow
          currentColIdx = 0
          const col = colsList[currentColIdx]
          if (col) selectedCol.value = col.id
        }
      }
      scrollToCell(currentRow, currentColIdx)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedCol.value && selectedCol.value > 0) {
        startEditing(selectedRowIndex.value, selectedCol.value)
      }
      break
    case 'F2':
      event.preventDefault()
      if (selectedCol.value && selectedCol.value > 0) {
        startEditing(selectedRowIndex.value, selectedCol.value)
      }
      break
    case 'Delete':
    case 'Backspace':
      if (selectedCol.value !== null && selectedCol.value > 0 && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        const row = filteredRows.value[selectedRowIndex.value]
        if (row) {
          const oldValue = getCellMark(row, selectedCol.value)
          if (oldValue !== null) {
            // Clear cell
            const actualRow = rows.value.find(r => r.enrollment_id === row.enrollment_id)
            if (actualRow) {
              actualRow.details[selectedCol.value] = null
            }
            undoStack.value.push({ enrollmentId: row.enrollment_id, detailId: selectedCol.value, oldValue })
            redoStack.value = []
            showSaveStatus('saving')
            updateCellMark(subjectId.value, termId.value, selectedCol.value, null)
              .then(() => { showSaveStatus('saved'); refreshData() })
              .catch(() => { 
                showSaveStatus('failed'); 
                if (actualRow && selectedCol.value !== null) {
                  actualRow.details[selectedCol.value] = oldValue 
                }
              })
          }
        }
      }
      break
    case 'z':
    case 'Z':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      }
      break
    case 'y':
    case 'Y':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        redo()
      }
      break
  }
}

function onEditKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      saveEdit()
      // Move to cell below
      const enterLen = filteredRows.value?.length ?? 0
      if (selectedRowIndex.value < enterLen - 1) {
        selectedRowIndex.value++
      }
      const enterCol = selectedCol.value
      if (enterCol !== null && enterCol > 0) {
        nextTick(() => startEditing(selectedRowIndex.value, enterCol))
      }
      break
    case 'Tab':
      event.preventDefault()
      saveEdit()
      const editCols = columns.value ?? []
      const idx = selectedCol.value ? editCols.findIndex(c => c.id === selectedCol.value) : 0
      if (event.shiftKey) {
        if (idx > 0 && editCols[idx - 1] !== undefined) {
          const col = editCols[idx - 1]
          if (col) {
            selectedCol.value = col.id
          }
        } else if (selectedRowIndex.value > 0) {
          selectedRowIndex.value--
          if (editCols.length > 0) {
            const lastCol = editCols[editCols.length - 1]
            if (lastCol) selectedCol.value = lastCol.id
          }
        }
      } else {
        if (idx < editCols.length - 1 && editCols[idx + 1] !== undefined) {
          const col = editCols[idx + 1]
          if (col) {
            selectedCol.value = col.id
          }
        } else if (selectedRowIndex.value < (filteredRows.value?.length ?? 0) - 1) {
          selectedRowIndex.value++
          if (editCols.length > 0) {
            const firstCol = editCols[0]
            if (firstCol) selectedCol.value = firstCol.id
          }
        }
      }
      const editCol = selectedCol.value
      if (editCol !== null && editCol > 0) {
        nextTick(() => startEditing(selectedRowIndex.value, editCol))
      }
      break
    case 'Escape':
      event.preventDefault()
      cancelEdit()
      break
    case 'ArrowUp':
      event.preventDefault()
      saveEdit()
      if (selectedRowIndex.value > 0) {
        selectedRowIndex.value--
      }
      const upCol = selectedCol.value
      if (upCol !== null && upCol > 0) {
        nextTick(() => startEditing(selectedRowIndex.value, upCol))
      }
      break
    case 'ArrowDown':
      event.preventDefault()
      saveEdit()
      const downEditLen = filteredRows.value?.length ?? 0
      if (selectedRowIndex.value < downEditLen - 1) {
        selectedRowIndex.value++
      }
      const downCol = selectedCol.value
      if (downCol !== null && downCol > 0) {
        nextTick(() => startEditing(selectedRowIndex.value, downCol))
      }
      break
  }
}

function onEditInput() {
  // Live validation could go here
}

function scrollToCell(rowIdx: number, colIdx: number) {
  // Scroll the container to keep the focused cell visible
  const container = sheetContainer.value?.querySelector('.sheet-scroll')
  if (!container) return
  const cells = container.querySelectorAll('.cell-score')
  // Simplified: just scroll to the row
  const rowCells = container.querySelectorAll('tbody tr')
  if (rowCells[rowIdx]) {
    rowCells[rowIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

// ─── Undo / Redo ─────────────────────────────────────────────────────
function undo() {
  const action = undoStack.value.pop()
  if (!action) return
  const row = rows.value.find(r => r.enrollment_id === action.enrollmentId)
  if (!row) return
  row.details[action.detailId] = action.oldValue
  redoStack.value.push(action)

  updateCellMark(subjectId.value, termId.value, action.detailId, action.oldValue)
    .then(() => { showSaveStatus('saved'); refreshData() })
    .catch(() => showSaveStatus('failed'))
}

function redo() {
  const action = redoStack.value.pop()
  if (!action) return
  undoStack.value.push(action)
  // Toggle: redo sets to opposite of what was undone (null -> oldValue or oldValue -> null)
  const row = rows.value.find(r => r.enrollment_id === action.enrollmentId)
  if (!row) return
  const details = row.details
  if (!details) return
  const current = details[action.detailId]
  const newValue = current === null ? action.oldValue : null
  if (newValue !== null) {
    const safeDetails = { ...details }
    safeDetails[action.detailId] = newValue
    row.details = safeDetails
    updateCellMark(subjectId.value, termId.value, action.detailId, newValue)
      .then(() => { showSaveStatus('saved'); refreshData() })
      .catch(() => showSaveStatus('failed'))
  }
}

// ─── Data Loading ────────────────────────────────────────────────────
function goBack() { router.push('/scores') }

async function refreshData() {
  if (!subjectId.value || !termId.value) return
  loading.value = true
  try {
    const result = await getSpreadsheetBySubjectAndTerm(subjectId.value, termId.value)
    data.value = result
    if (result.assessment_types) {
      assessments.value = result.assessment_types
      assessments.value.forEach(at => { weightEdits[at.id] = at.weight_percent })
    }
    // Reset selection
    selectedRowIndex.value = 0
    const firstColumn = columns.value[0]
    selectedCol.value = firstColumn ? firstColumn.id : null
  } catch { showSaveStatus('failed') }
  finally { loading.value = false }
}

// ─── Column Management ───────────────────────────────────────────────
function startRenameColumn(col: SpreadsheetColumn) {
  if (!col || !col.label) return
  renamingColumn.value = col
  renameValue.value = col.label
  nextTick(() => {
    const input = document.querySelector('.modal-overlay .form-input') as HTMLInputElement | null
    if (input) {
      input.focus()
    }
  })
}

async function doRenameColumn() {
  if (!renamingColumn.value || !renameValue.value.trim()) return
  try {
    await renameColumn(subjectId.value, termId.value, renamingColumn.value.id, renameValue.value.trim())
    renamingColumn.value = null
    showSaveStatus('saved')
    refreshData()
  } catch { showSaveStatus('failed') }
}

function confirmDeleteColumn(col: SpreadsheetColumn | undefined) {
  if (!col) return
  const label = col.label ?? ''
  deleteConfirm.value = { col: col, label: label || 'this column' }
}

async function doDeleteColumn() {
  if (!deleteConfirm.value) return
  try {
    await deleteColumn(subjectId.value, termId.value, deleteConfirm.value.col.id)
    deleteConfirm.value = null
    showSaveStatus('saved')
    refreshData()
  } catch { showSaveStatus('failed') }
}

async function doAddColumn() {
  if (!newColumn.label.trim()) return
  try {
    await addColumn(subjectId.value, termId.value, {
      type: newColumn.type,
      label: newColumn.label.trim(),
      max_score: newColumn.max_score,
    })
    showAddColumn.value = false
    newColumn.label = ''
    newColumn.max_score = null
    showSaveStatus('saved')
    refreshData()
  } catch { showSaveStatus('failed') }
}

async function doUpdateWeights() {
  if (totalWeight.value !== 100) return
  try {
    await updateWeights(assessments.value.map(at => ({ id: at.id, weight_percent: weightEdits[at.id] || 0 })))
    showWeights.value = false
    showSaveStatus('saved')
    refreshData()
  } catch { showSaveStatus('failed') }
}

// ─── Google Sheets Two-Way Sync ──────────────────────────────────────
async function syncToGoogle() {
  syncing.value = true
  try {
    // First try the OAuth integration (requires access token)
    const token = localStorage.getItem('google_access_token')
    if (token) {
      try {
        const result = await createGoogleSheet(subjectId.value, termId.value, token)
        // Open the created Google Sheet directly
        window.open(result.url, '_blank')
        showSaveStatus('saved')
        return
      } catch (e) {
        console.warn('OAuth sync failed, falling back to CSV export', e)
      }
    }
    
    // Fallback: Export CSV and open Google Sheets
    const result = await syncToGoogleSheets(subjectId.value, termId.value)
    
    // Create a Blob URL for the CSV
    const blob = new Blob([result.csv_content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    // Open Google Sheets in a new tab
    window.open('https://docs.google.com/spreadsheets', '_blank')
    
    // Automatically download the CSV file
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.value?.subject?.name || 'scores'}-${data.value?.term?.name || 'term'}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    
    showSaveStatus('saved')
  } catch { showSaveStatus('failed') }
  finally { syncing.value = false }
}

function importFromGoogle() {
  showImport.value = true
}

function importCSV(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const content = reader.result as string
      showSaveStatus('saving')
      await importFromGoogleSheetsCSV(subjectId.value, termId.value, content)
      showImport.value = false
      showSaveStatus('saved')
      refreshData()
    } catch {
      showSaveStatus('failed')
      alert('Failed to import CSV. Please check the file format.')
    }
  }
  reader.readAsText(file)
  input.value = ''
}

// ─── Export ──────────────────────────────────────────────────────────
function exportCSV() {
  if (!data.value) return
  const cols = columns.value
  let csv = 'Student Name,Student ID'
  cols.forEach(c => { csv += `,${c.label} (${c.type})` })
  csv += ',Total,Grade\n'

  rows.value.forEach(r => {
    csv += `${r.student_name.replace(/,/g, ' ')},${r.student_number}`
    cols.forEach(c => { const m = getCellMark(r, c.id); csv += `,${m !== null ? m : ''}` })
    csv += `,${r.total !== null ? r.total : ''},${r.grade || ''}\n`
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `scores-${data.value.subject?.name || 'export'}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
  showSaveStatus('saved')
}

// ─── Status ──────────────────────────────────────────────────────────
function showSaveStatus(status: 'saving' | 'saved' | 'failed') {
  saveStatus.value = status
  if (status !== 'saving') {
    setTimeout(() => {
      if (saveStatus.value === status) saveStatus.value = 'idle'
    }, 3000)
  }
}

// ─── Lifecycle ───────────────────────────────────────────────────────
onMounted(() => {
  refreshData()
  // Focus the sheet container for keyboard events
  nextTick(() => {
    const container = document.querySelector('.sheet-wrapper') as HTMLElement
    if (container) container.focus()
  })
})

watch([subjectId, termId], () => {
  if (subjectId.value && termId.value) refreshData()
})
</script>

<style scoped>
/* ─── Layout ────────────────────────────────────────────────────────── */
.score-sheet {
  position: relative;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  height: calc(100vh - 0px);
  display: flex;
  flex-direction: column;
  color: #1e293b;
  background: #fff;
}

/* ─── Toolbar - all buttons on LEFT side ───────────────────────────── */
.sheet-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.toolbar-spacer {
  flex: 0;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.offering-info {
  display: flex;
  flex-direction: column;
  white-space: nowrap;
}

.offering-info strong {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.offering-info .text-muted {
  font-size: 0.7rem;
  color: #64748b;
}

.term-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.75rem;
  margin-right: 4px;
}

/* ─── Buttons ──────────────────────────────────────────────────────── */
.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.78rem;
  color: #475569;
  transition: all 0.15s;
  white-space: nowrap;
}

.tb-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.tb-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tb-btn span {
  display: inline;
}

.btn-group {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

/* ─── Search Box ───────────────────────────────────────────────────── */
.search-box {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  min-width: 120px;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.78rem;
  width: 100px;
  color: #1e293b;
}

.search-box i {
  color: #94a3b8;
  font-size: 0.78rem;
}

/* ─── Save Status ──────────────────────────────────────────────────── */
.save-status {
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.status-saving { color: #f59e0b; background: #fef3c7; }
.status-saved { color: #16a34a; background: #dcfce7; }
.status-failed { color: #dc2626; background: #fee2e2; }
.status-idle { color: transparent; }

/* ─── Stats Bar ────────────────────────────────────────────────────── */
.stats-bar {
  display: flex;
  gap: 16px;
  padding: 6px 12px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  gap: 5px;
  font-size: 0.78rem;
  align-items: center;
}

.stat-label { color: #64748b; font-weight: 500; }
.stat-value { font-weight: 700; color: #0f172a; }

/* ─── Sheet Wrapper ────────────────────────────────────────────────── */
.sheet-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  outline: none;
}

.sheet-wrapper:focus {
  outline: none;
}

.sheet-scroll {
  overflow: auto;
  height: 100%;
  max-height: 100%;
}

/* ─── Table ────────────────────────────────────────────────────────── */
.sheet-table {
  border-collapse: separate;
  border-spacing: 0;
  width: max-content;
  min-width: 100%;
  font-size: 0.8rem;
}

/* ─── Header ───────────────────────────────────────────────────────── */
.sheet-table thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 5px 8px;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #475569;
  text-align: left;
  white-space: nowrap;
  min-width: 80px;
  user-select: none;
}

/* Corner cells (intersection of header row and frozen columns) need highest z-index */
.sheet-table thead th.cell-frozen {
  z-index: 30;
  background: #f1f5f9;
}

/* ─── Frozen Columns ────────────────────────────────────────────────── */
.cell-frozen {
  position: sticky;
  z-index: 20;
  background: #f1f5f9;
}

/* Row number column (#) - leftmost frozen column */
.row-num-header, .row-num { 
  left: 0; 
  width: 36px; 
  min-width: 36px; 
  max-width: 36px; 
  text-align: center; 
}

/* Student Name column - second frozen column */
.student-name-header, .cell-student-name { 
  left: 36px; 
  min-width: 160px; 
}

/* Student ID column - third frozen column */
.student-id-header, .cell-student-id { 
  left: 196px; 
  min-width: 90px; 
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 40px;
  width: 100%;
}

.column-header-content {
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.column-label {
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  font-size: 0.68rem;
  text-align: center;
  width: 100%;
}

.column-type-badge {
  font-size: 0.55rem;
  padding: 1px 4px;
  border-radius: 2px;
  background: #e2e8f0;
  color: #64748b;
  text-transform: lowercase;
  font-weight: 400;
}

.col-type-quiz .column-type-badge { background: #dbeafe; color: #2563eb; }
.col-type-assignment .column-type-badge { background: #dcfce7; color: #16a34a; }
.col-type-project .column-type-badge { background: #fef3c7; color: #d97706; }
.col-type-midterm .column-type-badge { background: #ede9fe; color: #7c3aed; }
.col-type-final .column-type-badge { background: #fee2e2; color: #dc2626; }

.column-actions {
  display: flex;
  gap: 2px;
  margin-top: 2px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  justify-content: center;
}

.cell-header:hover .column-actions {
  opacity: 1;
  visibility: visible;
}

.col-action-btn {
  background: none;
  border: none;
  padding: 1px 3px;
  cursor: pointer;
  font-size: 0.6rem;
  color: #64748b;
  border-radius: 2px;
}

.col-action-btn:hover { background: #e2e8f0; }
.text-danger { color: #ef4444 !important; }

.max-score-label {
  font-size: 0.55rem;
  color: #94a3b8;
  font-weight: 400;
  margin-top: 1px;
}

.cell-total, .cell-grade { background: #fafafa; }
.cell-total.cell-header, .cell-grade.cell-header { background: #e2e8f0; }

/* Ensure frozen cells maintain background when scrolling */
.cell-frozen.cell-total, .cell-frozen.cell-grade {
  background: #fafafa;
}

/* ─── Cells ────────────────────────────────────────────────────────── */
.cell {
  border: 1px solid #e2e8f0;
  padding: 3px 6px;
  font-size: 0.8rem;
  white-space: nowrap;
  cursor: pointer;
  height: 32px;
  vertical-align: middle;
  transition: background 0.05s;
}

.cell-score {
  min-width: 60px;
  text-align: center;
  position: relative;
}

.cell:hover {
  background: #f8fafc;
}

.cell-selected {
  outline: 2px solid #3b82f6;
  outline-offset: -1px;
  background: #eff6ff !important;
  z-index: 5;
  position: relative;
}

.cell-editing {
  padding: 0 !important;
  outline: 2px solid #2563eb !important;
  outline-offset: -1px;
  z-index: 5;
  position: relative;
}

/* ─── Cell Colors ──────────────────────────────────────────────────── */
.cell-excellent { background: #dcfce7 !important; color: #16a34a; font-weight: 600; }
.cell-average { background: #fef9c3 !important; color: #b45309; }
.cell-low { background: #fee2e2 !important; color: #dc2626; }

/* ─── Cell Editor ──────────────────────────────────────────────────── */
.cell-editor-wrapper { width: 100%; height: 100%; }

.cell-editor {
  width: 100%;
  height: 100%;
  min-height: 30px;
  border: none;
  outline: none;
  padding: 3px 6px;
  font-size: 0.8rem;
  text-align: center;
  background: #fff;
  font-family: inherit;
  color: #0f172a;
}

.cell-value {
  display: block;
  padding: 3px 0;
}

/* ─── Row States ───────────────────────────────────────────────────── */
.row-even .cell { background-color: #fafafa; }
.row-selected .cell { background-color: #f0f4ff; }
.row-selected .cell.cell-frozen { background-color: #e8effb; }

/* ─── Grade Colors ─────────────────────────────────────────────────── */
.grade-a { color: #16a34a !important; font-weight: 700 !important; }
.grade-b-plus { color: #2563eb !important; font-weight: 700 !important; }
.grade-b { color: #2563eb !important; font-weight: 700 !important; }
.grade-c-plus { color: #b45309 !important; font-weight: 700 !important; }
.grade-c { color: #b45309 !important; font-weight: 700 !important; }
.grade-d { color: #9333ea !important; font-weight: 700 !important; }
.grade-f { color: #dc2626 !important; font-weight: 700 !important; }
.grade-none { color: #94a3b8 !important; }

/* ─── Loading ──────────────────────────────────────────────────────── */
.loading-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.85);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
  z-index: 100; font-size: 0.85rem; color: #64748b;
}

.spinner {
  width: 28px; height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.7s linear infinite; }

/* ─── Modal ────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff; border-radius: 10px;
  width: 90%; max-width: 450px;
  max-height: 80vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-sm { max-width: 380px; }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid #e2e8f0;
}

.modal-header h5 { font-size: 0.95rem; font-weight: 700; margin: 0; }
.modal-close { background: none; border: none; font-size: 1.4rem; color: #64748b; cursor: pointer; padding: 0; line-height: 1; }

.modal-body { padding: 18px; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 10px 18px; border-top: 1px solid #e2e8f0;
}

.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 0.78rem; font-weight: 600; color: #374151; margin-bottom: 3px; }

.form-input {
  width: 100%; padding: 7px 10px;
  border: 1px solid #d1d5db; border-radius: 5px;
  font-size: 0.85rem; outline: none;
  transition: border-color 0.15s; box-sizing: border-box;
}

.form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
select.form-input { appearance: auto; }

.btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 14px; border-radius: 6px;
  font-size: 0.8rem; font-weight: 600;
  cursor: pointer; border: none; transition: all 0.15s;
}

.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }

.btn-secondary { background: #f1f5f9; color: #475569; }
.btn-secondary:hover { background: #e2e8f0; }

.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }

.btn-block { width: 100%; justify-content: center; }

/* ─── Weight Table ─────────────────────────────────────────────────── */
.weight-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.weight-table th { text-align: left; padding: 6px 10px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 0.72rem; text-transform: uppercase; }
.weight-table td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
.weight-name { font-weight: 600; display: block; }
.weight-code { font-size: 0.72rem; color: #94a3b8; }
.weight-input { width: 70px; text-align: center; }

.weight-total-bar {
  margin-top: 10px; padding: 6px 10px; border-radius: 5px;
  font-weight: 600; font-size: 0.78rem; text-align: center;
}

.weight-ok { background: #dcfce7; color: #16a34a; }
.weight-warn { background: #fef3c7; color: #d97706; }

/* ─── Import Steps ─────────────────────────────────────────────────── */
.import-desc { font-size: 0.8rem; color: #475569; margin-bottom: 10px; }
.import-steps { font-size: 0.78rem; color: #64748b; padding-left: 18px; margin-bottom: 14px; }
.import-steps li { margin-bottom: 4px; }

/* ─── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .sheet-toolbar { flex-direction: column; align-items: flex-start; }
  .toolbar-actions { width: 100%; }
  .btn-group { width: 100%; }
}
</style>