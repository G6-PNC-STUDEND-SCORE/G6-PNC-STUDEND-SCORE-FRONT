<template>
  <div v-if="show" class="modal fade show" style="display: block;" @click.self="$emit('close')">
    <div class="modal-dialog modal-sm modal-dialog-centered" @click.stop>
      <div class="modal-content">
        <div class="modal-header border-0 pb-2">
          <h5 class="modal-title fw-medium">Delete Class</h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('close')"
          ></button>
        </div>
        <div class="modal-body pt-2">
          <p class="mb-2">Are you sure you want to delete <strong>{{ className }}</strong>?</p>
          <p class="text-danger small mb-0">This action cannot be undone.</p>
        </div>
        <div class="modal-footer border-0 pt-2">
          <button type="button" class="btn btn-light btn-sm" @click="$emit('close')">Cancel</button>
          <button
            type="button"
            class="btn btn-danger btn-sm"
            @click="$emit('confirm')"
            :disabled="submitting"
          >
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  className: string
  submitting: boolean
}>()

defineEmits<{
  close: []
  confirm: []
}>()
</script>
