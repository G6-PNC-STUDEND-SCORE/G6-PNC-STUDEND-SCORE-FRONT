<template>
  <div class="page-container">
    <div v-if="loading" class="load-state">
      <div class="spinner"></div>
      <span>{{ t('students.loading') }}</span>
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
                <h3>{{ t('students.deleteStudent') }}</h3>
                <p>{{ t('students.cannotUndo') }}</p>
              </div>
              <button class="modal-x" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">{{ t('students.deleteConfirm') }} <strong>{{ selectedStudent?.user?.name }}</strong>?</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeDeleteModal">{{ t('common.cancel') }}</button>
              <button class="btn btn-danger" @click="handleDelete" :disabled="formSubmitting">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>{{ t('common.delete') }}</span>
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
                <h3>{{ t('students.deleteStudents') }}</h3>
                <p>{{ t('students.cannotUndo') }}</p>
              </div>
              <button class="modal-x" @click="closeBulkDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">{{ t('students.deleteConfirm') }} <strong>{{ selectedBulkIds.length }} {{ t('students.name').toLowerCase() }}{{ selectedBulkIds.length !== 1 ? 's' : '' }}</strong>?</p>
              <p class="del-warning">{{ t('students.deleteWarning') }}</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeBulkDeleteModal">{{ t('common.cancel') }}</button>
              <button class="btn btn-danger" @click="handleBulkDelete" :disabled="formSubmitting">
                <span v-if="formSubmitting" class="spinner-sm"></span>
                <Trash2 v-else :size="16" />
                <span>{{ t('common.delete') }} {{ selectedBulkIds.length }} {{ t('students.name').toLowerCase() }}{{ selectedBulkIds.length !== 1 ? 's' : '' }}</span>
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
                <h3>{{ t('students.assignStudent') }}</h3>
                <p>{{ t('students.assignToClass') }} {{ selectedStudent?.user?.name }}</p>
              </div>
              <button class="modal-x" @click="closeAssignModal">&times;</button>
            </div>
            <form @submit.prevent="handleAssign">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">
                    <Building :size="15" class="field-icon" />
                    {{ t('students.selectClass') }} <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <select
                      :value="assignForm.class_id"
                      @change="assignForm.class_id = Number(($event.target as HTMLSelectElement).value)"
                      class="styled-input"
                      required
                    >
                      <option :value="null">{{ t('students.chooseClass') }}</option>
                      <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="closeAssignModal">{{ t('common.cancel') }}</button>
                <button type="submit" class="btn btn-primary" :disabled="formSubmitting || !assignForm.class_id">
                  <span v-if="formSubmitting" class="spinner-sm"></span>
                  <Check v-else :size="16" />
                  <span>{{ t('students.assignTo') }}</span>
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
                  <span class="info-role">{{ t('students.name').toLowerCase() }}</span>
                </div>
              </div>

              <div class="info-card">
                <div class="info-row">
                  <span class="info-label"><Hash :size="14" /> {{ t('students.id') }}</span>
                  <span class="info-value">#{{ selectedStudent.id }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><Mail :size="14" /> {{ t('students.email') }}</span>
                  <span class="info-value">{{ selectedStudent.user?.email || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><VenusAndMars :size="14" /> {{ t('students.gender') }}</span>
                  <span class="info-value">{{ selectedStudent.user?.gender || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><BookOpen :size="14" /> {{ t('students.studentIdNumber') }}</span>
                  <span class="info-value">{{ selectedStudent.studentNumberSequence?.student_number || selectedStudent.student_id_number || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><Users :size="14" /> {{ t('students.generationLabel') }}</span>
                  <span class="info-value">{{ selectedStudent.generation?.name || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><Building :size="14" /> {{ t('students.class') }}</span>
                  <span class="info-value">{{ selectedStudent.class?.name || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label"><ToggleLeft :size="14" /> {{ t('students.statusLabel') }}</span>
                  <span class="info-value" :class="'status-' + (selectedStudent.user?.status || 'inactive')">{{ selectedStudent.user?.status || 'inactive' }}</span>
                </div>
                <div class="info-row info-row-last">
                  <span class="info-label"><Calendar :size="14" /> {{ t('students.created') }}</span>
                  <span class="info-value">{{ formatDate(selectedStudent.created_at) }}</span>
                </div>
              </div>
            </div>

            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeDetailsModal">{{ t('common.close') }}</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { onMounted } from 'vue'
import StudentList from './StudentList.vue'
import StudentFormModal from './StudentFormModal.vue'
import { AlertTriangle, Trash2, ArrowRightFromLine, Check, Building, Mail, VenusAndMars, BookOpen, Users, ToggleLeft, Calendar, Hash } from '@lucide/vue'
import { useStudents } from './composables/useStudents.ts'

const { t } = useI18n()

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
