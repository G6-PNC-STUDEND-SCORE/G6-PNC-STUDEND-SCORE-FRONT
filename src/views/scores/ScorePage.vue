<template>
  <div>
    <div class="px-4 py-4">
      <div class="page-header">
        <h2 class="page-title">Score Sheet</h2>
      </div>

      <!-- Terms Grid -->
      <div v-if="loading" class="loading-state">
        <div class="spinner-sm"></div>
        <span>Loading terms...</span>
      </div>

      <div v-else-if="terms.length === 0" class="empty-state">
        <div class="empty-state-icon">
          <Inbox :size="24" />
        </div>
        <h5>No Terms Found</h5>
        <p class="text-secondary">No terms available.</p>
      </div>

      <div v-else class="terms-grid">
        <div
          v-for="term in terms"
          :key="term.id"
          class="term-card"
          @click="goToTermSubjects(term.id)"
        >
          <div class="term-card-icon">
            <Calendar :size="22" />
          </div>
          <div class="term-card-info">
            <h3 class="term-name">{{ term.name }}</h3>
            <p class="term-subtitle">Click to view subjects</p>
          </div>
          <ChevronRight :size="18" class="term-arrow" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Header from '@/layouts/Header.vue'
import { getSpreadsheetSubjects, type SubjectItem } from '@/services/scoreService'
import { cacheService } from '@/services/cacheService'
import { Inbox, Calendar, ChevronRight } from '@lucide/vue'

const CACHE_KEY = 'scores-subjects'

const router = useRouter()

const terms = ref<Array<{ id: number; name: string }>>([])
const loading = ref(false)

function goToTermSubjects(termId: number) {
  router.push(`/scores/term/${termId}`)
}

function extractTerms(data: { subjects: SubjectItem[] }) {
  const termsMap = new Map<number, { id: number; name: string }>()
  data.subjects.forEach((subject: SubjectItem) => {
    subject.terms.forEach((term) => {
      if (!termsMap.has(term.term_id)) {
        termsMap.set(term.term_id, {
          id: term.term_id,
          name: term.term_name,
        })
      }
    })
  })
  terms.value = Array.from(termsMap.values()).sort((a, b) => a.id - b.id)
}

async function loadSubjects() {
  try {
    const data = await getSpreadsheetSubjects()
    extractTerms(data)
    cacheService.set(CACHE_KEY, data, 24 * 60 * 60_000) // cache 24h
  } catch (err) {
    console.error('Failed to load terms:', err)
  }
}

onMounted(async () => {
  // 1. Show cached data INSTANTLY
  const cached = cacheService.get<{ subjects: SubjectItem[] }>(CACHE_KEY)
  if (cached) {
    extractTerms(cached)
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
.page-subtitle { font-size: 0.8125rem; color: #64748b; margin: 0; font-weight: 400; }

.terms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.term-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.term-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 12px rgba(59,130,246,0.1);
  transform: translateY(-2px);
}

.term-card-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #2563eb;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.term-card-info { flex: 1; min-width: 0; }

.term-name { 
  font-size: 1rem; 
  font-weight: 700; 
  color: #0f172a; 
  margin: 0 0 4px 0;
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}

.term-subtitle { 
  font-size: 0.8125rem; 
  color: #64748b; 
  margin: 0;
  font-weight: 400;
}

.term-arrow {
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
