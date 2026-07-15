<template>
  <div class="page-container">
    <!-- ── Toast ── -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast-bar" :class="toast.type">
        <component :is="toastIconComponent" :size="16" />
        <span>{{ toast.message }}</span>
        <button class="toast-close" @click="toast.show = false">&times;</button>
      </div>
    </Transition>

    <!-- ── Header ── -->
    <div class="page-head">
      <div class="page-head-left">
        <div class="page-icon">
          <Users :size="22" />
        </div>
        <div>
          <h1 class="page-title">Classes</h1>
          <p class="page-desc">Manage classes and sections</p>
        </div>
      </div>
      <div class="page-head-right">
        <button class="btn btn-primary" @click="openAddModal">
          <Plus :size="16" />
          <span>Add Class</span>
        </button>
      </div>
    </div>

    <!-- ── Store Messages ── -->
    <div v-if="store.error" class="msg msg-error">
      <AlertTriangle :size="16" />
      {{ store.error }}
      <button class="msg-close" @click="store.clearMessages()">&times;</button>
    </div>
    <div v-if="store.successMessage" class="msg msg-success">
      <CheckCircle :size="16" />
      {{ store.successMessage }}
      <button class="msg-close" @click="store.clearMessages()">&times;</button>
    </div>

    <!-- ── Loading ── -->
    <div v-if="store.loading" class="load-state">
      <div class="spinner"></div>
      <span>Loading classes…</span>
    </div>

    <!-- ── Table ── -->
    <div v-else class="table-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Class</th>
            <th>Generation</th>
            <th>Room</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <TransitionGroup name="row" tag="tbody">
          <tr v-if="filteredClasses.length === 0" key="empty">
            <td colspan="5" class="td-empty">
              <div class="empty-box">
                <Inbox :size="40" />
                <h5>No classes found</h5>
                <p>{{ searchQuery ? 'Try a different search term.' : 'No classes match the current filter.' }}</p>
              </div>
            </td>
          </tr>
          <tr v-for="cls in filteredClasses" :key="cls.id">
            <td class="td-name" @click="openEditModal(cls)">
              <div class="cls-avatar" :style="{ background: classIconBg() }">
                <Users :size="16" />
              </div>
              <span class="cls-name">{{ cls.name }}</span>
            </td>
            <td class="td-meta" @click="openEditModal(cls)">
              <span class="meta-val">{{ cls.academicYear?.name || '—' }}</span>
            </td>
            <td class="td-meta" @click="openEditModal(cls)">
              <span class="meta-val">{{ cls.room || '—' }}</span>
            </td>
            <td class="td-status">
              <span class="pill" :class="cls.is_active ? 'pill-on' : 'pill-off'">
                {{ cls.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="td-actions">
              <button class="act-btn" @click.stop="openEditModal(cls)" title="Edit">
                <Pencil :size="15" />
              </button>
              <button class="act-btn act-danger" @click.stop="confirmDelete(cls)" title="Delete">
                <Trash2 :size="15" />
              </button>
            </td>
          </tr>
        </TransitionGroup>
      </table>
    </div>

    <!-- ── Add / Edit Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="overlay" @click.self="closeModal">
          <div class="modal-card">
            <div class="modal-head">
              <div class="modal-icon" :class="isEditMode ? 'icon-edit' : 'icon-add'">
                <SquarePen v-if="isEditMode" :size="20" />
                <CirclePlus v-else :size="20" />
              </div>
              <div>
                <h3>{{ isEditMode ? 'Edit Class' : 'New Class' }}</h3>
                <p>{{ isEditMode ? 'Update the class details below.' : 'Fill in the details to create a new class.' }}</p>
              </div>
              <button class="modal-x" @click="closeModal">&times;</button>
            </div>
            <form @submit.prevent="handleSubmit" class="modal-body">
              <div class="field">
                <label>Class Name <span class="req">*</span></label>
                <input v-model="formData.name" :class="{ err: errors.name }" placeholder="e.g. Class A" required />
                <span v-if="errors.name" class="field-err">{{ errors.name }}</span>
              </div>
              <div class="field">
                <label>Generation <span class="req">*</span></label>
                <select v-model.number="formData.generation_id" :class="{ err: errors.generation_id }">
                  <option :value="null">Select generation</option>
                  <option v-for="y in academicYears" :key="y.id" :value="y.id">{{ y.name }}</option>
                </select>
                <span v-if="errors.generation_id" class="field-err">{{ errors.generation_id }}</span>
              </div>
              <div class="field">
                <label>Room</label>
                <input v-model="formData.room" placeholder="e.g. B12" />
              </div>
              <div class="field">
                <label>Description</label>
                <textarea v-model="formData.description" placeholder="Optional notes..." rows="3"></textarea>
              </div>
              <div class="field">
                <label>Status</label>
                <select v-model="formData.is_active">
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
              </div>
              <div class="modal-foot">
                <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="store.loading">
                  <span v-if="store.loading" class="spinner-sm"></span>
                  {{ isEditMode ? 'Update Class' : 'Create Class' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete Modal ── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="overlay" @click.self="closeDeleteModal">
          <div class="modal-card modal-sm">
            <div class="modal-head">
              <div class="modal-icon icon-danger">
                <AlertTriangle :size="20" />
              </div>
              <div>
                <h3>Delete Class</h3>
                <p>This action cannot be undone.</p>
              </div>
              <button class="modal-x" @click="closeDeleteModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="del-text">Are you sure you want to delete <strong>{{ classToDelete?.name }}</strong>?</p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="closeDeleteModal">Cancel</button>
              <button class="btn btn-danger" @click="handleDelete" :disabled="store.loading">
                <span v-if="store.loading" class="spinner-sm"></span>
                Delete
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useClassStore } from '@/stores/class'
import type { SchoolClass } from '@/services/classService'
import { getAcademicYears } from '@/services/academicYearService'
import {
  Users, Plus, AlertTriangle, CheckCircle, Inbox, Pencil, Trash2, SquarePen, CirclePlus,
} from '@lucide/vue'

const store = useClassStore()
const searchQuery = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditMode = ref(false)
const classToDelete = ref<SchoolClass | null>(null)
const academicYears = ref<{ id: number; name: string }[]>([])

const formData = reactive({
  name: '',
  generation_id: null as number | null,
  room: '',
  description: '',
  is_active: true,
})

const errors = reactive({ name: '', generation_id: '' })

const classes = computed(() => store.classes)

const filteredClasses = computed(() => {
  let list = classes.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }
  return list
})

function validateForm() {
  let v = true
  if (!formData.name.trim()) { errors.name = 'Name is required'; v = false } else errors.name = ''
  if (!formData.generation_id) { errors.generation_id = 'Generation is required'; v = false } else errors.generation_id = ''
  return v
}

function resetForm() {
  Object.assign(formData, { name: '', generation_id: null, room: '', description: '', is_active: true })
  errors.name = ''; errors.generation_id = ''
}

function openAddModal() {
  isEditMode.value = false
  resetForm()
  showModal.value = true
}

function openEditModal(cls: SchoolClass) {
  isEditMode.value = true
  store.currentClass = cls
  formData.name = cls.name
  formData.generation_id = cls.generation_id
  formData.room = cls.room ?? ''
  formData.description = cls.description ?? ''
  formData.is_active = cls.is_active
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function loadAcademicYears() {
  try {
    const r = await getAcademicYears()
    if (r.success && Array.isArray(r.data)) academicYears.value = r.data
  } catch { academicYears.value = [] }
}

async function handleSubmit() {
  if (!validateForm()) return
  if (isEditMode.value && store.currentClass) {
    const ok = await store.updateClass(store.currentClass.id, formData)
    if (ok) { closeModal(); await store.fetchClasses(); showToast('Class updated successfully') }
  } else {
    const ok = await store.createClass(formData)
    if (ok) { closeModal(); await store.fetchClasses(); showToast('Class created successfully') }
  }
}

function confirmDelete(cls: SchoolClass) { classToDelete.value = cls; showDeleteModal.value = true }
function closeDeleteModal() { showDeleteModal.value = false; classToDelete.value = null }

async function handleDelete() {
  if (!classToDelete.value) return
  const ok = await store.deleteClass(classToDelete.value.id)
  if (ok) { closeDeleteModal(); await store.fetchClasses(); showToast('Class deleted successfully') }
}

const toast = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })
const toastIconComponent = computed(() => toast.type === 'success' ? CheckCircle : AlertTriangle)

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toast.message = msg
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

onMounted(async () => {
  await Promise.all([store.fetchClasses(), loadAcademicYears()])
})

function classIconBg() {
  return '#2563eb'
}
</script>

<style scoped>
.page-container { padding: 1rem 1.5rem 2rem; font-family: 'Inter', 'Noto Sans Khmer', system-ui, sans-serif; color: #0f172a; max-width: 1440px; }
.page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; gap: 16px; flex-wrap: wrap; }
.page-head-left { display: flex; align-items: center; gap: 14px; }
.page-icon { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #2563eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.page-title { font-size: 1.4rem; font-weight: 800; margin: 0 0 2px; letter-spacing: -0.025em; }
.page-desc { font-size: 0.8rem; color: #64748b; margin: 0; }
.page-head-right { display: flex; align-items: center; gap: 10px; }

.msg { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: 500; margin-bottom: 14px; }
.msg-error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
.msg-success { background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }
.msg-close { margin-left: auto; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; opacity: 0.5; padding: 0 4px; }
.msg-close:hover { opacity: 1; }

.load-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 4rem; color: #64748b; }
.spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.7s linear infinite; }
.spinner-sm { display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.table-wrap { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl thead th { padding: 12px 16px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: left; white-space: nowrap; }
.tbl tbody tr { transition: background 0.15s; }
.tbl tbody tr:hover { background: #f8faff; }
.tbl tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
.td-empty { text-align: center; padding: 3rem 1rem; }
.empty-box { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #94a3b8; }
.empty-box h5 { font-weight: 700; color: #64748b; margin: 0; font-size: 1rem; }
.empty-box p { font-size: 0.85rem; margin: 0; }

.td-name { cursor: pointer; }
.cls-avatar { width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; margin-right: 8px; vertical-align: middle; }
.cls-name { font-weight: 600; font-size: 0.9rem; color: #0f172a; }
.td-meta { cursor: pointer; }
.meta-val { font-size: 0.82rem; color: #64748b; }

.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.02em; }
.pill-on { background: #dcfce7; color: #16a34a; }
.pill-off { background: #f1f5f9; color: #94a3b8; }

.td-actions { white-space: nowrap; }
.act-btn { background: none; border: none; padding: 5px 6px; border-radius: 6px; cursor: pointer; color: #94a3b8; transition: all 0.15s; }
.act-btn:hover { background: #f1f5f9; color: #3b82f6; }
.act-danger:hover { background: #fef2f2; color: #ef4444; }

.overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; animation: modal-in 0.25s ease-out; }
.modal-sm { max-width: 380px; }
@keyframes modal-in { 0%{opacity:0;transform:scale(0.92)translateY(10px)} 100%{opacity:1;transform:scale(1)translateY(0)} }
.modal-head { display: flex; align-items: flex-start; gap: 14px; padding: 20px 24px 0; position: relative; }
.modal-head h3 { font-size: 1.05rem; font-weight: 700; margin: 0 0 2px; }
.modal-head p { font-size: 0.82rem; color: #64748b; margin: 0; }
.modal-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
.icon-add { background: #dbeafe; color: #2563eb; }
.icon-edit { background: #fef3c7; color: #d97706; }
.icon-danger { background: #fee2e2; color: #ef4444; }
.modal-x { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; line-height: 1; padding: 4px; }
.modal-x:hover { color: #475569; }
.modal-body { padding: 16px 24px 20px; }
.field { margin-bottom: 14px; }
.field label { display: block; font-size: 0.82rem; font-weight: 600; color: #374151; margin-bottom: 5px; }
.req { color: #ef4444; }
.field input, .field select, .field textarea { width: 100%; padding: 8px 12px; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 0.88rem; outline: none; transition: border-color 0.15s; box-sizing: border-box; font-family: inherit; background: #fff; color: #0f172a; }
.field input:focus, .field select:focus, .field textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
.field input.err, .field select.err { border-color: #ef4444; }
.field-err { display: block; font-size: 0.75rem; color: #ef4444; margin-top: 3px; font-weight: 500; }
.del-text { font-size: 0.9rem; color: #475569; margin: 0; }
.modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 24px 20px; }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 0.5rem 1.125rem; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; font-family: inherit; white-space: nowrap; }
.btn-primary { background: #2563eb; color: #fff; box-shadow: 0 2px 8px rgba(37,99,235,0.2); }
.btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.btn-ghost { background: #f1f5f9; color: #475569; }
.btn-ghost:hover { background: #e2e8f0; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }

.toast-bar { position: fixed; top: 20px; right: 20px; z-index: 99999; display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-radius: 10px; font-size: 0.85rem; font-weight: 500; box-shadow: 0 8px 30px rgba(0,0,0,0.15); max-width: 400px; }
.toast-bar.success { background: #ecfdf5; color: #065f46; border-left: 4px solid #10b981; }
.toast-bar.error { background: #fef2f2; color: #991b1b; border-left: 4px solid #ef4444; }
.toast-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; opacity: 0.6; margin-left: auto; padding: 0 4px; }
.toast-close:hover { opacity: 1; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { transform: translateX(100%); opacity: 0; }
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }
.row-enter-active, .row-leave-active { transition: all 0.3s ease; }
.row-enter-from { opacity: 0; transform: translateX(-20px); }
.row-leave-to { opacity: 0; transform: translateX(20px); }
</style>