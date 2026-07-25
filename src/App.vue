<template>
  <div id="app">
    <router-view />
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import Toast from '@/components/Toast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
</script>
