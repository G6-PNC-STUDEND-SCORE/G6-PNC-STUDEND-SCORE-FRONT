<template>
  <div class="search-input-wrapper">
    <Search :size="16" class="search-icon" />
    <input
      :value="modelValue"
      type="text"
      class="search-input"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown.escape="$emit('update:modelValue', '')"
    />
    <button
      v-if="modelValue"
      class="search-clear"
      @click="$emit('update:modelValue', '')"
    >
      <X :size="14" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Search, X } from '@lucide/vue'

withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  {
    placeholder: 'Search...',
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 2.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #0f172a;
  background: #f8fafc;
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: #fff;
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.search-clear:hover {
  background: #f1f5f9;
  color: #475569;
}
</style>
