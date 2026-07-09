<template>
  <div class="card border-0 shadow-sm rounded-3 overflow-hidden">
    <!-- Search & Filter Bar -->      <div class="p-3 border-bottom d-flex flex-wrap align-items-center gap-3" style="background: #fafbfc; font-family: 'Inter', 'Noto Sans Khmer', sans-serif;">
        <div class="position-relative flex-grow-1" style="max-width: 320px;">
          <i class="bi bi-search position-absolute start-0 top-50 translate-middle-y ms-3" style="color: #9ca3af;"></i>
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          class="form-control ps-5"
          style="border-radius: 0.5rem; border-color: #e5e7eb; font-size: 0.8125rem; padding-top: 0.5rem; padding-bottom: 0.5rem;"
          placeholder="Search by name..."
        />
      </div>
      <div class="d-flex gap-2 align-items-center">
        <label class="d-flex align-items-center gap-2" style="font-size: 0.8125rem; color: #374151; font-weight: 500;">
          Gender:
          <select
            :value="genderFilter"
            @change="$emit('update:genderFilter', ($event.target as HTMLSelectElement).value)"
            class="form-select"
            style="border-radius: 0.5rem; border-color: #e5e7eb; font-size: 0.8125rem; width: auto; padding: 0.4rem 2rem 0.4rem 0.75rem;"
          >
            <option value="">All</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
      </div>
      <span class="badge rounded-pill" style="background: #eef2ff; color: #2563eb; font-size: 0.75rem; padding: 0.35rem 0.75rem;">
        {{ students.length }} student{{ students.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Table -->
    <div class="table-responsive" style="font-family: 'Inter', 'Noto Sans Khmer', sans-serif;">
      <table class="table table-hover align-middle mb-0" style="font-size: 0.875rem;">
        <thead style="background: #f8fafc; border-bottom: 2px solid #e5e7eb;">
          <tr>
            <th class="ps-4 py-3 fw-semibold" style="color: #374151;">#</th>
            <th class="py-3 fw-semibold" style="color: #374151;">Name</th>
            <th class="py-3 fw-semibold" style="color: #374151;">Gender</th>
            <th class="py-3 fw-semibold" style="color: #374151;">Class</th>
            <th class="py-3 fw-semibold text-end pe-4" style="color: #374151;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="students.length === 0">
            <td colspan="5" class="text-center py-5" style="color: #9ca3af;">
              <i class="bi bi-people fs-1 d-block mb-2"></i>
              No students found
            </td>
          </tr>
          <tr
            v-for="(student, index) in paginatedStudents"
            :key="student.id"
            class="student-row"
            :class="student.gender === 'Male' ? 'row-male' : 'row-female'"
          >
            <td class="ps-4 py-3" style="color: #6b7280;">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="py-3">
              <div class="d-flex align-items-center gap-3">
                <div
                  class="d-flex align-items-center justify-content-center rounded-circle fw-bold text-white flex-shrink-0"
                  style="width: 36px; height: 36px; font-size: 0.75rem; background: linear-gradient(135deg, #2563eb, #1d4ed8);"
                >
                  {{ getInitials(student.name) }}
                </div>
                <div>
                  <span class="fw-semibold" style="color: #1a1a2e;">{{ student.name }}</span>
                </div>
              </div>
            </td>
            <td class="py-3">
              <span
                class="gender-badge"
                :class="student.gender === 'Male' ? 'badge-male' : 'badge-female'"
              >
                {{ student.gender }}
              </span>
            </td>
            <td class="py-3">
              <span v-if="student.class" style="color: #374151;">
                <i class="bi bi-building me-1" style="color: #9ca3af;"></i>
                {{ student.class.name }}
              </span>
              <span v-else class="fst-italic" style="color: #9ca3af;">
                <i class="bi bi-dash me-1"></i>
                Not assigned
              </span>
            </td>
            <td class="py-3 text-end pe-4" @click.stop>
              <div class="action-dropdown">
                <button
                  class="action-trigger"
                  :title="`Actions for ${student.name}`"
                  @click="toggleDropdown(student.id)"
                >
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <Transition name="dropdown">
                  <div v-if="openDropdownId === student.id" class="action-menu">
                    <button class="action-item view" @click="$emit('view', student); openDropdownId = null">
                      <i class="bi bi-eye"></i>
                      <span>View Details</span>
                    </button>
                    <button class="action-item edit" @click="$emit('edit', student); openDropdownId = null">
                      <i class="bi bi-pencil"></i>
                      <span>Edit</span>
                    </button>
                    <button class="action-item assign" @click="$emit('assign', student); openDropdownId = null">
                      <i class="bi bi-box-arrow-in-right"></i>
                      <span>Assign Class</span>
                    </button>
                    <div class="dropdown-divider"></div>
                    <button class="action-item delete" @click="$emit('delete', student); openDropdownId = null">
                      <i class="bi bi-trash"></i>
                      <span>Delete</span>
                    </button>
                  </div>
                </Transition>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-bar">
      <div class="pagination-info">
        <span class="rows-label">Rows per page:</span>
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
          aria-label="Previous page"
        >
          <i class="bi bi-chevron-left"></i>
        </button>

        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            class="page-btn"
            :class="{ active: currentPage === page }"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
          <span v-else class="page-dots">…</span>
        </template>

        <button
          class="page-nav"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
          aria-label="Next page"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <div class="pagination-total">
        {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, students.length) }} of {{ students.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { Student } from '@/services/studentService'

const openDropdownId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 25, 50]

const props = defineProps<{
  students: Student[]
  searchQuery: string
  genderFilter: string
  getInitials: (name: string) => string
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.students.length / pageSize.value)))

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.students.slice(start, end)
})

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

function toggleDropdown(id: number) {
  openDropdownId.value = openDropdownId.value === id ? null : id
}

// Close dropdown when clicking outside
function handleClickOutside() {
  openDropdownId.value = null
}

window.addEventListener('click', handleClickOutside)
onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

defineEmits<{
  'update:searchQuery': [value: string]
  'update:genderFilter': [value: string]
  view: [student: Student]
  edit: [student: Student]
  assign: [student: Student]
  delete: [student: Student]
}>()
</script>

<style scoped>
.student-row {
  transition: background 0.2s ease, border-left 0.2s ease;
  border-left: 3px solid transparent;
}

.row-male:hover {
  background: #eff6ff;
  border-left-color: #3b82f6;
}

.row-female:hover {
  background: #fdf2f8;
  border-left-color: #ec4899;
}

.table > :not(caption) > * > * {
  border-bottom-color: #f1f3f5;
}

/* ==================== Gender Badge ==================== */
.gender-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 100px;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;
}

.badge-male {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-female {
  background: #fce7f3;
  color: #be185d;
}

.gender-badge::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

.badge-male::before {
  background: #3b82f6;
}

.badge-female::before {
  background: #ec4899;
}

/* ==================== Action Dropdown ==================== */
.action-dropdown {
  position: relative;
  display: inline-flex;
}

.action-trigger {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.action-trigger:hover {
  background: #eef2ff;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.action-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 190px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 100;
  animation: dropIn 0.18s ease-out;
  transform-origin: top right;
}

@keyframes dropIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(-6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dropdown-enter-active {
  transition: all 0.18s ease-out;
}
.dropdown-leave-active {
  transition: all 0.12s ease-in;
}
.dropdown-enter-from {
  opacity: 0;
  transform: scale(0.92) translateY(-6px);
}
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-3px);
}

.action-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: "Inter", "Noto Sans Khmer", sans-serif;
  transition: all 0.15s ease;
  text-align: left;
  color: #374151;
}

.action-item i {
  font-size: 1rem;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.action-item.view:hover {
  background: #f0f5ff;
  color: #2563eb;
}

.action-item.edit:hover {
  background: #e0f2fe;
  color: #0369a1;
}

.action-item.assign:hover {
  background: #fef9c3;
  color: #854d0e;
}

.action-item.delete:hover {
  background: #fef2f2;
  color: #dc2626;
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 8px;
}

/* ==================== Pagination ==================== */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  font-size: 0.8125rem;
  gap: 12px;
  flex-wrap: wrap;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
}

.rows-label {
  font-weight: 500;
  white-space: nowrap;
}

.rows-selector {
  display: flex;
  gap: 2px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 2px;
}

.rows-btn {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.15s ease;
}

.rows-btn:hover {
  color: #334155;
}

.rows-btn.active {
  background: #fff;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 2px;
}

.page-nav {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.75rem;
}

.page-nav:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
  background: #f0f5ff;
}

.page-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.15s ease;
}

.page-btn:hover:not(.active) {
  background: #f1f5f9;
  color: #2563eb;
}

.page-btn.active {
  background: #2563eb;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.page-dots {
  width: 24px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
  letter-spacing: 1px;
}

.pagination-total {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .pagination-bar {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .pagination-info {
    width: 100%;
    justify-content: center;
  }
}

/* ==================== Responsive ==================== */
@media (max-width: 768px) {
  .action-trigger {
    width: 30px;
    height: 30px;
    font-size: 0.875rem;
  }

  .action-menu {
    right: auto;
    left: 0;
  }
}
</style>
