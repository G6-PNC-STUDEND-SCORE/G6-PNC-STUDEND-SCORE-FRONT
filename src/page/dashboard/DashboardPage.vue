<template>
  <div class="dashboard-container">
    <div class="dashboard-card">
      <h1>Dashboard</h1>
      <p>Welcome, {{ auth.user?.name }}!</p>
      <p>You are logged in as <strong>{{ auth.user?.role }}</strong>.</p>
      <button class="logout-btn" @click="handleLogout">Logout</button>
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

<style scoped>
.dashboard-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background: #f0f2f5;
}

.dashboard-card {
  width: 100%;
  max-width: 480px;
  padding: 2.5rem 2rem;
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.dashboard-card h1 {
  margin: 0 0 1rem;
  font-size: 1.75rem;
  color: #1a1a2e;
}

.dashboard-card p {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #374151;
}

.logout-btn {
  margin-top: 1.5rem;
  padding: 0.75rem 2rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  background: #ef4444;
  border: none;
  border-radius: 0.625rem;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.logout-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>
