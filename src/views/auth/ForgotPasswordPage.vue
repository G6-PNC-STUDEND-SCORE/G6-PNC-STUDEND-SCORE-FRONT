<template>
  <div class="fp-page">
    <div class="bg-shape bg-shape-1"></div>
    <div class="bg-shape bg-shape-2"></div>
    <div class="bg-shape bg-shape-3"></div>
    <div class="bg-grid"></div>

    <div class="fp-card-wrapper">
      <div class="fp-card">
        <!-- Header -->
        <div class="fp-header">
          <img :src="logoSrc" alt="PNC" class="fp-logo" />
          <h1 class="fp-title">Reset Password</h1>
          <p class="fp-subtitle">Enter your email and create a new password.</p>
        </div>

        <!-- Success -->
        <div v-if="success" class="alert alert-success">
          <CheckCircle :size="16" />
          <span>{{ successMsg }}</span>
        </div>
        <!-- Error -->
        <div v-if="error" class="alert alert-error">
          <AlertTriangle :size="16" />
          <span>{{ error }}</span>
        </div>

        <!-- Form -->
        <form v-if="!success" @submit.prevent="onSubmit" class="fp-form" novalidate>
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <div class="input-wrapper">
              <Mail :size="16" class="input-icon" />
              <input id="email" v-model="email" type="email" class="form-input" placeholder="you@example.com" autocomplete="email" required />
            </div>
          </div>

          <div class="form-group">
            <label for="new-password" class="form-label">New Password</label>
            <div class="input-wrapper">
              <Lock :size="16" class="input-icon" />
              <input id="new-password" v-model="newPassword" :type="showPass ? 'text' : 'password'" class="form-input" placeholder="Min. 8 characters" autocomplete="new-password" required minlength="8" />
              <button type="button" class="password-toggle" :aria-label="showPass ? 'Hide' : 'Show'" @click="showPass = !showPass">
                <EyeOff v-if="showPass" :size="18" /><Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="confirm-password" class="form-label">Confirm Password</label>
            <div class="input-wrapper">
              <Lock :size="16" class="input-icon" />
              <input id="confirm-password" v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" class="form-input" placeholder="Repeat your password" autocomplete="new-password" required minlength="8" />
              <button type="button" class="password-toggle" :aria-label="showConfirm ? 'Hide' : 'Show'" @click="showConfirm = !showConfirm">
                <EyeOff v-if="showConfirm" :size="18" /><Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <div class="hints">
            <span :class="['hint', { valid: newPassword.length >= 8 }]"><Check :size="11" /> At least 8 characters</span>
            <span :class="['hint', { valid: confirmPassword.length > 0 && newPassword === confirmPassword }]"><Check :size="11" /> Passwords match</span>
          </div>

          <button type="submit" class="btn-primary" :disabled="loading || !isValid">
            <template v-if="loading"><span class="spinner"></span><span>Resetting...</span></template>
            <template v-else><KeyRound :size="16" /><span>Reset Password</span></template>
          </button>
        </form>

        <p class="fp-back">
          <router-link to="/login" class="back-link"><ArrowLeft :size="14" /> Back to Sign In</router-link>
        </p>
        <p class="fp-footer">&copy; 2026 Passerelles Num&eacute;riques Cambodia</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { directResetPassword } from '@/services/authService'
import logoSrc from '@/assets/images/pnc-logo.png'
import { AlertTriangle, Mail, Lock, EyeOff, Eye, Check, ArrowLeft, KeyRound, CheckCircle } from '@lucide/vue'

const email = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPass = ref(false)
const showConfirm = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref(false)
const successMsg = ref('')

const isValid = computed(() =>
  newPassword.value.length >= 8 && confirmPassword.value.length >= 8 && newPassword.value === confirmPassword.value
)

async function onSubmit() {
  if (!isValid.value || !email.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await directResetPassword({
      email: email.value,
      password: newPassword.value,
      password_confirmation: confirmPassword.value,
    })
    success.value = true
    successMsg.value = res.message
  } catch (e: any) {
    error.value = e.response?.data?.message || e.message || 'Failed to reset password.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fp-page {
  position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 1.5rem;
  background: radial-gradient(ellipse 80% 60% at 0% 50%,rgba(59,130,246,0.06) 0%,transparent 60%),
    radial-gradient(ellipse 80% 60% at 100% 50%,rgba(99,102,241,0.06) 0%,transparent 60%),
    radial-gradient(ellipse 60% 40% at 50% 0%,rgba(59,130,246,0.04) 0%,transparent 60%),
    linear-gradient(180deg,#f8faff 0%,#f0f5ff 50%,#eef4fb 100%);
  overflow: hidden;
  font-family: "Inter","Segoe UI",system-ui,-apple-system,sans-serif;
}
.bg-shape { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; will-change:transform; }
.bg-shape-1 { width:500px; height:500px; background:radial-gradient(circle,rgba(59,130,246,0.12),rgba(59,130,246,0.03)); top:-180px; right:-100px; animation:shapeFloat 20s ease-in-out infinite; }
.bg-shape-2 { width:420px; height:420px; background:radial-gradient(circle,rgba(99,102,241,0.1),rgba(99,102,241,0.02)); bottom:-140px; left:-100px; animation:shapeFloat 20s ease-in-out infinite reverse; }
.bg-shape-3 { width:300px; height:300px; background:radial-gradient(circle,rgba(52,211,153,0.06),transparent); top:40%; left:10%; animation:shapeFloat 25s ease-in-out infinite 2s; }
.bg-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px); background-size:60px 60px; pointer-events:none; }
@keyframes shapeFloat { 0%,100%{transform:translate(0,0) scale(1)} 25%{transform:translate(20px,-30px) scale(1.05)} 50%{transform:translate(-10px,20px) scale(0.97)} 75%{transform:translate(30px,10px) scale(1.03)} }

.fp-card-wrapper { position:relative; width:100%; max-width:420px; animation:cardEntry 0.7s cubic-bezier(0.16,1,0.3,1); }
@keyframes cardEntry { 0%{opacity:0;transform:translateY(30px) scale(0.97)} 100%{opacity:1;transform:translateY(0) scale(1)} }
.fp-card { background:#fff; border-radius:20px; padding:2rem 2.25rem; box-shadow:0 1px 2px rgba(0,0,0,0.03),0 4px 12px rgba(0,0,0,0.04),0 12px 32px rgba(59,130,246,0.06),0 24px 60px rgba(0,0,0,0.04); border:1px solid rgba(255,255,255,0.6); }
.fp-header { text-align:center; margin-bottom:1.25rem; }
.fp-logo { height:58px; width:auto; object-fit:contain; margin-bottom:0.5rem; transition:transform 0.3s; }
.fp-logo:hover { transform:scale(1.04); }
.fp-title { font-size:1.05rem; font-weight:700; margin:0 0 0.25rem; line-height:1.3; letter-spacing:-0.02em; background:linear-gradient(135deg,#1e40af,#3b82f6,#60a5fa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.fp-subtitle { font-size:0.875rem; color:#64748b; margin:0; line-height:1.5; font-weight:400; }

.alert { display:flex; align-items:center; gap:0.5rem; padding:0.65rem 0.875rem; border-radius:10px; font-size:0.8125rem; margin-bottom:1rem; animation:alertSlide 0.3s ease-out; }
@keyframes alertSlide { 0%{opacity:0;transform:translateY(-6px)} 100%{opacity:1;transform:translateY(0)} }
.alert-error { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
.alert-success { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; align-items:flex-start; }
.alert-success :deep(svg) { margin-top:1px; }

.fp-form { display:flex; flex-direction:column; gap:0.5rem; }
.form-group { display:flex; flex-direction:column; gap:0.375rem; }
.form-label { font-size:0.8125rem; font-weight:600; color:#374151; margin:0; letter-spacing:-0.01em; }

.input-wrapper { position:relative; display:flex; align-items:center; }
.input-icon { position:absolute; left:0.875rem; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; transition:color 0.2s; z-index:2; }
.form-input { width:100%; padding:0.55rem 0.875rem 0.55rem 2.75rem; font-size:0.875rem; color:#1e293b; font-weight:500; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; outline:none; transition:all 0.2s; font-family:inherit; line-height:1.5; }
.form-input::placeholder { color:#94a3b8; font-weight:400; font-size:0.8125rem; }
.form-input:hover { background:#f1f5f9; border-color:#cbd5e1; }
.form-input:focus { background:#fff; border-color:#3b82f6; box-shadow:0 0 0 4px rgba(59,130,246,0.1); }
.input-wrapper:focus-within .input-icon { color:#3b82f6; }
.form-input[type="password"],.form-input[type="text"]#new-password,.form-input[type="text"]#confirm-password { padding-right:3rem; }

.password-toggle { position:absolute; right:0.5rem; top:50%; transform:translateY(-50%); width:2rem; height:2rem; display:flex; align-items:center; justify-content:center; background:transparent; border:none; color:#94a3b8; border-radius:8px; cursor:pointer; transition:all 0.2s; z-index:2; padding:0; }
.password-toggle:hover { background:#f1f5f9; color:#475569; }
.password-toggle:active { background:#e2e8f0; transform:translateY(-50%) scale(0.95); }

.hints { display:flex; flex-direction:column; gap:0.15rem; }
.hint { display:inline-flex; align-items:center; gap:0.3rem; font-size:0.75rem; color:#94a3b8; transition:color 0.2s; }
.hint.valid { color:#16a34a; }

.btn-primary { width:100%; padding:0.55rem 1.5rem; font-size:0.875rem; font-weight:600; color:#fff; background:linear-gradient(135deg,#2563eb,#3b82f6); border:none; border-radius:12px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; transition:all 0.25s; box-shadow:0 4px 14px rgba(59,130,246,0.3); font-family:inherit; position:relative; overflow:hidden; margin-top:0.25rem; }
.btn-primary::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,#1d4ed8,#2563eb); opacity:0; transition:opacity 0.25s; border-radius:12px; }
.btn-primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 20px rgba(59,130,246,0.35); }
.btn-primary:hover:not(:disabled)::before { opacity:1; }
.btn-primary:active:not(:disabled) { transform:translateY(0); box-shadow:0 2px 8px rgba(59,130,246,0.25); transition-duration:0.08s; }
.btn-primary:disabled { opacity:0.65; cursor:not-allowed; }
.btn-primary :deep(svg),.btn-primary span { position:relative; z-index:1; }

.spinner { width:1.1rem; height:1.1rem; border:2.5px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.6s linear infinite; position:relative; z-index:1; }
@keyframes spin { to{transform:rotate(360deg)} }

.fp-back { text-align:center; margin:1rem 0 0; }
.back-link { display:inline-flex; align-items:center; gap:0.4rem; font-size:0.8125rem; font-weight:600; color:#3b82f6; text-decoration:none; transition:color 0.2s; }
.back-link:hover { color:#2563eb; }
.fp-footer { font-size:0.7rem; color:#94a3b8; text-align:center; margin:0.75rem 0 0; padding-top:0.625rem; border-top:1px solid #f1f5f9; letter-spacing:0.01em; }

@media (max-width:480px) {
  .fp-page { padding:1rem; align-items:flex-start; padding-top:2.5rem; }
  .fp-card { padding:1.5rem 1.25rem; border-radius:16px; }
  .fp-logo { height:50px; }
  .fp-title { font-size:1.05rem; }
}
</style>
