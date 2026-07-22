<template>
  <div :class="['filter-bar', 'card', 'border-0', { 'dark-mode': isDark }]">
    <div class="card-body px-3" style="padding-top: 1.5rem; padding-bottom: 1.5rem; min-height: 100px;">
      <div class="d-flex flex-wrap align-items-center gap-2">
        <div class="filter-group">
          <label class="filter-label">Generation</label>
          <select
            class="form-select form-select-sm"
            :value="store.filters.generation_id ?? ''"
            @change="onFilterChange('generation_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">All Generations</option>
            <option
              v-for="gen in store.filterOptions.generations"
              :key="gen.id"
              :value="gen.id"
            >
              {{ gen.name || `Generation ${gen.year}` }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Term</label>
          <select
            class="form-select form-select-sm"
            :value="store.filters.term_id ?? ''"
            @change="onFilterChange('term_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">All Terms</option>
            <option
              v-for="term in store.filterOptions.terms"
              :key="term.id"
              :value="term.id"
            >
              {{ term.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Class</label>
          <select
            class="form-select form-select-sm"
            :value="store.filters.class_id ?? ''"
            @change="onFilterChange('class_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">All Classes</option>
            <option
              v-for="cls in store.filterOptions.classes"
              :key="cls.id"
              :value="cls.id"
            >
              {{ cls.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Department</label>
          <select
            class="form-select form-select-sm"
            :value="store.filters.department_id ?? ''"
            @change="onFilterChange('department_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">All Departments</option>
            <option
              v-for="dept in store.filterOptions.departments"
              :key="dept.id"
              :value="dept.id"
            >
              {{ dept.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Teacher</label>
          <select
            class="form-select form-select-sm"
            :value="store.filters.teacher_id ?? ''"
            @change="onFilterChange('teacher_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">All Teachers</option>
            <option
              v-for="teacher in store.filterOptions.teachers"
              :key="teacher.id"
              :value="teacher.id"
            >
              {{ teacher.user?.name || `Teacher #${teacher.id}` }}
            </option>
          </select>
        </div>

        <button
          v-if="store.activeFilterCount > 0"
          class="btn btn-sm btn-outline-danger clear-btn"
          @click="store.clearFilters()"
        >
          <XCircle :size="14" class="me-1" />
          Clear ({{ store.activeFilterCount }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useDashboardStore } from '@/stores/dashboard'
import type { DashboardFilters } from '@/types/dashboard'
import { XCircle } from '@lucide/vue'

const themeStore = useThemeStore()
const store = useDashboardStore()
const isDark = computed(() => themeStore.isDark)

function onFilterChange(key: keyof DashboardFilters, value: string) {
  store.setFilter(key, value ? Number(value) : null)
}
</script>

<style scoped>
.filter-bar {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: background 0.3s ease, border-color 0.3s ease;
}


.filter-bar.dark-mode {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 150px;
}

.filter-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.dark-mode .filter-label {
  color: #94a3b8;
}

.form-select-sm {
  font-size: 0.8rem;
  padding: 0.25rem 1.6rem 0.25rem 0.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
  cursor: pointer;
  transition: border-color 0.2s;
}

.dark-mode .form-select-sm {
  background-color: rgba(51, 65, 85, 0.5);
  border-color: #475569;
  color: #e2e8f0;
}

.form-select-sm:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.clear-btn {
  align-self: flex-end;
  font-size: 0.75rem;
  border-radius: 8px;
  padding: 0.25rem 0.6rem;
  margin-bottom: 1px;
}
</style>
