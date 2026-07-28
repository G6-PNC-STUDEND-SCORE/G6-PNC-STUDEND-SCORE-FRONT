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
            src="https://www.passerellesnumeriques.org/wp-content/uploads/2024/05/PN-Logo-English-Blue-Baseline.png"
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