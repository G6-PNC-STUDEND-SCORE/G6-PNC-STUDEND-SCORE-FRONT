<template>
  <Header />
  <div class="px-4 py-4">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><i class="bi bi-gear-fill"></i></div>
        <div>
          <h2 class="page-title">Settings</h2>
          <p class="page-subtitle">Manage grade boundaries, assessment types, terms, and generations</p>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
        <i :class="tab.icon"></i> {{ tab.label }}
      </button>
    </div>

    <!-- Grade Boundaries -->
    <div v-if="activeTab === 'grade-boundaries'" class="settings-section">
      <div class="section-header">
        <h3>Grade Boundaries</h3>
        <p class="section-desc">Configure score ranges for each letter grade. Scores are matched top-down from highest grade.</p>
      </div>
      <div class="grade-boundaries-list">
        <div v-for="boundary in gradeBoundaries" :key="boundary.id" class="boundary-card">
          <div class="boundary-grade" :style="{ background: boundary.color || '#e2e8f0' }">{{ boundary.grade }}</div>
          <div class="boundary-fields">
            <div class="field-row">
              <div class="field-group">
                <label>Min %</label>
                <input v-model.number="boundary.min_percent" type="number" min="0" max="100" class="form-input" @change="saveBoundary(boundary)" />
              </div>
              <div class="field-group">
                <label>Max %</label>
                <input v-model.number="boundary.max_percent" type="number" min="0" max="100" class="form-input" @change="saveBoundary(boundary)" />
              </div>
              <div class="field-group">
                <label>Label</label>
                <input v-model="boundary.label" class="form-input" @blur="saveBoundary(boundary)" />
              </div>
              <div class="field-group field-color">
                <label>Color</label>
                <input v-model="boundary.color" type="color" class="color-input" @change="saveBoundary(boundary)" />
              </div>
              <div class="field-group field-toggle">
                <label>Active</label>
                <label class="toggle"><input type="checkbox" v-model="boundary.is_active" @change="saveBoundary(boundary)" /><span class="toggle-slider"></span></label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="saveMsg" class="save-msg" :class="saveMsgType">{{ saveMsg }}</div>
    </div>

    <!-- Assessment Types -->
    <div v-if="activeTab === 'assessment-types'" class="settings-section">
      <div class="section-header">
        <h3>Assessment Types</h3>
        <p class="section-desc">Manage assessment components like quizzes, assignments, midterms, and finals.</p>
        <button class="btn btn-primary btn-sm" @click="showAddAssessment = true"><i class="bi bi-plus-lg"></i> Add Type</button>
      </div>
      <table class="settings-table">
        <thead><tr><th>Code</th><th>Name</th><th>Weight (%)</th><th>Active</th><th></th></tr></thead>
        <tbody>
          <tr v-for="at in assessmentTypes" :key="at.id">
            <td><code>{{ at.code }}</code></td>
            <td>
              <input v-model="at.name" class="form-input table-input" @blur="updateAssessment(at)" />
            </td>
            <td>
              <input v-model.number="at.weight_percent" type="number" min="0" max="100" step="0.5" class="form-input table-input weight-input" @change="updateAssessment(at)" />
            </td>
            <td>
              <label class="toggle"><input type="checkbox" v-model="at.is_active" @change="updateAssessment(at)" /><span class="toggle-slider"></span></label>
            </td>
            <td>
              <button class="btn-icon text-danger" @click="deleteAssessment(at)" title="Delete"><i class="bi bi-trash3"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!assessmentTypes.length" class="empty-mini">No assessment types found.</div>
      <div v-if="saveMsg" class="save-msg" :class="saveMsgType">{{ saveMsg }}</div>
    </div>

    <!-- Terms -->
    <div v-if="activeTab === 'terms'" class="settings-section">
      <div class="section-header">
        <h3>Terms</h3>
        <p class="section-desc">Manage academic terms.</p>
        <button class="btn btn-primary btn-sm" @click="showAddTerm = true"><i class="bi bi-plus-lg"></i> Add Term</button>
      </div>
      <table class="settings-table">
        <thead><tr><th>#</th><th>Name</th><th>Start</th><th>End</th><th></th></tr></thead>
        <tbody>
          <tr v-for="term in terms" :key="term.id">
            <td>{{ term.term_number }}</td>
            <td><input v-model="term.name" class="form-input table-input" @blur="updateTerm(term)" /></td>
            <td><input v-model="term.start_date" type="date" class="form-input table-input" @change="updateTerm(term)" /></td>
            <td><input v-model="term.end_date" type="date" class="form-input table-input" @change="updateTerm(term)" /></td>
            <td><button class="btn-icon text-danger" @click="deleteTerm(term)" title="Delete"><i class="bi bi-trash3"></i></button></td>
          </tr>
        </tbody>
      </table>
      <div v-if="!terms.length" class="empty-mini">No terms found.</div>
    </div>

    <!-- Generations -->
    <div v-if="activeTab === 'generations'" class="settings-section">
      <div class="section-header">
        <h3>Generations</h3>
        <p class="section-desc">Manage academic generations (year groups).</p>
        <button class="btn btn-primary btn-sm" @click="showAddGeneration = true"><i class="bi bi-plus-lg"></i> Add Generation</button>
      </div>
      <table class="settings-table">
        <thead><tr><th>Year</th><th>Current</th><th></th></tr></thead>
        <tbody>
          <tr v-for="gen in generations" :key="gen.id">
            <td><input v-model.number="gen.year" type="number" class="form-input table-input" @change="updateGeneration(gen)" /></td>
            <td>
              <label class="toggle"><input type="checkbox" v-model="gen.is_current" @change="updateGeneration(gen)" /><span class="toggle-slider"></span></label>
            </td>
            <td><button class="btn-icon text-danger" @click="deleteGeneration(gen)" title="Delete"><i class="bi bi-trash3"></i></button></td>
          </tr>
        </tbody>
      </table>
      <div v-if="!generations.length" class="empty-mini">No generations found.</div>
    </div>

    <!-- Add Assessment Type Modal -->
    <div v-if="showAddAssessment" class="modal-overlay" @click.self="showAddAssessment = false">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Add Assessment Type</h5><button class="modal-close" @click="showAddAssessment = false">&times;</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Code</label><input v-model="newAssessment.code" class="form-input" placeholder="e.g. project" /></div>
          <div class="form-group"><label>Name</label><input v-model="newAssessment.name" class="form-input" placeholder="e.g. Project" /></div>
          <div class="form-group"><label>Weight (%)</label><input v-model.number="newAssessment.weight_percent" type="number" min="0" max="100" step="0.5" class="form-input" /></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddAssessment = false">Cancel</button>
          <button class="btn btn-primary" @click="doAddAssessment">Add</button>
        </div>
      </div>
    </div>

    <!-- Add Term Modal -->
    <div v-if="showAddTerm" class="modal-overlay" @click.self="showAddTerm = false">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Add Term</h5><button class="modal-close" @click="showAddTerm = false">&times;</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Name</label><input v-model="newTerm.name" class="form-input" placeholder="e.g. Term 1" /></div>
          <div class="form-group"><label>Term Number</label><input v-model.number="newTerm.term_number" type="number" min="1" class="form-input" /></div>
          <div class="form-group"><label>Start Date</label><input v-model="newTerm.start_date" type="date" class="form-input" /></div>
          <div class="form-group"><label>End Date</label><input v-model="newTerm.end_date" type="date" class="form-input" /></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddTerm = false">Cancel</button>
          <button class="btn btn-primary" @click="doAddTerm">Add</button>
        </div>
      </div>
    </div>

    <!-- Add Generation Modal -->
    <div v-if="showAddGeneration" class="modal-overlay" @click.self="showAddGeneration = false">
      <div class="modal-content modal-sm">
        <div class="modal-header"><h5>Add Generation</h5><button class="modal-close" @click="showAddGeneration = false">&times;</button></div>
        <div class="modal-body">
          <div class="form-group"><label>Year</label><input v-model.number="newGeneration.year" type="number" min="2020" max="2099" class="form-input" placeholder="e.g. 2026" /></div>
          <div class="form-group"><label class="toggle-label"><input type="checkbox" v-model="newGeneration.is_current" class="form-checkbox" /> Set as current generation</label></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddGeneration = false">Cancel</button>
          <button class="btn btn-primary" @click="doAddGeneration">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Header from '@/layouts/Header.vue'
import { settingsService, type GradeBoundary, type AssessmentType, type Term, type Generation } from '@/services/settingsService'

const tabs = [
  { key: 'grade-boundaries', label: 'Grade Boundaries', icon: 'bi bi-bar-chart-steps' },
  { key: 'assessment-types', label: 'Assessment Types', icon: 'bi bi-collection' },
  { key: 'terms', label: 'Terms', icon: 'bi bi-calendar-week' },
  { key: 'generations', label: 'Generations', icon: 'bi bi-people' },
]

const activeTab = ref('grade-boundaries')

const gradeBoundaries = ref<GradeBoundary[]>([])
const assessmentTypes = ref<AssessmentType[]>([])
const terms = ref<Term[]>([])
const generations = ref<Generation[]>([])

const saveMsg = ref('')
const saveMsgType = ref('')

const showAddAssessment = ref(false)
const showAddTerm = ref(false)
const showAddGeneration = ref(false)

const newAssessment = ref<Partial<AssessmentType>>({ code: '', name: '', weight_percent: 10, is_active: true })
const newTerm = ref<Partial<Term>>({ name: '', term_number: 1, start_date: '', end_date: '' })
const newGeneration = ref<Partial<Generation>>({ year: new Date().getFullYear(), is_current: false })

function showMessage(msg: string, type: 'success' | 'error' = 'success') {
  saveMsg.value = msg
  saveMsgType.value = type
  setTimeout(() => { saveMsg.value = '' }, 3000)
}

async function saveBoundary(b: GradeBoundary) {
  try {
    await settingsService.updateGradeBoundary(b.id, {
      min_percent: b.min_percent,
      max_percent: b.max_percent,
      label: b.label,
      color: b.color,
      is_active: b.is_active,
    })
    showMessage('Grade boundary updated')
  } catch { showMessage('Failed to update', 'error') }
}

async function updateAssessment(at: AssessmentType) {
  try {
    await settingsService.updateAssessmentType(at.id, {
      name: at.name,
      weight_percent: at.weight_percent,
      is_active: at.is_active,
    })
    showMessage('Assessment type updated')
  } catch { showMessage('Failed to update', 'error') }
}

async function deleteAssessment(at: AssessmentType) {
  if (!confirm(`Delete "${at.name}"?`)) return
  try {
    await settingsService.deleteAssessmentType(at.id)
    assessmentTypes.value = assessmentTypes.value.filter(a => a.id !== at.id)
    showMessage('Assessment type deleted')
  } catch { showMessage('Failed to delete (may be in use)', 'error') }
}

async function doAddAssessment() {
  if (!newAssessment.value.code || !newAssessment.value.name) return
  try {
    const result = await settingsService.createAssessmentType(newAssessment.value)
    assessmentTypes.value.push(result)
    showAddAssessment.value = false
    newAssessment.value = { code: '', name: '', weight_percent: 10, is_active: true }
    showMessage('Assessment type added')
  } catch { showMessage('Failed to create', 'error') }
}

async function updateTerm(t: Term) {
  try {
    await settingsService.updateTerm(t.id, {
      name: t.name,
      start_date: t.start_date,
      end_date: t.end_date,
    })
    showMessage('Term updated')
  } catch { showMessage('Failed to update', 'error') }
}

async function deleteTerm(t: Term) {
  if (!confirm(`Delete "${t.name}"?`)) return
  try {
    await settingsService.deleteTerm(t.id)
    terms.value = terms.value.filter(term => term.id !== t.id)
    showMessage('Term deleted')
  } catch { showMessage('Failed to delete', 'error') }
}

async function doAddTerm() {
  if (!newTerm.value.name) return
  try {
    const result = await settingsService.createTerm(newTerm.value)
    terms.value.push(result)
    showAddTerm.value = false
    newTerm.value = { name: '', term_number: 1, start_date: '', end_date: '' }
    showMessage('Term added')
  } catch { showMessage('Failed to create', 'error') }
}

async function updateGeneration(g: Generation) {
  try {
    await settingsService.updateGeneration(g.id, {
      year: g.year,
      is_current: g.is_current,
    })
    showMessage('Generation updated')
  } catch { showMessage('Failed to update', 'error') }
}

async function deleteGeneration(g: Generation) {
  if (!confirm(`Delete generation ${g.year}?`)) return
  try {
    await settingsService.deleteGeneration(g.id)
    generations.value = generations.value.filter(gen => gen.id !== g.id)
    showMessage('Generation deleted')
  } catch { showMessage('Failed to delete', 'error') }
}

async function doAddGeneration() {
  if (!newGeneration.value.year) return
  try {
    const result = await settingsService.createGeneration(newGeneration.value)
    generations.value.push(result)
    showAddGeneration.value = false
    newGeneration.value = { year: new Date().getFullYear(), is_current: false }
    showMessage('Generation added')
  } catch { showMessage('Failed to create', 'error') }
}

onMounted(async () => {
  try {
    gradeBoundaries.value = await settingsService.getGradeBoundaries()
    assessmentTypes.value = await settingsService.getAssessmentTypes()
    terms.value = await settingsService.getTerms()
    generations.value = await settingsService.getGenerations()
  } catch { showMessage('Failed to load settings', 'error') }
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.page-header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff, #dbeafe);
  color: #2563eb;
  border-radius: 12px;
  font-size: 1.2rem;
}
.page-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 1.5rem;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 10px;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border: none;
  background: transparent;
  border-radius: 7px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover { color: #334155; background: #e2e8f0; }
.tab-btn.active { background: #fff; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.settings-section { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; }
.section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1rem; flex-wrap: wrap; }
.section-header h3 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
.section-desc { font-size: 0.8rem; color: #64748b; margin: 0; flex: 1; }
.grade-boundaries-list { display: flex; flex-direction: column; gap: 8px; }
.boundary-card { display: flex; align-items: center; gap: 12px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
.boundary-grade { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #fff; font-weight: 700; font-size: 0.95rem; flex-shrink: 0; }
.boundary-fields { flex: 1; }
.field-row { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
.field-group { min-width: 60px; }
.field-group label { display: block; font-size: 0.65rem; font-weight: 600; color: #64748b; margin-bottom: 2px; text-transform: uppercase; }
.field-color { min-width: 50px; }
.field-toggle { min-width: 50px; }
.color-input { width: 36px; height: 32px; padding: 2px; border: 1px solid #d1d5db; border-radius: 5px; cursor: pointer; }
.toggle { position: relative; display: inline-block; width: 32px; height: 18px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #cbd5e1; border-radius: 18px; transition: 0.2s; }
.toggle-slider:before { content: ''; position: absolute; height: 14px; width: 14px; left: 2px; bottom: 2px; background: #fff; border-radius: 50%; transition: 0.2s; }
.toggle input:checked + .toggle-slider { background: #2563eb; }
.toggle input:checked + .toggle-slider:before { transform: translateX(14px); }
.settings-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.settings-table th { text-align: left; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 0.72rem; text-transform: uppercase; }
.settings-table td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.settings-table td code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 0.8rem; }
.table-input { font-size: 0.8rem; padding: 4px 8px; }
.weight-input { width: 70px; text-align: center; }
.btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.btn-sm { padding: 5px 10px; font-size: 0.75rem; }
.btn-primary { background: #2563eb; color: #fff; }
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary { background: #f1f5f9; color: #475569; }
.btn-secondary:hover { background: #e2e8f0; }
.btn-icon { background: none; border: none; padding: 4px 6px; cursor: pointer; font-size: 0.85rem; border-radius: 4px; }
.btn-icon:hover { background: #fee2e2; }
.text-danger { color: #ef4444 !important; }
.form-input { width: 100%; padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 5px; font-size: 0.85rem; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
.form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.form-checkbox { margin-right: 6px; }
.toggle-label { display: flex; align-items: center; font-size: 0.85rem; color: #374151; cursor: pointer; }
.save-msg { margin-top: 12px; padding: 8px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 500; }
.save-msg.success { background: #dcfce7; color: #16a34a; }
.save-msg.error { background: #fee2e2; color: #dc2626; }
.empty-mini { text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.85rem; }

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
</style>
