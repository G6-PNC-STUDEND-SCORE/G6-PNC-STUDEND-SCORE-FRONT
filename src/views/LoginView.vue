<template>
  <div class="container mt-5" style="max-width: 420px">
    <h2 class="mb-4">Login</h2>

    <form @submit.prevent="onSubmit">
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input v-model="email" type="email" class="form-control" required />
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input v-model="password" type="password" class="form-control" required minlength="8" />
      </div>

      <div class="d-grid gap-2">
        <button class="btn btn-primary" :disabled="auth.loading">
          {{ auth.loading ? 'Logging in...' : 'Login' }}
        </button>
      </div>

      <div v-if="auth.error" class="alert alert-danger mt-3">
        {{ auth.error }}
      </div>
    </form>
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

async function onSubmit() {
  const success = await auth.login(email.value, password.value)
  if (success) {
    await router.push('/dashboard')
  }
}
</script>

