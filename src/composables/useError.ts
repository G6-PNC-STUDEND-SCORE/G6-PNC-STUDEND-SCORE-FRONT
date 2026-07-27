import { ref } from 'vue'
import { extractErrorMessage } from '@/utils'

export function useError() {
  const error = ref<string | null>(null)

  function setError(err: unknown): void {
    error.value = extractErrorMessage(err)
  }

  function clearError(): void {
    error.value = null
  }

  function withError<T>(fn: () => Promise<T>): Promise<T | undefined> {
    clearError()
    return fn().catch((err: unknown) => {
      setError(err)
      return undefined
    })
  }

  return { error, setError, clearError, withError }
}
