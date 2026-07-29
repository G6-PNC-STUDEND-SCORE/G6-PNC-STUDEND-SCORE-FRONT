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
              <h3>{{ isEdit ? t('students.editStudent') : t('students.newStudent') }}</h3>
              <p>{{ isEdit ? t('students.editDesc') : t('students.createDesc') }}</p>
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
                <span v-if="error && !name.trim()" class="field-err">{{ t('students.nameRequired') }}</span>
              </div>

              <div v-if="!isEdit" class="section-divider"></div>

              <div v-if="!isEdit" class="form-row">
                <div class="form-group form-group-flex">
                  <label class="form-label">
                    <Mail :size="14" class="field-icon" />
                    {{ t('students.emailAddress') }} <span class="req">*</span>
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
                  <span v-if="error && !email?.trim()" class="field-err">{{ t('students.emailRequired') }}</span>
                </div>

                <div class="form-group form-group-flex">
                  <label class="form-label">
                    <Lock :size="14" class="field-icon" />
                    {{ t('students.password') }} <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <input
                      :value="password"
                      @input="$emit('update:password', ($event.target as HTMLInputElement).value)"
                      type="password"
                      class="styled-input"
                      :class="{ err: error && (!password || password.length < 8) }"
                      :placeholder="t('students.passwordPlaceholder')"
                      required
                      minlength="8"
                    />
                  </div>
                  <span v-if="error && (!password || password.length < 8)" class="field-err">{{ t('students.passwordRequired') }}</span>
                </div>
              </div>

              <div class="section-divider"></div>

              <div class="form-row">
                <div class="form-group form-group-flex">
                  <label class="form-label">
                    <VenusAndMars :size="14" class="field-icon" />
                    {{ t('students.gender') }}
                  </label>
                  <div class="input-wrap">
                    <select
                      :value="gender"
                      @change="$emit('update:gender', ($event.target as HTMLSelectElement).value as '' | 'Male' | 'Female')"
                      class="styled-input"
                    >
                      <option value="">{{ t('students.selectGender') }}</option>
                      <option value="Male">{{ t('students.male') }}</option>
                      <option value="Female">{{ t('students.female') }}</option>
                    </select>
                  </div>
                </div>

                <div class="form-group form-group-flex">
                  <label class="form-label">
                    <ToggleLeft :size="14" class="field-icon" />
                    {{ t('students.statusLabel') }} <span class="req">*</span>
                  </label>
                  <div class="input-wrap">
                    <select
                      :value="status"
                      @change="$emit('update:status', ($event.target as HTMLSelectElement).value as 'active' | 'inactive' | 'suspended')"
                      class="styled-input"
                      required
                    >
                      <option value="active">{{ t('students.active') }}</option>
                      <option value="inactive">{{ t('students.inactive') }}</option>
                      <option value="suspended">{{ t('students.suspended') }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="section-divider"></div>

              <div class="form-group">
                <label class="form-label">
                  <Building :size="14" class="field-icon" />
                  {{ t('students.assignToClass') }}
                  <span class="opt">{{ t('students.optional') }}</span>
                </label>
                <div class="input-wrap">
                  <select
                    :value="classId"
                    @change="$emit('update:class-id', Number(($event.target as HTMLSelectElement).value) || null)"
                    class="styled-input"
                  >
                    <option :value="null">{{ t('students.notAssigned') }}</option>
                    <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
                  </select>
                </div>
              </div>

              <div class="section-divider"></div>

              <div class="form-group">
                <label class="form-label">
                  <Users :size="14" class="field-icon" />
                  {{ t('students.generationLabel') }}
                  <span class="opt">{{ t('students.optional') }}</span>
                </label>
                <div class="input-wrap">
                  <select
                    :value="generationId"
                    @change="$emit('update:generation-id', Number(($event.target as HTMLSelectElement).value) || null)"
                    class="styled-input"
                  >
                    <option :value="null">{{ t('students.notSelected') }}</option>
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
                <span>{{ isEdit ? t('students.saveChanges') : t('students.createStudent') }}</span>
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
/* ── Modal Overlay ─────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 1rem;
}

/* ── Modal Panel ───────────────────────────── */
.modal-content-panel {
  background: #fff;
  border-radius: 16px;
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 25px 80px rgba(15, 23, 42, 0.2);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  position: relative;
}

.modal-content-panel::-webkit-scrollbar {
  width: 4px;
}
.modal-content-panel::-webkit-scrollbar-track {
  background: transparent;
}
.modal-content-panel::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

/* ── Modal Header ──────────────────────────── */
.modal-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 24px 28px 0;
  position: relative;
}

.modal-head h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 3px;
  line-height: 1.3;
}

.modal-head p {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.modal-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.icon-create {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

.icon-edit {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.2);
}

.modal-x {
  position: absolute;
  top: 18px;
  right: 20px;
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border: none;
  font-size: 1.3rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-x:hover {
  background: #e2e8f0;
  color: #475569;
  transform: rotate(90deg);
}

/* ── Form Body ─────────────────────────────── */
.modal-body-custom {
  padding: 20px 28px 8px;
}

/* ── Error Alert ───────────────────────────── */
.error-alert {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-size: 0.8125rem;
  color: #991b1b;
  background: #fef2f2;
  border-radius: 10px;
  margin-bottom: 16px;
  border-left: 4px solid #ef4444;
  box-shadow: 0 0 0 1px #fecaca;
  transition: box-shadow 0.3s ease;
}

/* ── Section Divider ───────────────────────── */
.section-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e2e8f0, transparent);
  margin: 16px 0 18px;
}

/* ── Form Groups ───────────────────────────── */
.form-group {
  margin-bottom: 4px;
}

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

.opt {
  font-size: 0.7rem;
  font-weight: 400;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 1px 7px;
  border-radius: 4px;
  margin-left: 2px;
}

.field-err {
  display: block;
  font-size: 0.72rem;
  color: #ef4444;
  margin-top: 4px;
  font-weight: 500;
}

.input-wrap {
  position: relative;
}

/* ── Form Row (two columns) ────────────────── */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group-flex {
  min-width: 0;
}

/* ── Inputs & Selects ──────────────────────── */
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

.styled-input:hover {
  border-color: #9ca3af;
}

.styled-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.styled-input::placeholder {
  color: #adb5bd;
}

.styled-input.err {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

select.styled-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

/* ── Modal Footer ──────────────────────────── */
.modal-foot {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 16px 28px 24px;
  border-top: 1px solid #f1f5f9;
  margin-top: 8px;
}

/* ── Transition ────────────────────────────── */
.modal-enter-active {
  transition: all 0.25s ease-out;
}
.modal-leave-active {
  transition: all 0.2s ease-in;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-content-panel,
.modal-leave-to .modal-content-panel {
  transform: scale(0.94) translateY(12px);
}

/* ── Buttons (override global) ─────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem 1.125rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  white-space: nowrap;
}

.btn-ghost {
  background: #f1f5f9;
  color: #475569;
}
.btn-ghost:hover {
  background: #e2e8f0;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
}
.btn-primary:hover {
  background: #1d4ed8;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
