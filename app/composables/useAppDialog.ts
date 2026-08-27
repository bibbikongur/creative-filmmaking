import { reactive } from 'vue'

// ─────────────────────────────────────────────────────────────────────────────
// Site-styled replacement for the native alert/confirm/prompt dialogs, rendered
// by <AppDialog /> (mounted once in app.vue). Only ever triggered from user
// events on the client, so the module-level singleton state is safe.
// ─────────────────────────────────────────────────────────────────────────────

export type AppDialogKind = 'alert' | 'confirm' | 'prompt'

const state = reactive({
  open: false,
  kind: 'alert' as AppDialogKind,
  message: '',
  input: '',
})

let resolver: ((value: unknown) => void) | null = null

function show(kind: AppDialogKind, message: string, input = '') {
  // A dialog opened over another settles the first one as cancelled.
  resolver?.(kind === 'prompt' ? null : false)
  state.kind = kind
  state.message = message
  state.input = input
  state.open = true
  return new Promise((resolve) => { resolver = resolve })
}

export function useAppDialog() {
  const settle = (value: unknown) => {
    state.open = false
    resolver?.(value)
    resolver = null
  }
  return {
    state,
    settle,
    /** Drop-in for alert(): resolves when dismissed. */
    alertDialog: (message: string) => show('alert', message) as Promise<void>,
    /** Drop-in for confirm(): true on OK, false on cancel. */
    confirmDialog: (message: string) => show('confirm', message) as Promise<boolean>,
    /** Drop-in for prompt(): the entered string, or null on cancel. */
    promptDialog: (message: string, initial = '') => show('prompt', message, initial) as Promise<string | null>,
  }
}
