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
              <i :class="isEdit ? 'bi bi-pencil-square' : 'bi bi-journal-plus'"></i>
            </div>
            <div>
              <h5>{{ isEdit ? 'Edit Class' : 'Add New Class' }}</h5>
              <p class="modal-subtitle">{{ isEdit ? 'Update class information' : 'Fill in the class details' }}</p>
            </div>
          </div>

          <form @submit.prevent="$emit('submit')">
            <div class="modal-body-custom">
              <div v-if="error" class="error-alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                {{ error }}
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-journal me-1"></i>
                  Class Name
                </label>
                <div class="input-wrapper">
                  <input
                    :value="name"
                    @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
                    type="text"
                    class="modern-input"
                    placeholder="e.g. Class 2027A"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-calendar me-1"></i>
                  Generation Year
                </label>
                <div class="input-wrapper">
                  <input
                    :value="generation"
                    @input="$emit('update:generation', ($event.target as HTMLInputElement).value)"
                    type="text"
                    class="modern-input"
                    placeholder="e.g. 2026"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-person-badge me-1"></i>
                  Homeroom Teacher
                </label>
                <div class="input-wrapper">
                  <select
                    :value="teacherId"
                    @change="$emit('update:teacherId', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
                    class="modern-input"
                  >
                    <option :value="null">— Select Teacher —</option>
                    <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                      {{ teacher.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-door-open me-1"></i>
                  Room
                </label>
                <div class="input-wrapper">
                  <input
                    :value="room"
                    @input="$emit('update:room', ($event.target as HTMLInputElement).value)"
                    type="text"
                    class="modern-input"
                    placeholder="e.g. B32"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-people me-1"></i>
                  Students
                </label>
                <div class="input-wrapper">
                  <input
                    :value="students"
                    @input="$emit('update:students', Number(($event.target as HTMLInputElement).value))"
                    type="number"
                    class="modern-input"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">
                  <i class="bi bi-toggle-on me-1"></i>
                  Status
                </label>
                <div class="status-toggle">
                  <label
                    class="status-option"
                    :class="{ active: status === 'Active', 'active-on': status === 'Active' }"
                  >
                    <input
                      type="radio"
                      :checked="status === 'Active'"
                      @change="$emit('update:status', 'Active')"
                      class="visually-hidden"
                    />
                    <span class="status-dot active"></span>
                    <span class="status-text">Active</span>
                  </label>
                  <label
                    class="status-option"
                    :class="{ active: status === 'Inactive', 'inactive-on': status === 'Inactive' }"
                  >
                    <input
                      type="radio"
                      :checked="status === 'Inactive'"
                      @change="$emit('update:status', 'Inactive')"
                      class="visually-hidden"
                    />
                    <span class="status-dot inactive"></span>
                    <span class="status-text">Inactive</span>
                  </label>
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
                  {{ isEdit ? 'Save Changes' : 'Create Class' }}
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
defineProps<{
  show: boolean
  isEdit: boolean
  name: string
  generation: string
  teacherId: number | null
  room: string
  students: number
  status: 'Active' | 'Inactive'
  teachers: { id: number; name: string }[]
  submitting: boolean
  error: string | null
}>()

defineEmits<{
  close: []
  submit: []
  'update:name': [value: string]
  'update:generation': [value: string]
  'update:teacherId': [value: number | null]
  'update:room': [value: string]
  'update:students': [value: number]
  'update:status': [value: 'Active' | 'Inactive']
}>()
</script>

<style scoped>

</style>
