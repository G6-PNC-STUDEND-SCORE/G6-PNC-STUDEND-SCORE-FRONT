<template>
  <div :class="['login-page', { 'dark-mode': theme.isDark }]">
    <!-- Theme Toggle Button -->
    <button
      class="login-theme-toggle"
      @click="theme.toggle()"
      :title="theme.isDark ? 'Switch to Light mode' : 'Switch to Dark mode'"
    >
      <MoonStar v-if="theme.isDark" :size="18" />
      <Sun v-else :size="18" />
    </button>

    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>

    <div class="login-card-wrapper">
      <div class="login-card">
        <div class="text-center mb-2">
          <img
            src="https://www.passerellesnumeriques.org/wp-content/uploads/2024/05/PN-Logo-English-Blue-Baseline.png"
            alt="Passerelles Numériques Cambodia"
            class="pnc-logo"
          />
        </div>

        <h1 class="welcome-heading">Student Score Management System</h1>

        <div v-if="auth.error" class="alert-custom alert-error">
          <AlertTriangle :size="16" />
          <span>{{ auth.error }}</span>
        </div>



        <form @submit.prevent="onSubmit" class="login-form">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <div class="input-wrapper">
              <Mail :size="16" class="input-icon" />
              <input
                id="email"
                v-model="email"
                type="email"
                class="form-input"
                placeholder="you@example.com"
                autocomplete="email"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <div class="input-wrapper">
              <Lock :size="16" class="input-icon" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                minlength="8"
              />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" class="checkbox-input" checked />
              <span class="checkbox-custom">
                <Check :size="12" />
              </span>
              <span class="checkbox-text">Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            class="btn-submit"
            :disabled="auth.loading"
          >
            <template v-if="auth.loading">
              <span class="spinner"></span>
              <span>Signing in...</span>
            </template>
            <template v-else>
              <LogIn :size="18" />
              <span>Sign In</span>
            </template>
          </button>
        </form>

        <div class="google-divider">
          <span class="google-divider-line"></span>
          <span class="google-divider-text">or continue with</span>
          <span class="google-divider-line"></span>
        </div>
        <div ref="googleButtonRef" class="google-btn-wrapper"></div>

        <p class="copyright">&copy; 2026 Passerelles Numériques Cambodia</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { initGoogleClientId } from '@/services/googleAuthService'
import { AlertTriangle, Mail, Lock, EyeOff, Eye, Check, LogIn, MoonStar, Sun } from '@lucide/vue'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            cancel_on_tap_outside?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            options: {
              type?: 'standard' | 'icon'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              width?: number
              logo_alignment?: 'left' | 'center'
            }
          ) => void
          prompt: (momentListener?: (notification: { isNotDisplayed: () => string; isSkippedMoment: () => string; getMomentType: () => string }) => void) => void
        }
      }
    }
  }
}

const router = useRouter()
const theme = useThemeStore()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const googleButtonRef = ref<HTMLElement | null>(null)
let retryTimeout: ReturnType<typeof setTimeout> | undefined

async function onSubmit() {
  const success = await auth.login(email.value, password.value)
  if (success) {
    auth.setLoginMessage(`Welcome back, ${auth.user?.name || 'User'}!`)
    await router.push('/dashboard')
  }
}

function handleGoogleCredential(response: { credential: string }) {
  if (response.credential) {
    auth.loginWithGoogle(response.credential).then(success => {
      if (success) {
        auth.setLoginMessage(`Welcome back, ${auth.user?.name || 'User'}!`)
        setTimeout(() => router.push('/dashboard'), 500)
      }
    })
  }
}

onMounted(() => {
  let retries = 0
  const maxRetries = 20

  function initGoogleSignIn() {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: initGoogleClientId(),
        callback: handleGoogleCredential,
        cancel_on_tap_outside: false,
      })

      if (googleButtonRef.value) {
        window.google.accounts.id.renderButton(googleButtonRef.value, {
          type: 'standard',
          shape: 'pill',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: googleButtonRef.value.offsetWidth || 320,
          logo_alignment: 'center',
        })
      }

      window.google.accounts.id.prompt()
    } else if (retries < maxRetries) {
      retries++
      retryTimeout = setTimeout(initGoogleSignIn, 300)
    } else {
      console.warn('Google Identity Services library failed to load after retries')
    }
  }

  initGoogleSignIn()
})

onUnmounted(() => {
  clearTimeout(retryTimeout)
})
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #e8f0fe 0%, #f0f5ff 40%, #f8faff 70%, #eef4fb 100%);
  overflow: hidden;
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
  transition: background 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Login Page Theme Toggle ── */
.login-theme-toggle {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 100;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.login-theme-toggle:hover {
  border-color: #93c5fd;
  background: rgba(255, 255, 255, 0.95);
  color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.12);
}

.login-theme-toggle:active {
  transform: translateY(0) scale(0.95);
}

.login-page.dark-mode .login-theme-toggle {
  background: rgba(30, 41, 59, 0.6);
  border-color: rgba(71, 85, 105, 0.4);
  color: #94a3b8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.login-page.dark-mode .login-theme-toggle:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(96, 165, 250, 0.3);
  color: #60a5fa;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;
  pointer-events: none;
  animation: blobFloat 12s ease-in-out infinite;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  top: -120px;
  right: -80px;
  animation-delay: 0s;
}

.blob-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #a78bfa, #818cf8);
  bottom: -100px;
  left: -80px;
  animation-delay: -4s;
}

.blob-3 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #34d399, #38bdf8);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -8s;
  opacity: 0.12;
}

@keyframes blobFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.05);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.95);
  }
}

.login-card-wrapper {
  position: relative;
  width: 100%;
  max-width: 420px;
  animation: cardFadeIn 0.6s ease-out;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 2.5rem 2rem;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(59, 130, 246, 0.08),
    0 24px 60px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  animation: cardContentIn 0.5s ease-out 0.15s both;
  transition: background 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.35s ease, box-shadow 0.35s ease;
}

@keyframes cardContentIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pnc-logo {
  height: 62px;
  width: auto;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.pnc-logo:hover {
  transform: scale(1.03);
}


.welcome-heading {
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
  text-align: center;
  margin: 0.75rem 0 0.25rem 0;
  line-height: 1.3;
}

.alert-custom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.8125rem;
  margin-bottom: 1.25rem;
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.alert-error :deep(svg) {
  flex-shrink: 0;
}

.alert-success {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

/* ==========================================
   Form Layout
   ========================================== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
  transition: color 0.2s ease;
  z-index: 2;
}

.form-input {
  width: 100%;
  padding: 0.6rem 0.875rem 0.6rem 2.75rem;
  font-size: 0.875rem;
  color: #1f2937;
  background: #f8fafc;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-input:hover {
  background: #f1f5f9;
  border-color: #d1d5db;
}

.form-input:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.input-wrapper:focus-within .input-icon {
  color: #3b82f6;
}

/* Password with extra padding for toggle button */
.form-input[type="password"],
.form-input[type="text"]#password {
  padding-right: 3rem;
}

.password-toggle {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #9ca3af;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
  padding: 0;
}

.password-toggle:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.password-toggle:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

/* Custom checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-custom :deep(svg) {
  color: transparent;
  transition: color 0.15s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: #3b82f6;
  border-color: #3b82f6;
}

.checkbox-input:checked + .checkbox-custom :deep(svg) {
  color: #ffffff;
}

.checkbox-input:focus-visible + .checkbox-custom {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.checkbox-label:hover .checkbox-custom {
  border-color: #3b82f6;
}

.checkbox-text {
  font-size: 0.8125rem;
  color: #4b5563;
  font-weight: 500;
}

.forgot-link {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s ease;
  white-space: nowrap;
}

.forgot-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.btn-submit {
  width: 100%;
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
  font-family: inherit;
  position: relative;
  overflow: hidden;
}

.btn-submit::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 12px;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-submit:hover:not(:disabled)::before {
  opacity: 1;
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-submit :deep(svg),
.btn-submit span {
  position: relative;
  z-index: 1;
}

/* Spinner */
.spinner {
  width: 1.1rem;
  height: 1.1rem;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  position: relative;
  z-index: 1;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.google-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.5rem 0;
}

.google-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
}

.google-divider-text {
  font-size: 0.65rem;
  color: #9ca3af;
  font-weight: 500;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.google-btn-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 44px;
}

.google-btn-wrapper > div > iframe {
  width: 100% !important;
}

.copyright {
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
  margin: 1.25rem 0 0 0;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}


/* ── Dark Mode ── */
.login-page.dark-mode {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #162032 70%, #0b1120 100%);
}

.login-page.dark-mode .blob-1 {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.2));
}

.login-page.dark-mode .blob-2 {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.2));
}

.login-page.dark-mode .blob-3 {
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(56, 189, 248, 0.2));
}

.login-page.dark-mode .login-card {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(71, 85, 105, 0.4);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2),
    0 8px 32px rgba(59, 130, 246, 0.06),
    0 24px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
}

.login-page.dark-mode .welcome-heading {
  color: #f1f5f9;
}

.login-page.dark-mode .alert-error {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.2);
}

.login-page.dark-mode .form-label {
  color: #cbd5e1;
}

.login-page.dark-mode .form-input {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(71, 85, 105, 0.4);
  color: #f1f5f9;
}

.login-page.dark-mode .form-input::placeholder {
  color: #64748b;
}

.login-page.dark-mode .form-input:hover {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(71, 85, 105, 0.6);
}

.login-page.dark-mode .form-input:focus {
  background: rgba(15, 23, 42, 0.9);
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.login-page.dark-mode .input-icon {
  color: #64748b;
}

.login-page.dark-mode .input-wrapper:focus-within .input-icon {
  color: #60a5fa;
}

.login-page.dark-mode .password-toggle {
  color: #64748b;
}

.login-page.dark-mode .password-toggle:hover {
  background: rgba(51, 65, 85, 0.5);
  color: #cbd5e1;
}

.login-page.dark-mode .checkbox-text {
  color: #94a3b8;
}

.login-page.dark-mode .forgot-link {
  color: #60a5fa;
}

.login-page.dark-mode .forgot-link:hover {
  color: #93c5fd;
}

.login-page.dark-mode .google-divider-line {
  background: linear-gradient(90deg, transparent, rgba(71, 85, 105, 0.5), transparent);
}

.login-page.dark-mode .google-divider-text {
  color: #64748b;
}

.login-page.dark-mode .copyright {
  color: #475569;
  border-top-color: rgba(71, 85, 105, 0.3);
}

@media (max-width: 480px) {
  .login-page {
    padding: 1rem;
    align-items: flex-start;
    padding-top: 2rem;
  }

  .login-card {
    padding: 1.75rem 1.25rem;
    border-radius: 20px;
  }

  .pnc-logo {
    height: 52px;
  }

  .welcome-heading {
    font-size: 1.3rem;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .blob-1 {
    width: 250px;
    height: 250px;
  }

  .blob-2 {
    width: 200px;
    height: 200px;
  }

  .blob-3 {
    display: none;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .login-card {
    padding: 2rem 1.5rem;
  }

  .blob-1 {
    width: 300px;
    height: 300px;
  }

  .blob-2 {
    width: 250px;
    height: 250px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .login-card {
    padding: 2.25rem 1.75rem;
  }
}
</style>
