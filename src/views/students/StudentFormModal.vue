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
