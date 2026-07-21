<template>
  <div class="page-container">




      <!-- ── Loading State ───────────────────────────────────────── -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>{{ !selectedClass ? 'Loading classes...' : 'Loading terms...' }}</span>
      </div>

      <template v-else>
        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- CLASS GRID                                                 -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <template v-if="!selectedClass">
          <div class="scores-card">
            <!-- Toolbar: Search + Filter + Stats -->
            <div class="toolbar" v-if="classes.length > 0">
              <div class="toolbar-left">
                <div class="tb-search">
                  <Search :size="16" />
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search classes..."
                  />
                  <button v-if="searchQuery" class="tb-clear" @click="searchQuery = ''">
                    <X :size="14" />
                  </button>
                </div>
              </div>
              <div class="toolbar-right">
                <div class="tb-filter" v-if="classGenerations.length > 0">
                  <select v-model="selectedGenerationFilter">
                    <option :value="null">All Generations</option>
                    <option
                      v-for="gen in classGenerations"
                      :key="gen"
                      :value="gen"
                    >
                      {{ gen }}
                    </option>
                  </select>
                </div>
                <div class="stat-chip" v-if="filteredClasses.length > 0">
                  <Users :size="14" />
                  <span>{{ filteredClasses.length }} Class{{ filteredClasses.length !== 1 ? 'es' : '' }}</span>
                </div>
                <div class="stat-chip" v-if="classGenerations.length > 0">
                  <GraduationCap :size="14" />
                  <span>{{ classGenerations.length }} Generation{{ classGenerations.length !== 1 ? 's' : '' }}</span>
                </div>
                <div class="stat-chip" v-if="filteredTotalStudents > 0">
                  <Users :size="14" />
                  <span>{{ filteredTotalStudents }} Student{{ filteredTotalStudents !== 1 ? 's' : '' }}</span>
                </div>
              </div>
            </div>

            <div v-if="filteredClasses.length === 0 && !loadingClasses" class="empty-state">
              <div class="empty-state-icon"><Inbox :size="24" /></div>
              <h5 v-if="searchQuery || selectedGenerationFilter">No Matching Classes</h5>
              <h5 v-else>No Classes Found</h5>
              <p class="text-secondary" v-if="searchQuery">Try a different search term.</p>
              <p class="text-secondary" v-else-if="selectedGenerationFilter">No classes found for this generation.</p>
              <p class="text-secondary" v-else>No classes are available. Please create a class first.</p>
            </div>

            <div v-else class="classes-grid">
              <div
                v-for="cls in filteredClasses"
                :key="cls.id"
                class="class-card"
                :style="{ '--card-accent': getClassAccentColor(cls) }"
                @click="selectClass(cls)"
              >
                <div class="class-card-top">
                  <div class="class-card-icon" :style="{ background: getClassGradient(cls) }">
                    <Users :size="22" />
                  </div>
                  <div class="class-card-badge" v-if="cls.room">{{ cls.room }}</div>
                </div>
                <div class="class-card-body">
                  <h3 class="class-card-name">{{ cls.name }}</h3>
                  <p class="class-card-desc" v-if="cls.description">{{ cls.description }}</p>
                </div>
                <div class="class-card-footer">
                  <div class="class-card-stat" v-if="cls.students !== undefined && cls.students !== null">
                    <Users :size="12" />
                    <span>{{ cls.students }} students</span>
                  </div>
                  <div class="class-card-stat" v-else>
                    <Calendar :size="12" />
                    <span>{{ cls.generation?.name || 'Current' }}</span>
                  </div>
                  <div class="class-card-arrow"><ChevronRight :size="16" /></div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- TERMS WITH SUBJECTS                                        -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <template v-else>
          <div class="scores-card">
            <!-- ── Breadcrumb inside card ── -->
            <div class="terms-header">
              <button class="terms-back" @click="selectClass(null)">
                <ChevronLeft :size="15" />
                <span>All Classes</span>
              </button>
              <ChevronRight :size="12" class="terms-sep" />
              <span class="terms-current">
                <School :size="13" />
                {{ selectedClass.name }}
              </span>
            </div>

            <!-- Toolbar: Generation Filter + Sort Toggle -->
            <div class="term-toolbar">
              <div class="toolbar-left">
                <div class="tb-filter" v-if="generations.length > 0">
                  <select v-model="selectedGeneration">
                    <option :value="null">All Years</option>
                    <option
                      v-for="gen in generations"
                      :key="gen"
                      :value="gen"
                    >
                      {{ gen }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="toolbar-right">
                <div class="sort-toggle">
                  <span class="sort-label">Sort by</span>
                  <button
                    class="sort-btn"
                    :class="{ 'sort-btn-active': subjectSortMode === 'enrollment' }"
                    @click="subjectSortMode = 'enrollment'"
                    title="Sort by number of enrolled students"
                  >
                    <Users :size="14" />
                    <span>Students</span>
                  </button>
                  <button
                    class="sort-btn"
                    :class="{ 'sort-btn-active': subjectSortMode === 'alphabetical' }"
                    @click="subjectSortMode = 'alphabetical'"
                    title="Sort alphabetically by name"
                  >
                    <ArrowUpDown :size="14" />
                    <span>A–Z</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Term Cards with Subjects -->
            <div v-if="filteredTerms.length === 0" class="empty-state">
              <div class="empty-state-icon"><Inbox :size="24" /></div>
              <h5>No Terms Found</h5>
              <p class="text-secondary">No terms available for {{ selectedClass.name }} in this generation.</p>
            </div>

            <div v-else class="term-sections">
              <div
                v-for="term in filteredTerms"
                :key="term.id"
                class="term-section"
              >
                <!-- Term Header -->
                <div class="term-section-header" @click="goToTermSubjects(term.id)">
                  <div class="term-section-header-left">
                    <div class="term-section-icon">
                      <Calendar :size="20" />
                    </div>
                    <div>
                      <h3 class="term-section-name">{{ term.name }}</h3>
                      <span class="term-section-count">
                        {{ getTermSubjects(term.id).length }} subject{{ getTermSubjects(term.id).length !== 1 ? 's' : '' }}
                      </span>
                    </div>
                  </div>
                  <div class="term-section-header-right">
                    <span class="term-year-badge">{{ term.academic_year }}</span>
                    <ChevronRight :size="18" class="term-section-arrow" />
                  </div>
                </div>

                <!-- Subject Chips -->
                <div class="subject-chips" v-if="getTermSubjects(term.id).length > 0">
                  <div
                    v-for="subject in getTermSubjects(term.id)"
                    :key="subject.id"
                    class="subject-chip"
                    :style="{ '--chip-color': getSubjectColor(subject.code || '') }"
                    @click.stop="goToScoreSheet(subject, term.id)"
                    :title="`View ${subject.name} scores`"
                  >
                    <BookOpen :size="14" />
                    <span class="subject-chip-name">{{ subject.name }}</span>
                    <span class="subject-chip-code">{{ subject.code }}</span>
                    <span class="subject-chip-count" v-if="getSubjectEnrollmentCount(subject, term.id) > 0">
                      {{ getSubjectEnrollmentCount(subject, term.id) }}
                    </span>
                  </div>
                </div>

                <div v-else class="no-subjects-note">
                  <BookOpen :size="12" />
                  <span>No subjects for this term</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSpreadsheetSubjects, type SubjectItem } from '@/services/scoreService'
import { classService, type SchoolClass } from '@/services/classService'
import { cacheService } from '@/services/cacheService'
import {
  Inbox, Calendar, ChevronRight, ChevronLeft,
  GraduationCap, School, Users, BookOpen, ArrowUpDown,
  Search, X,
} from '@lucide/vue'

const CACHE_KEY = 'scores-subjects'

const router = useRouter()

// ── Core Data ───────────────────────────────────────────────────────
const subjectsData = ref<SubjectItem[]>([])
const terms = ref<Array<{ id: number; name: string; academic_year: string | number | null }>>([])
const loading = ref(false)
const selectedGeneration = ref<string | number | null>(null)

// ── Class State ─────────────────────────────────────────────────────
const classes = ref<SchoolClass[]>([])
const loadingClasses = ref(false)
const selectedClass = ref<SchoolClass | null>(null)

// ── Class-level Filters ────────────────────────────────────────────
const searchQuery = ref('')
const selectedGenerationFilter = ref<string | number | null>(null)

const classGenerations = computed(() => {
  const genSet = new Set<string>()
  classes.value.forEach((cls) => {
    const name = cls.generation?.name
    if (name) genSet.add(String(name))
  })
  return Array.from(genSet).sort((a, b) => Number(a) - Number(b))
})

const filteredClasses = computed(() => {
  let list = classes.value
  // Filter by search query
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((c) => c.name.toLowerCase().includes(q))
  }
  // Filter by generation
  if (selectedGenerationFilter.value !== null) {
    list = list.filter((c) => String(c.generation?.name) === String(selectedGenerationFilter.value))
  }
  return list
})

const filteredTotalStudents = computed(() => {
  return filteredClasses.value.reduce((sum, cls) => sum + (cls.students ?? 0), 0)
})

function getClassGradient(cls: SchoolClass): string {
  // SubjectPage-style blue gradients (ts-1 through ts-4)
  const gradients = [
    'linear-gradient(135deg, #2563eb, #1d4ed8)',
    'linear-gradient(135deg, #3b82f6, #2563eb)',
    'linear-gradient(135deg, #60a5fa, #3b82f6)',
    'linear-gradient(135deg, #93c5fd, #60a5fa)',
    'linear-gradient(135deg, #1d4ed8, #1e40af)',
    'linear-gradient(135deg, #2563eb, #3b82f6)',
    'linear-gradient(135deg, #3b82f6, #60a5fa)',
    'linear-gradient(135deg, #60a5fa, #93c5fd)',
  ]
  let hash = 0
  for (let i = 0; i < cls.name.length; i++) {
    hash = cls.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

function getClassAccentColor(cls: SchoolClass): string {
  const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa']
  let hash = 0
  for (let i = 0; i < cls.name.length; i++) {
    hash = cls.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getSubjectColor(code: string): string {
  const colors = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444', '#14b8a6', '#eab308', '#ec4898']
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// ── Sort State ─────────────────────────────────────────────────────
type SortMode = 'enrollment' | 'alphabetical'
const subjectSortMode = ref<SortMode>('enrollment')

// ── Subject helpers ─────────────────────────────────────────────────
function getTermSubjects(termId: number): SubjectItem[] {
  const className = selectedClass.value?.name
  if (!className) return []

  const filtered = subjectsData.value.filter((subject) => {
    const term = subject.terms.find((t) => t.term_id === termId)
    if (!term) return false
    // Check that this subject's offering for this term includes the selected class
    return term.classes.some((c) => c === className)
  })

  // Sort based on current mode
  const sorted = [...filtered]
  if (subjectSortMode.value === 'enrollment') {
    sorted.sort((a, b) => {
      const termA = a.terms.find((t) => t.term_id === termId)
      const termB = b.terms.find((t) => t.term_id === termId)
      const countA = termA?.enrollment_count ?? 0
      const countB = termB?.enrollment_count ?? 0
      return countB - countA // descending: most students first
    })
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name))
  }

  return sorted
}

function getSubjectEnrollmentCount(subject: SubjectItem, termId: number): number {
  const term = subject.terms.find((t) => t.term_id === termId)
  return term?.enrollment_count || 0
}

function goToScoreSheet(subject: SubjectItem, termId: number) {
  const query: Record<string, string> = {}
  if (selectedClass.value) {
    query.class_id = String(selectedClass.value.id)
    query.class_name = selectedClass.value.name
  }
  router.push({
    path: `/scores/subject/${subject.id}/term/${termId}`,
    query,
  })
}

// ── Data fetching ───────────────────────────────────────────────────
async function fetchClasses() {
  loadingClasses.value = true
  try {
    const response = await classService.getClasses()
    if (response.success) {
      const data = response.data
      const raw = Array.isArray(data) ? data : [data]
      // Only show active classes
      classes.value = raw.filter((c) => c.is_active !== false)
    }
  } catch (err) {
    console.error('Failed to load classes:', err)
  } finally {
    loadingClasses.value = false
  }
}

function selectClass(cls: SchoolClass | null) {
  selectedClass.value = cls
  selectedGeneration.value = null
  // Reset class-level filters when navigating into a class
  searchQuery.value = ''
  selectedGenerationFilter.value = null
}

const generations = computed(() => {
  const genSet = new Set<string | number>()
  terms.value.forEach((t) => {
    if (t.academic_year) genSet.add(t.academic_year)
  })
  return Array.from(genSet).sort((a, b) => Number(a) - Number(b))
})

const filteredTerms = computed(() => {
  const result = !selectedGeneration.value
    ? terms.value
    : terms.value.filter((t) => t.academic_year === selectedGeneration.value)
  return result
})

function goToTermSubjects(termId: number) {
  const query: Record<string, string> = {}
  if (selectedClass.value) {
    query.class_id = String(selectedClass.value.id)
    query.class_name = selectedClass.value.name
  }
  router.push({ path: `/scores/term/${termId}`, query })
}

function extractData(data: { subjects: SubjectItem[] }) {
  subjectsData.value = data.subjects

  // Extract unique terms
  const termsMap = new Map<number, { id: number; name: string; academic_year: string | number | null }>()
  data.subjects.forEach((subject: SubjectItem) => {
    subject.terms.forEach((term) => {
      if (!termsMap.has(term.term_id)) {
        termsMap.set(term.term_id, {
          id: term.term_id,
          name: term.term_name,
          academic_year: term.academic_year ?? null,
        })
      }
    })
  })
  terms.value = Array.from(termsMap.values()).sort((a, b) => a.id - b.id)

  // Auto-select the latest generation
  if (!selectedGeneration.value && generations.value.length > 0) {
    selectedGeneration.value = generations.value[generations.value.length - 1]
  }
}

async function loadSubjects() {
  try {
    const data = await getSpreadsheetSubjects()
    extractData(data)
    cacheService.set(CACHE_KEY, data, 24 * 60 * 60_000)
  } catch (err) {
    console.error('Failed to load subjects:', err)
  }
}

onMounted(async () => {
  // 1. Show cached data instantly
  const cached = cacheService.get<{ subjects: SubjectItem[] }>(CACHE_KEY)
  if (cached) {
    extractData(cached)
  } else {
    loading.value = true
  }
  // 2. Fetch fresh data in background
  await Promise.all([fetchClasses(), loadSubjects()])
  loading.value = false
})
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════════
   SCORE PAGE — Consistent with SubjectPage / ClassPage
   ══════════════════════════════════════════════════════════════════ */
.page-container {
  padding: 1rem 1.5rem 2rem;
  font-family: 'Inter', 'Noto Sans Khmer', system-ui, sans-serif;
  color: #0f172a;
  max-width: 1440px;
}

/* ── Terms Header (breadcrumb inside card) ───────────────────────── */
.terms-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px 6px;
  font-size: 0.8125rem;
}

.terms-back {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.terms-back:hover {
  background: #f1f5f9;
  color: #2563eb;
}

.terms-sep {
  color: #cbd5e1;
  flex-shrink: 0;
}

.terms-current {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #2563eb;
  font-weight: 700;
  font-size: 0.82rem;
}

/* ── Stats Chip ───────────────────────────────────────────────────── */
.stat-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
}

.stat-chip svg { color: #3b82f6; }

/* ── Loading State ────────────────────────────────────────────────── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 4rem;
  color: #64748b;
}

.spinner {
  width: 30px; height: 30px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.spinner-sm {
  width: 16px; height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════════════════════════════ */
/*  SCORES CARD — matches UsersPage .user-card style                   */
/* ══════════════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════════════ */
/*  TOOLBAR — matches UsersPage .toolbar style                        */
/* ══════════════════════════════════════════════════════════════════ */
.toolbar,
.term-toolbar {
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

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.tb-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  height: 38px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  min-width: 200px;
  flex: 1;
  max-width: 320px;
  transition: border-color 0.2s;
}

.tb-search:focus-within {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
}

.tb-search svg {
  color: #94a3b8;
  flex-shrink: 0;
}

.tb-search input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  font-size: 0.85rem;
  color: #1e293b;
  font-family: inherit;
}

.tb-search input::placeholder {
  color: #94a3b8;
}

.tb-clear {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.tb-clear:hover {
  color: #64748b;
}

.tb-filter {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tb-filter select {
  height: 38px;
  padding: 0 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
  outline: none;
  font-family: inherit;
}

.tb-filter select:focus {
  border-color: #93c5fd;
}

/* ══════════════════════════════════════════════════════════════════ */
/*  CLASS CARDS                                                        */
/* ══════════════════════════════════════════════════════════════════ */
.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px;
}

.class-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.class-card:hover {
  border-color: var(--card-accent, #3b82f6);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.12);
  transform: translateY(-3px);
}

.class-card:active {
  transform: translateY(-1px) scale(0.99);
}

.class-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 18px 0;
}

.class-card-icon {
  width: 46px; height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.class-card-badge {
  padding: 3px 8px;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
}

.class-card-body { padding: 14px 18px; flex: 1; }

.class-card-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.class-card-desc {
  font-size: 0.78rem;
  color: #94a3b8;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.class-card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-top: 1px solid #f1f5f9;
}

.class-card-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 500;
  color: #94a3b8;
}

.class-card-stat svg { color: #64748b; }

.class-card-arrow {
  margin-left: auto;
  color: #cbd5e1;
  transition: transform 0.2s ease, color 0.2s ease;
}

.class-card:hover .class-card-arrow {
  color: var(--card-accent, #3b82f6);
  transform: translateX(3px);
}

/* ══════════════════════════════════════════════════════════════════ */
/*  TERM SECTIONS                                                      */
/* ══════════════════════════════════════════════════════════════════ */
.term-sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
}

.term-section {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.2s;
}

.term-section:hover {
  border-color: #93c5fd;
  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.06);
}

/* Term section header */
.term-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.term-section-header:hover {
  background: #f8fafc;
}

.term-section-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.term-section-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.term-section-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1px 0;
}

.term-section-count {
  font-size: 0.68rem;
  color: #94a3b8;
  font-weight: 500;
}

.term-section-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.term-year-badge {
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 5px;
  font-size: 0.65rem;
  font-weight: 600;
  color: #64748b;
}

.term-section-arrow {
  color: #cbd5e1;
  transition: transform 0.2s ease, color 0.2s ease;
}

.term-section-header:hover .term-section-arrow {
  color: #2563eb;
  transform: translateX(2px);
}

/* ══════════════════════════════════════════════════════════════════ */
/*  SORT TOGGLE                                                        */
/* ══════════════════════════════════════════════════════════════════ */
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

.sort-btn:hover {
  color: #1e293b;
}

.sort-btn-active {
  background: #fff;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.sort-btn-active:hover {
  color: #1d4ed8;
}

/* ══════════════════════════════════════════════════════════════════ */
/*  SUBJECT CHIPS                                                      */
/* ══════════════════════════════════════════════════════════════════ */
.subject-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 2px 14px 10px;
}

.subject-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.75rem;
  font-weight: 500;
  color: #334155;
  position: relative;
  overflow: hidden;
}

.subject-chip::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--chip-color, #3b82f6);
  border-radius: 0 2px 2px 0;
}

.subject-chip:hover {
  background: #fff;
  border-color: var(--chip-color, #3b82f6);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.subject-chip:active {
  transform: translateY(0);
}

.subject-chip svg {
  color: var(--chip-color, #3b82f6);
  flex-shrink: 0;
}

.subject-chip-name {
  font-weight: 600;
}

.subject-chip-code {
  font-size: 0.65rem;
  color: #94a3b8;
  padding: 1px 4px;
  background: #f1f5f9;
  border-radius: 3px;
}

.subject-chip-count {
  margin-left: 2px;
  padding: 1px 5px;
  background: #eef2ff;
  color: #2563eb;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: 700;
}

.no-subjects-note {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 14px 10px;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* ══════════════════════════════════════════════════════════════════ */
/*  EMPTY STATE — simple, like UsersPage                               */
/* ══════════════════════════════════════════════════════════════════ */
.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: #9ca3af;
}

.empty-state-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.empty-state h5 { font-weight: 600; color: #64748b; margin: 0 0 4px 0; font-size: 1rem; }
.empty-state p { font-size: 0.8125rem; margin: 0; }

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .page-container { padding: 0.75rem 1rem; }
}

@media (max-width: 640px) {
  .classes-grid { grid-template-columns: 1fr; }
}
</style>
