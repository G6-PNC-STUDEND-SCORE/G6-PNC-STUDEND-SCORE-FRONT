<template>
  <div class="d-flex align-items-center justify-content-center min-vh-100 p-3" style="background: #f0f2f5;">
    <div class="w-100 rounded-4 shadow-sm p-4 p-md-5 bg-white" style="max-width: 420px;">
      <!-- Header -->
      <div class="d-flex align-items-center justify-content-center gap-2 mb-4">
        <span class="d-flex align-items-center justify-content-center" style="width: 2.5rem; height: 2.5rem; font-size: 1.5rem; color: #667eea; background: rgba(102, 126, 234, 0.1); border-radius: 0.75rem;">
          <i class="bi bi-mortarboard-fill"></i>
        </span>
        <span class="fw-bold" style="font-size: 1.1rem; color: #1a1a2e;">Student Score Management</span>
      </div>

      <h1 class="text-center mb-1 fw-bold" style="font-size: 1.5rem; color: #1a1a2e;">Welcome Back</h1>
      <p class="text-center mb-4" style="font-size: 0.875rem; color: #6b7280;">Sign in to your account to continue</p>

      <div v-if="auth.error" class="d-flex align-items-center gap-2 p-3 mb-4 rounded-3 text-danger-emphasis bg-danger-subtle border border-danger-subtle" style="font-size: 0.8125rem;">
        <i class="bi bi-exclamation-triangle-fill"></i>
        {{ auth.error }}
      </div>

      <div v-if="loginSuccess" class="d-flex align-items-center gap-2 p-3 mb-4 rounded-3 text-success-emphasis bg-success-subtle border border-success-subtle" style="font-size: 0.8125rem; animation: fadeInUp 0.3s ease-out;">
        <i class="bi bi-check-circle-fill"></i>
        Login successful! Welcome back.
      </div>

      <form @submit.prevent="onSubmit">
        <div class="mb-4">
          <label class="d-block mb-1" style="font-size: 0.8125rem; font-weight: 600; color: #374151;" for="email">Email</label>
          <div class="position-relative d-flex align-items-center">
            <span class="position-absolute start-0 translate-middle-y" style="left: 0.75rem !important; top: 50%; color: #9ca3af; font-size: 1rem; pointer-events: none;">
              <i class="bi bi-envelope-fill"></i>
            </span>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-control ps-5"
              style="padding-top: 0.6875rem; padding-bottom: 0.6875rem; font-size: 0.9375rem; border-radius: 0.625rem; border-color: #e5e7eb;"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </div>
        </div>

        <div class="mb-4">
          <label class="d-block mb-1" style="font-size: 0.8125rem; font-weight: 600; color: #374151;" for="password">Password</label>
          <div class="position-relative d-flex align-items-center">
            <span class="position-absolute start-0 translate-middle-y" style="left: 0.75rem !important; top: 50%; color: #9ca3af; font-size: 1rem; pointer-events: none;">
              <i class="bi bi-lock-fill"></i>
            </span>
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control ps-5 pe-5"
              style="padding-top: 0.6875rem; padding-bottom: 0.6875rem; font-size: 0.9375rem; border-radius: 0.625rem; border-color: #e5e7eb;"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
              minlength="8"
            />
            <button
              type="button"
              class="position-absolute end-0 translate-middle-y d-flex align-items-center justify-content-center btn border-0"
              style="right: 0.5rem !important; top: 50%; width: 1.75rem; height: 1.75rem; font-size: 1.125rem; color: #9ca3af; border-radius: 0.375rem; padding: 0;"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="btn btn-primary w-100 py-3 d-inline-flex align-items-center justify-content-center gap-2 border-0 fw-semibold"
          style="font-size: 0.9375rem; border-radius: 0.625rem; background: #2563eb;"
          :disabled="auth.loading || loginSuccess"
        >
          <template v-if="auth.loading">
            <span class="spinner-border spinner-border-sm" role="status"></span>
            Signing in...
          </template>
          <template v-else>
            <i class="bi bi-box-arrow-in-right"></i>
            Sign In
          </template>
        </button>
      </form>

      <div class="mt-4 pt-4 text-center border-top" style="font-size: 0.875rem; color: #6b7280; border-color: #f3f4f6 !important;">
        Don't have an account?
        <a href="javascript:void(0)" class="fw-semibold text-decoration-none" style="color: #667eea;">Sign Up</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loginSuccess = ref(false)

async function onSubmit() {
  const success = await auth.login(email.value, password.value)
  if (success) {
    loginSuccess.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    await router.push('/dashboard')
    loginSuccess.value = false
  }
}
</script>

<style>
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
</style>
