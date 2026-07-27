import { ref } from 'vue'

export function useLoading(initialState = false) {
  const loading = ref(initialState)

  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    loading.value = true
    try {
      return await fn()
    } finally {
      loading.value = false
    }
  }

  function start() {
    loading.value = true
  }

  function stop() {
    loading.value = false
  }

  return { loading, withLoading, start, stop }
}
