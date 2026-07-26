<template>
  <div class="page-container">
    <div v-if="loading" class="load-state">
      <div class="spinner"></div>
      <span>Loading students…</span>
    </div>

    <div v-else-if="error" class="msg msg-error">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <StudentList
      ref="studentListRef"
      :students="filteredStudents"
      :search-query="searchQuery"
      :gender-filter="genderFilter"
      :generation-filter="generationFilter"
      :generations="generations"
      :get-initials="getInitials"
      @update:search-query="searchQuery = $event"
      @update:gender-filter="genderFilter = $event"
      @update:generation-filter="generationFilter = $event"
      @view="viewDetails"
      @edit="openEditModal"
      @assign="openAssignModal"
      @delete="openDeleteModal"
      @bulk-delete="openBulkDeleteModal"
      @add="openCreateModal"
    />

    <StudentFormModal
      :show="showCreateModal"
      :is-edit="false"
      :name="createForm.name"
      :email="createForm.email"
      :password="createForm.password"
      :gender="createForm.gender"
      :status="createForm.status"
      :class-id="createForm.class_id"
      :classes="classes"
      :generation-id="createForm.generation_id"
      :generations="generations"
      :submitting="formSubmitting"
      :error="formError"
      @close="closeCreateModal"
      @submit="handleCreate"
      @update:name="createForm.name = $event"
      @update:email="createForm.email = $event"
      @update:password="createForm.password = $event"
      @update:gender="createForm.gender = $event"
      @update:status="createForm.status = $event"
      @update:class-id="createForm.class_id = $event"
      @update:generation-id="createForm.generation_id = $event"
    />

    <StudentFormModal
      :show="showEditModal"
      :is-edit="true"
      :name="editForm.name"
      :gender="editForm.gender"
      :status="editForm.status"
      :class-id="editForm.class_id"
      :classes="classes"
      :generation-id="editForm.generation_id"
      :generations="generations"
      :submitting="formSubmitting"
      :error="formError"
      @close="closeEditModal"
      @submit="handleEdit"
      @update:name="editForm.name = $event"
      @update:gender="editForm.gender = $event"
      @update:status="editForm.status = $event"
      @update:class-id="editForm.class_id = $event"
      @update:generation-id="editForm.generation_id = $event"
    />

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="overlay" @click.self="closeDeleteModal">
          <div class="modal-card modal-sm">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>Delete Student</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">Are you sure you want to delete <strong>{{ selectedStudent?.user?.name }}</strong>?</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeDeleteModal">Cancel</button>
              <button class="btn btn-danger" @click="handleDelete" :disabled="formSubmitting">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showBulkDeleteModal" class="overlay" @click.self="closeBulkDeleteModal">
          <div class="modal-card modal-sm">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>Delete Students</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeBulkDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">Are you sure you want to delete <strong>{{ selectedBulkIds.length }} student{{ selectedBulkIds.length !== 1 ? 's' : '' }}</strong>?</p>
              <p class="del-warning">All scores, enrollments, and related data will be permanently removed.</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeBulkDeleteModal">Cancel</button>
              <button class="btn btn-danger" @click="handleBulkDelete" :disabled="formSubmitting">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>Delete {{ selectedBulkIds.length }} student{{ selectedBulkIds.length !== 1 ? 's' : '' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAssignModal" class="overlay" @click.self="closeAssignModal">
          <div class="modal-card modal-sm">
            <div class="modal-head">
              <div class="modal-icon icon-assign">
                <ArrowRightFromLine :size="20" />
              </div>
              <div>
                <h3>Assign to Class</h3>
                <p>Assign {{ selectedStudent?.user?.name }} to a class</p>
              </div>
              <button class="modal-x" @click="closeAssignModal">&times;</button>
            </div>
            <form @submit.prevent="handleAssign">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">
                    <Building :size="15" class="field-icon" />
                    Select Class <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <select
                      :value="assignForm.class_id"
                      @change="assignForm.class_id = Number(($event.target as HTMLSelectElement).value)"
                      class="styled-input"
                      required
                    >
                      <option :value="null" disabled>— Choose a class —</option>
                      <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="closeAssignModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="formSubmitting || !assignForm.class_id">
                  <span v-if="formSubmitting" class="spinner-sm"></span>
                  <Check v-else :size="16" />
                  <span>Assign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetailsModal && selectedStudent" class="modal-overlay" @click.self="closeDetailsModal">
          <div class="modal-content-panel" style="max-width: 820px;">
            <div class="modal-head">
              <button class="modal-x" @click="closeDetailsModal">&times;</button>
            </div>

            <div class="modal-body-custom">
              <div class="info-header">
                <div v-if="selectedStudent.profile_photo_url" class="info-avatar-img">
                  <img :src="selectedStudent.profile_photo_url" :alt="selectedStudent.user?.name || 'Student'" />
                </div>
                <div v-else class="info-avatar">{{ getInitials(selectedStudent.user?.name || '') }}</div>
                <div class="info-heading">
                  <h4>{{ selectedStudent.user?.name }}</h4>
                  <span class="info-role">Student</span>
                </div>
              </div>

              <div class="info-card">
                <div class="info-row">
                  <span class="info-label"><Hash :size="14" /> ID</span>
                  <span class="info-value">#{{ selectedStudent.id }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><Mail :size="14" /> Email</span>
                  <span class="info-value">{{ selectedStudent.user?.email || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><VenusAndMars :size="14" /> Gender</span>
                  <span class="info-value">{{ selectedStudent.user?.gender || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><BookOpen :size="14" /> Student ID</span>
                  <span class="info-value">{{ selectedStudent.studentNumberSequence?.student_number || selectedStudent.student_id_number || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><Users :size="14" /> Generation</span>
                  <span class="info-value">{{ selectedStudent.generation?.name || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><Building :size="14" /> Class</span>
                  <span class="info-value">{{ selectedStudent.class?.name || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><ToggleLeft :size="14" /> Status</span>
                  <span class="info-value" :class="'status-' + (selectedStudent.user?.status || 'inactive')">{{ selectedStudent.user?.status || 'inactive' }}</span>
                </div>
                <div class="info-row info-row-last">
                  <span class="info-label"><Calendar :size="14" /> Created</span>
                  <span class="info-value">{{ formatDate(selectedStudent.created_at) }}</span>
                </div>
              </div>
            </div>

            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeDetailsModal">Close</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import StudentList from './StudentList.vue'
import StudentFormModal from './StudentFormModal.vue'
import { AlertTriangle, Trash2, ArrowRightFromLine, Check, Building, Mail, VenusAndMars, BookOpen, Users, ToggleLeft, Calendar, Hash } from '@lucide/vue'
import { useStudents } from './composables/useStudents.ts'

const {
  loading, error, searchQuery, genderFilter, generationFilter, formSubmitting, formError,
  showCreateModal, showEditModal, showDeleteModal, showBulkDeleteModal, showAssignModal, showDetailsModal,
  selectedStudent, selectedBulkIds, createForm, editForm, assignForm,
  classes, generations, filteredStudents, getInitials, formatDate,
  init, openCreateModal, closeCreateModal, handleCreate,
  openEditModal, closeEditModal, handleEdit,
  openDeleteModal, closeDeleteModal, handleDelete,
  openBulkDeleteModal, closeBulkDeleteModal,
  openAssignModal, closeAssignModal, handleAssign,
  handleBulkDelete,
  viewDetails, closeDetailsModal,
} = useStudents()

onMounted(() => init())
</script>

<style scoped>

.page-container {
  height: calc(100vh - 96px);
  width: calc(100% + 12px);
  margin-top: -6px;
  margin-left: -6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}


.msg {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px;
  font-size: 0.85rem; font-weight: 500; margin-bottom: 14px;
}
.msg-error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }


.load-state {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 4rem; color: #64748b;
}
.spinner {
  width: 30px; height: 30px;
  border: 3px solid #e2e8f0; border-top-color: #3b82f6;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
.spinner-sm { display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }


.overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 16px;
}

.modal-card {
  background: #fff; border-radius: 16px; width: 100%; max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  overflow: hidden; animation: modal-in 0.25s ease-out;
}
.modal-sm { max-width: 380px; }
@keyframes modal-in { 0%{opacity:0;transform:scale(0.92)translateY(10px)} 100%{opacity:1;transform:scale(1)translateY(0)} }

.modal-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px 0;
  position: relative;
  flex-wrap: nowrap;
}
.modal-head h3 { font-size: 1.05rem; font-weight: 700; margin: 0 0 2px; }
.modal-head p { font-size: 0.82rem; color: #64748b; margin: 0; }

.modal-icon {
  width: 42px; height: 42px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.icon-danger { background: #fee2e2; color: #ef4444; }
.icon-assign { background: #fef3c7; color: #d97706; }
.icon-info { background: #dbeafe; color: #2563eb; }

.modal-x {
  position: absolute; top: 16px; right: 16px;
  background: none; border: none; font-size: 1.5rem;
  color: #94a3b8; cursor: pointer; line-height: 1; padding: 4px;
}
.modal-x:hover { color: #475569; }

.modal-body { padding: 16px 24px 20px; }
.modal-foot {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 24px 20px;
}


.del-text { font-size: 0.9rem; color: #475569; margin: 0; }
.del-warning { font-size: 0.75rem; color: #ef4444; background: #fef2f2; padding: 8px 12px; border-radius: 8px; margin: 8px 0 0; line-height: 1.4; }


.pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 600; letter-spacing: 0.02em;
}
.pill-on { background: #dbeafe; color: #1d4ed8; }
.pill-off { background: #f1f5f9; color: #94a3b8; }
.pill-male { background: #dbeafe; color: #2563eb; }
.pill-female { background: #f1f5f9; color: #64748b; }





.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card, .modal-leave-to .modal-card { transform: scale(0.92) translateY(10px); }


.form-group { margin-bottom: 0; }

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.81rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 7px;
}

.field-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.req {
  color: #ef4444;
  font-weight: 700;
}

.input-wrap {
  position: relative;
}

.styled-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.88rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  color: #0f172a;
  background: #fff;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
  appearance: none;
  box-sizing: border-box;
}

.styled-input:hover { border-color: #9ca3af; }
.styled-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}
.styled-input::placeholder { color: #adb5bd; }

select.styled-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}


.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  padding: 1rem;
}

.modal-content-panel {
  background: #fff;
  border-radius: 16px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  position: relative;
}

.modal-body-custom {
  padding: 20px 32px 16px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 0 24px;
}

.info-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.info-avatar-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.info-avatar-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.info-heading h4 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px;
}

.info-role {
  font-size: 0.82rem;
  color: #94a3b8;
  font-weight: 500;
}

.info-card {
  background: #f8fafc;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow: hidden;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e9ecef;
}

.info-row-last {
  border-bottom: none;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.83rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.info-label svg {
  color: #94a3b8;
  flex-shrink: 0;
}

.info-value {
  font-size: 0.88rem;
  font-weight: 500;
  color: #0f172a;
  text-align: right;
  max-width: 65%;
  overflow-wrap: break-word;
}

.status-active { color: #16a34a; font-weight: 600; }
.status-inactive { color: #94a3b8; font-weight: 600; }

@media (max-width: 768px) {
  .page-container { padding: 0.75rem 1rem; }
  .page-head { flex-direction: column; align-items: flex-start; }
  .page-head-right { width: 100%; }
  .page-head-right .btn { flex: 1; justify-content: center; }
}
</style>
