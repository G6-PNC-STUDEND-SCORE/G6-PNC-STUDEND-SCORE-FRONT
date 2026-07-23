<template>
  <div :class="['filter-bar', 'card', { 'dark-mode': isDark }]">
    <div class="card-body">
      <div class="d-flex flex-wrap align-items-center filter-items">
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
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04), 0 2px 12px rgba(0, 0, 0, 0.02);
  transition: all 0.25s ease;
}

.filter-bar:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 4px 20px rgba(0, 0, 0, 0.03);
  border-color: rgba(148, 163, 184, 0.4);
}

.filter-bar .card-body {
  padding: 0.75rem;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.filter-items {
  column-gap: 1rem;
  row-gap: 0.75rem;
}

.filter-bar.dark-mode {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(71, 85, 105, 0.5);
}

.filter-bar.dark-mode:hover {
  border-color: rgba(100, 116, 139, 0.6);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 150px;
  flex: 1 1 auto;
}

.filter-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding-left: 2px;
}

.dark-mode .filter-label {
  color: #94a3b8;
}

.filter-bar .form-select-sm {
  font-size: 0.8rem;
  padding: 0.35rem 1.6rem 0.35rem 0.6rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  color: #1e293b;
}

.filter-bar .form-select-sm:hover {
  border-color: #94a3b8;
  background-color: #ffffff;
}

.filter-bar .form-select-sm:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  background-color: #ffffff;
}

.dark-mode .form-select-sm {
  background-color: rgba(51, 65, 85, 0.5);
  border-color: #475569;
  color: #e2e8f0;
}

.dark-mode .form-select-sm:hover {
  background-color: rgba(71, 85, 105, 0.5);
  border-color: #64748b;
}

.dark-mode .form-select-sm:focus {
  background-color: rgba(51, 65, 85, 0.7);
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
}

.clear-btn {
  align-self: flex-end;
  font-size: 0.75rem;
  border-radius: 8px;
  padding: 0.3rem 0.65rem;
  font-weight: 600;
  transition: all 0.2s ease;
  margin-bottom: 0;
}.clear-btn:hover {
  transform: scale(1.04);
}
</style>
