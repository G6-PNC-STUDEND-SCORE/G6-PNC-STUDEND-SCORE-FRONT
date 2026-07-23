<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" :class="['modal-overlay', { 'dark-mode': theme.isDark }]" @click.self="$emit('close')">
        <div class="modal-content-panel">
          <!-- Header -->
          <div class="modal-header-custom">
            <button class="modal-close-btn" @click="$emit('close')" aria-label="Close">
              <X :size="14" />
            </button>
            <div class="modal-icon" :class="isEdit ? 'icon-edit' : 'icon-create'">
              <SquarePen v-if="isEdit" :size="22" />
              <UserPlus v-else :size="22" />
            </div>
            <h5 class="mb-1 fw-bold">{{ isEdit ? 'Edit Student' : 'Add New Student' }}</h5>
            <p class="modal-subtitle">{{ isEdit ? 'Update student information' : 'Fill in the student details' }}</p>
          </div>

          <form @submit.prevent="$emit('submit')">
            <div class="modal-body-custom">
              <!-- Error Alert -->
              <div v-if="error" class="error-alert">
                <AlertTriangle :size="16" class="me-2" />
                {{ error }}
              </div>

              <!-- Profile Photo (Edit mode only) -->
              <div v-if="isEdit" class="form-group">
                <label class="form-label">
                  <Camera :size="14" class="me-1" />
                  Profile Photo
                </label>
                <div class="photo-upload-area">
                  <!-- Preview -->
                  <div class="photo-preview-wrapper">
                    <div v-if="photoPreview" class="photo-preview">
                      <img :src="photoPreview" alt="Preview" class="preview-img" />
                    </div>
                    <div v-else-if="existingPhotoUrl" class="photo-preview">
                      <img :src="existingPhotoUrl" alt="Current photo" class="preview-img" />
                    </div>
                    <div v-else class="photo-placeholder">
                      <User :size="32" />
                    </div>
                  </div>
                  <div class="photo-actions">
                    <label class="photo-upload-btn">
                      <CloudUpload :size="14" class="me-1" />
                      {{ existingPhotoUrl || photoPreview ? 'Change Photo' : 'Upload Photo' }}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                        class="visually-hidden"
                        @change="onPhotoSelected"
                      />
                    </label>
                    <button
                      v-if="existingPhotoUrl || photoPreview"
                      type="button"
                      class="photo-remove-btn"
                      @click="onRemovePhoto"
                    >
                      <Trash2 :size="14" class="me-1" />
                      Remove
                    </button>
                  </div>
                  <p v-if="photoError" class="photo-error">
                    <AlertCircle :size="14" class="me-1" />
                    {{ photoError }}
                  </p>
                  <p v-else class="photo-hint">JPEG, PNG, JPG, GIF, or WebP. Max 2MB.</p>
                </div>
              </div>

              <!-- Full Name -->
              <div class="form-group">
                <label class="form-label">
                  <User :size="14" class="me-1" />
                  Full Name
                </label>
                <div class="input-wrapper">
                  <input
                    :value="name"
                    @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
                    type="text"
                    class="modern-input"
                    placeholder="e.g. John Smith"
                    required
                  />
                </div>
              </div>

              <!-- Email (Create mode only) -->
              <div v-if="!isEdit" class="form-group">
                <label class="form-label">
                  <Mail :size="14" class="me-1" />
                  Email Address
                </label>
                <div class="input-wrapper">
                  <input
                    :value="email"
                    @input="$emit('update:email', ($event.target as HTMLInputElement).value)"
                    type="email"
                    class="modern-input"
                    placeholder="student@example.com"
                    required
                  />
                </div>
              </div>

              <!-- Password (Create mode only) -->
              <div v-if="!isEdit" class="form-group">
                <label class="form-label">
                  <Lock :size="14" class="me-1" />
                  Password
                </label>
                <div class="input-wrapper">
                  <input
                    :value="password"
                    @input="$emit('update:password', ($event.target as HTMLInputElement).value)"
                    type="password"
                    class="modern-input"
                    placeholder="Min. 8 characters"
                    required
                    minlength="8"
                  />
                </div>
              </div>



              <!-- Gender -->
              <div class="form-group">
                <label class="form-label">
                  <VenusAndMars :size="14" class="me-1" />
                  Gender
                </label>
                <div class="gender-toggle">
                  <label
                    class="gender-option"
                    :class="{ active: gender === 'Male', 'male-active': gender === 'Male' }"
                  >
                    <input
                      type="radio"
                      :checked="gender === 'Male'"
                      @change="$emit('update:gender', 'Male')"
                      class="visually-hidden"
                    />
                    <span class="gender-dot male"></span>
                    <span class="gender-text">Male</span>
                  </label>
                  <label
                    class="gender-option"
                    :class="{ active: gender === 'Female', 'female-active': gender === 'Female' }"
                  >
                    <input
                      type="radio"
                      :checked="gender === 'Female'"
                      @change="$emit('update:gender', 'Female')"
                      class="visually-hidden"
                    />
                    <span class="gender-dot female"></span>
                    <span class="gender-text">Female</span>
                  </label>
                </div>
              </div>

              <!-- Class -->
              <div class="form-group">
                <label class="form-label">
                  <Building2 :size="14" class="me-1" />
                  Assign to Class
                </label>
                <div class="input-wrapper">
                  <select
                    :value="classId"
                    @change="$emit('update:classId', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
                    class="modern-input"
                  >
                    <option :value="null as any">— Not assigned —</option>
                    <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                  </select>
                </div>
              </div>

              <!-- Status -->
              <div class="form-group">
                <label class="form-label">
                  <ToggleLeft :size="14" class="me-1" />
                  Status
                </label>
                <div class="status-toggle">
                  <label
                    class="status-option"
                    :class="{ active: status === 'active', 'active-on': status === 'active' }"
                  >
                    <input
                      type="radio"
                      :checked="status === 'active'"
                      @change="$emit('update:status', 'active')"
                      class="visually-hidden"
                    />
                    <span class="status-dot active"></span>
                    <span class="status-text">Active</span>
                  </label>
                  <label
                    class="status-option"
                    :class="{ active: status === 'inactive', 'inactive-on': status === 'inactive' }"
                  >
                    <input
                      type="radio"
                      :checked="status === 'inactive'"
                      @change="$emit('update:status', 'inactive')"
                      class="visually-hidden"
                    />
                    <span class="status-dot inactive"></span>
                    <span class="status-text">Inactive</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer-custom">
              <button type="button" class="btn-outline" @click="$emit('close')">
                Cancel
              </button>
              <button
                type="submit"
                class="btn-primary-custom"
                :disabled="submitting"
              >
                <template v-if="submitting">
                  <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                  {{ isEdit ? 'Saving...' : 'Creating...' }}
                </template>
                <template v-else>
                  <Check :size="16" class="me-1" />
                  {{ isEdit ? 'Save Changes' : 'Create Student' }}
                </template>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
const theme = useThemeStore()
import { ref, watch } from 'vue'
import type { SchoolClass } from '@/services/studentService'
import {
  X,
  SquarePen,
  UserPlus,
  AlertTriangle,
  Camera,
  User,
  CloudUpload,
  Trash2,
  AlertCircle,
  Mail,
  Lock,
  VenusAndMars,
  Building2,
  ToggleLeft,
  Check,
} from '@lucide/vue'

const props = defineProps<{
  show: boolean
  isEdit: boolean
  name: string
  gender: 'Male' | 'Female'
  classId: number | null
  status: 'active' | 'inactive'
  classes: SchoolClass[]
  submitting: boolean
  error: string | null
  existingPhotoUrl?: string | null
  // Create-only fields
  email?: string
  password?: string
}>()

const emit = defineEmits<{
  close: []
  submit: []
  'update:name': [value: string]
  'update:gender': [value: 'Male' | 'Female']
  'update:classId': [value: number | null]
  'update:status': [value: 'active' | 'inactive']
  'update:photo': [file: File | null]
  'remove-photo': []
  'update:email': [value: string]
  'update:password': [value: string]
}>()

const photoPreview = ref<string | null>(null)
const photoError = ref<string | null>(null)

// Reset photo preview when modal opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    photoPreview.value = null
    photoError.value = null
  }
})

// Watch for existingPhotoUrl changes (when editing different students)
watch(() => props.existingPhotoUrl, () => {
  photoPreview.value = null
  photoError.value = null
})

function onPhotoSelected(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  photoError.value = null

  // Validate file type (extra client-side validation)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    photoError.value = 'Invalid file type. Allowed: JPEG, PNG, JPG, GIF, WebP.'
    target.value = ''
    return
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    photoError.value = 'File is too large. Maximum size is 2MB.'
    target.value = ''
    return
  }

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    photoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  emit('update:photo', file)

  // Reset input so the same file can be re-selected
  target.value = ''
}

function onRemovePhoto() {
  photoPreview.value = null
  photoError.value = null
  emit('remove-photo')
}
</script>

<style scoped>
/* ==================== Overlay ==================== */
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
  border-radius: 20px;
  width: 460px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
  animation: modalBounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

@keyframes modalBounce {
  0% {
    transform: scale(0.92) translateY(12px);
    opacity: 0;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* ==================== Header ==================== */
.modal-header-custom {
  padding: 32px 32px 20px;
  text-align: center;
  position: relative;
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: rotate(90deg);
}

.modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.icon-create {
  background: linear-gradient(135deg, #eef2ff, #dbeafe);
  color: #2563eb;
}

.icon-edit {
  background: linear-gradient(135deg, #e0f2fe, #bae6fd);
  color: #0369a1;
}

.modal-header-custom h5 {
  font-size: 1.1rem;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.modal-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}

/* ==================== Body ==================== */
.modal-body-custom {
  padding: 0 32px 8px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.form-label :deep(svg) {
  color: #94a3b8;
}

/* ==================== Inputs ==================== */
.input-wrapper {
  position: relative;
}

.modern-input {
  width: 100%;
  padding: 0.65rem 0.875rem;
  font-size: 0.875rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  color: #0f172a;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
  appearance: none;
}

.modern-input:hover {
  background: #fff;
  border-color: #cbd5e1;
}

.modern-input:focus {
  background: #fff;
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.modern-input::placeholder {
  color: #94a3b8;
}

select.modern-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

/* ==================== Gender Toggle ==================== */
.gender-toggle {
  display: flex;
  gap: 10px;
}

.gender-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.65rem 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.gender-option:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.gender-option.active.male-active {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
}

.gender-option.active.female-active {
  background: #fdf2f8;
  color: #be185d;
  border-color: #ec4899;
  box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.12);
}

.gender-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.gender-dot.male { background: #3b82f6; }
.gender-dot.female { background: #ec4899; }

.gender-text {
  font-size: 0.8125rem;
}

/* ==================== Status Toggle ==================== */
.status-toggle {
  display: flex;
  gap: 10px;
}

.status-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0.65rem 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.status-option:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.status-option.active.active-on {
  background: #ecfdf5;
  color: #15803d;
  border-color: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

.status-option.active.inactive-on {
  background: #f8fafc;
  color: #64748b;
  border-color: #94a3b8;
  box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.12);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.active { background: #22c55e; }
.status-dot.inactive { background: #94a3b8; }

.status-text {
  font-size: 0.8125rem;
}

/* ==================== Error Alert ==================== */
.error-alert {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.8125rem;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
  margin-bottom: 20px;
}

/* ==================== Footer ==================== */
.modal-footer-custom {
  display: flex;
  gap: 10px;
  padding: 16px 32px 28px;
}

.modal-footer-custom button {
  flex: 1;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.btn-outline {
  background: #f1f5f9;
  color: #475569;
  border: 1.5px solid #e2e8f0 !important;
}

.btn-outline:hover {
  background: #e2e8f0;
  border-color: #cbd5e1 !important;
}

.btn-primary-custom {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
}

.btn-primary-custom:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.btn-primary-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ==================== Photo Upload ==================== */
.photo-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border: 1.5px dashed #d1d5db;
  border-radius: 14px;
  transition: all 0.2s ease;
}

.photo-upload-area:hover {
  border-color: #93c5fd;
  background: #f0f5ff;
}

.photo-preview-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.photo-preview {
  width: 100%;
  height: 100%;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  color: #94a3b8;
}

.photo-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.photo-upload-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.photo-upload-btn:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
}

.photo-remove-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.photo-remove-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.12);
}

.photo-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
  text-align: center;
}

.photo-error {
  font-size: 0.75rem;
  color: #dc2626;
  margin: 0;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 4px;
}

.modal-enter-active { transition: all 0.25s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content-panel,
.modal-leave-to .modal-content-panel {
  transform: scale(0.92) translateY(12px);
}

.modal-content-panel::-webkit-scrollbar { width: 4px; }
.modal-content-panel::-webkit-scrollbar-track { background: transparent; }
.modal-content-panel::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

/* ── Dark Mode ── */
.dark-mode .modal-overlay {
  background: rgba(0,0,0,0.65);
}
.dark-mode .modal-content-panel {
  background: #1e293b;
}
.dark-mode .modal-header-custom h5 {
  color: #f1f5f9;
}
.dark-mode .modal-subtitle {
  color: #94a3b8;
}
.dark-mode .modal-close-btn {
  background: #334155;
  color: #94a3b8;
}
.dark-mode .modal-close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}
.dark-mode .form-label {
  color: #cbd5e1;
}
.dark-mode .form-label :deep(svg) {
  color: #64748b;
}
.dark-mode .modern-input {
  background: #0f172a;
  border-color: #475569;
  color: #e2e8f0;
}
.dark-mode .modern-input:hover {
  background: #1e293b;
  border-color: #64748b;
}
.dark-mode .modern-input:focus {
  background: #1e293b;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}
.dark-mode .modern-input::placeholder {
  color: #64748b;
}
.dark-mode select.modern-input {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
}
.dark-mode .gender-option {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}
.dark-mode .gender-option:hover {
  background: #1e293b;
  border-color: #475569;
}
.dark-mode .gender-option.active.male-active {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border-color: #3b82f6;
}
.dark-mode .gender-option.active.female-active {
  background: rgba(236, 72, 153, 0.1);
  color: #f472b6;
  border-color: #ec4899;
}
.dark-mode .status-option {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}
.dark-mode .status-option:hover {
  background: #1e293b;
  border-color: #475569;
}
.dark-mode .status-option.active.active-on {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
  border-color: #22c55e;
}
.dark-mode .status-option.active.inactive-on {
  background: #334155;
  color: #94a3b8;
  border-color: #64748b;
}
.dark-mode .error-alert {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.2);
}
.dark-mode .btn-outline {
  background: #334155;
  color: #cbd5e1;
  border-color: #475569 !important;
}
.dark-mode .btn-outline:hover {
  background: #475569;
  border-color: #64748b !important;
}
.dark-mode .photo-upload-area {
  background: #0f172a;
  border-color: #475569;
}
.dark-mode .photo-upload-area:hover {
  border-color: #3b82f6;
  background: #1e3a5f;
}
.dark-mode .photo-placeholder {
  background: linear-gradient(135deg, #334155, #475569);
  color: #64748b;
}
.dark-mode .photo-upload-btn {
  background: #1e3a5f;
  color: #60a5fa;
  border-color: #1e40af;
}
.dark-mode .photo-upload-btn:hover {
  background: #1e40af;
  border-color: #3b82f6;
}
.dark-mode .photo-remove-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.2);
}
.dark-mode .photo-remove-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}
.dark-mode .photo-hint {
  color: #64748b;
}
.dark-mode .photo-error {
  color: #fca5a5;
}
</style>
