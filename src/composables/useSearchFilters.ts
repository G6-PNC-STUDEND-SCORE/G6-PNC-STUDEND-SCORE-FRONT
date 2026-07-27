import { reactive, ref, watch } from 'vue'

export function useSearchFilters<F extends Record<string, unknown>>(
  initialFilters: F,
  onChange?: () => void
) {
  const searchQuery = ref('')
  const filters = reactive({ ...initialFilters }) as F

  watch([searchQuery, filters], () => onChange?.(), { deep: true })

  function resetFilters() {
    searchQuery.value = ''
    Object.assign(filters, initialFilters)
  }

  return { searchQuery, filters, resetFilters }
}
