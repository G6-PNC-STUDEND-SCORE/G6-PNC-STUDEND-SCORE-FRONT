<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content-panel">
          <div class="modal-head">
            <div class="modal-icon" :class="isEdit ? 'icon-edit' : 'icon-create'">
              <SquarePen v-if="isEdit" :size="18" />
              <UserPlus v-else :size="18" />
            </div>
            <div>
              <h3>{{ isEdit ? t('students.editStudent') : t('students.addNewStudent') }}</h3>
              <p>{{ isEdit ? t('students.updateInfo') : t('students.fillDetails') }}</p>
            </div>
            <button class="modal-x" @click="$emit('close')">&times;</button>
          </div>

          <form @submit.prevent="$emit('submit')">
            <div class="modal-body-custom">
              <div v-if="error" class="error-alert">
                <AlertTriangle :size="16" class="me-2" />                {{ error }}
              </div>

              <div class="form-group">
                <label class="form-label">
                  <User :size="14" class="field-icon" />
                  {{ t('students.fullName') }} <span class="req">*</span>
                </label>
                <div class="input-wrap">
                  <input
                    :value="name"
                    @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
                    type="text"
                    class="styled-input"
                    :class="{ err: error && !name.trim() }"
                    :placeholder="t('students.namePlaceholder')"
                    required
                  />
                </div>
                <span v-if="error && !name.trim()" class="field-err">Full name is required</span>
              </div>

              <div v-if="!isEdit" class="section-divider"></div>

              <div v-if="!isEdit" class="form-row">
                <div class="form-group form-group-flex">
                  <label class="form-label">
                    <Mail :size="14" class="field-icon" />
                    {{ t('login.email') }} <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <input
                      :value="email"
                      @input="$emit('update:email', ($event.target as HTMLInputElement).value)"
                      type="email"
                      class="styled-input"
                      :class="{ err: error && !email?.trim() }"
                      :placeholder="t('students.emailPlaceholder')"
                      required
                    />
                  </div>
                  <span v-if="error && !email?.trim()" class="field-err">Email is required</span>
                </div>

                <div class="form-group form-group-flex">
                  <label class="form-label">
                    <Lock :size="14" class="field-icon" />
                    {{ t('login.password') }} <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <input
                      :value="password"
                      @input="$emit('update:password', ($event.target as HTMLInputElement).value)"
                      type="password"
                      class="styled-input"
                      :class="{ err: error && (!password || password.length < 8) }"
                      :placeholder="t('students.passwordHint')"
                      required
                      minlength="8"
                    />
                  </div>
                  <span v-if="error && (!password || password.length < 8)" class="field-err">Password must be at least 8 characters</span>
                </div>
              </div>

              <div class="section-divider"></div>

              <div class="form-row">
                <div class="form-group form-group-flex">
                  <label class="form-label">
                    <VenusAndMars :size="14" class="field-icon" />
                    Gender
                  </label>
                  <div class="input-wrap">
                    <select
                      :value="gender"
                      @change="$emit('update:gender', ($event.target as HTMLSelectElement).value as '' | 'Male' | 'Female')"
                      class="styled-input"
                    >
                      <option value="">— Select gender —</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div class="form-group form-group-flex">
                  <label class="form-label">
                    <ToggleLeft :size="14" class="field-icon" />
                    Status <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <select
                      :value="status"
                      @change="$emit('update:status', ($event.target as HTMLSelectElement).value as 'active' | 'inactive' | 'suspended')"
                      class="styled-input"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="section-divider"></div>

              <div class="form-group">
                <label class="form-label">
                  <Building :size="14" class="field-icon" />                    {{ t('students.assignToClass') }}
                  <span class="opt">({{ t('students.optional') }})</span>
                </label>
                <div class="input-wrap">
                  <select
                    :value="classId"
                    @change="$emit('update:class-id', Number(($event.target as HTMLSelectElement).value) || null)"
                    class="styled-input"
                  >
                    <option :value="null">— {{ t('students.notAssigned') }} —</option>
                    <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                  </select>
                </div>
              </div>

              <div class="section-divider"></div>

              <div class="form-group">
                <label class="form-label">
                  <Users :size="14" class="field-icon" />
                  {{ t('classes.generation') }}
                  <span class="opt">({{ t('students.optional') }})</span>
                </label>
                <div class="input-wrap">
                  <select
                    :value="generationId"
                    @change="$emit('update:generation-id', Number(($event.target as HTMLSelectElement).value) || null)"
                    class="styled-input"
                  >
                    <option :value="null">— {{ t('students.notSelected') }} —</option>
                    <option v-for="gen in generations" :key="gen.id" :value="gen.id">{{ gen.name }}</option>
                  </select>
                </div>
              </div>

            </div>

            <div class="modal-foot">
              <button type="button" class="btn btn-ghost" @click="$emit('close')">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <span v-if="submitting" class="spinner-sm"></span>
                <Check v-else :size="16" />
                <span>{{ isEdit ? t('classes.saveChanges') : t('students.createStudent') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import {
  SquarePen, UserPlus, AlertTriangle, User,
  Check, Mail, Lock, VenusAndMars, ToggleLeft, Building, Users,
} from '@lucide/vue'

import type { SchoolClass, Generation } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  show: boolean
  isEdit: boolean
  name: string
  gender: '' | 'Male' | 'Female'
  status: 'active' | 'inactive' | 'suspended'
  classId: number | null
  classes: SchoolClass[]
  generationId: number | null
  generations: Generation[]
  submitting: boolean
  error: string | null
  email?: string
  password?: string
}>()

const emit = defineEmits<{
  close: []
  submit: []
  'update:name': [value: string]
  'update:gender': [value: '' | 'Male' | 'Female']
  'update:status': [value: 'active' | 'inactive' | 'suspended']
  'update:class-id': [value: number | null]
  'update:generation-id': [value: number | null]
  'update:email': [value: string]
  'update:password': [value: string]
}>()
</script>

<style scoped>
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
  border-radius: 14px;
  width: 520px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modal-in 0.25s ease-out;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

@keyframes modal-in {
  0% { opacity: 0; transform: scale(0.92) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-content-panel::-webkit-scrollbar { width: 4px; }
.modal-content-panel::-webkit-scrollbar-track { background: transparent; }
.modal-content-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-content-panel,
.modal-leave-to .modal-content-panel { transform: scale(0.92) translateY(10px); }

.modal-enter-active .modal-content-panel,
.modal-leave-active .modal-content-panel { transition: transform 0.25s ease-out; }


.modal-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px 0;
  position: relative;
  flex-wrap: nowrap;
}
.modal-head h3 { font-size: 1rem; font-weight: 700; margin: 0 0 2px; }
.modal-head p { font-size: 0.8rem; color: #64748b; margin: 0; }

.modal-x {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}
.modal-x:hover { color: #475569; }

.modal-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.icon-create { background: #dbeafe; color: #2563eb; }
.icon-edit { background: #fef3c7; color: #d97706; }

.modal-body-custom { padding: 14px 24px 10px; }

.form-group { margin-bottom: 0; }

.form-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 5px;
}

.field-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.req {
  color: #ef4444;
  font-weight: 700;
}

.opt {
  font-weight: 400;
  color: #94a3b8;
  font-size: 0.75rem;
}

.field-err {
  display: block;
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 4px;
  font-weight: 500;
}

.input-wrap {
  position: relative;
}

.styled-input {
  width: 100%;
  padding: 8px 11px;
  font-size: 0.85rem;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  color: #0f172a;
  background: #fff;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
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

.styled-input.err {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
}

select.styled-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.section-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e2e8f0, transparent);
  margin: 12px 0 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-group-flex {
  min-width: 0;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 24px 18px;
}


.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-alert {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 0.8rem;
  color: #991b1b;
  background: #fef2f2;
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 3px solid #ef4444;
}

.me-2 { margin-right: 8px; }
</style>

<!-- ════════════════════════════════════════
     DARK MODE — NON-SCOPED
     (scoped styles can't reach .dark-mode on parent)
     ════════════════════════════════════════ -->
<style>
.dark-mode .modal-content-panel {
  background: #1e293b !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4) !important;
}

.dark-mode .modal-overlay {
  background: rgba(0, 0, 0, 0.6) !important;
}

.dark-mode .modal-head h3 {
  color: #f1f5f9 !important;
}

.dark-mode .modal-head p {
  color: #94a3b8 !important;
}

.dark-mode .modal-x {
  color: #64748b !important;
}

.dark-mode .modal-x:hover {
  color: #94a3b8 !important;
}

.dark-mode .icon-create {
  background: rgba(37, 99, 235, 0.15) !important;
  color: #60a5fa !important;
}

.dark-mode .icon-edit {
  background: rgba(245, 158, 11, 0.15) !important;
  color: #fbbf24 !important;
}

.dark-mode .form-label {
  color: #cbd5e1 !important;
}

.dark-mode .field-icon {
  color: #64748b !important;
}

.dark-mode .styled-input {
  background: #1e293b !important;
  border-color: #475569 !important;
  color: #e2e8f0 !important;
}

.dark-mode .styled-input:hover {
  border-color: #64748b !important;
}

.dark-mode .styled-input:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
}

.dark-mode .styled-input::placeholder {
  color: #64748b !important;
}

.dark-mode select.styled-input {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
  background-color: #1e293b !important;
}

.dark-mode select.styled-input option {
  background: #1e293b !important;
  color: #e2e8f0 !important;
}

.dark-mode .section-divider {
  background: linear-gradient(to right, transparent, #334155, transparent) !important;
}

.dark-mode .error-alert {
  background: rgba(239, 68, 68, 0.12) !important;
  color: #fca5a5 !important;
  border-left-color: #ef4444 !important;
}

.dark-mode .opt {
  color: #64748b !important;
}

.dark-mode .modal-content-panel::-webkit-scrollbar-thumb {
  background: #475569 !important;
}

.dark-mode .btn-ghost {
  background: rgba(51, 65, 85, 0.5) !important;
  border-color: #475569 !important;
  color: #cbd5e1 !important;
}

.dark-mode .btn-ghost:hover {
  background: rgba(51, 65, 85, 0.7) !important;
  border-color: #60a5fa !important;
}

.dark-mode .btn-primary {
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #fff !important;
}

.dark-mode .btn-danger {
  background: rgba(239, 68, 68, 0.8) !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
}
</style>
