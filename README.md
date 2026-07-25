# Student Score Management System - Frontend

Vue 3 SPA for managing students, classes, subjects, scores, and reports. Communicates with the Laravel 12 backend via REST APIs.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Vue | 3.5 | Frontend Framework |
| TypeScript | 6.0 | Type Safety |
| Vite | 8.0 | Build Tool |
| Vue Router | 5.1 | Page Navigation |
| Pinia | 3.0 | State Management |
| Axios | 1.18 | HTTP Client |
| Bootstrap | 5.3 | UI Framework |
| Bootstrap Icons | 1.13 | Icons |
| Lucide Vue | 1.24 | Icons |
| ECharts | 6.1 | Charts |
| vue-echarts | 8.0 | Charts wrapper |
| Chart.js | 4.5 | Charts (legacy) |
| vue-chartjs | 5.3 | Charts wrapper (legacy) |
| jsPDF | 4.2 | PDF generation |
| jspdf-autotable | 5.0 | PDF tables |
| xlsx | 0.18 | Excel import/export |
| vue-i18n | 9.14 | Internationalization |
| oxlint | 1.69 | Linting |
| oxfmt | 0.54 | Formatting |
| eslint | 10.5 | Linting (legacy) |

### Dev Dependencies

| Technology | Version | Purpose |
|---|---|---|
| @vitejs/plugin-vue | 6.0 | Vite Vue plugin |
| vue-tsc | 3.3 | TypeScript checking |
| vite-plugin-vue-devtools | 8.1 | Dev tools |
| npm-run-all2 | 9.0 | Script runner |

### Engine Requirements

- Node.js >= 22.18.0 or >= 24.12.0

## Project Structure

```text
src/
├── assets/                  # Images, fonts
├── components/              # Reusable Vue components
│   ├── common/              # PageHeader, AppCard, ActionButtons, SearchInput
│   ├── AnimatedNumber.vue   # Animated number transitions
│   ├── ConfirmDialog.vue    # Global confirm dialog (uses Modal + useConfirm)
│   ├── DataTable.vue        # Shared data table with selection & sorting
│   ├── EChart.vue           # ECharts wrapper
│   ├── EmptyState.vue       # Empty state placeholder
│   ├── FilterBar.vue        # Filter bar component
│   ├── GoogleSheetsModal.vue# Google Sheets integration modal
│   ├── KpiCard.vue          # KPI card display
│   ├── LanguageSwitcher.vue # Language toggle
│   ├── LoadingState.vue     # Loading spinner/skeleton
│   ├── Modal.vue            # Shared modal overlay (global CSS)
│   ├── Navigation.vue       # Sidebar navigation
│   └── Toast.vue            # Global toast notifications (reads from useToast)
├── composables/             # Reusable logic (all global singletons)
│   ├── useToast.ts          # Global singleton toast composable
│   ├── useConfirm.ts        # Global singleton confirm dialog
│   ├── useLoading.ts        # Loading state management
│   ├── usePermission.ts     # RBAC permission checks
│   └── useError.ts          # Error extraction utility
├── constants/               # Centralized app constants
│   └── index.ts             # ROLES, CACHE_KEYS, CACHE_TTL, SIDEBAR, PAGINATION, DEBOUNCE, etc.
├── layouts/
│   ├── AuthLayout.vue       # Login page layout (minimal)
│   └── MainLayout.vue       # Protected routes layout (sidebar + header)
├── locales/                 # i18n translation files
├── router/
│   ├── index.ts             # Vue Router instance with guards
│   └── routes.ts            # Route definitions (nested under MainLayout)
├── services/                # Axios-based API service layer (all import from apiHttp.ts)
│   ├── apiHttp.ts           # Shared Axios instance with auth/token interceptors
│   ├── authService.ts       # Login, logout, Google OAuth, password reset
│   ├── academicYearService.ts
│   ├── cacheService.ts      # Client-side caching
│   ├── classService.ts      # Class CRUD
│   ├── dashboardService.ts  # Dashboard stats
│   ├── emailDomainRuleService.ts
│   ├── googleAuthService.ts # Google OAuth token exchange
│   ├── permissionService.ts # Permission/role management
│   ├── profileService.ts    # User profile
│   ├── scoreService.ts      # Score management
│   ├── studentPortalService.ts
│   ├── studentService.ts    # Student CRUD
│   ├── subjectService.ts    # Subject CRUD
│   ├── subjectTermService.ts# Subject-term assignments
│   └── userService.ts       # User management
├── stores/                  # Pinia state stores
│   └── auth.ts              # Auth store (user, token, login/logout)
├── styles/
│   └── global.css           # Global CSS: custom properties, shared table/form/modal/badge/toolbar/search/filter/pagination/button classes
├── types/                   # Centralized TypeScript interfaces (no duplicates)
│   ├── auth.ts              # User, Role, Permission, LoginPayload, AuthResponse
│   ├── models.ts            # Student, SchoolClass, Subject, Teacher, Term, AcademicYear, etc.
│   ├── score.ts             # Score, ScoreDetail, AssessmentType
│   ├── portal.ts            # Student portal types
│   ├── dashboard.ts         # Dashboard stats types
│   └── index.ts             # Re-exports all types
├── utils/                   # Shared utility functions
│   └── index.ts             # getUserInitials, extractErrorMessage, formatNumber, debounce, generateAvatarGradient
├── views/                   # Application pages
│   ├── auth/
│   │   └── LoginPage.vue
│   ├── students/
│   │   ├── StudentPage.vue      # Student management page
│   │   ├── StudentList.vue      # Student table/list
│   │   ├── StudentFormModal.vue # Create/edit student form
│   │   └── StudentDetailsModal.vue
│   ├── classes/
│   │   ├── ClassPage.vue        # Class management page
│   │   ├── ClassList.vue        # Class table/list
│   │   ├── ClassFormModal.vue   # Create/edit class form
│   │   ├── ClassDetailsModal.vue
│   │   └── ClassDeleteModal.vue
│   ├── teachers/
│   │   └── TeacherPage.vue
│   ├── users/
│   │   └── UsersPage.vue
│   ├── roles/
│   │   ├── RolesPage.vue
│   │   └── DomainRulesPanel.vue
│   ├── scores/
│   │   ├── ScorePage.vue
│   │   ├── ScoreSheetView.vue
│   │   └── TermSubjectsView.vue
│   ├── reports/
│   │   └── ReportPage.vue
│   ├── portal/
│   │   ├── StudentPortalPage.vue    # Student self-service portal
│   │   ├── StudentScoresPage.vue    # Student score view
│   │   └── StudentTranscriptPage.vue# Transcript view/download
│   ├── SubjectPage.vue
│   ├── DashboardView.vue
│   ├── SettingsPage.vue
│   └── UserProfile.vue
├── i18n.ts                  # vue-i18n setup
├── App.vue                  # Minimal shell: <router-view> + global Toast + ConfirmDialog
└── main.ts                  # Entry point (imports global.css, registers plugins)
```

## Installation

```bash
git clone https://github.com/G6-PNC-STUDEND-SCORE/G6-PNC-STUDEND-SCORE-FRONT.git
cd frontend
npm install
cp .env.example .env
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API URL | `http://127.0.0.1:8000/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `VITE_GOOGLE_REDIRECT_URI` | OAuth callback URL | - |

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run build-only` | Production build (no type-check) |
| `npm run lint` | Run oxlint + eslint with auto-fix |
| `npm run format` | Format with oxfmt |
| `npm run type-check` | vue-tsc type checking only |
| `npm run preview` | Preview production build |

## Architecture

### Types

Centralized in `src/types/` -- no duplicate interfaces across services. All services import types from `@/types`.

- `auth.ts` -- User, Role, Permission, LoginPayload, AuthResponse
- `models.ts` -- Student, SchoolClass, Subject, Teacher, Term, AcademicYear, Generation, etc.
- `score.ts` -- Score, ScoreDetail, AssessmentType
- `portal.ts` -- Student portal types
- `dashboard.ts` -- Dashboard stats types
- `index.ts` -- Re-exports all types

### Constants

Single source of truth in `src/constants/index.ts`:

- `ROLES` -- Role constants
- `CACHE_KEYS` / `CACHE_TTL` -- Client-side caching config
- `SIDEBAR` -- Navigation menu items
- `PAGINATION` -- Default page sizes
- `DEBOUNCE` -- Debounce delays
- `ROLE_LANDING_PATHS` -- Default route per role
- `SELF_MANAGED_SCROLL_PAGES` -- Pages with scroll management
- `ASSESSMENT_TYPES` -- Assessment type definitions
- `GOOGLE_OAUTH` -- OAuth config
- `LOCAL_STORAGE_KEYS` -- Storage key constants
- `GRADE_COLORS` -- Grade color mapping
- `ICON_COLOR_CLASSES` -- Icon color utilities

### Utils

Shared functions in `src/utils/index.ts`:

- `getUserInitials(name)` -- Extract initials from name
- `extractErrorMessage(error)` -- Normalize error objects to string
- `formatNumber(value, decimals)` -- Locale-aware number formatting
- `debounce(fn, delay)` -- Debounce utility
- `generateAvatarGradient(name)` -- Generate consistent gradient from name

### Services

All 16 services use a shared Axios instance (`apiHttp.ts`) with auth/token interceptors. No service creates its own Axios instance. Types imported from `src/types/`.

### Composables

Global singletons, no local toast/confirm duplicates:

- `useToast()` -- Global toast notifications (singleton, used everywhere)
- `useConfirm()` -- Global confirm dialog (singleton, used everywhere)
- `useLoading()` -- Loading state management
- `usePermission()` -- RBAC permission checks
- `useError()` -- Error extraction utility

### Global Styles

CSS custom properties and shared utility classes in `src/styles/global.css`:

- **Tables**: `.data-table-base`, `.data-row`, `.row-selected`, `.col-check`, `.col-index`, `.col-actions`
- **Forms**: `.form-group`, `.modern-input`, `.form-label`, `.form-error`
- **Modals**: `.modal-overlay`, `.modal-content-panel`, `.modal-header`, `.modal-body`, `.modal-footer`
- **Badges**: `.badge-active`, `.badge-inactive`
- **Buttons**: `.act-btn`, `.act-btn:hover`, `.act-danger:hover`
- **Toolbar**: `.toolbar`, `.toolbar-left`, `.toolbar-right`
- **Search**: `.search-wrapper`, `.search-icon`
- **Filter**: `.filter-dropdown`
- **Pagination**: `.pagination-bar`, `.page-btn`, `.page-btn.active`
- **Bulk actions**: `.bulk-bar`
- **Empty state**: `.empty-container`, `.empty-icon`, `.empty-title`, `.empty-desc`
- **Loading**: `.spinner`

### Layouts

- `AuthLayout` -- Login page (minimal, no sidebar)
- `MainLayout` -- All protected routes (sidebar + header)

### App.vue

Minimal shell -- just `<router-view />` + global Toast + ConfirmDialog. All page-level UI is in views/.

## Google OAuth Setup

### Error: "The given origin is not allowed for the given client ID"

This error occurs when the domain where your frontend is running is not whitelisted in Google Cloud Console.

### How to Fix

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Click the edit (pencil) icon
4. Under **Authorized JavaScript origins**, add your frontend domains:

   **Local development:**
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   http://localhost:5174
   ```

   **Production:**
   ```
   https://your-domain.com
   https://www.your-domain.com
   ```

5. Under **Authorized redirect URIs**, add:
   ```
   http://127.0.0.1:8000/api/google-login
   http://localhost:8000/api/google-login
   https://your-domain.com/api/google-login
   ```

6. Click **Save**
7. Restart the frontend dev server

### Troubleshooting

- Make sure you saved changes in Google Cloud Console
- Clear browser cache and cookies
- Wait 1-2 minutes for Google's servers to propagate changes
- Verify the frontend is running from the exact origin you added (e.g., `http://localhost:5173` not `http://127.0.0.1:5173` if you only added one)

The client ID is configured in `frontend/.env.example` and as a fallback in `frontend/src/services/googleAuthService.ts`.

## Git Workflow

Main branches:
- `master` -- Stable production branch
- `develop` -- Main development branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/feature-name
# ... work ...
git add . && git commit -m "Add feature"
git push -u origin feature/feature-name
```

Then create a Pull Request from **feature/** -> **develop**.
