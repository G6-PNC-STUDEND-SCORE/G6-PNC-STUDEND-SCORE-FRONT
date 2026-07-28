<template>
  <div class="student-card">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
          <input
            :value="searchQuery"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
            type="text"
            class="search-input"
            :placeholder="t('students.searchPlaceholder')"
          />
        </div>

        <div class="filter-group">
          <label class="filter-label">
            <VenusAndMars :size="16" />
            <span>{{ t('students.gender') }}</span>
            <select
              :value="genderFilter"
              @change="$emit('update:genderFilter', ($event.target as HTMLSelectElement).value)"
              class="filter-select"
            >
              <option value="">{{ t('students.all') }}</option>
              <option value="Male">{{ t('students.male') }}</option>
              <option value="Female">{{ t('students.female') }}</option>
            </select>
          </label>
        </div>
        <div class="filter-group">
          <label class="filter-label">
            <Users :size="16" />
            <span>{{ t('students.generation') }}</span>
            <select
              :value="generationFilter"
              @change="$emit('update:generationFilter', ($event.target as HTMLSelectElement).value === '' ? '' : Number(($event.target as HTMLSelectElement).value))"
              class="filter-select"
            >
              <option value="">{{ t('students.all') }}</option>
              <option v-for="gen in generations" :key="gen.id" :value="gen.id">{{ gen.name }}</option>
            </select>
          </label>
        </div>
      </div>

      <div class="toolbar-right">
        <button
          v-if="canCreate"
          class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold"
          style="border-radius: 0.625rem; background: #2563eb; padding: 0.35rem 0.875rem; font-size: 0.8125rem; flex-shrink: 0;"
          @click="$emit('add')"
        >
          <Plus :size="15" />
          {{ t('students.addStudent') }}
        </button>

        <span class="count-badge">
          {{ students.length }} {{ t('students.name').toLowerCase() }}{{ students.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <div v-if="canDelete && someSelected" class="bulk-bar">
        <span class="bulk-count">{{ selectedIds.length }} {{ t('app.selected') }}</span>
        <div class="bulk-actions">
          <button class="bulk-delete-btn" @click="$emit('bulkDelete', [...selectedIds]); selectedIds = []" :title="t('students.deleteStudents')">
            <Trash2 :size="16" />
            {{ t('app.deleteSelected') }}
          </button>
          <button class="bulk-clear-btn" @click="selectedIds = []" :title="t('app.clearSelection')">{{ t('app.clearSelection') }}</button>
        </div>
      </div>

    <div v-if="students.length === 0" class="empty-container">
      <div class="empty-box">
        <Inbox :size="40" />
        <h5>{{ t('students.noStudents') }}</h5>
        <p>{{ props.searchQuery ? t('app.tryDifferentSearch') : t('app.noMatchFilter') }}</p>
      </div>
    </div>

    <div v-else class="table-wrap">
      <table class="student-table data-table-base">
        <thead>
          <tr>
            <th v-if="canDelete" class="col-check">
              <input
                type="checkbox"
                class="table-checkbox"
                :checked="allSelected"
                :indeterminate="someSelected && !allSelected"
                @change="toggleAll"
                :aria-label="t('app.all')"
              />
            </th>
            <th class="col-index">#</th>
            <th>{{ t('students.name') }}</th>
            <th class="col-student-id">{{ t('students.studentId') }}</th>
            <th>{{ t('students.gender') }}</th>
            <th>{{ t('students.class') }}</th>
            <th>{{ t('students.generation') }}</th>
            <th>{{ t('students.status') }}</th>
            <th class="col-actions">{{ t('students.actions') }}</th>
          </tr>
        </thead>
        <TransitionGroup name="row" tag="tbody">
          <tr
            v-for="(student, index) in paginatedStudents"
            :key="student.id"
            class="data-row"
            :class="{ 'row-selected': selectedIds.includes(student.id) }"
          >
            <td v-if="canDelete" class="col-check">
              <input
                type="checkbox"
                class="table-checkbox"
                :checked="selectedIds.includes(student.id)"
                @change="toggleRow(student.id)"
                :aria-label="`${t('app.selected')} ${student.user?.name || student.id}`"
              />
            </td>
            <td class="col-index">
              <span class="id-cell">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
            </td>
            <td>
              <div class="student-cell">
                <div
                  v-if="student.profile_photo_url"
                  class="avatar-img"
                >
                  <img
                    :src="student.profile_photo_url"
                    :alt="student.user?.name || 'Student'"
                    class="photo-img"
                  />
                </div>
                <div v-else class="avatar">
                  {{ getInitials(student.user?.name || '') }}
                </div>
                <span class="student-name">{{ student.user?.name }}</span>
              </div>
            </td>
            <td class="col-student-id">
              <span v-if="student.student_id_number" class="id-number-cell">{{ student.student_id_number }}</span>
              <span v-else class="meta-cell">—</span>
            </td>
            <td>
              <span class="meta-cell">{{ student.user?.gender || '—' }}</span>
            </td>
            <td>
              <span v-if="student.class" class="class-cell">
                {{ student.class.name }}
              </span>
              <span v-else class="meta-cell">—</span>
            </td>
            <td>
              <span class="meta-cell">{{ student.generation?.name || '—' }}</span>
            </td>
            <td>
              <span
                class="status-badge"
                :class="(student.user?.status || '') === 'active' ? 'badge-active' : 'badge-inactive'"
              >
                {{ (student.user?.status || '') === 'active' ? t('students.active') : t('students.inactive') }}
              </span>
            </td>
            <td class="col-actions" @click.stop>
              <div class="td-actions">
                <button class="act-btn" :title="t('students.viewDetails')" @click="$emit('view', student)">
                  <Eye :size="15" />
                </button>
                <button v-if="canUpdate" class="act-btn" :title="t('students.edit')" @click="$emit('edit', student)">
                  <Pencil :size="15" />
                </button>
                <button v-if="canDelete" class="act-btn act-danger" :title="t('students.deleteStudent')" @click="$emit('delete', student)">
                  <Trash2 :size="15" />
                </button>
              </div>
            </td>
          </tr>
        </TransitionGroup>
      </table>
    </div>

    <div v-if="students.length > 0" class="pagination-bar">
      <div class="pagination-info">
        <span class="rows-label">{{ t('pagination.rowsPerPage') }}</span>
        <div class="rows-selector">
          <button
            v-for="size in pageSizeOptions"
            :key="size"
            class="rows-btn"
            :class="{ active: pageSize === size }"
            @click="pageSize = size; currentPage = 1"
          >
            {{ size }}
          </button>
        </div>
      </div>

      <div class="pagination-pages">
        <button
          class="page-nav"
          :disabled="currentPage <= 1"
          @click="currentPage--"
          :aria-label="t('pagination.previous')"
        >
          <ChevronLeft :size="16" />
        </button>

        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            class="page-btn"
            :class="{ active: currentPage === page }"
            @click="currentPage = page as number"
          >
            {{ page }}
          </button>
          <span v-else class="page-dots">…</span>
        </template>

        <button
          class="page-nav"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
          :aria-label="t('pagination.next')"
        >
          <ChevronRight :size="16" />
        </button>
      </div>

      <div class="pagination-total">
        {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, students.length) }} {{ t('app.of') }} {{ students.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TransitionGroup } from 'vue'
import type { Student } from '@/services/studentService'
import {
  Search,
  VenusAndMars,
  Users,
  Inbox,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
} from '@lucide/vue'
import type { Generation } from '@/types'
import { usePermission } from '@/composables/usePermission'

const { t } = useI18n()
const { hasPermission } = usePermission()
const canCreate = computed(() => hasPermission('create-students'))
const canUpdate = computed(() => hasPermission('update-students'))
const canDelete = computed(() => hasPermission('delete-students'))

const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 25, 50, 75, 100]
const selectedIds = ref<number[]>([])

const props = defineProps<{
  students: Student[]
  searchQuery: string
  genderFilter: string
  generationFilter: number | ''
  generations: Generation[]
  getInitials: (name: string) => string
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.students.length / pageSize.value)))

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.students.slice(start, end)
})

const allSelected = computed(() =>
  paginatedStudents.value.length > 0 &&
  paginatedStudents.value.every((s) => selectedIds.value.includes(s.id))
)

const someSelected = computed(() => selectedIds.value.length > 0)

defineExpose({ selectedIds })

function toggleRow(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)
}

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter(
      (id) => !paginatedStudents.value.some((s) => s.id === id)
    )
  } else {
    const ids = paginatedStudents.value.map((s) => s.id)
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...ids]))
  }
}

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('...')

  pages.push(total)

  return pages
})

defineEmits<{
  'update:searchQuery': [value: string]
  'update:genderFilter': [value: string]
  'update:generationFilter': [value: number | '']
  view: [student: Student]
  edit: [student: Student]
  assign: [student: Student]
  delete: [student: Student]
  bulkDelete: [ids: number[]]
  add: []}>()
</script>
