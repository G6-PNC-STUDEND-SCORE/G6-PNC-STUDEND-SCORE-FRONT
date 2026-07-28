<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content-panel" style="max-width: 580px;">
          <!-- Standard header matching system pattern -->
          <div class="modal-header-custom">
            <button class="modal-close-btn" @click="$emit('close')" aria-label="Close">
              <i class="bi bi-x-lg"></i>
            </button>
            <div class="modal-icon icon-create">
              <i class="bi bi-trophy"></i>
            </div>
            <div>
              <h5>Manage Grade Boundaries</h5>
              <p class="modal-subtitle">
                Define the percentage ranges for each grade level
              </p>
            </div>
          </div>

          <!-- Body -->
          <div class="modal-body-custom">
            <div v-if="loading" class="loading-container">
              <div class="mini-spinner"></div>
              <span>Loading grade boundaries...</span>
            </div>

            <div v-else-if="error" class="error-container">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <span>{{ error }}</span>
            </div>

            <template v-else>
              <div class="grade-boundary-list">
                <div
                  v-for="gb in sortedBoundaries"
                  :key="gb.id"
                  class="grade-boundary-row"
                  :class="{ 'boundary-inactive': !gb.is_active }"
                >
                  <div class="boundary-row-inner">
                    <!-- Grade badge -->
                    <div class="boundary-grade-badge" :style="{ background: gb.color || getDefaultColor(gb.grade) }">
                      {{ gb.grade }}
                    </div>

                    <!-- Range controls -->
                    <div class="boundary-range-section">
                      <div class="range-input-group">
                        <label class="range-label">Min</label>
                        <div class="range-input-wrap">
                          <input
                            v-model.number="edits[gb.id].min_percent"
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            class="modern-input range-input"
                            @input="validateRange(gb.id)"
                          />
                          <span class="input-suffix">%</span>
                        </div>
                      </div>

                      <div class="range-track-wrap">
                        <div class="range-track">
                          <div
                            class="range-track-fill"
                            :style="{
                              left: (edits[gb.id]?.min_percent ?? gb.min_percent) + '%',
                              width: ((edits[gb.id]?.max_percent ?? gb.max_percent) - (edits[gb.id]?.min_percent ?? gb.min_percent)) + '%',
                              background: gb.color || getDefaultColor(gb.grade)
                            }"
                          ></div>
                        </div>
                      </div>

                      <div class="range-input-group">
                        <label class="range-label">Max</label>
                        <div class="range-input-wrap">
                          <input
                            v-model.number="edits[gb.id].max_percent"
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            class="modern-input range-input"
                            @input="validateRange(gb.id)"
                          />
                          <span class="input-suffix">%</span>
                        </div>
                      </div>
                    </div>

                    <!-- Toggle -->
                    <div class="boundary-toggle" @click="toggleActive(gb.id)" :title="edits[gb.id].is_active ? 'Active' : 'Inactive'">
                      <div class="toggle-switch" :class="{ 'toggle-on': edits[gb.id].is_active }">
                        <div class="toggle-knob"></div>
                      </div>
                    </div>
                  </div>

                  <!-- Error -->
                  <Transition name="error-slide">
                    <div v-if="rangeErrors[gb.id]" class="boundary-error">
                      <i class="bi bi-exclamation-circle-fill"></i>
                      {{ rangeErrors[gb.id] }}
                    </div>
                  </Transition>
                </div>
              </div>

              <!-- Info box -->
              <div class="grade-boundary-info">
                <i class="bi bi-info-circle-fill"></i>
                <span>
                  Grade boundaries map total weighted scores to letter grades. Only <strong>active</strong> boundaries are applied. Adjust the ranges to define your grading scale.
                </span>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="modal-footer-custom">
            <button class="btn-outline" @click="$emit('close')">
              <i class="bi bi-x"></i>
              Cancel
            </button>
            <button
              class="btn-primary-custom"
              :disabled="!hasChanges || hasErrors || saving"
              @click="saveBoundaries"
            >
              <i v-if="saving" class="bi bi-arrow-repeat spinning"></i>
              <i v-else class="bi bi-check-lg"></i>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { getGradeBoundaries, updateGradeBoundary, type GradeBoundary } from '@/services/gradeBoundaryService'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const loading = ref(false)
const saving = ref(false)
const error = ref('')

const boundaries = ref<GradeBoundary[]>([])
const edits = reactive<Record<number, Partial<GradeBoundary>>>({})
const rangeErrors = reactive<Record<number, string>>({})

const sortedBoundaries = computed(() =>
  [...boundaries.value].sort((a, b) => b.min_percent - a.min_percent)
)

const hasChanges = computed(() => {
  return boundaries.value.some(gb => {
    const e = edits[gb.id]
    if (!e) return false
    return (
      Math.abs(Number(e.min_percent) - Number(gb.min_percent)) > 0.01 ||
      Math.abs(Number(e.max_percent) - Number(gb.max_percent)) > 0.01 ||
      e.is_active !== gb.is_active
    )
  })
})

const hasErrors = computed(() => Object.values(rangeErrors).some(e => !!e))

function getDefaultColor(grade: string): string {
  const colors: Record<string, string> = {
    'A': '#10b981',
    'B+': '#3b82f6',
    'B': '#3b82f6',
    'C+': '#f59e0b',
    'C': '#f59e0b',
    'D': '#f97316',
    'F': '#ef4444',
  }
  return colors[grade] || '#94a3b8'
}

function validateRange(id: number) {
  const e = edits[id]
  if (!e) return

  const min = Number(e.min_percent)
  const max = Number(e.max_percent)

  if (isNaN(min) || isNaN(max)) {
    rangeErrors[id] = 'Please enter valid numbers'
    return
  }

  if (min > max) {
    rangeErrors[id] = 'Min must be less than or equal to Max'
    return
  }

  if (min < 0) {
    rangeErrors[id] = 'Min cannot be less than 0'
    return
  }

  if (max > 100) {
    rangeErrors[id] = 'Max cannot exceed 100'
    return
  }

  // Check for overlapping ranges
  const boundary = boundaries.value.find(b => b.id === id)
  if (boundary) {
    for (const other of boundaries.value) {
      if (other.id === id || !edits[other.id]?.is_active) continue
      const otherMin = Number(edits[other.id]?.min_percent ?? other.min_percent)
      const otherMax = Number(edits[other.id]?.max_percent ?? other.max_percent)
      if (min <= otherMax && max >= otherMin) {
        rangeErrors[id] = `Range overlaps with grade ${other.grade} (${otherMin}%-${otherMax}%)`
        return
      }
    }
  }

  delete rangeErrors[id]
}

function toggleActive(id: number) {
  if (edits[id]) {
    edits[id].is_active = !edits[id].is_active
  }
}

async function loadBoundaries() {
  if (!props.visible) return
  loading.value = true
  error.value = ''
  try {
    boundaries.value = await getGradeBoundaries()
    for (const gb of boundaries.value) {
      edits[gb.id] = {
        min_percent: gb.min_percent,
        max_percent: gb.max_percent,
        is_active: gb.is_active,
      }
    }
    Object.keys(rangeErrors).forEach(k => delete rangeErrors[k])
  } catch (err: any) {
    error.value = err?.response?.data?.message || err.message || 'Failed to load grade boundaries'
  } finally {
    loading.value = false
  }
}

async function saveBoundaries() {
  saving.value = true
  try {
    const promises = boundaries.value
      .filter(gb => {
        const e = edits[gb.id]
        return e && (
          e.min_percent !== gb.min_percent ||
          e.max_percent !== gb.max_percent ||
          e.is_active !== gb.is_active
        )
      })
      .map(gb => updateGradeBoundary(gb.id, edits[gb.id]!))

    await Promise.all(promises)
    emit('saved')
  } catch (err: any) {
    error.value = err?.response?.data?.message || err.message || 'Failed to save grade boundaries'
  } finally {
    saving.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) loadBoundaries()
})
</script>

<style scoped>
/* ─── Overrides ─── */
.grade-boundary-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

/* ─── Row ─── */
.grade-boundary-row {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  transition: all 0.2s ease;
  position: relative;
}

.grade-boundary-row:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.boundary-inactive {
  opacity: 0.5;
  background: #f8fafc;
}

.boundary-inactive:hover {
  opacity: 0.65;
}

.boundary-row-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ─── Badge ─── */
.boundary-grade-badge {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: transform 0.2s ease;
}

.grade-boundary-row:hover .boundary-grade-badge {
  transform: scale(1.05);
}

/* ─── Range Section ─── */
.boundary-range-section {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex: 1;
}

.range-input-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.range-label {
  font-size: 9px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.range-input-wrap {
  position: relative;
}

.range-input {
  width: 54px !important;
  text-align: center;
  padding: 6px 16px 6px 4px !important;
  border-radius: 8px !important;
  font-weight: 700 !important;
  font-size: 0.82rem !important;
  border: 1.5px solid #e2e8f0 !important;
  background: #f8fafc !important;
  transition: all 0.2s ease !important;
}

.range-input:focus {
  background: #ffffff !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important;
}

.input-suffix {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.68rem;
  color: #94a3b8;
  font-weight: 600;
  pointer-events: none;
}

/* ─── Track ─── */
.range-track-wrap {
  flex: 1;
  min-width: 40px;
  padding: 0 2px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  padding-bottom: 2px;
}

.range-track {
  position: relative;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.range-track-fill {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 3px;
  opacity: 0.65;
  transition: all 0.25s ease;
}

.grade-boundary-row:hover .range-track-fill {
  opacity: 0.85;
}

/* ─── Toggle ─── */
.boundary-toggle {
  cursor: pointer;
  flex-shrink: 0;
  padding: 4px;
  border-radius: 8px;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
}

.boundary-toggle:hover {
  background: #f1f5f9;
}

.toggle-switch {
  width: 38px;
  height: 20px;
  background: #cbd5e1;
  border-radius: 10px;
  padding: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.toggle-switch.toggle-on {
  background: #10b981;
}

.toggle-knob {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}

.toggle-switch.toggle-on .toggle-knob {
  transform: translateX(18px);
}

/* ─── Error ─── */
.boundary-error {
  margin-top: 8px;
  padding: 5px 10px;
  background: #fef2f2;
  border-radius: 6px;
  font-size: 11px;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #fecaca;
}

.error-slide-enter-active { animation: slideDown 0.2s ease; }
.error-slide-leave-active { animation: slideDown 0.15s ease reverse; }

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ─── Info ─── */
.grade-boundary-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.77rem;
  color: #64748b;
  line-height: 1.6;
  margin-top: 2px;
}

.grade-boundary-info i {
  font-size: 14px;
  margin-top: 2px;
  flex-shrink: 0;
  color: #3b82f6;
}

.grade-boundary-info strong {
  font-weight: 600;
  color: #475569;
}

/* ─── Loading ─── */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 0;
  color: #64748b;
  font-size: 13px;
}

.mini-spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Error State ─── */
.error-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 13px;
}

.error-container i {
  font-size: 1.1rem;
}

/* ─── Remove number arrows ─── */
.range-input::-webkit-inner-spin-button,
.range-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.range-input[type="number"] {
  -moz-appearance: textfield;
}

/* ─── Spinning icon ─── */
.spinning {
  display: inline-block;
  animation: spin 0.7s linear infinite;
}
</style>
