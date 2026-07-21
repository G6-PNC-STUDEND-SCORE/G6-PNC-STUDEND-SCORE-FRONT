<template>
  <div>
   
    <div class="px-4 py-4">
      <div class="page-header">
        <div class="page-header-left">
          <h2 class="page-title">{{ selectedTermName }}</h2>
        </div>
        <div class="page-header-right">
          <button class="btn-back" @click="goBack">
            <ArrowLeft :size="16" /> Back to Terms
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner-sm"></div>
        <span>Loading subjects...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredSubjects.length === 0" class="empty-state">
        <div class="empty-state-icon">
          <Inbox :size="24" />
        </div>
        <h5>No Subjects Found</h5>
        <p class="text-secondary">No subjects with active offerings for this term.</p>
      </div>

      <!-- Subjects Grid -->
      <div v-else class="subjects-grid">
        <div
          v-for="subject in filteredSubjects"
          :key="subject.id"
          class="subject-card"
          @click="goToScoreSheet(subject)"
        >
          <div class="card-icon" :class="getSubjectColor(subject.code || '')">
            <BookOpen :size="18" />
          </div>
          <div class="card-info">
            <h4 class="card-title">{{ subject.name }}</h4>
            <span class="card-code">{{ subject.code }}</span>
          </div>
          <div class="card-meta">
            <span class="students-count">
              {{ getSubjectEnrollmentCount(subject) }} students
            </span>
          </div>
          <ChevronRight :size="16" class="card-arrow" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getSpreadsheetSubjects, type SubjectItem } from '@/services/scoreService'
import { cacheService } from '@/services/cacheService'
import { ArrowLeft, Inbox, BookOpen, ChevronRight } from '@lucide/vue'

const CACHE_KEY = 'scores-subjects'

const router = useRouter()
const route = useRoute()

const subjects = ref<SubjectItem[]>([])
const terms = ref<Array<{ id: number; name: string }>>([])
const loading = ref(false)

const termId = computed(() => Number(route.params.termId))

const selectedTermName = computed(() => {
  const term = terms.value.find(t => t.id === termId.value)
  return term?.name ?? 'Term'
})

const filteredSubjects = computed(() => {
  if (!termId.value) return subjects.value
  return subjects.value.filter(
    (s) => s.terms.some((t) => t.term_id === termId.value)
  )
})

function getSubjectEnrollmentCount(subject: SubjectItem): number {
  const term = subject.terms.find(t => t.term_id === termId.value)
  return term?.enrollment_count || 0
}

function goToScoreSheet(subject: SubjectItem) {
  router.push(`/scores/subject/${subject.id}/term/${termId.value}`)
}

function goBack() {
  router.push('/scores')
}

async function loadSubjects() {
  try {
    const data = await getSpreadsheetSubjects()
    subjects.value = data.subjects
    terms.value = data.terms
    cacheService.set(CACHE_KEY, data, 24 * 60 * 60_000) // cache 24h
  } catch (err) {
    console.error('Failed to load subjects:', err)
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

onMounted(async () => {
  // 1. Show cached data INSTANTLY
  const cached = cacheService.get<{ subjects: SubjectItem[]; terms: Array<{ id: number; name: string }> }>(CACHE_KEY)
  if (cached) {
    subjects.value = cached.subjects
    terms.value = cached.terms ?? []
  } else {
    loading.value = true
  }
  // 2. Refresh from API in background (loading stays false if cache existed)
  await loadSubjects()
  loading.value = false
})
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

.page-header-right { display: flex; align-items: center; }

.btn-back {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #1e293b;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-back:hover {
  background: #f8fafc;
  border-color: #93c5fd;
  color: #2563eb;
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
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.subject-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 12px rgba(59,130,246,0.1);
  transform: translateX(4px);
}

.card-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.card-icon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.card-icon.green { background: linear-gradient(135deg, #22c55e, #16a34a); }
.card-icon.purple { background: linear-gradient(135deg, #a855f7, #7c3aed); }
.card-icon.orange { background: linear-gradient(135deg, #f97316, #ea580c); }
.card-icon.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
.card-icon.teal { background: linear-gradient(135deg, #14b8a6, #0d9488); }

.card-info { flex: 1; min-width: 0; }

.card-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-code {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.students-count {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 6px;
}

.card-arrow {
  color: #cbd5e1;
  flex-shrink: 0;
}

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
  margin-bottom: 1rem;
}
.empty-state h5 { font-weight: 700; color: #0f172a; margin-bottom: 0.25rem; }
.empty-state p { font-size: 0.875rem; }
</style>
