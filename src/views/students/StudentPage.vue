<template>
  <div :class="['page-container', { 'dark-mode': theme.isDark }]">
    <!-- ── Toast ── -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast-bar" :class="toast.type">
        <CheckCircle v-if="toast.type === 'success'" :size="16" />
        <AlertCircle v-else :size="16" />
        <span>{{ toast.message }}</span>
        <button class="toast-close" @click="toast.show = false">&times;</button>
      </div>
    </Transition>

    <!-- ── Header ── -->
    <div class="page-head">
      <div class="page-head-left">
        <div class="page-icon">
          <GraduationCap :size="22" />
        </div>
        <div>
          <h1 class="page-title">Students</h1>
          <p class="page-desc">Manage student profiles, classes, and information</p>
        </div>
      </div>
      <div class="page-head-right">
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus :size="16" />
          <span>Add Student</span>
        </button>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="load-state">
      <div class="spinner"></div>
      <span>Loading students…</span>
    </div>

    <!-- ── Error ── -->
    <div v-else-if="error" class="msg msg-error">
      <AlertTriangle :size="16" />
      {{ error }}
    </div>

    <!-- ── Student List ── -->
    <StudentList
      v-else
      ref="studentListRef"
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
      @bulk-delete="openBulkDeleteModal"
    />

    <!-- ── Create & Edit Modals (StudentFormModal handles its own overlay) ── -->
    <StudentFormModal
      :show="showCreateModal"
      :is-edit="false"
      :name="createForm.name"
      :email="createForm.email"
      :password="createForm.password"
      :gender="createForm.gender"
      :class-id="createForm.class_id"
      :status="createForm.status"
      :classes="classes"
      :submitting="formSubmitting"
      :error="formError"
      @close="closeCreateModal"
      @submit="handleCreate"
      @update:name="createForm.name = $event"
      @update:email="createForm.email = $event"
      @update:password="createForm.password = $event"
      @update:gender="createForm.gender = $event"
      @update:class-id="createForm.class_id = $event"
      @update:status="createForm.status = $event"
    />

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
      :existing-photo-url="existingPhotoUrl"
      @close="closeEditModal"
      @submit="handleEdit"
      @update:name="editForm.name = $event"
      @update:gender="editForm.gender = $event"
      @update:class-id="editForm.class_id = $event"
      @update:status="editForm.status = $event"
      @update:photo="onEditPhotoSelected"
      @remove-photo="onEditRemovePhoto"
    />

    <!-- ── Delete Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" :class="['overlay', { 'dark-mode': theme.isDark }]" @click.self="closeDeleteModal">
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

    <!-- ── Bulk Delete Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showBulkDeleteModal" :class="['overlay', { 'dark-mode': theme.isDark }]" @click.self="closeBulkDeleteModal">
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
              <p class="del-text" style="margin-top: 8px;">All scores, enrollments, and related data will be permanently removed.</p>
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

    <!-- ── Assign Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAssignModal" :class="['overlay', { 'dark-mode': theme.isDark }]" @click.self="closeAssignModal">
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
                <div class="field">
                  <label>Select Class</label>
                  <select
                    :value="assignForm.class_id"
                    @change="assignForm.class_id = Number(($event.target as HTMLSelectElement).value)"
                    required
                  >
                    <option :value="null" disabled>— Choose a class —</option>
                    <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                  </select>
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

    <!-- ── Details Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetailsModal && selectedStudent" :class="['overlay', { 'dark-mode': theme.isDark }]" @click.self="closeDetailsModal">
          <div class="modal-card">
            <div class="modal-head">
              <div class="modal-icon icon-info">
                <Eye :size="20" />
              </div>
              <div>
                <h3>Student Details</h3>
                <p>Complete information about this student</p>
              </div>
              <button class="modal-x" @click="closeDetailsModal">&times;</button>
            </div>
            <div class="modal-body">
              <!-- Avatar & Name -->
              <div class="detail-user-row">
                <div v-if="selectedStudent.profile_photo_url" class="detail-avatar">
                  <img :src="selectedStudent.profile_photo_url" :alt="selectedStudent.user?.name || 'Student'" class="detail-avatar-img" />
                </div>
                <div v-else class="detail-avatar detail-avatar-fallback">
                  {{ getInitials(selectedStudent.user?.name || '') }}
                </div>
                <div>
                  <h4>{{ selectedStudent.user?.name }}</h4>
                  <span class="pill" :class="(selectedStudent.user?.gender || '') === 'Male' ? 'pill-male' : 'pill-female'">
                    {{ selectedStudent.user?.gender || '—' }}
                  </span>
                </div>
              </div>

              <!-- Details Grid -->
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Student ID</span>
                  <span class="detail-value">#{{ selectedStudent.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">{{ selectedStudent.user?.email || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Class</span>
                  <span class="detail-value">{{ selectedStudent.class?.name || 'Not assigned' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status</span>
                  <span class="pill" :class="(selectedStudent.user?.status || '') === 'active' ? 'pill-on' : 'pill-off'">
                    {{ (selectedStudent.user?.status || '') === 'active' ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Gender</span>
                  <span class="detail-value">{{ selectedStudent.user?.gender || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Student ID Number</span>
                  <span class="detail-value">{{ selectedStudent.student_id_number || '—' }}</span>
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
import { useThemeStore } from '@/stores/theme'
import StudentList from './StudentList.vue'
import StudentFormModal from './StudentFormModal.vue'
import { GraduationCap, Plus, AlertTriangle, CheckCircle, AlertCircle, Trash2, ArrowRightFromLine, Check, Eye } from '@lucide/vue'
import { useStudents } from './composables/useStudents.ts'

const theme = useThemeStore()
const {
  loading, error, searchQuery, genderFilter, formSubmitting, formError, toast,
  showCreateModal, showEditModal, showDeleteModal, showBulkDeleteModal, showAssignModal, showDetailsModal,
  selectedStudent, selectedBulkIds, createForm, editForm, assignForm, existingPhotoUrl, onEditPhotoSelected, onEditRemovePhoto,
  classes, filteredStudents, getInitials,
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
/* ══════════════════════════════════════════════════════════════
   GLOBAL
   ══════════════════════════════════════════════════════════════ */
.page-container {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1rem 1.5rem 2rem;
  font-family: 'Inter', 'Noto Sans Khmer', system-ui, sans-serif;
  color: #0f172a;
  max-width: 1440px;
}

.page-icon {
  width: 44px; height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #2563eb;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* ══════════════════════════════════════════════════════════════
   HEADER
   ══════════════════════════════════════════════════════════════ */
.page-head {
  display: flex;
  align-items: center; justify-content: space-between;
  margin-bottom: 1.25rem; gap: 16px; flex-wrap: wrap;
}
.page-head-left { display: flex; align-items: center; gap: 14px; }
.page-title { font-size: 1.4rem; font-weight: 800; margin: 0 0 2px; letter-spacing: -0.025em; }
.page-desc { font-size: 0.8rem; color: #64748b; margin: 0; }
.page-head-right { display: flex; align-items: center; gap: 10px; }

/* ══════════════════════════════════════════════════════════════
   BUTTONS
   ══════════════════════════════════════════════════════════════ */
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 0.5rem 1.125rem; border-radius: 10px;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  border: none; transition: all 0.2s; font-family: inherit;
  white-space: nowrap;
}
.btn-primary { background: #2563eb; color: #fff; box-shadow: 0 2px 8px rgba(37,99,235,0.2); }
.btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.btn-ghost { background: #f1f5f9; color: #475569; }
.btn-ghost:hover { background: #e2e8f0; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }

/* ══════════════════════════════════════════════════════════════
   MESSAGES
   ══════════════════════════════════════════════════════════════ */
.msg {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: 10px;
  font-size: 0.85rem; font-weight: 500; margin-bottom: 14px;
}
.msg-error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }

/* ══════════════════════════════════════════════════════════════
   LOADING
   ══════════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════════════════════ */
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
  display: flex; align-items: flex-start; gap: 14px;
  padding: 20px 24px 0; position: relative;
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

/* ── Form Fields ── */
.field { margin-bottom: 14px; }
.field label { display: block; font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 5px; }
.field select, .field input {
  width: 100%; padding: 8px 12px; border: 1.5px solid #d1d5db;
  border-radius: 8px; font-size: 0.88rem; outline: none;
  transition: border-color 0.15s; box-sizing: border-box; font-family: inherit;
  background: #fff; color: #0f172a;
}
.field select:focus, .field input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }

.del-text { font-size: 0.9rem; color: #475569; margin: 0; }

/* ── Pill Badges ── */
.pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px; border-radius: 20px;
  font-size: 0.72rem; font-weight: 600; letter-spacing: 0.02em;
}
.pill-on { background: #dcfce7; color: #16a34a; }
.pill-off { background: #f1f5f9; color: #94a3b8; }
.pill-male { background: #dbeafe; color: #2563eb; }
.pill-female { background: #f1f5f9; color: #64748b; }

/* ══════════════════════════════════════════════════════════════
   DETAILS MODAL
   ══════════════════════════════════════════════════════════════ */
.detail-user-row {
  display: flex; align-items: center; gap: 14px;
  padding-bottom: 16px; margin-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}
.detail-user-row h4 { font-size: 1rem; font-weight: 700; margin: 0 0 4px; }

.detail-avatar {
  width: 54px; height: 54px; border-radius: 50%;
  overflow: hidden; flex-shrink: 0;
}
.detail-avatar-img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.detail-avatar-fallback {
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff; font-weight: 700; font-size: 1.125rem;
  box-shadow: 0 2px 8px rgba(37,99,235,0.25);
}

.detail-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.detail-item {
  display: flex; flex-direction: column; gap: 2px;
  padding: 10px 12px;
  background: #f8fafc; border-radius: 10px;
}
.detail-label { font-size: 0.72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
.detail-value { font-size: 0.88rem; color: #0f172a; font-weight: 600; }

/* ══════════════════════════════════════════════════════════════
   TOAST BAR
   ══════════════════════════════════════════════════════════════ */
.toast-bar {
  position: fixed; top: 20px; right: 20px; z-index: 99999;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-radius: 10px;
  font-size: 0.85rem; font-weight: 500;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15); max-width: 400px;
}
.toast-bar.success { background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }
.toast-bar.error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
.toast-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; opacity: 0.6; margin-left: auto; padding: 0 4px; }
.toast-close:hover { opacity: 1; }

/* ══════════════════════════════════════════════════════════════
   TRANSITIONS
   ══════════════════════════════════════════════════════════════ */
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { transform: translateX(100%); opacity: 0; }

.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-card, .modal-leave-to .modal-card { transform: scale(0.92) translateY(10px); }

/* ══════════════════════════════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .page-container { padding: 0.75rem 1rem; }
  .page-head { flex-direction: column; align-items: flex-start; }
  .page-head-right { width: 100%; }
  .page-head-right .btn { flex: 1; justify-content: center; }
}

/* ── Dark Mode ── */
.dark-mode .page-container {
  color: #e2e8f0;
}

.dark-mode .page-icon {
  background: rgba(59, 130, 246, 0.15);
}

.dark-mode .msg-error {
  background: rgba(127, 29, 29, 0.3);
  color: #fca5a5;
  border-left-color: #ef4444;
}

.dark-mode .btn-ghost {
  background: rgba(51, 65, 85, 0.4);
  color: #cbd5e1;
}

.dark-mode .btn-ghost:hover {
  background: rgba(71, 85, 105, 0.5);
}

.dark-mode .load-state {
  color: #94a3b8;
}

.dark-mode .modal-card {
  background: #1e293b;
}

.dark-mode .modal-head h3 {
  color: #f1f5f9;
}

.dark-mode .modal-head p {
  color: #94a3b8;
}

.dark-mode .modal-x {
  color: #64748b;
}

.dark-mode .modal-x:hover {
  color: #cbd5e1;
}

.dark-mode .field label {
  color: #cbd5e1;
}

.dark-mode .field select,
.dark-mode .field input {
  background: rgba(51, 65, 85, 0.4);
  border-color: #475569;
  color: #e2e8f0;
}

.dark-mode .field select:focus,
.dark-mode .field input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

.dark-mode .del-text {
  color: #cbd5e1;
}

.dark-mode .detail-user-row {
  border-bottom-color: rgba(71, 85, 105, 0.3);
}

.dark-mode .detail-user-row h4 {
  color: #f1f5f9;
}

.dark-mode .detail-item {
  background: rgba(51, 65, 85, 0.3);
}

.dark-mode .detail-label {
  color: #94a3b8;
}

.dark-mode .detail-value {
  color: #e2e8f0;
}

.dark-mode .pill-off {
  background: rgba(71, 85, 105, 0.4);
  color: #94a3b8;
}

.dark-mode .pill-male {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.dark-mode .pill-female {
  background: rgba(71, 85, 105, 0.4);
  color: #94a3b8;
}

.dark-mode .toast-bar.success {
  background: rgba(6, 95, 70, 0.5);
  color: #6ee7b7;
  border-left-color: #10b981;
}

.dark-mode .toast-bar.error {
  background: rgba(127, 29, 29, 0.5);
  color: #fca5a5;
  border-left-color: #ef4444;
}

.dark-mode .overlay {
  background: rgba(0, 0, 0, 0.6);
}
</style>
