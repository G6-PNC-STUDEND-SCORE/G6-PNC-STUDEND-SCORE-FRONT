import { reactive, ref, watch } from 'vue'

/**
 * Search text + arbitrary filter fields, with an onChange hook fired whenever
 * either changes — wire this to page-reset logic in server- or client-side lists.
 */
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
