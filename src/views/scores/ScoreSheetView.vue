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
      <div class="toolbar-actions">
        <div class="btn-group">
          <button class="tb-btn" @click="showAddColumn = true" title="Add Column"><i class="bi bi-plus-lg"></i> <span>Add</span></button>
          <button class="tb-btn" @click="showWeights = true" title="Weight Configuration"><i class="bi bi-sliders"></i> <span>Weights</span></button>
          <button class="tb-btn" @click="syncToGoogle" title="Export to Google Sheets" :disabled="syncing"><i :class="syncing ? 'bi bi-arrow-repeat spinning' : 'bi bi-google'"></i><span>{{ syncing ? 'Exporting...' : 'Google Sheets' }}</span></button>
          <button class="tb-btn" @click="importFromGoogle" title="Import from Google Sheets CSV"><i class="bi bi-cloud-download"></i> <span>Import</span></button>
          <button class="tb-btn" @click="exportCSV" title="Export CSV"><i class="bi bi-download"></i> <span>Export</span></button>
          <button class="tb-btn" @click="refreshData" title="Refresh"><i class="bi bi-arrow-clockwise" :class="{ spinning: loading }"></i></button>
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
    <div class="sheet-wrapper" tabindex="0" @keydown="onGlobalKeydown" ref="sheetContainer" @paste="onPaste" @copy="onCopy" @cut="onCut">
      <div class="sheet-scroll" @scroll="onScroll">
        <table class="sheet-table">
          <thead>
            <tr>
              <th class="cell-header cell-frozen row-num-header" :class="{ 'header-highlighted': isRowHeaderHighlighted() }">#</th>
              <th class="cell-header cell-frozen student-name-header" :class="{ 'header-highlighted': selectedCol === -1 }">Student Name</th>
              <th class="cell-header cell-frozen student-id-header" :class="{ 'header-highlighted': selectedCol === 0 }">ID</th>
              <th v-for="col in columns" :key="col.id" class="cell-header" :class="[getColumnTypeClass(col.type), { 'header-highlighted': selectedCol === col.id }]" :style="{ minWidth: '80px' }">
                <div class="header-content column-header-content">
                  <span class="column-label" :title="col.label" @lclick.stop="startRenameColumn(col)">{{ col.label }}</span>
                  <select v-model="columnTypes[col.id]" @change="onColumnTypeChange(col, $event)" class="column-type-select" @click.stop @mousedown.stop>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
                <option value="project">Project</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="custom">Custom</option>
              </select>
                  <div class="column-actions">
                    <button class="col-action-btn" @click="startRenameColumn(col)" title="Rename"><i class="bi bi-pencil"></i></button>
                    <button class="col-action-btn text-danger" @click="confirmDeleteColumn(col)" title="Delete"><i class="bi bi-trash3"></i></button>
                  </div>
                </div>
                <div v-if="col.max_score" class="max-score-label">/ {{ col.max_score }}</div>
              </th>
              <th class="cell-header cell-total">Total</th>
              <th class="cell-header cell-grade">Grade</th>
              <th class="cell-header add-col-header">
                <div class="add-col-trigger" @click.stop="showInlineAddColumn = !showInlineAddColumn" title="Add column"><i class="bi bi-plus-lg"></i></div>
                <div v-if="showInlineAddColumn" class="inline-add-col" @click.stop>
                  <input v-model="inlineColName" placeholder="Column name" class="inline-input" @keydown.enter="doAddColumnInline" />
                  <select v-model="inlineColType" class="inline-select" @keydown.enter.prevent>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input v-model.number="inlineColMax" type="number" class="inline-input" placeholder="Max" @keydown.enter="doAddColumnInline" />
                  <button class="inline-btn" @click="doAddColumnInline">Add</button>
                  <button class="inline-btn-cancel" @click="showInlineAddColumn = false">&times;</button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in visibleRows" :key="row.enrollment_id"
              :class="{ 'row-selected': editingRow === null && isRowSelected(rowIndex) }">
              <td class="cell cell-frozen row-num"
                :class="{ 'row-num-highlighted': editingRow === null && isRowSelected(rowIndex) }"
                @click.stop>{{ rowIndex + 1 }}</td>

              <td class="cell cell-frozen cell-student-name"
                :class="getStudentNameCellClass(rowIndex)"
                :data-row-idx="rowIndex"
                :data-col-id="-1"
                @mousedown.prevent="onCellMouseDown($event, rowIndex, -1)"
                @dblclick.prevent.stop="startEditing(rowIndex, -1)"
              >
                <div class="student-name-cell-inner">
                  <div v-if="editingRow === rowIndex && editingCol === -1" class="cell-editor-wrapper">
                    <input ref="cellEditor" v-model="editValue" type="text" class="cell-editor"
                      @keydown="onEditKeydown" @blur="saveEdit()" @input="onEditInput" />
                  </div>
                  <span v-else class="cell-value" :title="row.student_name">{{ row.student_name }}</span>
                  <div v-if="showFillHandle(rowIndex, -1)" class="fill-handle fill-handle-frozen"
                    @mousedown.prevent.stop="fillNextStudentName(rowIndex)" @click.stop title="Fill next name down">+</div>
                </div>
              </td>

              <td class="cell cell-frozen cell-student-id"
                :class="getStudentIdCellClass(rowIndex)"
                :data-row-idx="rowIndex"
                :data-col-id="0"
                @mousedown.prevent="onCellMouseDown($event, rowIndex, 0)"
                @dblclick.prevent.stop="startEditing(rowIndex, 0)"
              >
                <div class="student-id-cell-inner">
                  <div v-if="editingRow === rowIndex && editingCol === 0" class="cell-editor-wrapper id-editor-wrapper">
                    <input ref="cellEditor" v-model="editValue" type="text" class="cell-editor id-editor-input" list="student-numbers-list"
                      @keydown="onEditKeydown" @blur="saveEdit()" @input="onEditInput" placeholder="Select or type ID..." />
                  </div>
                  <span v-else class="cell-value" :title="row.student_number">{{ row.student_number }}</span>
                  <div v-if="showFillHandle(rowIndex, 0)" class="fill-handle fill-handle-frozen"
                    @mousedown.prevent.stop="fillNextStudentId(rowIndex)" @click.stop title="Fill next ID down">+</div>
                </div>
              </td>

              <td v-for="col in columns" :key="col.id"
                class="cell cell-score"
                :data-row-idx="rowIndex"
                :data-col-id="col.id"
                :class="getScoreCellClass(rowIndex, col)"
                @mousedown.prevent="onCellMouseDown($event, rowIndex, col.id)"
              >
                <div v-if="editingRow === rowIndex && editingCol === col.id" class="cell-editor-wrapper">
                  <input ref="cellEditor" v-model="editValue" type="text" inputmode="decimal" class="cell-editor"
                    @keydown="onEditKeydown" @blur="saveEdit()" @input="onEditInput" />
                </div>
                <span v-else class="cell-value" :title="getCellTitle(col, row)">{{ formatCellValue(getCellMark(row, col.id)) }}</span>

                <!-- Fill handle: show on active cell when not editing and not in range selection -->
                <div v-if="showFillHandle(rowIndex, col.id)" class="fill-handle"
                  @mousedown.prevent.stop="onFillHandleMouseDown($event, rowIndex, col.id)" @click.stop>+</div>
              </td>

              <td class="cell cell-total" :class="getTotalCellClass(row)">{{ row.total !== null ? row.total.toFixed(2) : '-' }}</td>
              <td class="cell cell-grade" :class="'grade-' + (row.grade?.toLowerCase().replace('+', '-plus') || 'none')">{{ row.grade || '-' }}</td>
            </tr>
            <tr class="add-row-row" @click="doAddRow">
              <td :colspan="3 + columns.length + 2" class="cell-frozen add-row-cell">
                <i class="bi bi-plus-lg"></i> Add Student Row
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Datalist for student ID suggestions (must be outside table) -->
    <datalist id="student-numbers-list">
      <option v-for="num in studentNumbers" :key="num" :value="num"></option>
    </datalist>

    <!-- Page Size Selector -->
    <div class="table-footer">
      <div class="page-size-selector">
        <span class="page-size-label">Show</span>
        <select v-model="pageSize" class="page-size-select">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="15">15</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option value="all">All</option>
        </select>
        <span class="page-size-label">of {{ filteredRows.length }} rows</span>
      </div>
    </div>

    <!-- Modals (unchanged) -->
    <div v-if="renamingColumn" class="modal-overlay" @click.self="renamingColumn = null">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Rename Column</h5><button class="modal-close" @click="renamingColumn = null">&times;</button></div>
        <div class="modal-body"><div class="form-group"><label>New Label</label><input v-model="renameValue" class="form-input" ref="renameInput" @keydown.enter="doRenameColumn" /></div></div>
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
          <div class="weight-total-bar" :class="{ 'weight-ok': totalWeight === 100, 'weight-warn': totalWeight !== 100 }">Total: {{ totalWeight.toFixed(1) }}% {{ totalWeight === 100 ? '✓' : '(must be 100%)' }}</div>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="showWeights = false">Cancel</button><button class="btn btn-primary" :disabled="totalWeight !== 100" @click="doUpdateWeights">Save & Recalculate</button></div>
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
          <div class="import-notice"><i class="bi bi-info-circle"></i><div><strong>How to sync with Google Sheets:</strong><ol class="import-steps"><li>Click <strong>"Google Sheets"</strong> button to export data</li><li>In Google Sheets, edit scores as needed</li><li>Go to <strong>File → Download → CSV</strong></li><li>Upload the downloaded CSV file here</li></ol></div></div>
          <label class="btn btn-primary btn-block"><i class="bi bi-upload"></i> Choose CSV File<input type="file" accept=".csv" hidden @change="importCSV" /></label>
        </div>
        <div class="modal-footer"><button class="btn btn-secondary" @click="showImport = false">Close</button></div>
      </div>
    </div>
    <div v-if="loading" class="loading-overlay"><div class="spinner"></div><span>Loading scores...</span></div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, watch, nextTick, reactive, triggerRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  getSpreadsheetBySubjectAndTerm, updateCellMark, addColumn, deleteColumn,
  renameColumn, updateWeights, syncToGoogleSheets, createGoogleSheet,
  importFromGoogleSheetsCSV, addEnrollment, updateStudentInfo,
  changeColumnType, getStudentNumbers,
  type SpreadsheetColumn, type SpreadsheetRow, type AssessmentTypeWeight, type SpreadsheetResponse,
} from '@/services/scoreService'

const router = useRouter()
const route = useRoute()
const subjectId = computed(() => Number(route.params.subjectId))
const termId = computed(() => Number(route.params.termId))

// ─── Core State ──────────────────────────────────────────────────────
const data = shallowRef<SpreadsheetResponse | null>(null)
const loading = ref(false)
const syncing = ref(false)
const searchQuery = ref('')
const saveStatus = ref<'saving' | 'saved' | 'failed' | 'idle'>('idle')
const sheetContainer = ref<HTMLElement | null>(null)
const pageSize = ref<number | 'all'>(20)

// ─── Selection State ─────────────────────────────────────────────────
const selectedRowIndex = ref(0)
const selectedCol = ref<number | null>(null)
const selectionStartRow = ref<number | null>(null)
const selectionStartCol = ref<number | null>(null)
const isRangeSelecting = ref(false)

// ─── Editing State ───────────────────────────────────────────────────
const editingRow = ref<number | null>(null)
const editingCol = ref<number | null>(null)
const editValue = ref('')
const cellEditor = ref<HTMLInputElement | null>(null)

// ─── Fill Handle ─────────────────────────────────────────────────────
const fillPreviewSet = ref<Set<string>>(new Set())
const fillDrag = ref<{
  active: boolean; sourceRow: number; sourceColId: number;
  startClientX: number; startClientY: number;
  destRow: number; destColId: number;
  previewDestRow: number; previewDestColId: number;
} | null>(null)

// ─── Modal State ─────────────────────────────────────────────────────
const showAddColumn = ref(false)
const showInlineAddColumn = ref(false)
const inlineColName = ref('')
const inlineColType = ref('quiz')
const inlineColMax = ref<number | null>(100)
const showWeights = ref(false)
const showImport = ref(false)
const renamingColumn = ref<SpreadsheetColumn | null>(null)
const renameValue = ref('')
const deleteConfirm = ref<{ col: SpreadsheetColumn; label: string } | null>(null)
const newColumn = reactive({ type: 'quiz', label: '', max_score: null as number | null })
const weightEdits = reactive<Record<number, number>>({})
const assessments = ref<AssessmentTypeWeight[]>([])
const studentNumbers = ref<string[]>([])
const columnTypes = reactive<Record<number, string>>({})

// ─── Auto-fill next student ID ───────────────────────────────────────
type StudentNumberSequence = {
  prefix: string
  sequence: number
  width: number
}

function parseStudentNumberSequence(value: string | null | undefined): StudentNumberSequence | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const match = trimmed.match(/^(.*?)(\d+)$/)
  if (!match || match.length < 3) return null
  const prefix = match[1] ?? ''
  const digits = match[2] ?? ''
  if (!digits) return null
  const sequence = Number.parseInt(digits, 10)
  if (Number.isNaN(sequence)) return null
  return {
    prefix,
    sequence,
    width: digits.length,
  }
}

function formatStudentNumberSequence(sequence: StudentNumberSequence, nextSequence = sequence.sequence): string {
  return `${sequence.prefix}${String(nextSequence).padStart(sequence.width, '0')}`
}

function getKnownStudentNumberSequences(): StudentNumberSequence[] {
  return [...studentNumbers.value, ...rows.value.map(r => r.student_number)]
    .map(parseStudentNumberSequence)
    .filter((value): value is StudentNumberSequence => value !== null)
}

function getHighestKnownStudentNumberSequence(): StudentNumberSequence | null {
  const sequences = getKnownStudentNumberSequences()
  if (!sequences.length) return null

  const currentYearPrefix = `PNC${new Date().getFullYear()}-`
  const currentYearSequences = sequences.filter(seq => seq.prefix === currentYearPrefix)
  const pool = currentYearSequences.length ? currentYearSequences : sequences

  return pool.reduce((best, candidate) => {
    if (candidate.prefix === best.prefix && candidate.sequence > best.sequence) return candidate
    if (candidate.prefix === best.prefix) return best
    return candidate.sequence > best.sequence ? candidate : best
  })
}

function getNextStudentNumber(baseValue?: string | null): string {
  const parsedBase = parseStudentNumberSequence(baseValue)
  if (parsedBase) return formatStudentNumberSequence(parsedBase, parsedBase.sequence + 1)

  const highest = getHighestKnownStudentNumberSequence()
  if (highest) return formatStudentNumberSequence(highest, highest.sequence + 1)

  const year = new Date().getFullYear()
  return `PNC${year}-001`
}

function syncStudentNumbersCache(oldValue: string | null, newValue: string | null) {
  const next = new Set(studentNumbers.value)
  if (oldValue) next.delete(oldValue)
  if (newValue) next.add(newValue)
  studentNumbers.value = [...next]
}

async function fillNextStudentId(rowIdx: number) {
  const row = filteredRows.value[rowIdx]
  if (!row) return

  if (editingRow.value !== null && (editingRow.value !== rowIdx || editingCol.value !== 0)) {
    saveEdit()
  }

  const isTargetIdCell = editingRow.value === rowIdx && editingCol.value === 0
  const currentValue = isTargetIdCell ? editValue.value.trim() : row.student_number.trim()
  const currentSequence = parseStudentNumberSequence(currentValue)

  // If the current row already has a sequential ID, treat it as the seed and fill the next row.
  if (currentSequence) {
    const nextRowIdx = rowIdx + 1
    if (nextRowIdx >= filteredRows.value.length) return

    const nextValue = getNextStudentNumber(currentValue)
    startEditing(nextRowIdx, 0)
    await nextTick()
    editValue.value = nextValue
    await nextTick()
    scrollToCell(nextRowIdx, 0)

    const editor = Array.isArray(cellEditor.value) ? cellEditor.value[0] : cellEditor.value
    editor?.focus()
    editor?.select()
    return
  }

  const nextValue = getNextStudentNumber(currentValue || row.student_number)

  if (!isTargetIdCell) {
    startEditing(rowIdx, 0)
    await nextTick()
  }

  editValue.value = nextValue
  saveEdit()

  const nextRowIdx = rowIdx + 1
  if (nextRowIdx >= filteredRows.value.length) return

  const suggestedNext = getNextStudentNumber(nextValue)
  startEditing(nextRowIdx, 0)
  await nextTick()
  editValue.value = suggestedNext
  await nextTick()
  scrollToCell(nextRowIdx, 0)

  const editor = Array.isArray(cellEditor.value) ? cellEditor.value[0] : cellEditor.value
  editor?.focus()
  editor?.select()
}

async function fillNextStudentName(rowIdx: number) {
  const row = filteredRows.value[rowIdx]
  if (!row) return

  if (editingRow.value !== null && (editingRow.value !== rowIdx || editingCol.value !== -1)) {
    saveEdit()
  }

  const isTargetNameCell = editingRow.value === rowIdx && editingCol.value === -1
  const currentValue = isTargetNameCell ? editValue.value.trim() : row.student_name.trim()
  if (!currentValue) return

  const nextRowIdx = rowIdx + 1
  if (nextRowIdx >= filteredRows.value.length) return

  startEditing(nextRowIdx, -1)
  await nextTick()
  editValue.value = currentValue
  await nextTick()
  scrollToCell(nextRowIdx, -1)

  const editor = Array.isArray(cellEditor.value) ? cellEditor.value[0] : cellEditor.value
  editor?.focus()
  editor?.select()
}

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

const visibleRows = computed(() => {
  if (pageSize.value === 'all') return filteredRows.value
  return filteredRows.value.slice(0, pageSize.value)
})

const averageScore = computed(() => {
  const withScores = visibleRows.value.filter(r => r.total !== null)
  if (!withScores.length) return 0
  return withScores.reduce((acc, r) => acc + (r.total || 0), 0) / withScores.length
})

const passRate = computed(() => {
  const graded = visibleRows.value.filter(r => r.grade !== null)
  if (!graded.length) return 0
  return (graded.filter(r => isPassing(r.grade!)).length / graded.length) * 100
})

const topStudent = computed(() => {
  const sorted = [...visibleRows.value].filter(r => r.total !== null).sort((a, b) => (b.total || 0) - (a.total || 0))
  return sorted[0]?.student_name ?? '-'
})

const totalWeight = computed(() => Object.values(weightEdits).reduce((s, v) => s + (v || 0), 0))

const saveStatusClass = computed(() => ({
  'status-saving': saveStatus.value === 'saving',
  'status-saved': saveStatus.value === 'saved',
  'status-failed': saveStatus.value === 'failed',
  'status-idle': saveStatus.value === 'idle',
}))

const saveStatusIcon = computed(() => ({
  saving: 'bi bi-arrow-repeat', saved: 'bi bi-check-circle-fill',
  failed: 'bi bi-exclamation-circle-fill', idle: 'bi bi-check-circle',
}[saveStatus.value]))

const saveStatusText = computed(() => ({
  saving: 'Saving...', saved: 'Saved', failed: 'Failed', idle: '',
}[saveStatus.value]))

// ─── Helper Functions ────────────────────────────────────────────────
function getCellMark(row: SpreadsheetRow, detailId: number): number | null {
  const m = row.details[detailId]
  return m !== undefined ? m : null
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
function cellKey(rowIdx: number, colId: number): string { return `${rowIdx}:${colId}` }
function isSelectableColumn(colId: number): boolean { return colId === -1 || colId === 0 || colId > 0 }
function getSelectableColumnIds(): number[] { return [-1, 0, ...columns.value.map(c => c.id)] }
function getSelectionColumnOrder(colId: number): number { return getSelectableColumnIds().indexOf(colId) }
function getCellClipboardValue(row: SpreadsheetRow | undefined, colId: number): string {
  if (!row) return ''
  if (colId === -1) return row.student_name
  if (colId === 0) return row.student_number
  if (colId > 0) {
    const value = getCellMark(row, colId)
    return value !== null ? String(value) : ''
  }
  return ''
}

function getSelectionBounds(): { r1: number; r2: number; c1: number; c2: number } | null {
  if (selectionStartRow.value === null || selectionStartCol.value === null || selectedCol.value === null) return null
  const startOrder = getSelectionColumnOrder(selectionStartCol.value)
  const endOrder = getSelectionColumnOrder(selectedCol.value)
  if (startOrder < 0 || endOrder < 0) return null
  return {
    r1: Math.min(selectionStartRow.value, selectedRowIndex.value),
    r2: Math.max(selectionStartRow.value, selectedRowIndex.value),
    c1: Math.min(startOrder, endOrder),
    c2: Math.max(startOrder, endOrder),
  }
}

function getSelectionText(): string {
  const bounds = getSelectionBounds()
  const columnsInSelection = getSelectableColumnIds()
  if (!bounds) {
    const row = filteredRows.value[selectedRowIndex.value]
    return getCellClipboardValue(row, selectedCol.value ?? -999)
  }

  const selectedColumns = columnsInSelection.slice(bounds.c1, bounds.c2 + 1)
  const lines: string[] = []
  for (let r = bounds.r1; r <= bounds.r2; r++) {
    const row = filteredRows.value[r]
    lines.push(selectedColumns.map(colId => getCellClipboardValue(row, colId)).join('\t'))
  }
  return lines.join('\n')
}
function isEditing(rowIdx: number, colId: number): boolean { return editingRow.value === rowIdx && editingCol.value === colId }
// ─── Selection / Range Helpers ───────────────────────────────────────
function isInRange(rowIdx: number, colId: number): boolean {
  if (!isRangeSelecting.value || selectionStartRow.value === null || selectionStartCol.value === null || selectedCol.value === null) return false
  const r1 = Math.min(selectionStartRow.value, selectedRowIndex.value)
  const r2 = Math.max(selectionStartRow.value, selectedRowIndex.value)
  const c1 = getSelectionColumnOrder(selectionStartCol.value)
  const c2 = getSelectionColumnOrder(selectedCol.value)
  const target = getSelectionColumnOrder(colId)
  if (c1 < 0 || c2 < 0 || target < 0) return false
  return rowIdx >= r1 && rowIdx <= r2 && target >= Math.min(c1, c2) && target <= Math.max(c1, c2)
}

function isRowSelected(rowIdx: number): boolean {
  if (!isRangeSelecting.value) return rowIdx === selectedRowIndex.value
  const startRow = selectionStartRow.value ?? selectedRowIndex.value
  const endRow = selectedRowIndex.value
  const r1 = Math.min(startRow, endRow)
  const r2 = Math.max(startRow, endRow)
  return rowIdx >= r1 && rowIdx <= r2
}

function isRowHeaderHighlighted(): boolean {
  return isRangeSelecting.value || selectedRowIndex.value >= 0
}

function isCellSelected(rowIdx: number, colId: number): boolean {
  if (editingRow.value !== null && editingCol.value !== null) return false
  if (!isSelectableColumn(colId)) return false
  if (!isRangeSelecting.value) return rowIdx === selectedRowIndex.value && selectedCol.value === colId
  return isInRange(rowIdx, colId)
}

function expandAllRowsForSelection() {
  if (pageSize.value !== 'all') {
    pageSize.value = 'all'
  }
}

function showFillHandle(rowIdx: number, colId: number): boolean {
  if (editingRow.value !== null || editingCol.value !== null) return false
  if (!isSelectableColumn(colId)) return false
  if (isRangeSelecting.value) {
    // Show fill handle on the last row of the range selection
    const r2 = Math.max(selectionStartRow.value ?? 0, selectedRowIndex.value)
    return rowIdx === r2 && colId === (selectedCol.value ?? 0)
  }
  return rowIdx === selectedRowIndex.value && selectedCol.value === colId
}

function getStudentNameCellClass(rowIdx: number): Record<string, boolean> {
  return {
    'cell-editing': editingRow.value === rowIdx && editingCol.value === -1,
    'cell-selected': !isEditing(rowIdx, -1) && isCellSelected(rowIdx, -1),
    'cell-in-range': !isEditing(rowIdx, -1) && isInRange(rowIdx, -1) && !(selectedRowIndex.value === rowIdx && selectedCol.value === -1),
  }
}

function getStudentIdCellClass(rowIdx: number): Record<string, boolean> {
  return {
    'cell-editing': editingRow.value === rowIdx && editingCol.value === 0,
    'cell-selected': !isEditing(rowIdx, 0) && isCellSelected(rowIdx, 0),
    'cell-in-range': !isEditing(rowIdx, 0) && isInRange(rowIdx, 0) && !(selectedRowIndex.value === rowIdx && selectedCol.value === 0),
  }
}

function getScoreCellClass(rowIdx: number, col: SpreadsheetColumn): Record<string, boolean> {
  const row = filteredRows.value[rowIdx]
  const mark = row ? getCellMark(row, col.id) : null
  return {
    'cell-editing': editingRow.value === rowIdx && editingCol.value === col.id,
    'cell-selected': !isEditing(rowIdx, col.id) && isCellSelected(rowIdx, col.id),
    'cell-in-range': !isEditing(rowIdx, col.id) && isInRange(rowIdx, col.id) && !(selectedRowIndex.value === rowIdx && selectedCol.value === col.id),
    'cell-excellent': !isEditing(rowIdx, col.id) && mark !== null && mark >= 90,
    'cell-average': !isEditing(rowIdx, col.id) && mark !== null && mark >= 70 && mark < 90,
    'cell-low': !isEditing(rowIdx, col.id) && mark !== null && mark < 70,
    'cell-autofill-preview': fillPreviewSet.value.has(cellKey(rowIdx, col.id)),
  }
}

function getTotalCellClass(row: SpreadsheetRow): Record<string, boolean> {
  return {
    'cell-excellent': row.total !== null && row.total >= 90,
    'cell-average': row.total !== null && row.total >= 70 && row.total < 90,
    'cell-low': row.total !== null && row.total < 70,
  }
}

// ─── Cell Selection (single click = select, double click = edit) ────
function onCellMouseDown(event: MouseEvent, rowIdx: number, colId: number) {
  if (editingRow.value !== null) {
    saveEdit()
  }
  if (colId === -2) return // row number click

  // Shift+Click for range selection
  if (event.shiftKey) {
    expandAllRowsForSelection()
    if (selectionStartRow.value === null) {
      selectionStartRow.value = selectedRowIndex.value
      selectionStartCol.value = selectedCol.value ?? colId
    }
    selectedRowIndex.value = Math.max(0, Math.min(rowIdx, filteredRows.value.length - 1))
    selectedCol.value = colId
    isRangeSelecting.value = true
    scrollToCell(selectedRowIndex.value, colId)
    return
  }

  // Simple click: select cell; score cells still open the editor immediately.
  isRangeSelecting.value = false
  selectionStartRow.value = rowIdx
  selectionStartCol.value = colId
  selectedRowIndex.value = Math.max(0, Math.min(rowIdx, filteredRows.value.length - 1))
  selectedCol.value = colId
  // Score cells still edit on single click; name/ID now stay selected so range selection works naturally.
  if (colId > 0) {
    if (editingRow.value !== null) cancelEdit()
    startEditing(rowIdx, colId)
  }

  // Start drag selection on selectable cells
  if (isSelectableColumn(colId)) {
    const container = sheetContainer.value?.querySelector('.sheet-scroll') as HTMLElement | null
    const edgeThreshold = 48
    const scrollStep = 18
    let didExpandForSelection = false
    let lastPointer: { x: number; y: number } | null = null
    let autoScrollTimer: number | null = null

    const stopAutoScroll = () => {
      if (autoScrollTimer !== null) {
        window.clearInterval(autoScrollTimer)
        autoScrollTimer = null
      }
    }

    const updateSelectionAtPointer = (clientX: number, clientY: number) => {
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
      if (!el) return
      const cell = el.closest('td.cell[data-row-idx][data-col-id]') as HTMLElement | null
      if (!cell) return
      const rStr = cell.getAttribute('data-row-idx')
      const cStr = cell.getAttribute('data-col-id')
      if (!rStr || !cStr) return
      const r = Number(rStr)
      const c = Number(cStr)
      if (isNaN(r) || isNaN(c) || !isSelectableColumn(c)) return
      if (r < 0 || r >= filteredRows.value.length) return
      if (!didExpandForSelection && (r !== rowIdx || c !== colId)) {
        expandAllRowsForSelection()
        didExpandForSelection = true
      }
      selectedRowIndex.value = r
      selectedCol.value = c
      isRangeSelecting.value = true
    }

    const tickAutoScroll = () => {
      if (!container || !lastPointer || !isRangeSelecting.value) {
        stopAutoScroll()
        return
      }

      const rect = container.getBoundingClientRect()
      let deltaY = 0

      if (lastPointer.y < rect.top + edgeThreshold) {
        deltaY = -scrollStep
      } else if (lastPointer.y > rect.bottom - edgeThreshold) {
        deltaY = scrollStep
      }

      if (deltaY === 0) {
        stopAutoScroll()
        return
      }

      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight)
      const nextScrollTop = Math.max(0, Math.min(maxScrollTop, container.scrollTop + deltaY))
      if (nextScrollTop === container.scrollTop) {
        stopAutoScroll()
        return
      }

      container.scrollTop = nextScrollTop
      updateSelectionAtPointer(lastPointer.x, lastPointer.y)
    }

    const startAutoScroll = () => {
      if (autoScrollTimer !== null) return
      autoScrollTimer = window.setInterval(tickAutoScroll, 16)
    }

    const onMouseMove = (e: MouseEvent) => {
      // If we were editing, cancel it since user is dragging
      if (editingRow.value !== null) cancelEdit()
      lastPointer = { x: e.clientX, y: e.clientY }
      updateSelectionAtPointer(e.clientX, e.clientY)
      if (container) {
        const rect = container.getBoundingClientRect()
        const nearEdge = e.clientY < rect.top + edgeThreshold || e.clientY > rect.bottom - edgeThreshold
        if (nearEdge) startAutoScroll()
        else stopAutoScroll()
      }
    }
    const onMouseUp = () => {
      stopAutoScroll()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
}



// ─── Inline Editing (double click = edit) ────────────────────────────
function startEditing(rowIdx: number, detailId: number) {
  if (!filteredRows.value.length) return
  if (detailId === -2) return

  const row = filteredRows.value[rowIdx]
  if (!row) return

  if (detailId > 0) {
    if (!columns.value.length) return
    const col = columns.value.find(c => c.id === detailId)
    if (!col) return
  }

  let oldValue: string | number | null
  if (detailId === -1) oldValue = row.student_name
  else if (detailId === 0) oldValue = row.student_number
  else oldValue = getCellMark(row, detailId)

  editingRow.value = rowIdx
  editingCol.value = detailId
  selectedRowIndex.value = rowIdx
  selectedCol.value = detailId
  editValue.value = oldValue !== null && oldValue !== undefined ? String(oldValue) : ''

  nextTick(() => {
    const editor = Array.isArray(cellEditor.value) ? cellEditor.value[0] : cellEditor.value
    if (editor) {
      editor.focus()
      editor.select()
    }
  })
}

function saveEdit() {
  if (editingRow.value === null || editingCol.value === null) return

  const filteredRow = filteredRows.value[editingRow.value]
  if (!filteredRow) { cancelEdit(); return }

  const detailId = editingCol.value

  if (detailId === -1) {
    const newName = editValue.value.trim()
    if (!newName || newName === filteredRow.student_name) { cancelEdit(); return }
    const oldName = filteredRow.student_name
    showSaveStatus('saving')
    updateStudentInfo(subjectId.value, termId.value, filteredRow.enrollment_id, { student_name: newName })
      .then(() => {
        showSaveStatus('saved')
        filteredRow.student_name = newName
        const actualRow = rows.value.find(r => r.enrollment_id === filteredRow.enrollment_id)
        if (actualRow) actualRow.student_name = newName
      })
      .catch((err) => {
        showSaveStatus('failed')
        filteredRow.student_name = oldName
        console.error('Failed to save student name:', err)
      })
    cancelEdit()
    return
  }

  if (detailId === 0) {
    const newNumber = editValue.value.trim()
    if (!newNumber || newNumber === filteredRow.student_number) { cancelEdit(); return }
    const oldNumber = filteredRow.student_number
    showSaveStatus('saving')
    updateStudentInfo(subjectId.value, termId.value, filteredRow.enrollment_id, { student_number: newNumber })
      .then(() => {
        showSaveStatus('saved')
        filteredRow.student_number = newNumber
        const actualRow = rows.value.find(r => r.enrollment_id === filteredRow.enrollment_id)
        if (actualRow) actualRow.student_number = newNumber
        syncStudentNumbersCache(oldNumber, newNumber)
      })
      .catch((err) => {
        showSaveStatus('failed')
        filteredRow.student_number = oldNumber
        console.error('Failed to save student number:', err)
      })
    cancelEdit()
    return
  }

  // Score mark
  const oldValue = getCellMark(filteredRow, detailId)
  const newValue = editValue.value === '' ? null : parseFloat(editValue.value)
  if (newValue !== null) {
    if (isNaN(newValue)) { cancelEdit(); return }
    if (newValue < 0 || newValue > 100) { cancelEdit(); return }
  }
  if (oldValue === newValue) { cancelEdit(); return }

  const actualRow = rows.value.find(r => r.enrollment_id === filteredRow.enrollment_id)
  if (!actualRow) { cancelEdit(); return }

  actualRow.details[detailId] = newValue
  triggerRef(data)
  undoStack.value.push({ enrollmentId: filteredRow.enrollment_id, detailId, oldValue })
  redoStack.value = []
  if (undoStack.value.length > maxUndo) undoStack.value.shift()
  cancelEdit()
  showSaveStatus('saving')

  // Resolve the actual detail ID for this student before saving
  const actualDetailId = actualRow.detail_ids?.[detailId] ?? detailId
  updateCellMark(subjectId.value, termId.value, actualDetailId, newValue)
    .then(() => {
      showSaveStatus('saved')
      recalculateRowTotal(actualRow)
    })
    .catch(() => {
      showSaveStatus('failed')
      actualRow.details[detailId] = oldValue
    })
}

function recalculateRowTotal(row: SpreadsheetRow) {
  const cols = columns.value
  if (!cols.length) return
  let total = 0
  const typeGroups: Record<string, number[]> = {}
  cols.forEach(col => {
    const mark = row.details[col.id]
    if (mark !== null && mark !== undefined) {
      if (!typeGroups[col.type]) typeGroups[col.type] = []
      typeGroups[col.type].push(mark)
    }
  })
  const assessmentMap = new Map(assessments.value.map(a => [a.code, a.weight_percent]))
  Object.entries(typeGroups).forEach(([type, marks]) => {
    const avg = marks.reduce((a, b) => a + b, 0) / marks.length
    const weight = (assessmentMap.get(type) || 0) / 100
    total += avg * weight
  })
  row.total = Math.round(total * 100) / 100
  row.grade = total >= 90 ? 'A' : total >= 80 ? 'B+' : total >= 75 ? 'B' : total >= 70 ? 'C+' : total >= 60 ? 'C' : total >= 50 ? 'D' : 'F'
  triggerRef(data)
}

function cancelEdit() {
  editingRow.value = null
  editingCol.value = null
  editValue.value = ''
}

// ─── Fill Handle ─────────────────────────────────────────────────────
function computeAutoFillValues(sourceValues: (number | null)[], count: number, direction: 1 | -1 = 1): (number | null)[] {
  if (!sourceValues.length) return Array.from({ length: count }, () => null)
  // Single value: repeat it
  if (sourceValues.length === 1) return Array.from({ length: count }, () => sourceValues[0] ?? null)

  // Filter out nulls for numeric calculations
  const numeric = sourceValues.map(v => (v === null ? null : Number(v)))
  const cleanNums = numeric.filter((v): v is number => v !== null && !Number.isNaN(v))

  // Infer a numeric progression when there are at least 2 values.
  // One value repeats; 2+ values can continue as a sequence.
  if (cleanNums.length < 2) {
    const result: (number | null)[] = []
    for (let i = 0; i < count; i++) {
      const srcIdx = i % sourceValues.length
      result.push(sourceValues[srcIdx] ?? null)
    }
    return result
  }

  // Check if it's a consistent arithmetic progression
  const step = cleanNums[1] - cleanNums[0]
  let isArithmetic = true
  for (let i = 2; i < cleanNums.length; i++) {
    if (cleanNums[i] - cleanNums[i - 1] !== step) { isArithmetic = false; break }
  }

  if (!isArithmetic) {
    // Repeat the pattern
    const result: (number | null)[] = []
    for (let i = 0; i < count; i++) {
      const srcIdx = i % sourceValues.length
      result.push(sourceValues[srcIdx] ?? null)
    }
    return result
  }

  // Arithmetic progression: continue the sequence in the drag direction.
  const result: (number | null)[] = []
  const edgeValue = direction === 1 ? sourceValues[sourceValues.length - 1] : sourceValues[0]
  const edgeNum = edgeValue !== null ? Number(edgeValue) : null
  if (edgeNum === null || Number.isNaN(edgeNum)) {
    // Fallback: repeat pattern
    for (let i = 0; i < count; i++) {
      const srcIdx = i % sourceValues.length
      result.push(sourceValues[srcIdx] ?? null)
    }
    return result
  }

  for (let i = 0; i < count; i++) {
    const nextValue = direction === 1 ? edgeNum + step * (i + 1) : edgeNum - step * (i + 1)
    result.push(nextValue)
  }
  return result
}

function onFillHandleMouseDown(e: MouseEvent, rowIdx: number, colId: number) {
  if (editingRow.value !== null) return
  if (colId <= 0) return
  if (!columns.value.length || !filteredRows.value.length) return
  e.preventDefault()
  e.stopPropagation()

  // Use sourceRow as the first row of the range (or single cell)
  let sourceRow = rowIdx
  const sourcePattern: (number | null)[] = []

  if (isRangeSelecting.value && selectionStartRow.value !== null) {
    const r1 = Math.min(selectionStartRow.value, selectedRowIndex.value)
    const r2 = Math.max(selectionStartRow.value, selectedRowIndex.value)
    // Only use range if fill handle is on the last row
    if (rowIdx === r2) {
      sourceRow = r1
      for (let r = r1; r <= r2; r++) {
        const mark = getCellMark(filteredRows.value[r], colId)
        sourcePattern.push(mark !== undefined ? mark : null)
      }
    }
  }

  // Fallback: single source cell value
  if (sourcePattern.length === 0) {
    const mark = getCellMark(filteredRows.value[rowIdx], colId)
    sourcePattern.push(mark !== undefined ? mark : null)
  }

  selectedRowIndex.value = rowIdx
  selectedCol.value = colId
  fillPreviewSet.value = new Set([cellKey(rowIdx, colId)])
  fillDrag.value = {
    active: true, sourceRow: sourceRow, sourceColId: colId,
    startClientX: e.clientX, startClientY: e.clientY,
    destRow: rowIdx, destColId: colId,
    previewDestRow: rowIdx, previewDestColId: colId,
  }
  // Store source pattern on the fillDrag object
  ;(fillDrag.value as any).sourcePattern = sourcePattern
  updateFillPreviewFromPointer(e.clientX, e.clientY)
  window.addEventListener('mousemove', onFillHandleMouseMove)
  window.addEventListener('mouseup', onFillHandleMouseUp)
}

function updateFillPreviewFromPointer(clientX: number, clientY: number) {
  if (!fillDrag.value) return
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  if (!el) return
  const cell = el.closest('td.cell-score') as HTMLElement | null
  if (!cell) { fillPreviewSet.value = new Set([cellKey(fillDrag.value.sourceRow, fillDrag.value.sourceColId)]); return }
  const rowIdxStr = cell.getAttribute('data-row-idx')
  const colIdStr = cell.getAttribute('data-col-id')
  if (!rowIdxStr || !colIdStr) return
  const destRow = Number(rowIdxStr)
  const destColId = Number(colIdStr)
  if (Number.isNaN(destRow) || Number.isNaN(destColId)) return
  if (destRow < 0 || destRow > filteredRows.value.length - 1) return
  fillDrag.value.destRow = destRow
  fillDrag.value.destColId = destColId
  fillDrag.value.previewDestRow = destRow
  fillDrag.value.previewDestColId = destColId
  const srcRow = fillDrag.value.sourceRow
  const srcColId = fillDrag.value.sourceColId
  const dy = fillDrag.value.startClientY - clientY
  const dx = fillDrag.value.startClientX - clientX
  const vertical = Math.abs(dy) >= Math.abs(dx)
  const set = new Set<string>()
  if (vertical) {
    const rStart = Math.min(srcRow, destRow)
    const rEnd = Math.max(srcRow, destRow)
    for (let r = rStart; r <= rEnd; r++) set.add(cellKey(r, srcColId))
  } else {
    const cols = columns.value
    const sIdx = cols.findIndex(c => c.id === srcColId)
    const dIdx = cols.findIndex(c => c.id === destColId)
    if (sIdx < 0 || dIdx < 0) { fillPreviewSet.value = new Set([cellKey(srcRow, srcColId)]); return }
    const cStart = Math.min(sIdx, dIdx)
    const cEnd = Math.max(sIdx, dIdx)
    for (let ci = cStart; ci <= cEnd; ci++) set.add(cellKey(srcRow, cols[ci].id))
  }
  fillPreviewSet.value = set
}

function onFillHandleMouseMove(e: MouseEvent) {
  if (!fillDrag.value?.active) return
  updateFillPreviewFromPointer(e.clientX, e.clientY)
}

function onFillHandleMouseUp() {
  if (!fillDrag.value?.active) return
  window.removeEventListener('mousemove', onFillHandleMouseMove)
  window.removeEventListener('mouseup', onFillHandleMouseUp)
  commitFillApply()
}

function commitFillApply() {
  if (!fillDrag.value) return
  const { sourceRow, sourceColId } = fillDrag.value
  const srcRow = sourceRow
  const srcColId = sourceColId
  const destRow = fillDrag.value.previewDestRow
  const destColId = fillDrag.value.previewDestColId
  const vertical = destRow !== srcRow

  // Get source pattern (from range selection or single cell)
  let sourcePattern = (fillDrag.value as any).sourcePattern as (number | null)[]
  if (!sourcePattern || sourcePattern.length === 0) {
    const sourceRowObj = filteredRows.value[srcRow]
    sourcePattern = [sourceRowObj ? getCellMark(sourceRowObj, srcColId) : null]
  }

  const patternLen = sourcePattern.length

  if (vertical) {
    // Vertical fill: continue the pattern away from the source range.
    const sourceStartRow = srcRow
    const sourceEndRow = srcRow + patternLen - 1
    const targetRows: number[] = []
    const direction: 1 | -1 = destRow > sourceEndRow ? 1 : -1

    if (direction === 1) {
      for (let r = sourceEndRow + 1; r <= destRow; r++) targetRows.push(r)
    } else {
      for (let r = sourceStartRow - 1; r >= destRow; r--) targetRows.push(r)
    }

    if (!targetRows.length) {
      fillPreviewSet.value = new Set()
      isRangeSelecting.value = false
      fillDrag.value = null
      return
    }

    const values = computeAutoFillValues(sourcePattern, targetRows.length, direction)
    targetRows.forEach((r, i) => {
      const targetRow = rows.value.find(tr => tr.enrollment_id === filteredRows.value[r]?.enrollment_id)
      if (!targetRow) return
      const nextValue = values[i] ?? null
      targetRow.details[srcColId] = nextValue
      recalculateRowTotal(targetRow)
      const resolvedSrcId = targetRow.detail_ids?.[srcColId] ?? srcColId
      updateCellMark(subjectId.value, termId.value, resolvedSrcId, nextValue).catch(() => {})
    })
  } else {
    // Horizontal fill: continue the pattern across columns.
    const cols = columns.value
    const sIdx = cols.findIndex(c => c.id === srcColId)
    const dIdx = cols.findIndex(c => c.id === destColId)
    if (sIdx < 0 || dIdx < 0) { fillDrag.value = null; fillPreviewSet.value = new Set(); return }
    const targetColIndices: number[] = []
    const direction: 1 | -1 = dIdx > sIdx ? 1 : -1

    if (direction === 1) {
      for (let ci = sIdx + 1; ci <= dIdx; ci++) targetColIndices.push(ci)
    } else {
      for (let ci = sIdx - 1; ci >= dIdx; ci--) targetColIndices.push(ci)
    }

    if (!targetColIndices.length) {
      fillPreviewSet.value = new Set()
      isRangeSelecting.value = false
      fillDrag.value = null
      return
    }

    const values = computeAutoFillValues(sourcePattern, targetColIndices.length, direction)
    const targetRow = rows.value.find(tr => tr.enrollment_id === filteredRows.value[srcRow]?.enrollment_id)
    if (!targetRow) {
      fillPreviewSet.value = new Set()
      isRangeSelecting.value = false
      fillDrag.value = null
      return
    }

    targetColIndices.forEach((ci, i) => {
      const nextValue = values[i] ?? null
      targetRow.details[cols[ci].id] = nextValue
      recalculateRowTotal(targetRow)
      const resolvedColId = targetRow.detail_ids?.[cols[ci].id] ?? cols[ci].id
      updateCellMark(subjectId.value, termId.value, resolvedColId, nextValue).catch(() => {})
    })
  }

  fillPreviewSet.value = new Set()
  isRangeSelecting.value = false
  fillDrag.value = null
}

// ─── Keyboard Navigation (Excel-like) ────────────────────────────────
function onGlobalKeydown(event: KeyboardEvent) {
  // If editing, delegate to edit handler
  if (editingRow.value !== null && editingCol.value !== null) {
    onEditKeydown(event)
    return
  }

  // Handle copy/paste/cut/undo/redo/save from here too (Ctrl+C/V/X/Z/Y/S)
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'a':
        event.preventDefault()
        expandAllRowsForSelection()
        if (selectedCol.value !== null && isSelectableColumn(selectedCol.value) && filteredRows.value.length > 0) {
          selectionStartRow.value = 0
          selectionStartCol.value = selectedCol.value
          selectedRowIndex.value = filteredRows.value.length - 1
          isRangeSelecting.value = true
          scrollToCell(selectedRowIndex.value, selectedCol.value)
        }
        return
      case 'c': event.preventDefault(); copySelection(); return
      case 'v': event.preventDefault(); return // handled by paste event
      case 'x': event.preventDefault(); cutSelection(); return
      case 'z': event.preventDefault(); event.shiftKey ? redo() : undo(); return
      case 'y': event.preventDefault(); redo(); return
      case 's': event.preventDefault(); showSaveStatus('saved'); return
      case 'r': event.preventDefault(); return
    }
  }

  // Printable character handling: type to start editing (Excel-like)
  if (selectedCol.value !== null && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    // Only for score cells, student name (-1), and student ID (0)
    if (selectedCol.value >= -1) {
      event.preventDefault()
      startEditing(selectedRowIndex.value, selectedCol.value)
      editValue.value = event.key
      return
    }
  }

  const cols = columns.value
  if (!cols.length || !filteredRows.value.length) return

  let currentRow = selectedRowIndex.value
  let currentColIdx = selectedCol.value !== null ? cols.findIndex(c => c.id === selectedCol.value) : 0
  if (currentColIdx < 0) currentColIdx = 0
  const shiftKey = event.shiftKey

  // Clear range selection when pressing ANY key WITHOUT Shift (Excel-like)
  if (!shiftKey) {
    isRangeSelecting.value = false
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+ArrowDown: jump to last row
        expandAllRowsForSelection()
        selectedRowIndex.value = filteredRows.value.length - 1
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(selectedRowIndex.value, currentColIdx)
      } else if (currentRow < filteredRows.value.length - 1) {
        const next = currentRow + 1
        if (pageSize.value !== 'all' && next >= pageSize.value) pageSize.value = 'all'
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = cols[currentColIdx].id
          isRangeSelecting.value = true
        }
        selectedRowIndex.value = next
        scrollToCell(next, currentColIdx)
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+ArrowUp: jump to first row
        expandAllRowsForSelection()
        selectedRowIndex.value = 0
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(selectedRowIndex.value, currentColIdx)
      } else if (currentRow > 0) {
        const prev = currentRow - 1
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = cols[currentColIdx].id
          isRangeSelecting.value = true
        }
        selectedRowIndex.value = prev
        scrollToCell(prev, currentColIdx)
      }
      break
    case 'ArrowLeft':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+ArrowLeft: jump to first column (student name)
        selectedCol.value = -1
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(currentRow, -1)
      } else if (selectedCol.value === 0) {
        // From student ID go to student name
        selectedCol.value = -1
        scrollToCell(currentRow, -1)
      } else if (currentColIdx > 0) {
        currentColIdx--
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = cols[currentColIdx + 1].id
          isRangeSelecting.value = true
        }
        selectedCol.value = cols[currentColIdx].id
        scrollToCell(currentRow, currentColIdx)
      } else if (currentColIdx === 0 && cols.length > 0 && selectedCol.value === cols[0].id) {
        // From first score column go to student ID
        selectedCol.value = 0
        scrollToCell(currentRow, 0)
      }
      break
    case 'ArrowRight':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+ArrowRight: jump to last column
        selectedCol.value = cols.length > 0 ? cols[cols.length - 1].id : null
        if (!shiftKey) isRangeSelecting.value = false
        scrollToCell(currentRow, cols.length - 1)
      } else if (selectedCol.value === -1) {
        // From student name go to student ID
        selectedCol.value = 0
        scrollToCell(currentRow, 0)
      } else if (selectedCol.value === 0) {
        // From student ID go to first score column
        if (cols.length > 0) {
          selectedCol.value = cols[0].id
          scrollToCell(currentRow, 0)
        }
      } else if (currentColIdx < cols.length - 1) {
        currentColIdx++
        if (shiftKey && !isRangeSelecting.value) {
          expandAllRowsForSelection()
          selectionStartRow.value = currentRow
          selectionStartCol.value = cols[currentColIdx - 1].id
          isRangeSelecting.value = true
        }
        selectedCol.value = cols[currentColIdx].id
        scrollToCell(currentRow, currentColIdx)
      }
      break
    case 'Tab':
      event.preventDefault()
      if (event.shiftKey) {
        if (currentColIdx > 0) { currentColIdx--; selectedCol.value = cols[currentColIdx].id }
        else if (currentRow > 0) { currentRow--; selectedRowIndex.value = currentRow; currentColIdx = cols.length - 1; selectedCol.value = cols[currentColIdx].id }
      } else {
        if (currentColIdx < cols.length - 1) { currentColIdx++; selectedCol.value = cols[currentColIdx].id }
        else if (currentRow < filteredRows.value.length - 1) {
          const next = currentRow + 1; if (pageSize.value !== 'all' && next >= pageSize.value) pageSize.value = 'all'
          currentRow = next; selectedRowIndex.value = currentRow; currentColIdx = 0; selectedCol.value = cols[currentColIdx].id
        }
      }
      isRangeSelecting.value = false
      scrollToCell(currentRow, currentColIdx)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedCol.value !== null && selectedCol.value > 0) {
        // For score cells, Enter advances step by step like Tab.
        handleTabNavigation(event.shiftKey)
      } else if (event.shiftKey) {
        // Shift+Enter: move up in the frozen Name/ID area.
        if (selectedRowIndex.value > 0) selectedRowIndex.value--
        scrollToCell(selectedRowIndex.value, currentColIdx)
      } else if (selectedCol.value !== null) {
        // Keep name/ID cells editable with Enter.
        startEditing(selectedRowIndex.value, selectedCol.value)
      }
      break
    case 'F2':
      event.preventDefault()
      if (selectedCol.value !== null) startEditing(selectedRowIndex.value, selectedCol.value)
      break
    case 'Home':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+Home: go to first cell
        selectedRowIndex.value = 0
        selectedCol.value = cols.length > 0 ? cols[0].id : null
      } else {
        // Home: go to first column in current row
        selectedCol.value = cols.length > 0 ? cols[0].id : null
      }
      if (!shiftKey) isRangeSelecting.value = false
      scrollToCell(selectedRowIndex.value, 0)
      break
    case 'End':
      event.preventDefault()
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+End: go to last cell
        selectedRowIndex.value = filteredRows.value.length - 1
        selectedCol.value = cols.length > 0 ? cols[cols.length - 1].id : null
      } else {
        // End: go to last column in current row
        selectedCol.value = cols.length > 0 ? cols[cols.length - 1].id : null
      }
      if (!shiftKey) isRangeSelecting.value = false
      scrollToCell(selectedRowIndex.value, cols.length - 1)
      break
    case 'PageDown':
      event.preventDefault()
      selectedRowIndex.value = Math.min(selectedRowIndex.value + 10, filteredRows.value.length - 1)
      if (!shiftKey) isRangeSelecting.value = false
      scrollToCell(selectedRowIndex.value, currentColIdx)
      break
    case 'PageUp':
      event.preventDefault()
      selectedRowIndex.value = Math.max(selectedRowIndex.value - 10, 0)
      if (!shiftKey) isRangeSelecting.value = false
      scrollToCell(selectedRowIndex.value, currentColIdx)
      break

    case 'Delete':
    case 'Backspace':
      if (selectedCol.value !== null && selectedCol.value > 0 && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        // If range selected, clear all cells in range
        if (isRangeSelecting.value) {
          clearRangeSelection()
        } else {
          clearSingleCell()
        }
      }
      break
  }
}

function clearSingleCell() {
  const row = filteredRows.value[selectedRowIndex.value]
  if (!row) return
  const oldValue = getCellMark(row, selectedCol.value!)
  if (oldValue === null) return
  const actualRow = rows.value.find(r => r.enrollment_id === row.enrollment_id)
  if (actualRow) { actualRow.details[selectedCol.value!] = null; triggerRef(data) }
  undoStack.value.push({ enrollmentId: row.enrollment_id, detailId: selectedCol.value!, oldValue })
  redoStack.value = []
  showSaveStatus('saving')
  const resolvedDelId = actualRow?.detail_ids?.[selectedCol.value!] ?? selectedCol.value!
  updateCellMark(subjectId.value, termId.value, resolvedDelId, null)
    .then(() => { showSaveStatus('saved'); refreshData() })
    .catch(() => { showSaveStatus('failed'); if (actualRow) actualRow.details[selectedCol.value!] = oldValue })
}

function clearRangeSelection() {
  const r1 = Math.min(selectionStartRow.value, selectedRowIndex.value)
  const r2 = Math.max(selectionStartRow.value, selectedRowIndex.value)
  const c1 = Math.min(selectionStartCol.value!, selectedCol.value!)
  const c2 = Math.max(selectionStartCol.value!, selectedCol.value!)
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const row = filteredRows.value[r]
      if (!row) continue
      const col = columns.value.find(co => co.id === c)
      if (!col) continue
      const oldValue = getCellMark(row, c)
      if (oldValue === null) continue
      const actualRow = rows.value.find(ar => ar.enrollment_id === row.enrollment_id)
      if (actualRow) actualRow.details[c] = null
      undoStack.value.push({ enrollmentId: row.enrollment_id, detailId: c, oldValue })
      const resolvedPasteId = actualRow?.detail_ids?.[c] ?? c
      updateCellMark(subjectId.value, termId.value, resolvedPasteId, null).catch(() => {})
    }
  }
  redoStack.value = []
  showSaveStatus('saved')
  isRangeSelecting.value = false
}

function onEditKeydown(event: KeyboardEvent) {
  // Handle Ctrl+Z, Ctrl+Y, Ctrl+S during editing
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 'z':
        event.preventDefault()
        saveEdit()
        if (event.shiftKey) redo()
        else undo()
        return
      case 'y':
        event.preventDefault()
        saveEdit()
        redo()
        return
      case 's':
        event.preventDefault()
        saveEdit()
        showSaveStatus('saved')
        return
    }
  }

  // Let the native text field / datalist handle vertical navigation for
  // the frozen Student Name / Student ID editors so long suggestion lists
  // can scroll normally.
  if (editingCol.value !== null && editingCol.value <= 0) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      return
    }
  }

  switch (event.key) {
    case 'Enter':
      event.preventDefault()
      saveEdit()
      if (selectedCol.value !== null && selectedCol.value > 0) {
        handleTabNavigation(event.shiftKey)
      } else if (event.shiftKey) {
        if (selectedRowIndex.value > 0) { selectedRowIndex.value-- }
        if (selectedCol.value !== null && selectedCol.value >= 0) {
          nextTick(() => startEditing(selectedRowIndex.value, selectedCol.value))
        }
      } else {
        if (selectedRowIndex.value < filteredRows.value.length - 1) { selectedRowIndex.value++ }
        if (selectedCol.value !== null && selectedCol.value >= 0) {
          nextTick(() => startEditing(selectedRowIndex.value, selectedCol.value))
        }
      }
      break
    case 'Tab':
      event.preventDefault()
      saveEdit()
      handleTabNavigation(event.shiftKey)
      break
    case 'Escape':
      event.preventDefault()
      cancelEdit()
      break
    case 'ArrowUp':
    case 'ArrowDown':
      event.preventDefault()
      saveEdit()
      if (event.key === 'ArrowUp' && selectedRowIndex.value > 0) selectedRowIndex.value--
      if (event.key === 'ArrowDown' && selectedRowIndex.value < filteredRows.value.length - 1) selectedRowIndex.value++
      if (selectedCol.value !== null && selectedCol.value >= 0) {
        nextTick(() => startEditing(selectedRowIndex.value, selectedCol.value))
      }
      break
  }
}

function handleTabNavigation(shiftKey: boolean) {
  const cols = columns.value
  const idx = selectedCol.value !== null ? cols.findIndex(c => c.id === selectedCol.value) : 0
  if (shiftKey) {
    if (idx > 0) { selectedCol.value = cols[idx - 1].id }
    else if (selectedRowIndex.value > 0) {
      selectedRowIndex.value--
      selectedCol.value = cols[cols.length - 1].id
    }
  } else {
    if (idx < cols.length - 1) { selectedCol.value = cols[idx + 1].id }
    else if (selectedRowIndex.value < filteredRows.value.length - 1) {
      selectedRowIndex.value++
      selectedCol.value = cols[0].id
    }
  }
  if (selectedCol.value !== null && selectedCol.value > 0) {
    nextTick(() => startEditing(selectedRowIndex.value, selectedCol.value))
  }
}

function onEditInput() { /* live validation placeholder */ }

function scrollToCell(rowIdx: number, colIdx: number) {
  const container = sheetContainer.value?.querySelector('.sheet-scroll')
  if (!container) return
  // Scroll row into view (vertical)
  const rowCells = container.querySelectorAll('tbody tr')
  if (rowCells[rowIdx]) {
    rowCells[rowIdx].scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }
  // Scroll score column into view (horizontal) using actual column ID
  const targetColId = selectedCol.value
  if (targetColId !== null && targetColId > 0) {
    const targetTd = container.querySelector<HTMLElement>(`td[data-col-id="${targetColId}"]`)
    if (targetTd) {
      targetTd.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
    }
  }
}

function onScroll() {
  // Selection remains visible while scrolling due to sticky headers and frozen columns
}

// ─── Copy / Paste ────────────────────────────────────────────────────
function copySelection() {
  const text = getSelectionText()
  navigator.clipboard.writeText(text).catch(() => {})
}

function cutSelection() {
  if (!selectedCol.value || selectedCol.value <= 0) return
  copySelection()
  const row = filteredRows.value[selectedRowIndex.value]
  if (!row) return
  const oldValue = getCellMark(row, selectedCol.value)
  if (oldValue === null) return
  const actualRow = rows.value.find(r => r.enrollment_id === row.enrollment_id)
  if (actualRow) actualRow.details[selectedCol.value] = null
  undoStack.value.push({ enrollmentId: row.enrollment_id, detailId: selectedCol.value, oldValue })
  redoStack.value = []
  showSaveStatus('saving')
  const resolvedCutId = actualRow?.detail_ids?.[selectedCol.value] ?? selectedCol.value
  updateCellMark(subjectId.value, termId.value, resolvedCutId, null)
    .then(() => { showSaveStatus('saved'); recalculateRowTotal(actualRow!) })
    .catch(() => { showSaveStatus('failed'); if (actualRow) actualRow.details[selectedCol.value] = oldValue })
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text')
  if (!text || !selectedCol.value || selectedCol.value <= 0) return
  event.preventDefault()
  const row = filteredRows.value[selectedRowIndex.value]
  if (!row) return
  const numValue = parseFloat(text)
  if (isNaN(numValue)) return
  if (numValue < 0 || numValue > 100) return
  const detailId = selectedCol.value
  const oldValue = getCellMark(row, detailId)
  const actualRow = rows.value.find(r => r.enrollment_id === row.enrollment_id)
  if (!actualRow) return
  actualRow.details[detailId] = numValue
  undoStack.value.push({ enrollmentId: row.enrollment_id, detailId, oldValue })
  redoStack.value = []
  showSaveStatus('saving')
  const resolvedPasteDetailId = actualRow.detail_ids?.[detailId] ?? detailId
  updateCellMark(subjectId.value, termId.value, resolvedPasteDetailId, numValue)
    .then(() => { showSaveStatus('saved'); recalculateRowTotal(actualRow) })
    .catch(() => { showSaveStatus('failed'); actualRow.details[detailId] = oldValue })
}

function onCopy(event: ClipboardEvent) {
  if (selectedCol.value === null) return
  event.clipboardData?.setData('text/plain', getSelectionText())
  event.preventDefault()
}

function onCut(event: ClipboardEvent) {
  onCopy(event)
  cutSelection()
}

// ─── Undo / Redo ─────────────────────────────────────────────────────
function undo() {
  const action = undoStack.value.pop()
  if (!action) return
  const row = rows.value.find(r => r.enrollment_id === action.enrollmentId)
  if (!row) return
  row.details[action.detailId] = action.oldValue
  redoStack.value.push(action)
  const resolvedUndoId = row.detail_ids?.[action.detailId] ?? action.detailId
  updateCellMark(subjectId.value, termId.value, resolvedUndoId, action.oldValue)
    .then(() => { showSaveStatus('saved'); refreshData() })
    .catch(() => showSaveStatus('failed'))
}

function redo() {
  const action = redoStack.value.pop()
  if (!action) return
  undoStack.value.push(action)
  const row = rows.value.find(r => r.enrollment_id === action.enrollmentId)
  if (!row) return
  const current = row.details[action.detailId]
  row.details[action.detailId] = current === null ? action.oldValue : null
  const resolvedRedoId = row.detail_ids?.[action.detailId] ?? action.detailId
  updateCellMark(subjectId.value, termId.value, resolvedRedoId, row.details[action.detailId])
    .then(() => { showSaveStatus('saved'); refreshData() })
    .catch(() => showSaveStatus('failed'))
}

// ─── Data Loading ────────────────────────────────────────────────────
function goBack() { router.push('/scores') }

async function refreshData() {
  if (!subjectId.value || !termId.value) return
  loading.value = true
  try {
    data.value = await getSpreadsheetBySubjectAndTerm(subjectId.value, termId.value)
    assessments.value = data.value.assessment_types
    assessments.value.forEach(at => { weightEdits[at.id] = at.weight_percent })
    // Initialize column types dropdown values
    columns.value.forEach(col => { columnTypes[col.id] = col.type })
    selectedRowIndex.value = 0
    selectedCol.value = columns.value.length > 0 ? columns.value[0].id : null
  } catch { showSaveStatus('failed') }
  finally { loading.value = false }
}

// ─── Column Management ───────────────────────────────────────────────
function startRenameColumn(col: SpreadsheetColumn) {
  renamingColumn.value = col
  renameValue.value = col.label
  nextTick(() => { (document.querySelector('.modal-overlay .form-input') as HTMLInputElement)?.focus() })
}

async function doRenameColumn() {
  if (!renamingColumn.value || !renameValue.value.trim()) return
  try {
    await renameColumn(subjectId.value, termId.value, renamingColumn.value.id, renameValue.value.trim())
    renamingColumn.value = null; showSaveStatus('saved'); refreshData()
  } catch { showSaveStatus('failed') }
}

function confirmDeleteColumn(col: SpreadsheetColumn) { deleteConfirm.value = { col, label: col.label } }

async function doDeleteColumn() {
  if (!deleteConfirm.value) return
  try {
    await deleteColumn(subjectId.value, termId.value, deleteConfirm.value.col.id)
    deleteConfirm.value = null; showSaveStatus('saved'); refreshData()
  } catch { showSaveStatus('failed') }
}

async function doAddColumn() {
  if (!newColumn.label.trim()) return
  try {
    await addColumn(subjectId.value, termId.value, { type: newColumn.type, label: newColumn.label.trim(), max_score: newColumn.max_score })
    showAddColumn.value = false; newColumn.label = ''; newColumn.max_score = null
    showSaveStatus('saved'); refreshData()
  } catch { showSaveStatus('failed') }
}

async function doAddColumnInline() {
  if (!inlineColName.value.trim()) return
  try {
    await addColumn(subjectId.value, termId.value, { type: inlineColType.value, label: inlineColName.value.trim(), max_score: inlineColMax.value })
    inlineColName.value = ''; inlineColType.value = 'quiz'; inlineColMax.value = 100
    showInlineAddColumn.value = false; showSaveStatus('saved'); refreshData()
  } catch { showSaveStatus('failed') }
}

async function doAddRow() {
  try {
    await addEnrollment(subjectId.value, termId.value, null)
    showSaveStatus('saved')
    pageSize.value = 'all'
    await refreshData()
  } catch (err) {
    showSaveStatus('failed')
    console.error('Failed to add row:', err)
    alert('Error: ' + ((err as any)?.response?.data?.message || 'Failed to add new row'))
  }
}

async function doUpdateWeights() {
  if (totalWeight.value !== 100) return
  try {
    await updateWeights(assessments.value.map(at => ({ id: at.id, weight_percent: weightEdits[at.id] || 0 })))
    showWeights.value = false; showSaveStatus('saved'); refreshData()
  } catch { showSaveStatus('failed') }
}

// ─── Google Sheets Sync ──────────────────────────────────────────────
async function syncToGoogle() {
  syncing.value = true
  try {
    const token = localStorage.getItem('google_access_token')
    if (token) {
      try {
        const result = await createGoogleSheet(subjectId.value, termId.value, token)
        window.open(result.url, '_blank'); showSaveStatus('saved'); return
      } catch (e) { console.warn('OAuth sync failed, falling back to CSV export', e) }
    }
    const result = await syncToGoogleSheets(subjectId.value, termId.value)
    const blob = new Blob([result.csv_content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    window.open('https://docs.google.com/spreadsheets', '_blank')
    const link = document.createElement('a')
    link.href = url; link.download = `${data.value?.subject?.name || 'scores'}-${data.value?.term?.name || 'term'}.csv`
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showSaveStatus('saved')
  } catch { showSaveStatus('failed') }
  finally { syncing.value = false }
}

function importFromGoogle() { showImport.value = true }

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
      showImport.value = false; showSaveStatus('saved'); refreshData()
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
  document.body.appendChild(link); link.click(); document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
  showSaveStatus('saved')
}

// ─── Status ──────────────────────────────────────────────────────────
function showSaveStatus(status: 'saving' | 'saved' | 'failed') {
  saveStatus.value = status
  if (status !== 'saving') setTimeout(() => { if (saveStatus.value === status) saveStatus.value = 'idle' }, 3000)
}

// ─── Lifecycle ───────────────────────────────────────────────────────
function onColumnTypeChange(col: SpreadsheetColumn, event: Event) {
  const newType = (event.target as HTMLSelectElement).value
  if (newType === col.type) return
  const oldType = col.type
  showSaveStatus('saving')
  changeColumnType(subjectId.value, termId.value, col.label, oldType, newType)
    .then(() => {
      showSaveStatus('saved')
      refreshData()
    })
    .catch(() => {
      showSaveStatus('failed')
      columnTypes[col.id] = oldType // revert
    })
}

onMounted(() => {
  refreshData()
  getStudentNumbers().then(nums => { studentNumbers.value = nums }).catch(() => {})
  nextTick(() => {
    const container = document.querySelector('.sheet-wrapper') as HTMLElement
    if (container) container.focus()
  })
})

watch([subjectId, termId], () => { if (subjectId.value && termId.value) refreshData() })
</script>

<style scoped>
/* ─── Layout ────────────────────────────────────────────────────────── */
.score-sheet {
  position: relative;
  font-family: 'Inter', 'Segoe UI', 'Noto Sans Khmer', sans-serif;
  height: calc(100vh - 0px);
  min-height: 0;
  display: flex;
  flex-direction: column;
  color: #1e293b;
  background: #fff;
}

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
.toolbar-spacer { flex: 0; }
.toolbar-actions { display: flex; align-items: center; gap: 8px; flex: 1; flex-wrap: wrap; }
.offering-info { display: flex; flex-direction: column; white-space: nowrap; }
.offering-info strong { font-size: 0.95rem; font-weight: 700; color: #0f172a; }
.offering-info .text-muted { font-size: 0.7rem; color: #64748b; }
.term-badge { display: inline-block; padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-weight: 700; font-size: 0.75rem; margin-right: 4px; }

.tb-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 10px; border: 1px solid #e2e8f0; background: #fff;
  border-radius: 6px; cursor: pointer; font-size: 0.78rem;
  color: #475569; transition: all 0.15s; white-space: nowrap;
}
.tb-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
.tb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-group { display: flex; gap: 3px; flex-wrap: wrap; }

.search-box { display: flex; align-items: center; gap: 5px; padding: 5px 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; min-width: 220px; }
.search-box input { border: none; background: transparent; outline: none; font-size: 0.78rem; width: 200px; color: #1e293b; }
.search-box i { color: #94a3b8; font-size: 0.78rem; }

.save-status { font-size: 0.7rem; display: flex; align-items: center; gap: 3px; padding: 3px 8px; border-radius: 4px; white-space: nowrap; }
.status-saving { color: #f59e0b; background: #fef3c7; }
.status-saved { color: #16a34a; background: #dcfce7; }
.status-failed { color: #dc2626; background: #fee2e2; }
.status-idle { color: transparent; }

.stats-bar { display: flex; gap: 16px; padding: 6px 12px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; flex-wrap: wrap; }
.stat-item { display: flex; gap: 5px; font-size: 0.78rem; align-items: center; }
.stat-label { color: #64748b; font-weight: 500; }
.stat-value { font-weight: 700; color: #0f172a; }

/* ─── Sheet Wrapper ────────────────────────────────────────────────── */
.sheet-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  outline: none;
}
.sheet-wrapper:focus { outline: none; }
.sheet-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

/* ─── Table ────────────────────────────────────────────────────────── */
.sheet-table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
  font-size: 0.8rem;
}

.sheet-table thead { position: sticky; top: 0; z-index: 10; }

.cell-header {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 5px 8px;
  font-weight: 700;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #475569;
  position: sticky;
  top: 0;
  z-index: 10;
  text-align: left;
  white-space: nowrap;
  min-width: 80px;
  user-select: none;
}

/* ─── Cell Highlights (Excel green) ─────────────────────────────────── */
.cell-frozen { position: sticky; z-index: 20; background: #f1f5f9; }

.row-num-header, .row-num { left: 0; width: 36px; min-width: 36px; max-width: 36px; text-align: center; z-index: 30; }
.student-name-header, .cell-student-name { left: 36px; min-width: 160px; z-index: 25; }
.student-id-header, .cell-student-id { left: 196px; min-width: 90px; z-index: 25; }

/* ─── Enhanced Header Highlight ─────────────────────────────────────── */
.header-highlighted {
  background: #d4edda !important; /* Light green */
  border-color: #6cc47c !important;
  color: #155724 !important;
}

.row-num-highlighted {
  background: #c3e6cb !important;
  border-color: #6cc47c !important;
  color: #155724 !important;
  font-weight: 700 !important;
}

/* ─── Header ────────────────────────────────────────────────────────── */
.header-content { display: flex; align-items: center; gap: 4px; }
.column-header-content { flex-direction: column; align-items: flex-start; gap: 1px; }
.column-label { overflow: hidden; text-overflow: ellipsis; cursor: pointer; font-size: 0.68rem; }

.column-actions { display: none; gap: 2px; margin-top: 2px; }
.cell-header:hover .column-actions { display: flex; }
.col-action-btn { background: none; border: none; padding: 1px 3px; cursor: pointer; font-size: 0.6rem; color: #64748b; border-radius: 2px; }
.col-action-btn:hover { background: #e2e8f0; }
.text-danger { color: #ef4444 !important; }
.max-score-label { font-size: 0.55rem; color: #94a3b8; font-weight: 400; margin-top: 1px; }

/* ─── Editable Column Type Select ─────────────────────────────────── */
.column-type-select {
  font-size: 0.6rem;
  padding: 1px 4px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  outline: none;
  max-width: 90px;
  font-weight: 400;
  appearance: auto;
  transition: all 0.15s;
}
.column-type-select:hover {
  border-color: #cbd5e1;
  background: rgba(255,255,255,0.6);
}
.column-type-select:focus {
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
}
.col-type-quiz .column-type-select { background: #dbeafe; color: #2563eb; border-color: #bfdbfe; }
.col-type-assignment .column-type-select { background: #dcfce7; color: #16a34a; border-color: #bbf7d0; }
.col-type-project .column-type-select { background: #fef3c7; color: #d97706; border-color: #fde68a; }
.col-type-midterm .column-type-select { background: #ede9fe; color: #7c3aed; border-color: #ddd6fe; }
.col-type-final .column-type-select { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
.cell-total, .cell-grade { background: #fafafa; }
.cell-total.cell-header, .cell-grade.cell-header { background: #e2e8f0; }

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
.cell-score { min-width: 60px; text-align: center; position: relative; }
.cell-score .cell-editing {
  z-index: 5;
}
.cell:hover { background: #f8fafc; }

/* ─── Excel-style Selection: Green Border ───────────────────────────── */
.cell-selected {
  outline: 2px solid #16a34a !important; /* Excel green */
  outline-offset: -1px;
  background: #e8f5e9 !important;
  z-index: 5;
}
/* Keep sticky positioning for frozen selected cells */
.cell-frozen.cell-selected {
  position: sticky;
}
/* Keep relative positioning for score selected cells */
.cell-score.cell-selected {
  position: relative;
}

/* ─── Range Selection: Light green area with border ─────────────────── */
.cell-in-range {
  background: #e8f5e9 !important;
  border-top-color: #a5d6a7 !important;
  border-bottom-color: #a5d6a7 !important;
  border-left-color: #a5d6a7 !important;
  border-right-color: #a5d6a7 !important;
}

/* ─── Cell Editing State ────────────────────────────────────────────── */
.cell-editing {
  outline: 2px solid #16a34a !important;
  outline-offset: -1px;
  background: #e8f5e9 !important;
  z-index: 5;
  padding: 0 !important;
}
/* For sticky editing cells: keep sticky positioning */
.cell-frozen.cell-editing {
  position: sticky;
}
/* For score cell editing: keep relative positioning */
.cell-score.cell-editing {
  position: relative;
}

/* ─── Cell Colors ──────────────────────────────────────────────────── */
.cell-excellent { background: #dcfce7 !important; color: #16a34a; font-weight: 600; }
.cell-average { background: #fef9c3 !important; color: #b45309; }
.cell-low { background: #fee2e2 !important; color: #dc2626; }

/* ─── Cell Editor ──────────────────────────────────────────────────── */
.cell-editor-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.cell-editor {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 4px;
  font-size: 0.8rem;
  text-align: center;
  background: #fff;
  font-family: inherit;
  color: #0f172a;
  box-sizing: border-box;
  min-width: 0;
  line-height: 1;
}

/* ─── Name Cell & Editor - Professional Spreadsheet Style ──────────── */
.cell-student-name {
  min-width: 160px;
  max-width: 160px;
  width: 160px;
}
.cell-student-name .cell-editor-wrapper .cell-editor {
  text-align: left;
  font-weight: 500;
  font-size: 0.82rem;
  color: #0f172a;
  padding: 0 6px;
  background: #fff;
  height: 100%;
  letter-spacing: 0.01em;
}
.cell-student-name.cell-selected {
  z-index: 25;
  outline: 2px solid #2563eb !important;
  outline-offset: -1px;
  position: sticky;
}
.cell-student-name.cell-editing {
  z-index: 25;
  outline: 2px solid #2563eb !important;
  outline-offset: -1px;
  background: #fff !important;
  position: sticky;
}
.cell-student-name .cell-value {
  font-weight: 500;
  color: #0f172a;
  padding: 3px 14px 3px 6px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

/* ─── Student ID Cell & Editor - Professional Style ───────────────── */
.student-name-cell-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.cell-student-id {
  min-width: 90px;
  max-width: 90px;
  width: 90px;
}
.student-id-cell-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.id-editor-wrapper {
  padding: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  box-sizing: border-box;
}
.id-editor-input {
  flex: 1;
  min-width: 0;
  text-align: left !important;
  font-weight: 600;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.75rem;
  color: #0f172a;
  letter-spacing: 0.01em;
  padding: 0 18px 0 3px !important;
  background: #fff !important;
  border: none;
  outline: none;
  height: 100%;
  box-sizing: border-box;
}
.fill-handle.fill-handle-frozen {
  right: -1px;
  bottom: -1px;
  z-index: 35;
}
.cell-student-id.cell-selected {
  z-index: 25;
  outline: 2px solid #2563eb !important;
  outline-offset: -1px;
  position: sticky;
}
.cell-student-id.cell-editing {
  z-index: 25;
  outline: 2px solid #2563eb !important;
  outline-offset: -1px;
  background: #fff !important;
  position: sticky;
}
.cell-student-id .cell-value {
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 600;
  font-size: 0.78rem;
  color: #334155;
  padding: 3px 18px 3px 6px;
  letter-spacing: 0.02em;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

/* ─── Cell Value Base ───────────────────────────────────────────────── */
.cell-value {
  display: block;
  padding: 3px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}


/* ─── Row States ───────────────────────────────────────────────────── */
.row-even .cell { background-color: #fafafa; }
.row-selected .cell { background-color: #f0fff4; }
.row-selected .cell.frozen { background-color: #e8f5e9; }

/* ─── Fill Handle ──────────────────────────────────────────────────── */
.fill-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #16a34a;
  border: 1px solid #fff;
  border-radius: 2px;
  cursor: crosshair;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1;
  user-select: none;
}
.fill-handle:hover {
  background: #15803d;
  transform: scale(1.2);
}

.cell-autofill-preview {
  background: #e8f5e9 !important;
  border-bottom: 2px solid #16a34a !important;
}

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
.spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 0.7s linear infinite; }

/* ─── Modal ────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content { background: #fff; border-radius: 10px; width: 90%; max-width: 450px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal-sm { max-width: 380px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid #e2e8f0; }
.modal-header h5 { font-size: 0.95rem; font-weight: 700; margin: 0; }
.modal-close { background: none; border: none; font-size: 1.4rem; color: #64748b; cursor: pointer; padding: 0; line-height: 1; }
.modal-body { padding: 18px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 10px 18px; border-top: 1px solid #e2e8f0; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 0.78rem; font-weight: 600; color: #374151; margin-bottom: 3px; }
.form-input { width: 100%; padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 5px; font-size: 0.85rem; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
.form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
select.form-input { appearance: auto; }
.btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
.btn-secondary { background: #f1f5f9; color: #475569; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
.btn-block { width: 100%; justify-content: center; }

.weight-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.weight-table th { text-align: left; padding: 6px 10px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 0.72rem; text-transform: uppercase; }
.weight-table td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
.weight-name { font-weight: 600; display: block; }
.weight-code { font-size: 0.72rem; color: #94a3b8; }
.weight-input { width: 70px; text-align: center; }
.weight-total-bar { margin-top: 10px; padding: 6px 10px; border-radius: 5px; font-weight: 600; font-size: 0.78rem; text-align: center; }
.weight-ok { background: #dcfce7; color: #16a34a; }
.weight-warn { background: #fef3c7; color: #d97706; }
.import-steps { font-size: 0.78rem; color: #64748b; padding-left: 18px; margin-bottom: 14px; }
.import-steps li { margin-bottom: 4px; }

@media (max-width: 768px) {
  .sheet-toolbar { flex-direction: column; align-items: flex-start; }
  .toolbar-actions { width: 100%; }
  .btn-group { width: 100%; }
}

.table-footer { display: flex; align-items: center; justify-content: flex-end; padding: 10px 12px; border-top: 1px solid #e2e8f0; background: #f8fafc; gap: 8px; }
.page-size-selector { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: #64748b; }
.page-size-select { padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.78rem; background: #fff; color: #1e293b; outline: none; cursor: pointer; }
.page-size-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }

.add-col-header { width: 40px; min-width: 40px; max-width: 40px; text-align: center; padding: 5px !important; position: relative; }
.add-col-trigger { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; color: #64748b; transition: all 0.15s; margin: 0 auto; }
.add-col-trigger:hover { background: #dbeafe; color: #2563eb; }
.inline-add-col { position: absolute; top: 100%; right: 0; z-index: 50; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); padding: 10px; display: flex; flex-direction: column; gap: 6px; min-width: 200px; margin-top: 4px; }
.inline-input { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.78rem; outline: none; width: 100%; box-sizing: border-box; }
.inline-input:focus { border-color: #3b82f6; }
.inline-select { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.78rem; background: #fff; outline: none; width: 100%; box-sizing: border-box; }
.inline-btn { padding: 6px 10px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.inline-btn:hover { background: #1d4ed8; }
.inline-btn-cancel { position: absolute; top: 4px; right: 6px; background: none; border: none; font-size: 1.1rem; color: #94a3b8; cursor: pointer; line-height: 1; }
.inline-btn-cancel:hover { color: #ef4444; }

.add-row-row { cursor: pointer; transition: background 0.15s; }
.add-row-row:hover { background: #f0f9ff !important; }
.add-row-cell { text-align: center; color: #3b82f6; font-weight: 600; font-size: 0.8rem; padding: 10px !important; border: 2px dashed #bfdbfe !important; border-radius: 0 0 8px 0; }
.add-row-cell i { margin-right: 6px; }

.cell { transition: background 0.1s ease, border-color 0.1s ease; }
.cell-score:hover { background: #f8fafc; }
.cell-selected { transition: outline 0.1s ease, background 0.1s ease; }
.row-selected .cell { transition: background 0.1s ease; }
</style>
