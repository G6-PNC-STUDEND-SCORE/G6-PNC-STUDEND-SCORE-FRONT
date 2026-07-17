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
      <table class="class-table">
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Generation</th>
            <th>Room</th>
            <th>Students</th>
            <th>Teacher</th>
            <th>Status</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="classItem in classes" :key="classItem.id">
            <td class="fw-semibold text-dark">{{ classItem.name }}</td>
            <td>{{ classItem.generation?.year || classItem.generation || '—' }}</td>
            <td>{{ classItem.room || '—' }}</td>
            <td>{{ classItem.students ?? '—' }}</td>
            <td>{{ classItem.teacher?.name || '—' }}</td>
            <td>
              <span class="status-badge" :class="classItem.is_active ? 'badge-active' : 'badge-inactive'">
                {{ classItem.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="action-btn view" @click="$emit('view', classItem)" title="View">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="action-btn edit" @click="$emit('edit', classItem)" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="action-btn delete" @click="$emit('delete', classItem)" title="Delete">
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

.class-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.class-table thead {
  background: #f8fafc;
}

.class-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid #e2e8f0;
}

.class-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

.class-table tbody tr:hover {
  background: #f8fafc;
}

.class-table tbody tr:last-child td {
  border-bottom: none;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-active {
  background: #dcfce7;
  color: #16a34a;
}

.badge-inactive {
  background: #f1f5f9;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s;
}

.action-btn.view {
  background: #eff6ff;
  color: #2563eb;
}

.action-btn.view:hover {
  background: #dbeafe;
}

.action-btn.edit {
  background: #fef9c3;
  color: #d97706;
}

.action-btn.edit:hover {
  background: #fef3c7;
}

.action-btn.delete {
  background: #fee2e2;
  color: #dc2626;
}

.action-btn.delete:hover {
  background: #fecaca;
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

.actions-col {
  width: 120px;
  text-align: right;
}
</style>
