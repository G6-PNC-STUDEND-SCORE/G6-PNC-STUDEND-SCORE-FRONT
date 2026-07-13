<template>
  <Header />
  <div class="px-4 py-4">
      <!-- Header -->
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-header-icon">
            <i class="bi bi-person-badge-fill"></i>
          </div>
          <div>
            <h2 class="page-title">Students</h2>
            <p class="page-subtitle">
              Manage student profiles, classes, and information
            </p>
          </div>
        </div>
        <button
          class="btn btn-primary d-inline-flex align-items-center gap-2 border-0 fw-semibold"
          style="border-radius: 0.625rem; background: #2563eb; padding: 0.5rem 1.125rem; font-size: 0.875rem;"
          @click="openCreateModal"
        >
          <i class="bi bi-plus-lg"></i>
          Add Student
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width: 2.5rem; height: 2.5rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2" style="color: #6b7280;">Loading students...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="d-flex align-items-center gap-2 p-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.875rem;">
        <i class="bi bi-exclamation-triangle-fill"></i>
        {{ error }}
      </div>

      <!-- Student List Table -->
      <StudentList
        v-else
        :students="filteredStudents"
        :search-query="searchQuery"
        :gender-filter="genderFilter"
        :get-initials="getInitials"
        @update:search-query="searchQuery = $event"
        @update:gender-filter="genderFilter = $event"
        @view="viewDetails"
        @edit="openEditModal"
        @assign="openAssignModal"
        @delete="openDeleteModal"
      />

    <!-- Create Modal -->
    <StudentFormModal
      :show="showCreateModal"
      :is-edit="false"
      :name="createForm.name"
      :gender="createForm.gender"
      :class-id="createForm.class_id"
      :status="createForm.status"
      :classes="classes"
      :submitting="formSubmitting"
      :error="formError"
      @close="closeCreateModal"
      @submit="handleCreate"
      @update:name="createForm.name = $event"
      @update:gender="createForm.gender = $event"
      @update:class-id="createForm.class_id = $event"
      @update:status="createForm.status = $event"
    />

    <!-- Edit Modal -->
    <StudentFormModal
      :show="showEditModal"
      :is-edit="true"
      :name="editForm.name"
      :gender="editForm.gender"
      :class-id="editForm.class_id"
      :status="editForm.status"
      :classes="classes"
      :submitting="formSubmitting"
      :error="formError"
      @close="closeEditModal"
      @submit="handleEdit"
      @update:name="editForm.name = $event"
      @update:gender="editForm.gender = $event"
      @update:class-id="editForm.class_id = $event"
      @update:status="editForm.status = $event"
    />

    <!-- Delete Modal -->
    <StudentDeleteModal
      :show="showDeleteModal"
      :student-name="selectedStudent?.user?.name ?? ''"
      :submitting="formSubmitting"
      @close="closeDeleteModal"
      @confirm="handleDelete"
    />

    <!-- Assign Modal -->
    <StudentAssignModal
      :show="showAssignModal"
      :student-name="selectedStudent?.user?.name ?? ''"
      :class-id="assignForm.class_id"
      :classes="classes"
      :submitting="formSubmitting"
      @close="closeAssignModal"
      @confirm="handleAssign"
      @update:class-id="assignForm.class_id = $event"
    />

    <!-- Details Modal -->
    <StudentDetailsModal
      :show="showDetailsModal"
      :student="selectedStudent"
      :get-initials="getInitials"
      :format-date="formatDate"
      @close="closeDetailsModal"
    />

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast-notification" :class="toast.type">
          <i :class="toast.type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-circle-fill'" class="me-2"></i>
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import Header from '@/layouts/Header.vue'
import { onMounted } from 'vue'
import StudentList from './StudentList.vue'
import StudentFormModal from './StudentFormModal.vue'
import StudentDeleteModal from './StudentDeleteModal.vue'
import StudentAssignModal from './StudentAssignModal.vue'
import StudentDetailsModal from './StudentDetailsModal.vue'
import { useStudents } from './composables/useStudents'

const {
  // Data
  loading,
  error,
  searchQuery,
  genderFilter,
  formSubmitting,
  formError,
  toast,
  // Modal state
  showCreateModal,
  showEditModal,
  showDeleteModal,
  showAssignModal,
  showDetailsModal,
  selectedStudent,
  // Form state
  createForm,
  editForm,
  assignForm,
  // Other data
  classes,
  // Computed
  filteredStudents,
  // Helpers
  getInitials,
  formatDate,
  // Actions
  init,
  openCreateModal,
  closeCreateModal,
  handleCreate,
  openEditModal,
  closeEditModal,
  handleEdit,
  openDeleteModal,
  closeDeleteModal,
  handleDelete,
  openAssignModal,
  closeAssignModal,
  handleAssign,
  viewDetails,
  closeDetailsModal,
} = useStudents()

onMounted(() => {
  init()
})
</script>

<style scoped>
/* ==================== Page Header ==================== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-header-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff, #dbeafe);
  color: #2563eb;
  border-radius: 12px;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
  font-weight: 400;
}

.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  z-index: 99999;
  animation: slideInRight 0.3s ease-out;
}

.toast-notification.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.toast-notification.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from, .toast-leave-to { transform: translateX(100%); opacity: 0; }
</style>
