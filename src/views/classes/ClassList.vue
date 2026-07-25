<template>
  <div class="class-list">
    <!-- Search and Filter -->
    <div class="list-toolbar">
      <div class="search-wrapper">
        <i class="bi bi-search search-icon"></i>
        <input
          :value="searchQuery"
          @input="$emit('update:search-query', ($event.target as HTMLInputElement).value)"
          type="text"
          class="search-input"
          placeholder="Search classes..."
        />
      </div>
      <select
        :value="statusFilter"
        @change="$emit('update:status-filter', ($event.target as HTMLSelectElement).value)"
        class="status-select"
      >
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <table class="class-table data-table-base">
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Generation</th>
            <th>Room</th>
            <th>Students</th>
            <th>Teacher</th>
            <th>Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="classItem in classes" :key="classItem.id" class="data-row">
            <td class="fw-semibold text-dark">{{ classItem.name }}</td>
            <td>{{ typeof classItem.generation === 'object' ? classItem.generation?.year : classItem.generation || '—' }}</td>
            <td>{{ classItem.room || '—' }}</td>
            <td>{{ classItem.students ?? '—' }}</td>
            <td>{{ classItem.teacher?.name || '—' }}</td>
            <td>
              <span class="status-badge" :class="classItem.is_active ? 'badge-active' : 'badge-inactive'">
                {{ classItem.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="td-actions">
                <button class="act-btn view" @click="$emit('view', classItem)" title="View">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="act-btn edit" @click="$emit('edit', classItem)" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="act-btn act-danger" @click="$emit('delete', classItem)" title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!classes.length">
            <td colspan="7" class="empty-row">
              <div class="empty-state">
                <i class="bi bi-inbox empty-icon"></i>
                <p>No classes found</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  classes: Array<{
    id: number
    name: string
    generation?: { year: string } | string | null
    room?: string | null
    students?: number | null
    teacher?: { name: string } | null
    is_active?: boolean
    status?: string
  }>
  searchQuery: string
  statusFilter: string
}>()

defineEmits<{
  'update:search-query': [value: string]
  'update:status-filter': [value: string]
  view: [classItem: Record<string, unknown>]
  edit: [classItem: Record<string, unknown>]
  delete: [classItem: Record<string, unknown>]
}>()
</script>

<style scoped>
.class-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.875rem;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.15s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.status-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  background: #fff;
  cursor: pointer;
  outline: none;
}

.status-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.table-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.class-table tbody tr:last-child td {
  border-bottom: none;
}

.status-badge {
  font-weight: 600;
}

.td-actions {
  display: flex;
  gap: 6px;
  white-space: nowrap;
  text-align: center;
}

.empty-row {
  padding: 3rem 1rem !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 2rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.col-actions {
  text-align: center;
  width: 110px;
}
</style>
