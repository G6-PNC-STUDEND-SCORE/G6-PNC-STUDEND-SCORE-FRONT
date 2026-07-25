<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content-panel">
          <div class="modal-header-custom">
            <button class="modal-close-btn" @click="$emit('close')" aria-label="Close">
              <i class="bi bi-x-lg"></i>
            </button>
            <div class="modal-icon" :class="isEdit ? 'icon-edit' : 'icon-create'">
              <i :class="isEdit ? 'bi bi-pencil-square' : 'bi bi-person-plus'"></i>
            </div>
            <div>
              <h5>{{ isEdit ? 'Edit Student' : 'Add New Student' }}</h5>
              <p class="modal-subtitle">{{ isEdit ? 'Update student information' : 'Fill in the student details' }}</p>
            </div>
          </div>

          <form @submit.prevent="$emit('submit')">
            <div class="modal-body-custom">
              <div v-if="error" class="error-alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                {{ error }}
              </div>

              <div v-if="isEdit" class="form-group">
                <label class="form-label">
                  <i class="bi bi-camera me-1"></i>
                  Profile Photo
                </label>
                <div class="photo-upload-area">
                  <div class="photo-preview-wrapper">
                    <div v-if="photoPreview" class="photo-preview">
                      <img :src="photoPreview" alt="Preview" class="preview-img" />
                    </div>
                    <div v-else-if="existingPhotoUrl" class="photo-preview">
                      <img :src="existingPhotoUrl" alt="Current photo" class="preview-img" />
                    </div>
                    <div v-else class="photo-placeholder">
                      <i class="bi bi-person" style="font-size: 2rem;"></i>
                    </div>
                  </div>
                  <div class="photo-actions">
                    <label class="photo-upload-btn">
                      <i class="bi bi-cloud-arrow-up me-1"></i>
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
                      <i class="bi bi-trash me-1"></i>
                      Remove
                    </button>
                  </div>
                  <p v-if="photoError" class="photo-error">
                    <i class="bi bi-exclamation-circle me-1"></i>
                    {{ photoError }}
                  </p>
                  <p v-else class="photo-hint">JPEG, PNG, JPG, GIF, or WebP. Max 2MB.</p>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-person me-1"></i>
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

              <div v-if="!isEdit" class="form-group">
                <label class="form-label">
                  <i class="bi bi-envelope me-1"></i>
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

              <div v-if="!isEdit" class="form-group">
                <label class="form-label">
                  <i class="bi bi-lock me-1"></i>
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

              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-gender-ambiguous me-1"></i>
                  Gender
                </label>
                <div class="input-wrapper">
                  <select
                    :value="gender"
                    @change="$emit('update:gender', ($event.target as HTMLSelectElement).value as 'Male' | 'Female')"
                    class="modern-input"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-building me-1"></i>
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

              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-toggle-on me-1"></i>
                  Status
                </label>
                <div class="input-wrapper">
                  <select
                    :value="status"
                    @change="$emit('update:status', ($event.target as HTMLSelectElement).value as 'active' | 'inactive')"
                    class="modern-input"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

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
                  <i class="bi bi-check-lg me-1"></i>
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
import { ref, watch } from 'vue'
import type { SchoolClass } from '@/services/studentService'

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

watch(() => props.show, (newVal) => {
  if (newVal) {
    photoPreview.value = null
    photoError.value = null
  }
})

watch(() => props.existingPhotoUrl, () => {
  photoPreview.value = null
  photoError.value = null
})

function onPhotoSelected(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  photoError.value = null

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    photoError.value = 'Invalid file type. Allowed: JPEG, PNG, JPG, GIF, WebP.'
    target.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    photoError.value = 'File is too large. Maximum size is 2MB.'
    target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    photoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  emit('update:photo', file)
  target.value = ''
}

function onRemovePhoto() {
  photoPreview.value = null
  photoError.value = null
  emit('remove-photo')
}
</script>

<style scoped>
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
</style>
