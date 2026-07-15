<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-panel">
          <!-- Header -->
          <div class="modal-header-custom">
            <button class="modal-close-btn" @click="$emit('close')" aria-label="Close">
              <i class="bi bi-x-lg"></i>
            </button>
            <div class="modal-icon icon-import">
              <i class="bi bi-upload"></i>
            </div>
            <h5 class="mb-1 fw-bold">Import Students</h5>
            <p class="modal-subtitle">Upload an Excel file with student data</p>
          </div>

          <!-- Step 1: Download Template + Upload -->
          <div v-if="step === 'upload'" class="modal-body-custom">
            <div class="template-section">
              <button class="template-btn" @click="handleDownloadTemplate">
                <i class="bi bi-download"></i>
                <span>Download Template</span>
              </button>
              <p class="template-hint">
                Fill the template with student data, then upload it below.
              </p>
            </div>

            <!-- Drop Zone -->
            <div
              class="drop-zone"
              :class="{ 'drop-active': isDragging, 'drop-has-file': parsedRows.length > 0 }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              @click="triggerFileInput"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".xlsx,.xls"
                class="d-none"
                @change="handleFileSelect"
              />
              <div v-if="parsedRows.length === 0" class="drop-content">
                <i class="bi bi-file-earmark-arrow-up drop-icon"></i>
                <span class="drop-text">Drag & drop your Excel file here, or click to browse</span>
                <span class="drop-hint">Supports .xlsx and .xls files</span>
              </div>
              <div v-else class="drop-content drop-success">
                <i class="bi bi-check-circle-fill text-success drop-icon"></i>
                <span class="drop-text">{{ fileName }} — <strong>{{ parsedRows.length }}</strong> student(s) found</span>
              </div>
            </div>

            <!-- Error -->
            <div v-if="parseError" class="error-alert">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              {{ parseError }}
            </div>
          </div>

          <!-- Step 2: Preview & Confirm -->
          <div v-else-if="step === 'preview'" class="modal-body-custom">
            <div class="preview-summary">
              <i class="bi bi-people-fill me-2"></i>
              <strong>{{ parsedRows.length }}</strong> student(s) ready to import
            </div>

            <div class="preview-table-wrap">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th>Class</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in previewRows" :key="i">
                    <td class="preview-idx">{{ i + 1 }}</td>
                    <td>{{ row.name }}</td>
                    <td>
                      <span
                        class="preview-badge"
                        :class="row.gender === 'Male' ? 'badge-male' : row.gender === 'Female' ? 'badge-female' : 'badge-none'"
                      >
                        {{ row.gender || '—' }}
                      </span>
                    </td>
                    <td>
                      <span
                        class="preview-badge"
                        :class="row.status === 'active' ? 'badge-active' : row.status === 'inactive' ? 'badge-inactive' : 'badge-none'"
                      >
                        {{ row.status || '—' }}
                      </span>
                    </td>
                    <td>{{ row.class || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="parsedRows.length > 10" class="preview-more">
              ...and {{ parsedRows.length - 10 }} more
            </div>

            <div v-if="importError" class="error-alert mt-3">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              {{ importError }}
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer-custom">
            <button type="button" class="btn-outline" @click="step === 'preview' ? backToUpload() : $emit('close')">
              {{ step === 'preview' ? 'Back' : 'Cancel' }}
            </button>
            <button
              v-if="step === 'upload'"
              type="button"
              class="btn-primary-custom"
              :disabled="parsedRows.length === 0"
              @click="goToPreview"
            >
              <i class="bi bi-eye me-1"></i>
              Preview Data
            </button>
            <button
              v-else
              type="button"
              class="btn-primary-custom btn-import"
              :disabled="importing"
              @click="handleImport"
            >
              <template v-if="importing">
                <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                Importing...
              </template>
              <template v-else>
                <i class="bi bi-check-lg me-1"></i>
                Confirm Import
              </template>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { downloadTemplate, parseExcel, importStudents, type ImportRow } from '@/services/studentImportService'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  imported: [result: { count: number; message?: string }]
}>()

const step = ref<'upload' | 'preview'>('upload')
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const fileName = ref('')
const parsedRows = ref<ImportRow[]>([])
const parseError = ref('')
const importError = ref('')
const importing = ref(false)

const previewRows = computed(() => parsedRows.value.slice(0, 10))

function handleDownloadTemplate() {
  downloadTemplate()
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await processFile(file)
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await processFile(file)
}

async function processFile(file: File) {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ]
  if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    parseError.value = 'Please select a valid Excel file (.xlsx or .xls)'
    return
  }

  parseError.value = ''
  fileName.value = file.name

  try {
    parsedRows.value = await parseExcel(file)
    if (parsedRows.value.length === 0) {
      parseError.value = 'No student data found in the file. Please check the template format.'
    }
  } catch (err) {
    parseError.value = (err as Error).message
    parsedRows.value = []
  }
}

function goToPreview() {
  step.value = 'preview'
}

function backToUpload() {
  step.value = 'upload'
  importError.value = ''
}

async function handleImport() {
  importing.value = true
  importError.value = ''

  try {
    const result = await importStudents(parsedRows.value)
    emit('imported', {
      count: result.imported,
      message: result.message,
    })
    // Reset state
    step.value = 'upload'
    fileName.value = ''
    parsedRows.value = []
    parseError.value = ''
    importError.value = ''
    if (fileInput.value) fileInput.value.value = ''
    emit('close')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    importError.value = err.response?.data?.message || err.message || 'Import failed'
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
/* ==================== Overlay ==================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  padding: 1rem;
}

.modal-panel {
  background: #fff;
  border-radius: 20px;
  width: 580px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
  animation: modalBounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

@keyframes modalBounce {
  0% { transform: scale(0.92) translateY(12px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

/* ==================== Header ==================== */
.modal-header-custom {
  padding: 32px 32px 20px;
  text-align: center;
  position: relative;
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
}

.modal-close-btn:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: rotate(90deg);
}

.modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin: 0 auto 16px;
}

.icon-import {
  background: linear-gradient(135deg, #e0f2fe, #bae6fd);
  color: #0369a1;
}

.modal-header-custom h5 {
  font-size: 1.1rem;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.modal-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}

/* ==================== Body ==================== */
.modal-body-custom {
  padding: 0 32px 8px;
}

/* ==================== Template Section ==================== */
.template-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 20px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
}

.template-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.6rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
  color: #2563eb;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-btn:hover {
  background: #dbeafe;
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.template-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
  text-align: center;
}

/* ==================== Drop Zone ==================== */
.drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 14px;
  padding: 36px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  background: #fafbfc;
  margin-bottom: 16px;
}

.drop-zone:hover {
  border-color: #93c5fd;
  background: #f0f5ff;
}

.drop-active {
  border-color: #2563eb !important;
  background: #eff6ff !important;
}

.drop-has-file {
  border-color: #22c55e;
  background: #f0fdf4;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.drop-icon {
  font-size: 2.2rem;
  color: #94a3b8;
  margin-bottom: 4px;
}

.drop-success .drop-icon {
  font-size: 2.2rem;
}

.drop-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.drop-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* ==================== Error Alert ==================== */
.error-alert {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.8125rem;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

/* ==================== Preview ==================== */
.preview-summary {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.875rem;
  color: #1e40af;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  margin-bottom: 16px;
}

.preview-table-wrap {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.preview-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f8fafc;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
}

.preview-table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f3f5;
  color: #334155;
  vertical-align: middle;
}

.preview-table tbody tr:last-child td {
  border-bottom: none;
}

.preview-table tbody tr:hover {
  background: #f8fafc;
}

.preview-idx {
  color: #94a3b8;
  font-weight: 600;
  width: 40px;
}

.preview-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 100px;
}

.badge-male {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-female {
  background: #fce7f3;
  color: #be185d;
}

.badge-active {
  background: #dcfce7;
  color: #15803d;
}

.badge-inactive {
  background: #f1f5f9;
  color: #64748b;
}

.badge-none {
  background: #f3f4f6;
  color: #9ca3af;
}

.preview-more {
  text-align: center;
  font-size: 0.75rem;
  color: #94a3b8;
  padding: 8px 0;
}

/* ==================== Footer ==================== */
.modal-footer-custom {
  display: flex;
  gap: 10px;
  padding: 16px 32px 28px;
}

.modal-footer-custom button {
  flex: 1;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  font-family: 'Inter', 'Noto Sans Khmer', sans-serif;
}

.btn-outline {
  background: #f1f5f9;
  color: #475569;
  border: 1.5px solid #e2e8f0 !important;
}

.btn-outline:hover {
  background: #e2e8f0;
  border-color: #cbd5e1 !important;
}

.btn-primary-custom {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
}

.btn-primary-custom:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.btn-primary-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-import {
  background: linear-gradient(135deg, #059669, #047857) !important;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3) !important;
}

.btn-import:hover {
  box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4) !important;
}

/* ==================== Transitions ==================== */
.modal-enter-active { transition: all 0.25s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: scale(0.92) translateY(12px);
}

/* ==================== Scrollbar ==================== */
.modal-panel::-webkit-scrollbar,
.preview-table-wrap::-webkit-scrollbar {
  width: 4px;
}
.modal-panel::-webkit-scrollbar-track,
.preview-table-wrap::-webkit-scrollbar-track {
  background: transparent;
}
.modal-panel::-webkit-scrollbar-thumb,
.preview-table-wrap::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
</style>
