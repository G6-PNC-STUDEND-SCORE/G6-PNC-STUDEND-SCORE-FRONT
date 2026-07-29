<template>
  <div class="login-page">
    <!-- Background decorative shapes -->
    <div class="bg-shape bg-shape-1"></div>
    <div class="bg-shape bg-shape-2"></div>
    <div class="bg-shape bg-shape-3"></div>
    <div class="bg-grid"></div>

    <div class="login-card-wrapper">
      <div class="login-card">
        <!-- Logo Section -->
        <div class="login-header">
          <img
            :src="logoSrc"
            alt="Passerelles Numériques Cambodia"
            class="login-logo"
          />
          <h1 class="login-title">Student Score Management System</h1>
          <p class="login-subtitle">Welcome back Please sign in to continue.</p>
        </div>

        <!-- Error Alert -->
        <div v-if="auth.error" class="alert alert-error">
          <AlertTriangle :size="16" />
          <span>{{ auth.error }}</span>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="onSubmit" class="login-form" novalidate>
          <!-- Email -->
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

          <!-- Password -->
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

          <!-- Remember Me + Forgot Password -->
          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" class="checkbox-input" checked />
              <span class="checkbox-custom">
                <Check :size="12" />
              </span>
              <span class="checkbox-text">Remember me</span>
            </label>
            <a href="#" class="forgot-link" @click.prevent>Forgot Password?</a>
          </div>

          <!-- Sign In Button -->
          <button
            type="submit"
            class="btn-primary"
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

        <!-- Divider -->
        <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-text">OR CONTINUE WITH</span>
          <span class="divider-line"></span>
        </div>

        <!-- Google Sign In -->
        <div ref="googleButtonRef" class="google-btn-wrapper"></div>

        <!-- Footer -->
        <p class="login-footer">&copy; 2026 Passerelles Num&eacute;riques Cambodia</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { initGoogleClientId } from '@/services/googleAuthService'
import logoSrc from '@/assets/images/pnc-logo.png'
import { AlertTriangle, Mail, Lock, EyeOff, Eye, Check, LogIn } from '@lucide/vue'

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
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const googleButtonRef = ref<HTMLElement | null>(null)
let retryTimeout: ReturnType<typeof setTimeout> | undefined

async function onSubmit() {
  const success = await auth.login(email.value, password.value)
  if (success) {
    await router.push(auth.defaultLandingPath)
  }
}

function handleGoogleCredential(response: { credential: string }) {
  if (response.credential) {
    auth.loginWithGoogle(response.credential).then(success => {
      if (success) {
        setTimeout(() => router.push(auth.defaultLandingPath), 500)
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
          text: 'continue_with',
          width: googleButtonRef.value.offsetWidth || 380,
          logo_alignment: 'center',
        })
      }
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
/* ============================================================
   Login Page – Premium Redesign
   Inspired by modern SaaS platforms (Notion, Stripe, Linear)
   ============================================================ */

/* ─── Page Container ─── */
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background:
    radial-gradient(ellipse 80% 60% at 0% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse 80% 60% at 100% 50%, rgba(99, 102, 241, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59, 130, 246, 0.04) 0%, transparent 60%),
    linear-gradient(180deg, #f8faff 0%, #f0f5ff 50%, #eef4fb 100%);
  overflow: hidden;
  font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
}

/* ─── Background Shapes ─── */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  will-change: transform;
}

.bg-shape-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.03));
  top: -180px;
  right: -100px;
  animation: shapeFloat 20s ease-in-out infinite;
}

.bg-shape-2 {
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.02));
  bottom: -140px;
  left: -100px;
  animation: shapeFloat 20s ease-in-out infinite reverse;
}

.bg-shape-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.06), transparent);
  top: 40%;
  left: 10%;
  animation: shapeFloat 25s ease-in-out infinite 2s;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

@keyframes shapeFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -30px) scale(1.05); }
  50% { transform: translate(-10px, 20px) scale(0.97); }
  75% { transform: translate(30px, 10px) scale(1.03); }
}

/* ─── Card Wrapper ─── */
.login-card-wrapper {
  position: relative;
  width: 100%;
  max-width: 420px;
  animation: cardEntry 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardEntry {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.97);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ─── Card ─── */
.login-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 2rem 2.25rem;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.03),
    0 4px 12px rgba(0, 0, 0, 0.04),
    0 12px 32px rgba(59, 130, 246, 0.06),
    0 24px 60px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.6);
  animation: cardContentIn 0.5s ease-out 0.15s both;
}

@keyframes cardContentIn {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* ─── Header (Logo + Title + Subtitle) ─── */
.login-header {
  text-align: center;
  margin-bottom: 1.25rem;
}

.login-logo {
  height: 58px;
  width: auto;
  object-fit: contain;
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin-bottom: 0.5rem;
}

.login-logo:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.login-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  font-weight: 400;
}

/* ─── Error Alert ─── */
.alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.875rem;
  border-radius: 10px;
  font-size: 0.8125rem;
  margin-bottom: 1rem;
  animation: alertSlide 0.3s ease-out;
}

@keyframes alertSlide {
  0% { opacity: 0; transform: translateY(-6px); }
  100% { opacity: 1; transform: translateY(0); }
}

.alert-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.alert-error :deep(svg) {
  flex-shrink: 0;
}

/* ─── Form ─── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* ─── Form Group ─── */
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
  letter-spacing: -0.01em;
}

/* ─── Input Wrapper ─── */
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
  color: #94a3b8;
  pointer-events: none;
  transition: color 0.2s ease;
  z-index: 2;
}

/* ─── Input ─── */
.form-input {
  width: 100%;
  padding: 0.55rem 0.875rem 0.55rem 2.75rem;
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 500;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
  line-height: 1.5;
}

.form-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
  font-size: 0.8125rem;
}

.form-input:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.form-input:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.input-wrapper:focus-within .input-icon {
  color: #3b82f6;
}

.form-input[type="password"],
.form-input[type="text"]#password {
  padding-right: 3rem;
}

/* ─── Password Toggle ─── */
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
  color: #94a3b8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
  padding: 0;
}

.password-toggle:hover {
  background: #f1f5f9;
  color: #475569;
}

.password-toggle:active {
  background: #e2e8f0;
  transform: translateY(-50%) scale(0.95);
}

.password-toggle:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ─── Form Options (Remember Me + Forgot Password) ─── */
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.checkbox-label {
  display: inline-flex;
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
  border: 2px solid #cbd5e1;
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
  color: #475569;
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
}

/* ─── Primary Button ─── */
.btn-primary {
  width: 100%;
  padding: 0.55rem 1.5rem;
  font-size: 0.875rem;
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
  margin-top: 0.25rem;
}

.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 12px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.35);
}

.btn-primary:hover:not(:disabled)::before {
  opacity: 1;
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
  transition-duration: 0.08s;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-primary :deep(svg),
.btn-primary span {
  position: relative;
  z-index: 1;
}

/* ─── Spinner ─── */
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
  to { transform: rotate(360deg); }
}

/* ─── Divider ─── */
.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.75rem 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent);
}

.divider-text {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ─── Google Button ─── */
.google-btn-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  min-height: 48px;
}

.google-btn-wrapper > div > iframe {
  width: 100% !important;
}

/* ─── Footer ─── */
.login-footer {
  font-size: 0.7rem;
  color: #94a3b8;
  text-align: center;
  margin: 0.75rem 0 0 0;
  padding-top: 0.625rem;
  border-top: 1px solid #f1f5f9;
  letter-spacing: 0.01em;
}

/* ============================================================
   Responsive
   ============================================================ */

@media (max-width: 480px) {
  .login-page {
    padding: 1rem;
    align-items: flex-start;
    padding-top: 2.5rem;
  }

  .login-card {
    padding: 1.5rem 1.25rem;
    border-radius: 16px;
  }

  .login-logo {
    height: 50px;
  }

  .login-title {
    font-size: 1.05rem;
  }

  .login-subtitle {
    font-size: 0.8125rem;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .bg-shape-1 {
    width: 250px;
    height: 250px;
    top: -80px;
    right: -60px;
  }

  .bg-shape-2 {
    width: 200px;
    height: 200px;
    bottom: -60px;
    left: -60px;
  }

  .bg-shape-3 {
    display: none;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .login-card {
    padding: 2rem 1.5rem;
  }

  .bg-shape-1 {
    width: 300px;
    height: 300px;
  }

  .bg-shape-2 {
    width: 250px;
    height: 250px;
  }
}
</style>
