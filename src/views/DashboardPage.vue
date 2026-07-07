<template>
  <div class="d-flex align-items-center justify-content-center min-vh-100 p-3" style="background: #f0f2f5;">
    <div class="w-100 text-center rounded-4 shadow-sm p-5 bg-white" style="max-width: 480px;">
      <h1 class="mb-3 fw-bold" style="font-size: 1.75rem; color: #1a1a2e;">Dashboard</h1>
      <p class="mb-2" style="font-size: 1rem; color: #374151;">Welcome, {{ auth.user?.name }}!</p>
      <p class="mb-0" style="font-size: 1rem; color: #374151;">
        You are logged in as <strong>{{ auth.user?.role }}</strong>.
      </p>
      <button
        class="btn btn-danger mt-4 px-5 py-3 fw-semibold border-0"
        style="font-size: 0.9375rem; border-radius: 0.625rem;"
        @click="handleLogout"
      >
        Logout
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>
