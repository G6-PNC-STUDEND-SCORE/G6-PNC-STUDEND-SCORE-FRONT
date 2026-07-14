<template>
  <div v-if="show" class="modal fade show" style="display: block;" @click.self="$emit('close')">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header border-0 pb-3">
          <h5 class="modal-title fw-medium mb-0">Class Details</h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="modal-body">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label text-muted small">Class Name</label>
              <p class="fw-medium mb-0">{{ classData.name }}</p>
            </div>
            <div class="col-6">
              <label class="form-label text-muted small">Generation</label>
              <p class="mb-0">{{ classData.generation || '—' }}</p>
            </div>
            <div class="col-6">
              <label class="form-label text-muted small">Room</label>
              <p class="mb-0">{{ classData.room }}</p>
            </div>
            <div class="col-6">
              <label class="form-label text-muted small">Students</label>
              <p class="mb-0">{{ classData.students }}</p>
            </div>
            <div class="col-6">
              <label class="form-label text-muted small">Status</label>
              <p class="mb-0">
                <span
                  class="badge"
                  :class="classData.status === 'Active' ? 'bg-success' : 'bg-secondary'"
                >
                  {{ classData.status }}
                </span>
              </p>
            </div>
            <div class="col-12">
              <label class="form-label text-muted small">Homeroom Teacher</label>
              <p class="mb-0">{{ classData.teacher?.name || 'No Teacher' }}</p>
            </div>
          </div>
        </div>
        <div class="modal-footer border-0 pt-3">
          <button type="button" class="btn btn-primary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  classData: {
    id: number
    name: string
    generation: string
    room: string
    students: number
    status: 'Active' | 'Inactive'
    teacher: { id: number; name: string } | null
  }
}>()

defineEmits<{
  close: []
}>()
</script>
