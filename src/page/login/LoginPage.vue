<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Header -->
      <div class="login-card__header">
        <span class="login-card__header-icon">
          <i class="bi bi-mortarboard-fill"></i>
        </span>
        <span class="login-card__header-text">Student Score Management</span>
      </div>

      <h1 class="login-card__title">Welcome Back</h1>
      <p class="login-card__subtitle">Sign in to your account to continue</p>

      <div v-if="auth.error" class="login-card__error">
        <i class="bi bi-exclamation-triangle-fill me-1"></i>
        {{ auth.error }}
      </div>

      <form @submit.prevent="onSubmit">
        <div class="login-form__group">
          <label class="login-form__label" for="email">Email</label>
          <div class="login-form__input-wrap">
            <span class="login-form__input-icon">
              <i class="bi bi-envelope-fill"></i>
            </span>
            <input
              id="email"
              v-model="email"
              type="email"
              class="login-form__input"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </div>
        </div>

        <div class="login-form__group">
          <label class="login-form__label" for="password">Password</label>
          <div class="login-form__input-wrap">
            <span class="login-form__input-icon">
              <i class="bi bi-lock-fill"></i>
            </span>
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="login-form__input login-form__input--password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
              minlength="8"
            />
            <button
              type="button"
              class="login-form__toggle-pw"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'bi bi-eye-slash-fill' : 'bi bi-eye-fill'"></i>
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="login-form__submit"
          :disabled="auth.loading"
        >
          <template v-if="auth.loading">
            <span class="spinner"></span>
            Signing in...
          </template>
          <template v-else>
            <i class="bi bi-box-arrow-in-right"></i>
            Sign In
          </template>
        </button>
      </form>

      <div class="login-card__footer">
        Don't have an account?
        <a href="javascript:void(0)" class="login-card__footer-link">Sign Up</a>
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
async function onSubmit() {
  const success = await auth.login(email.value, password.value)
  if (success) {
    await router.push('/dashboard')
  }
}
</script>

<style>
@import '@/css/login.css';
</style>
