import { ref } from 'vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmState extends Required<ConfirmOptions> {
  show: boolean
}

// Module-scoped singleton — one confirm dialog instance shared across the
// whole app, rendered once by <ConfirmDialog /> in App.vue.
const state = ref<ConfirmState>({
  show: false,
  title: 'Are you sure?',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
})

let resolver: ((value: boolean) => void) | null = null

function confirm(options: ConfirmOptions): Promise<boolean> {
  state.value = {
    show: true,
    title: options.title ?? 'Are you sure?',
    message: options.message,
    confirmLabel: options.confirmLabel ?? 'Confirm',
    cancelLabel: options.cancelLabel ?? 'Cancel',
    danger: options.danger ?? false,
  }
  return new Promise((resolve) => { resolver = resolve })
}

function settle(value: boolean) {
  state.value.show = false
  resolver?.(value)
  resolver = null
}

export function useConfirm() {
  return {
    confirmState: state,
    confirm,
    accept: () => settle(true),
    cancel: () => settle(false),
  }
}
