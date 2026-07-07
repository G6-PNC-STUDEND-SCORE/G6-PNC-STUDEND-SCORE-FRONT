<template>
  <div class="container mt-5">
    <h2 class="mb-4">Dashboard</h2>
    <div class="alert alert-success">
      Login successful! Welcome to your dashboard.
    </div>
    <div v-if="auth.user" class="card">
      <div class="card-body">
        <h5 class="card-title">User Information</h5>
        <pre class="bg-light p-3">{{ JSON.stringify(auth.user, null, 2) }}</pre>
      </div>
    </div>
    <div class="mt-4">
      <button @click="handleLogout" class="btn btn-outline-danger">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  // If user is not set but we have a token, init will fetch user data
  if (!auth.user && auth.token) {
    await auth.init()
  }
})

async function handleLogout() {
  await auth.logout()
  await router.push('/login')
}
</script>
