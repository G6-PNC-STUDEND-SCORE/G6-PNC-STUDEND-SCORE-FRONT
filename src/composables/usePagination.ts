import { ref, computed, type Ref } from 'vue'

export interface UsePaginationOptions<T> {
  items: Ref<T[]>
  pageSizeOptions?: number[]
  initialPageSize?: number
  onPageChange?: (page: number, pageSize: number) => void
}

export function usePagination<T>(options: UsePaginationOptions<T>) {
  const { items, pageSizeOptions = [10, 25, 50], initialPageSize = 10, onPageChange } = options

  const currentPage = ref(1)
  const pageSize = ref(initialPageSize)

  const totalItems = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)))

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return items.value.slice(start, start + pageSize.value)
  })

  const visiblePages = computed(() => {
    const pages: (number | string)[] = []
    const total = totalPages.value
    const current = currentPage.value

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
      return pages
    }

    pages.push(1)
    if (current > 3) pages.push('...')

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (current < total - 2) pages.push('...')
    pages.push(total)

    return pages
  })

  function changePage(page: number) {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    onPageChange?.(currentPage.value, pageSize.value)
  }

  function changePageSize(size: number) {
    pageSize.value = size
    currentPage.value = 1
    onPageChange?.(currentPage.value, pageSize.value)
  }

  function resetPage() {
    currentPage.value = 1
  }

  return {
    currentPage,
    pageSize,
    pageSizeOptions,
    totalItems,
    totalPages,
    paginatedItems,
    visiblePages,
    changePage,
    changePageSize,
    resetPage,
  }
}
