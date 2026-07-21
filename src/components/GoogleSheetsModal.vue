<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content gsheet-modal">
      <div class="modal-header">
        <h5>
          <i class="bi bi-google" style="color:#4285F4"></i>
          Google Sheets Integration
        </h5>
        <button class="modal-close" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Step 1: Google Account Connection -->
        <div class="gs-section">
          <div class="gs-section-title">
            <span class="gs-step-badge" :class="{ 'gs-step-done': connected }">1</span>
            <span>Connect Google Account</span>
            <span v-if="connecting" class="gs-badge gs-badge-warning">Connecting...</span>
            <span v-else-if="connected" class="gs-badge gs-badge-success">Connected</span>
            <span v-else class="gs-badge gs-badge-secondary">Not Connected</span>
          </div>
          <p class="gs-section-desc">
            Connect your Google account to create and edit spreadsheets directly. 
            This allows teachers to enter scores in Google Sheets and sync them back to the system.
          </p>
          <div v-if="!connected" class="gs-action-row">
            <button class="btn btn-primary" @click="connectGoogle" :disabled="connecting">
              <i class="bi bi-google"></i> Connect to Google
            </button>
            <div v-if="connecting" class="gs-spinner-text">
              <i class="bi bi-arrow-repeat spinning"></i> Waiting for authentication...
            </div>
          </div>
          <div v-else class="gs-connected-info">
            <div class="gs-connected-icon"><i class="bi bi-check-circle-fill"></i></div>
            <div class="gs-connected-details">
              <div class="gs-connected-email">{{ googleEmail || 'Google Account' }}</div>
              <div class="gs-connected-scopes">
                <i class="bi bi-shield-check"></i> Access: Create & edit spreadsheets
              </div>
            </div>
            <button class="btn btn-sm btn-outline-danger" @click="disconnectGoogle" :disabled="connecting">
              <i class="bi bi-box-arrow-right"></i> Disconnect
            </button>
          </div>
        </div>

        <!-- Step 2: Spreadsheet Actions -->
        <div class="gs-section" :class="{ 'gs-section-disabled': !connected }">
          <div class="gs-section-title">
            <span class="gs-step-badge" :class="{ 'gs-step-done': connected }">2</span>
            <span>Create & Sync Spreadsheet</span>
          </div>
          <p class="gs-section-desc">
            Create a new spreadsheet with all current student scores, or sync changes back from an existing sheet.
          </p>
          
          <div class="gs-action-cards">
            <!-- Create / Open Spreadsheet -->
            <div class="gs-action-card">
              <div class="gs-card-icon text-primary">
                <i class="bi bi-file-earmark-spreadsheet"></i>
              </div>
              <div class="gs-card-content">
                <div class="gs-card-title">Create Spreadsheet</div>
                <div class="gs-card-desc">
                  Creates "PNC Student Score Management System" with a sheet tab for 
                  <strong>{{ subjectName }} - {{ termName }}</strong> containing all student data.
                </div>
              </div>
              <button class="btn btn-primary btn-sm" @click="createSpreadsheet" :disabled="syncing">
                <i v-if="syncing" class="bi bi-arrow-repeat spinning"></i>
                <i v-else class="bi bi-plus-circle"></i>
                {{ syncing ? 'Creating...' : 'Create & Open' }}
              </button>
            </div>

            <!-- Sync from Sheets -->
            <div class="gs-action-card">
              <div class="gs-card-icon text-success">
                <i class="bi bi-cloud-download"></i>
              </div>
              <div class="gs-card-content">
                <div class="gs-card-title">Import Scores from Sheet</div>
                <div class="gs-card-desc">
                  Read the latest scores from your Google Sheet and update the system. 
                  Enter the Spreadsheet ID from the URL: 
                  <code>docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit</code>
                </div>
                <div class="gs-import-form">
                  <input v-model="spreadsheetId" type="text" class="form-input" 
                    placeholder="Paste Spreadsheet ID here..." 
                    @click.stop />
                  <button class="btn btn-success btn-sm" @click="importFromSheet" 
                    :disabled="importing || !spreadsheetId.trim()">
                    <i v-if="importing" class="bi bi-arrow-repeat spinning"></i>
                    <i v-else class="bi bi-cloud-download"></i>
                    {{ importing ? 'Importing...' : 'Import' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Last created spreadsheet info -->
          <div v-if="lastSpreadsheetUrl" class="gs-last-sheet">
            <i class="bi bi-link-45deg"></i>
            Last created: 
            <a :href="lastSpreadsheetUrl" target="_blank" rel="noopener">
              {{ lastSpreadsheetName || 'Open Spreadsheet' }}
              <i class="bi bi-box-arrow-up-right"></i>
            </a>
          </div>
        </div>

        <!-- Step 3: Auto-Sync Schedule (Optional) -->
        <div class="gs-section" :class="{ 'gs-section-disabled': !connected }">
          <div class="gs-section-title">
            <span class="gs-step-badge">3</span>
            <span>Auto-Sync (Optional)</span>
          </div>
          <p class="gs-section-desc">
            Set up automatic periodic syncing so scores entered in Google Sheets are 
            automatically imported into the system.
          </p>
          <div class="gs-auto-sync">
            <label class="gs-toggle">
              <input type="checkbox" v-model="autoSyncEnabled" :disabled="!connected" />
              <span class="gs-toggle-slider"></span>
              <span class="gs-toggle-label">Enable automatic sync every hour</span>
            </label>
            <div v-if="autoSyncEnabled" class="gs-note">
              <i class="bi bi-info-circle"></i>
              The backend will check for changes every hour and import new scores. 
              A system administrator needs to set up a cron job for this.
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="gs-status-msg">
          <span v-if="statusMessage" :class="statusClass">
            <i :class="statusIcon"></i> {{ statusMessage }}
          </span>
        </div>
        <button class="btn btn-secondary" @click="closeModal">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  getGoogleConfig,
  exchangeGoogleToken,
  refreshGoogleToken,
  getGoogleStatus,
  disconnectGoogleAccount,
  createGoogleSheet,
  importFromGoogleSheets,
} from '@/services/scoreService'

const props = defineProps<{
  subjectId: number
  termId: number
  subjectName: string
  termName: string
}>()

const emit = defineEmits<{
  close: []
  synced: []
}>()

// ─── State ──────────────────────────────────────────────────────────
const connected = ref(false)
const connecting = ref(false)
const syncing = ref(false)
const importing = ref(false)
const googleEmail = ref('')
const spreadsheetId = ref('')
const lastSpreadsheetUrl = ref('')
const lastSpreadsheetName = ref('')
const autoSyncEnabled = ref(false)
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')
const accessToken = ref('')

let tokenClient: any = null

const statusClass = computed(() => ({
  'text-success': statusType.value === 'success',
  'text-danger': statusType.value === 'error',
  'text-info': statusType.value === 'info',
}))

const statusIcon = computed(() => ({
  success: 'bi bi-check-circle-fill',
  error: 'bi bi-exclamation-circle-fill',
  info: 'bi bi-info-circle-fill',
}[statusType.value] || 'bi bi-info-circle-fill'))

// ─── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  await checkConnectionStatus()
  loadSavedState()
})

function setStatus(msg: string, type: 'success' | 'error' | 'info' = 'info') {
  statusMessage.value = msg
  statusType.value = type
}

// ─── Load saved state from localStorage ─────────────────────────────
function loadSavedState() {
  const savedUrl = localStorage.getItem('gs_last_spreadsheet_url')
  const savedName = localStorage.getItem('gs_last_spreadsheet_name')
  if (savedUrl) lastSpreadsheetUrl.value = savedUrl
  if (savedName) lastSpreadsheetName.value = savedName
  const savedAutoSync = localStorage.getItem('gs_auto_sync')
  if (savedAutoSync === 'true') autoSyncEnabled.value = true
}

function saveSpreadsheetState(url: string, name: string) {
  lastSpreadsheetUrl.value = url
  lastSpreadsheetName.value = name
  localStorage.setItem('gs_last_spreadsheet_url', url)
  localStorage.setItem('gs_last_spreadsheet_name', name)
}

// ─── Check connection status ────────────────────────────────────────
async function checkConnectionStatus() {
  // First check if we have a token in localStorage (from current session)
  const storedToken = localStorage.getItem('google_access_token')
  const storedEmail = localStorage.getItem('google_email')
  
  if (storedToken && storedEmail) {
    accessToken.value = storedToken
    googleEmail.value = storedEmail
    connected.value = true
    return
  }

  // Check with backend for stored refresh tokens
  try {
    const status = await getGoogleStatus()
    if (status.connected) {
      connected.value = true
      if (status.has_valid_token) {
        // Try to refresh to get a working token
        const refreshed = await refreshGoogleToken()
        accessToken.value = refreshed.access_token
        localStorage.setItem('google_access_token', refreshed.access_token)
      }
    }
  } catch {
    // Not connected via backend either
  }
}

// ─── Google OAuth Connection ────────────────────────────────────────
async function connectGoogle() {
  connecting.value = true
  setStatus('Opening Google authentication...', 'info')

  try {
    // Get the Google Client ID from backend
    const config = await getGoogleConfig()
    const clientId = config.client_id

    if (!clientId) {
      setStatus('Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.', 'error')
      connecting.value = false
      return
    }

    // Use Google Identity Services for OAuth
    await loadGoogleScript()
    
    const scope = config.scopes.join(' ')

    // Create the token client
    // GSI handles the redirect internally via popup - no explicit redirect_uri needed
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: scope,
      callback: async (response: any) => {
        if (response.error) {
          const errorMsg = response.error === 'popup_closed_by_user'
            ? 'Authentication cancelled. Please try again.'
            : 'Authentication failed: ' + response.error
          setStatus(errorMsg, 'error')
          connecting.value = false
          return
        }

        // Got the access token
        accessToken.value = response.access_token
        localStorage.setItem('google_access_token', response.access_token)

        // Try to exchange the auth code for a refresh token on the backend
        // This enables auto-sync via cron job
        if (response.code) {
          try {
            const result = await exchangeGoogleToken(response.code)
            if (result.has_refresh_token) {
              setStatus('Connected! Refresh token stored for auto-sync.', 'success')
            }
          } catch (err: any) {
            const msg = err?.response?.data?.message || ''
            if (msg.includes('not configured')) {
              console.warn('Google OAuth refresh token not configured on server')
              setStatus('Connected! Note: Auto-sync requires server-side OAuth config.', 'info')
            } else {
              // Access token works without refresh token
              console.warn('Could not store refresh token:', msg)
            }
          }
        } else {
          setStatus('Connected! (without auto-sync)', 'info')
        }

        // Get user email from token
        try {
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
          })
          const userInfo = await userInfoRes.json()
          googleEmail.value = userInfo.email || 'Connected Account'
          localStorage.setItem('google_email', googleEmail.value)
        } catch {
          googleEmail.value = 'Connected Account'
        }

        connected.value = true
        connecting.value = false
        setStatus('Google account connected successfully!', 'success')
      },
      error_callback: (error: any) => {
        setStatus('Authentication cancelled or failed. Please try again.', 'error')
        connecting.value = false
      },
    })

    // Request access token with consent prompt to potentially get a refresh token code
    tokenClient.requestAccessToken({ prompt: 'consent', include_granted_scopes: true })

  } catch (err: any) {
    setStatus('Failed to connect: ' + (err.message || 'Unknown error'), 'error')
    connecting.value = false
  }
}

// ─── Load Google Identity Services Script ───────────────────────────
function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      // Wait a tiny bit for the library to initialize
      setTimeout(() => {
        if (window.google?.accounts?.oauth2) {
          resolve()
        } else {
          reject(new Error('Google Identity Services library failed to initialize'))
        }
      }, 200)
    }
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'))
    document.head.appendChild(script)
  })
}

// ─── Disconnect ─────────────────────────────────────────────────────
async function disconnectGoogle() {
  connecting.value = true
  try {
    // Remove stored tokens
    localStorage.removeItem('google_access_token')
    localStorage.removeItem('google_email')
    
    // Also disconnect from backend
    try {
      await disconnectGoogleAccount()
    } catch {
      // Backend disconnect is optional
    }

    connected.value = false
    accessToken.value = ''
    googleEmail.value = ''
    setStatus('Google account disconnected.', 'info')
  } catch (err: any) {
    setStatus('Failed to disconnect: ' + (err.message || 'Unknown error'), 'error')
  } finally {
    connecting.value = false
  }
}

// ─── Create Spreadsheet ─────────────────────────────────────────────
async function createSpreadsheet() {
  if (!accessToken.value) {
    setStatus('Please connect your Google account first.', 'error')
    return
  }

  syncing.value = true
  setStatus('Creating spreadsheet...', 'info')

  try {
    const result = await createGoogleSheet(props.subjectId, props.termId, accessToken.value)
    saveSpreadsheetState(result.url, result.name)
    setStatus('Spreadsheet created successfully! Opening in new tab...', 'success')
    
    // Open the spreadsheet in a new tab
    window.open(result.url, '_blank')
    
    emit('synced')
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Failed to create spreadsheet'
    setStatus(message, 'error')
  } finally {
    syncing.value = false
  }
}

// ─── Import from Sheet ──────────────────────────────────────────────
async function importFromSheet() {
  if (!accessToken.value) {
    setStatus('Please connect your Google account first.', 'error')
    return
  }

  if (!spreadsheetId.value.trim()) {
    setStatus('Please enter a Spreadsheet ID.', 'error')
    return
  }

  importing.value = true
  setStatus('Importing scores from Google Sheets...', 'info')

  try {
    const result = await importFromGoogleSheets(
      props.subjectId, 
      props.termId, 
      spreadsheetId.value.trim(), 
      accessToken.value
    )
    setStatus(result.message || 'Scores imported successfully!', 'success')
    emit('synced')
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Failed to import scores'
    setStatus(message, 'error')
  } finally {
    importing.value = false
  }
}

// ─── Close ──────────────────────────────────────────────────────────
function closeModal() {
  emit('close')
}
</script>

<script lang="ts">
// Type declaration for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            redirect_uri?: string
            callback: (response: any) => void
            error_callback?: (error: any) => void
          }) => any
        }
      }
    }
  }
}
</script>

<style scoped>
.gsheet-modal {
  max-width: 620px;
}

.gs-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.gs-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.gs-section-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.gs-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
  margin-bottom: 6px;
}

.gs-step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.gs-step-done {
  background: #22c55e;
  color: white;
}

.gs-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.gs-badge-success { background: #dcfce7; color: #16a34a; }
.gs-badge-warning { background: #fef3c7; color: #d97706; }
.gs-badge-secondary { background: #f1f5f9; color: #64748b; }

.gs-section-desc {
  font-size: 0.82rem;
  color: #64748b;
  margin: 4px 0 12px 32px;
  line-height: 1.5;
}

.gs-action-row {
  margin-left: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.gs-spinner-text {
  font-size: 0.8rem;
  color: #64748b;
}

.gs-connected-info {
  margin-left: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.gs-connected-icon {
  color: #22c55e;
  font-size: 1.5rem;
}

.gs-connected-details {
  flex: 1;
  min-width: 0;
}

.gs-connected-email {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gs-connected-scopes {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 2px;
}

/* Action Cards */
.gs-action-cards {
  margin-left: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gs-action-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.gs-action-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.gs-card-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.gs-card-content {
  flex: 1;
  min-width: 0;
}

.gs-card-title {
  font-weight: 600;
  font-size: 0.88rem;
  color: #1e293b;
  margin-bottom: 4px;
}

.gs-card-desc {
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 8px;
}

.gs-card-desc code {
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.75rem;
  word-break: break-all;
}

.gs-import-form {
  display: flex;
  gap: 8px;
  align-items: center;
}

.gs-import-form .form-input {
  flex: 1;
  font-size: 0.8rem;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;
}

.gs-import-form .form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
}

/* Last sheet link */
.gs-last-sheet {
  margin-top: 12px;
  margin-left: 32px;
  font-size: 0.8rem;
  color: #64748b;
}

.gs-last-sheet a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.gs-last-sheet a:hover {
  text-decoration: underline;
}

/* Auto Sync Toggle */
.gs-auto-sync {
  margin-left: 32px;
}

.gs-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.gs-toggle input[type="checkbox"] {
  display: none;
}

.gs-toggle-slider {
  width: 36px;
  height: 20px;
  background: #e2e8f0;
  border-radius: 10px;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.gs-toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.gs-toggle input:checked + .gs-toggle-slider {
  background: #22c55e;
}

.gs-toggle input:checked + .gs-toggle-slider::after {
  transform: translateX(16px);
}

.gs-toggle-label {
  font-size: 0.85rem;
  color: #1e293b;
}

.gs-note {
  margin-top: 8px;
  padding: 8px 10px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 6px;
  font-size: 0.78rem;
  color: #92400e;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.gs-note i {
  margin-top: 2px;
  flex-shrink: 0;
}

/* Footer */
.gs-status-msg {
  flex: 1;
  font-size: 0.82rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinning {
  animation: spin 0.8s linear infinite;
  display: inline-block;
}
</style>
