import { ref } from 'vue'

interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error'
}

const state = ref<ToastState>({ show: false, message: '', type: 'success' })
let hideTimer: ReturnType<typeof setTimeout> | null = null

function display(message: string, type: 'success' | 'error', duration: number) {
  if (hideTimer) clearTimeout(hideTimer)
  state.value = { show: true, message, type }
  hideTimer = setTimeout(() => { state.value.show = false }, duration)
}

export function useToast() {
  return {
    toast: state,
    success: (message: string, duration = 3000) => display(message, 'success', duration),
    error: (message: string, duration = 3000) => display(message, 'error', duration),
    hide: () => { state.value.show = false },
  }
}
