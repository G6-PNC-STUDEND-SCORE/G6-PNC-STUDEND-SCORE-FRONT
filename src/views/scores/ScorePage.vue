<template>
  <div>
    <Header />
    <div class="px-4 py-4">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-header-icon">
            <i class="bi bi-clipboard-data-fill"></i>
          </div>
          <div>
            <h2 class="page-title">Score Sheet</h2>
            <p class="page-subtitle">Select a subject to manage scores and grading</p>
          </div>
        </div>
        <div class="page-header-right">
          <select v-model="selectedTermId" class="term-select" @change="loadSubjects">
            <option value="">All Terms</option>
            <option v-for="t in terms" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>

      <!-- Subjects grid -->
      <div v-if="loading" class="loading-state">
        <div class="spinner-sm"></div>
        <span>Loading subjects...</span>
      </div>

      <div v-else-if="filteredSubjects.length === 0" class="empty-state">
        <div class="empty-state-icon">
          <i class="bi bi-inbox"></i>
        </div>
        <h5>No Subjects Found</h5>
        <p class="text-secondary">No subjects with active offerings available.</p>
      </div>

      <div v-else class="subjects-grid">
        <div
          v-for="subject in filteredSubjects"
          :key="subject.id"
          class="subject-card"
        >
          <div class="card-header" @click="goToSheet(subject)">
            <div class="card-icon" :class="getSubjectColor(subject.code || '')">
              <i class="bi bi-book"></i>
            </div>
            <div class="card-info">
              <h4 class="card-title">{{ subject.name }}</h4>
              <span class="card-code">{{ subject.code }}</span>
            </div>
            <i class="bi bi-chevron-right card-arrow"></i>
          </div>
          <div class="card-body">
            <div
              v-for="term in subject.terms"
              :key="term.term_id"
              class="term-chip"
              :class="{ 'term-active': selectedTermId && selectedTermId === term.term_id }"
              @click="goToSheetWithTerm(subject, term)"
            >
              <span class="term-name">{{ term.term_name }}</span>
              <span class="term-meta">
                {{ term.enrollment_count }} students
                <template v-if="term.teachers.length"> · {{ term.teachers.join(', ') }}</template>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Header from '@/layouts/Header.vue'
import { getSpreadsheetSubjects, type SubjectItem } from '@/services/scoreService'

const router = useRouter()

const subjects = ref<SubjectItem[]>([])
const terms = ref<Array<{ id: number; name: string }>>([])
const selectedTermId = ref<number | ''>('')
const loading = ref(false)

const filteredSubjects = computed(() => {
  if (!selectedTermId.value) return subjects.value
  return subjects.value.filter(
    (s) => s.terms.some((t) => t.term_id === selectedTermId.value)
  )
})

function goToSheet(subject: SubjectItem) {
  // Go to the first term available
  if (subject.terms.length > 0) {
    const firstTerm = subject.terms[0]
    if (firstTerm) {
      goToSheetWithTerm(subject, firstTerm)
    }
  }
}

function goToSheetWithTerm(subject: SubjectItem, term: SubjectItem['terms'][number]) {
  router.push(`/scores/subject/${subject.id}/term/${term.term_id}`)
}

async function loadSubjects() {
  loading.value = true
  try {
    const data = await getSpreadsheetSubjects()
    subjects.value = data.subjects
    terms.value = data.terms
  } catch (err) {
    console.error('Failed to load subjects:', err)
  } finally {
    loading.value = false
  }
}

function getSubjectColor(code: string): string {
  const colors = ['blue', 'green', 'purple', 'orange', 'red', 'teal']
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

onMounted(loadSubjects)
</script>

<style scoped>
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.page-header-left { display: flex; align-items: center; gap: 14px; }

.page-header-icon {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #eef2ff, #dbeafe);
  color: #2563eb; border-radius: 12px; font-size: 1.2rem; flex-shrink: 0;
}

.page-title { font-size: 1.35rem; font-weight: 700; color: #0f172a; margin-bottom: 2px; letter-spacing: -0.02em; }
.page-subtitle { font-size: 0.8125rem; color: #64748b; margin: 0; font-weight: 400; }

.term-select {
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.8125rem;
  background: #fff;
  color: #1e293b;
  outline: none;
  min-width: 160px;
  cursor: pointer;
}
.term-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.subject-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.2s;
}
.subject-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 12px rgba(59,130,246,0.1);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 16px 12px;
  cursor: pointer;
}

.card-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 1rem; flex-shrink: 0;
}
.card-icon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.card-icon.green { background: linear-gradient(135deg, #22c55e, #16a34a); }
.card-icon.purple { background: linear-gradient(135deg, #a855f7, #7c3aed); }
.card-icon.orange { background: linear-gradient(135deg, #f97316, #ea580c); }
.card-icon.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
.card-icon.teal { background: linear-gradient(135deg, #14b8a6, #0d9488); }

.card-info { flex: 1; min-width: 0; }
.card-title { font-size: 0.9375rem; font-weight: 700; color: #0f172a; margin: 0 0 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-code { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
.card-arrow { color: #cbd5e1; font-size: 0.875rem; margin-top: 4px; }

.card-body {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.term-chip {
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.term-chip:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}
.term-chip.term-active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.term-name { font-size: 0.8125rem; font-weight: 600; color: #0f172a; }
.term-meta { font-size: 0.75rem; color: #64748b; }

.loading-state {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 3rem; color: #64748b;
}

.spinner-sm {
  width: 20px; height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 4rem 2rem; text-align: center;
  background: #f8fafc; border-radius: 16px; border: 1.5px dashed #e2e8f0;
}
.empty-state-icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: #eef2ff; color: #2563eb;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; margin-bottom: 1rem;
}
.empty-state h5 { font-weight: 700; color: #0f172a; margin-bottom: 0.25rem; }
.empty-state p { font-size: 0.875rem; }
</style>
