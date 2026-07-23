<template>
  <div :class="['page-container', { 'dark-mode': theme.isDark }]">
    <!-- ── Header ── -->
    <div class="page-head">
      <div class="page-head-left">
        <div class="page-head-icon">
          <BookOpen :size="22" />
        </div>
        <div>
          <h1 class="page-title">{{ selectedTermName }}</h1>
          <p class="page-desc">
            <template v-if="className">
              Subjects for <strong>{{ className }}</strong>
            </template>
            <template v-else>
              Select a subject to view scores
            </template>
          </p>
        </div>
      </div>
      <div class="page-head-right">
        <span v-if="className" class="head-badge">
          <School :size="14" />
          {{ className }}
        </span>
        <button class="btn-back" @click="goBack">
          <ArrowLeft :size="16" />
          <span>Back</span>
        </button>
      </div>
    </div>

    <!-- ── Loading --->
    <div v-if="loading" class="load-state">
      <div class="spinner"></div>
      <span>Loading subjects…</span>
    </div>

    <template v-else>
      <div class="scores-card">
        <!-- ── Toolbar ── -->
        <div class="term-toolbar" v-if="filteredSubjects.length > 0 || showAllClasses">
          <div class="tb-left">
            <button
              class="class-filter-btn"
              :class="{ active: showAllClasses }"
              @click="showAllClasses = !showAllClasses"
              :title="showAllClasses ? 'Filter by current class' : 'Show all classes'"
            >
              <School :size="14" />
              <span>{{ showAllClasses ? 'All Classes' : className || 'All Classes' }}</span>
            </button>
            <span class="tb-result-count">{{ filteredSubjects.length }} subject{{ filteredSubjects.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="sort-toggle">
            <span class="sort-label">Sort</span>
            <button
              class="sort-btn"
              :class="{ 'sort-btn-active': subjectSortMode === 'enrollment' }"
              @click="subjectSortMode = 'enrollment'"
              title="Sort by enrollment count"
            >
              <Users :size="14" />
              <span>Students</span>
            </button>
            <button
              class="sort-btn"
              :class="{ 'sort-btn-active': subjectSortMode === 'alphabetical' }"
              @click="subjectSortMode = 'alphabetical'"
              title="Sort alphabetically"
            >
              <ArrowUpDown :size="14" />
              <span>A–Z</span>
            </button>
          </div>
        </div>

        <!-- ── Empty State ── -->
        <div v-if="filteredSubjects.length === 0" class="empty-state">
          <div class="empty-state-icon"><Inbox :size="24" /></div>
          <h5>No Subjects Found</h5>
          <p class="text-secondary">No subjects with active offerings for this term.</p>
        </div>

        <!-- ── Subjects Grid ── -->
        <div v-else class="subjects-grid">
          <div
            v-for="subject in sortedSubjects"
            :key="subject.id"
            class="subject-card"
            @click="goToScoreSheet(subject)"
          >
            <div class="subj-card-left">
              <div class="subj-icon" :style="{ background: getSubjectGradient(subject.code || '') }">
                <BookOpen :size="16" />
              </div>
            </div>
            <div class="subj-card-body">
              <h4 class="subj-name">{{ subject.name }}</h4>
              <div class="subj-meta-row">
                <span class="subj-code">{{ subject.code }}</span>
                <span class="subj-dot">·</span>
                <span class="subj-enrollment">
                  <Users :size="11" />
                  {{ getSubjectEnrollmentCount(subject) }} students
                </span>
              </div>
            </div>
            <div class="subj-card-right">
              <ChevronRight :size="16" class="subj-arrow" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
const theme = useThemeStore()
import { useRouter, useRoute } from 'vue-router'
import { getSpreadsheetSubjects, type SubjectItem } from '@/services/scoreService'
import { cacheService } from '@/services/cacheService'
import {
  ArrowLeft, Inbox, BookOpen, ChevronRight,
  Users, School, ArrowUpDown,
} from '@lucide/vue'

const CACHE_KEY = 'scores-subjects'

const router = useRouter()
const route = useRoute()

const subjects = ref<SubjectItem[]>([])
const terms = ref<Array<{ id: number; name: string }>>([])
const loading = ref(false)
const showAllClasses = ref(false)

const termId = computed(() => Number(route.params.termId))
const classId = computed(() => route.query.class_id ? Number(route.query.class_id) : null)
const className = computed(() => (route.query.class_name as string) || '')

// ── Sort State ─────────────────────────────────────────────────────
type SortMode = 'enrollment' | 'alphabetical'
const subjectSortMode = ref<SortMode>('enrollment')

const selectedTermName = computed(() => {
  const term = terms.value.find(t => t.id === termId.value)
  return term?.name ?? 'Term'
})

const filteredSubjects = computed(() => {
  let result = subjects.value

  // Filter by term
  if (termId.value) {
    result = result.filter((s) => s.terms.some((t) => t.term_id === termId.value))
  }

  // Filter by class
  if (!showAllClasses.value && classId.value && className.value) {
    result = result.filter((s) => {
      const term = s.terms.find((t) => t.term_id === termId.value)
      if (!term) return false
      return term.classes.some((c: string) => c === className.value)
    })
  }

  return result
})



const sortedSubjects = computed(() => {
  const sorted = [...filteredSubjects.value]
  if (subjectSortMode.value === 'enrollment') {
    sorted.sort((a, b) => {
      const termA = a.terms.find((t) => t.term_id === termId.value)
      const termB = b.terms.find((t) => t.term_id === termId.value)
      return (termB?.enrollment_count ?? 0) - (termA?.enrollment_count ?? 0)
    })
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name))
  }
  return sorted
})

function getSubjectEnrollmentCount(subject: SubjectItem): number {
  const term = subject.terms.find(t => t.term_id === termId.value)
  return term?.enrollment_count || 0
}

function getSubjectGradient(code: string): string {
  const gradients = [
    'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    'linear-gradient(135deg, #22c55e, #16a34a)',
    'linear-gradient(135deg, #a855f7, #7c3aed)',
    'linear-gradient(135deg, #f97316, #ea580c)',
    'linear-gradient(135deg, #ef4444, #dc2626)',
    'linear-gradient(135deg, #14b8a6, #0d9488)',
    'linear-gradient(135deg, #eab308, #ca8a04)',
    'linear-gradient(135deg, #ec4899, #db2777)',
  ]
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function goToScoreSheet(subject: SubjectItem) {
  const query: Record<string, string> = {}
  if (classId.value) {
    query.class_id = String(classId.value)
    query.class_name = className.value
  }
  router.push({
    path: `/scores/subject/${subject.id}/term/${termId.value}`,
    query,
  })
}

function goBack() {
  const query: Record<string, string> = {}
  if (classId.value) {
    query.class_id = String(classId.value)
    query.class_name = className.value
  }
  router.push({ path: '/scores', query })
}

async function loadSubjects() {
  try {
    const data = await getSpreadsheetSubjects()
    subjects.value = data.subjects
    terms.value = data.terms ?? []
    cacheService.set(CACHE_KEY, data, 24 * 60 * 60_000)
  } catch (err) {
    console.error('Failed to load subjects:', err)
  }
}

onMounted(async () => {
  const cached = cacheService.get<{ subjects: SubjectItem[]; terms: Array<{ id: number; name: string }> }>(CACHE_KEY)
  if (cached) {
    subjects.value = cached.subjects
    terms.value = cached.terms ?? []
  } else {
    loading.value = true
  }
  await loadSubjects()
  loading.value = false
})
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   GLOBAL
   ══════════════════════════════════════════════════════════════ */
.page-container {
  padding: 1rem 1.5rem 2rem;
  font-family: 'Inter', 'Noto Sans Khmer', system-ui, sans-serif;
  color: #0f172a;
}

/* ══════════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════════ */
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  gap: 16px;
  flex-wrap: wrap;
}

.page-head-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-head-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
}

.page-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 2px;
  letter-spacing: -0.025em;
  color: #0f172a;
}

.page-desc {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.page-desc strong {
  color: #1e293b;
}

.page-head-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.head-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 8px;
  white-space: nowrap;
  border: 1px solid #dbeafe;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  color: #475569;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.btn-back:hover {
  background: #f8fafc;
  border-color: #93c5fd;
  color: #2563eb;
}

/* ══════════════════════════════════════════════════════════════
   LOADING
   ══════════════════════════════════════════════════════════════ */
.load-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 4rem;
  color: #64748b;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════════════════════════
   SCORES CARD — matches UsersPage .user-card style
   ══════════════════════════════════════════════════════════════ */
.scores-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.25s ease;
}

.scores-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

/* ══════════════════════════════════════════════════════════════
   TOOLBAR + SORT TOGGLE
   ══════════════════════════════════════════════════════════════ */
.term-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e9ecef;
}

.tb-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tb-result-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.class-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  white-space: nowrap;
}

.class-filter-btn:hover {
  border-color: #93c5fd;
  color: #2563eb;
  background: #f8faff;
}

.class-filter-btn.active {
  background: #eff6ff;
  border-color: #2563eb;
  color: #2563eb;
}

.class-filter-btn svg { color: currentColor; }

.sort-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  background: #f1f5f9;
  border-radius: 8px;
}

.sort-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #94a3b8;
  padding: 0 6px;
}

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.sort-btn:hover { color: #1e293b; }

.sort-btn-active {
  background: #fff;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.sort-btn-active:hover { color: #1d4ed8; }

/* ══════════════════════════════════════════════════════════════
   SUBJECTS GRID
   ══════════════════════════════════════════════════════════════ */
.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
  padding: 12px;
}

.subject-card {
  background: #fff;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.subject-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.08);
  transform: translateX(2px);
}

.subject-card:active {
  transform: translateX(1px);
}

.subj-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.subj-card-body {
  flex: 1;
  min-width: 0;
}

.subj-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subj-meta-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.subj-code {
  font-size: 0.62rem;
  font-weight: 600;
  color: #94a3b8;
  padding: 1px 5px;
  background: #f1f5f9;
  border-radius: 3px;
}

.subj-dot {
  color: #cbd5e1;
  font-size: 0.6rem;
  display: none;
}

.subj-enrollment {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.65rem;
  font-weight: 500;
  color: #64748b;
}

.subj-enrollment svg {
  color: #94a3b8;
}

.subj-card-right {
  flex-shrink: 0;
}

.subj-arrow {
  color: #cbd5e1;
  transition: transform 0.2s ease, color 0.2s ease;
}

.subject-card:hover .subj-arrow {
  color: #2563eb;
  transform: translateX(2px);
}

/* ══════════════════════════════════════════════════════════════
   EMPTY STATE — simple, like UsersPage
   ══════════════════════════════════════════════════════════════ */
.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: #9ca3af;
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.empty-state h5 {
  font-weight: 600;
  color: #64748b;
  margin: 0 0 4px 0;
  font-size: 1rem;
}

.empty-state p {
  font-size: 0.8125rem;
  margin: 0;
}

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .page-container { padding: 0.75rem 1rem; }
  .page-head { flex-direction: column; align-items: flex-start; }
  .page-head-right { width: 100%; }
  .subjects-grid { grid-template-columns: 1fr; }
}

/* ══════════════════════════════════════════════════════════════
   DARK MODE
   ══════════════════════════════════════════════════════════════ */
.dark-mode .page-container {
  color: #e2e8f0;
}
.dark-mode .page-title {
  color: #f1f5f9;
}
.dark-mode .page-desc {
  color: #94a3b8;
}
.dark-mode .page-desc strong {
  color: #e2e8f0;
}
.dark-mode .page-head-icon {
  background: linear-gradient(135deg, #1e3a5f, #1e40af);
  color: #60a5fa;
  box-shadow: 0 2px 8px rgba(59,130,246,0.15);
}
.dark-mode .head-badge {
  background: #1e3a5f;
  color: #60a5fa;
  border-color: #1e40af;
}
.dark-mode .btn-back {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}
.dark-mode .btn-back:hover {
  background: #334155;
  border-color: #3b82f6;
  color: #60a5fa;
}
.dark-mode .load-state {
  color: #94a3b8;
}
.dark-mode .spinner {
  border-color: #334155;
  border-top-color: #60a5fa;
}
.dark-mode .scores-card {
  background: #1e293b;
  border-color: #334155;
}
.dark-mode .scores-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.dark-mode .term-toolbar {
  background: #1e293b;
  border-bottom-color: #334155;
}
.dark-mode .tb-result-count {
  color: #64748b;
}
.dark-mode .class-filter-btn {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}
.dark-mode .class-filter-btn:hover {
  border-color: #3b82f6;
  color: #60a5fa;
  background: #1e3a5f;
}
.dark-mode .class-filter-btn.active {
  background: #1e3a5f;
  border-color: #3b82f6;
  color: #60a5fa;
}
.dark-mode .sort-toggle {
  background: #0f172a;
}
.dark-mode .sort-label {
  color: #64748b;
}
.dark-mode .sort-btn {
  color: #64748b;
}
.dark-mode .sort-btn:hover {
  color: #cbd5e1;
}
.dark-mode .sort-btn-active {
  background: #1e293b;
  color: #60a5fa;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.dark-mode .sort-btn-active:hover {
  color: #93c5fd;
}
.dark-mode .subject-card {
  background: #0f172a;
  border-color: #334155;
}
.dark-mode .subject-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 3px 10px rgba(59,130,246,0.15);
}
.dark-mode .subj-name {
  color: #f1f5f9;
}
.dark-mode .subj-code {
  background: #334155;
  color: #64748b;
}
.dark-mode .subj-dot {
  color: #475569;
}
.dark-mode .subj-enrollment {
  color: #94a3b8;
}
.dark-mode .subj-enrollment svg {
  color: #64748b;
}
.dark-mode .subj-arrow {
  color: #475569;
}
.dark-mode .subject-card:hover .subj-arrow {
  color: #60a5fa;
}
.dark-mode .empty-state {
  color: #64748b;
}
.dark-mode .empty-state-icon {
  background: #334155;
  color: #64748b;
}
.dark-mode .empty-state h5 {
  color: #94a3b8;
}
.dark-mode .empty-state p {
  color: #64748b;
}
</style>
