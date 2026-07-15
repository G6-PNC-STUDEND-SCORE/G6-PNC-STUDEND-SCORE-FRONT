<template>
  <div v-if="show" class="modal fade show" style="display: block;" @click.self="$emit('close')">
    <div class="modal-dialog modal-dialog-centered" @click.stop>
      <div class="modal-content" style="border-radius: 12px; border: none; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
        <div class="modal-header border-0 pt-4 px-4 pb-0">
          <h5 class="modal-title fw-semibold mb-0" style="font-size: 1.25rem;">
            {{ isEdit ? 'Edit Class' : 'Create New Class' }}
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
            style="font-size: 0.8rem;"
          ></button>
        </div>
        <div class="modal-body px-4 pt-3 pb-4">
          <form @submit.prevent="$emit('submit')">
            <div class="row g-3">
              <div class="col-12">
                <label for="name" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">Class Name</label>
                <input
                  type="text"
                  class="form-control"
                  id="name"
                  :value="name"
                  @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
                  :class="{ 'is-invalid': error && error.includes('name') }"
                  placeholder="e.g. Class 10A"
                  style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                  required
                />
              </div>

              <div class="col-12">
                <label for="generation" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">Generation</label>
                <select
                  class="form-select"
                  id="generation"
                  :value="generationId"
                  @change="$emit('update:generationId', ($event.target as HTMLSelectElement).value ? parseInt(($event.target as HTMLSelectElement).value) : null)"
                  :class="{ 'is-invalid': error && error.includes('generation') }"
                  style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                  required
                >
                  <option :value="null">Select Generation</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>

              <div class="col-12">
                <label for="teacher" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">Homeroom Teacher</label>
                <select
                  class="form-select"
                  id="teacher"
                  :value="teacherId"
                  @change="$emit('update:teacherId', ($event.target as HTMLSelectElement).value ? parseInt(($event.target as HTMLSelectElement).value) : null)"
                  style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                >
                  <option :value="null">No Teacher</option>
                  <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                    {{ teacher.name }}
                  </option>
                </select>
              </div>

              <div class="col-12">
                <label for="room" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">Room</label>
                <input
                  type="text"
                  class="form-control"
                  id="room"
                  :value="room"
                  @input="$emit('update:room', ($event.target as HTMLInputElement).value)"
                  :class="{ 'is-invalid': error && error.includes('room') }"
                  placeholder="e.g. Room 101"
                  style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                  required
                />
              </div>

              <div class="col-12">
                <label for="students" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">Number of Students</label>
                <input
                  type="number"
                  class="form-control"
                  id="students"
                  :value="students"
                  @input="$emit('update:students', parseInt(($event.target as HTMLInputElement).value) || 0)"
                  :class="{ 'is-invalid': error && error.includes('students') }"
                  placeholder="e.g. 30"
                  min="0"
                  style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                />
              </div>

              <div class="col-12">
                <label for="status" class="form-label mb-2" style="font-size: 0.875rem; color: #4a5568;">Status</label>
                <select
                  class="form-select"
                  id="status"
                  :value="status"
                  @input="$emit('update:status', ($event.target as HTMLSelectElement).value as 'Active' | 'Inactive')"
                  :class="{ 'is-invalid': error && error.includes('status') }"
                  required
                  style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 0.625rem 0.875rem;"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer border-0 px-4 pb-4 pt-0">
          <button
            type="button"
            class="btn btn-light flex-fill me-2"
            @click="$emit('close')"
            style="border-radius: 8px; padding: 0.625rem; font-weight: 500; color: #4a5568;"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary flex-fill ms-2"
            @click="$emit('submit')"
            :disabled="submitting"
            style="border-radius: 8px; padding: 0.625rem; font-weight: 500; background-color: #2563eb; border-color: #2563eb;"
          >
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            {{ isEdit ? 'Update' : 'Create' }} Class
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  isEdit: boolean
  name: string
  generationId: number | null
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
  'update:generationId': [value: number | null]
  'update:teacherId': [value: number | null]
  'update:room': [value: string]
  'update:students': [value: number]
  'update:status': [value: 'Active' | 'Inactive']
}>()
</script>
