<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content-panel">
          <!-- Header -->
          <div class="modal-header-custom">
            <button class="modal-close-btn" @click="$emit('close')" aria-label="Close">
              <i class="bi bi-x-lg"></i>
            </button>
            <div class="modal-icon" :class="isEdit ? 'icon-edit' : 'icon-create'">
              <i :class="isEdit ? 'bi bi-pencil-square' : 'bi bi-person-plus-fill'"></i>
            </div>
            <h5 class="mb-1 fw-bold">{{ isEdit ? 'Edit Student' : 'Add New Student' }}</h5>
            <p class="modal-subtitle">{{ isEdit ? 'Update student information' : 'Fill in the student details' }}</p>
          </div>

          <form @submit.prevent="$emit('submit')">
            <div class="modal-body-custom">
              <!-- Error Alert -->
              <div v-if="error" class="error-alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                {{ error }}
              </div>

              <!-- Full Name -->
              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-person-fill me-1"></i>
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

              <!-- Gender -->
              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-gender-ambiguous me-1"></i>
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
import type { SchoolClass } from '@/services/studentService'

defineProps<{
  show: boolean
  isEdit: boolean
  name: string
  gender: 'Male' | 'Female'
  classId: number | null
  classes: SchoolClass[]
  submitting: boolean
  error: string | null
}>()

defineEmits<{
  close: []
  submit: []
  'update:name': [value: string]
  'update:gender': [value: 'Male' | 'Female']
  'update:classId': [value: number | null]
}>()
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
  font-size: 0.75rem;
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
  font-size: 1.4rem;
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

.form-label i {
  font-size: 0.75rem;
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

.gender-option.active {
  border-color: #2563eb;
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

/* ==================== Transitions ==================== */
.modal-enter-active { transition: all 0.25s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content-panel,
.modal-leave-to .modal-content-panel {
  transform: scale(0.92) translateY(12px);
}

/* ==================== Scrollbar ==================== */
.modal-content-panel::-webkit-scrollbar { width: 4px; }
.modal-content-panel::-webkit-scrollbar-track { background: transparent; }
.modal-content-panel::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
</style>
