export const APP_NAME = 'Student Score Management System'
export const APP_DESCRIPTION = 'PNC Student Score Management System'

export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]

export const CACHE_KEYS = {
  USERS: 'users-data',
  USERS_ROLES: 'users-roles',
  CLASSES: 'classes-data',
  DASHBOARD: 'dashboard-data',
  SPREADSHEET: 'spreadsheet',
} as const

export const CACHE_TTL = {
  SHORT: 30_000,
  MEDIUM: 60_000,
  LONG: 24 * 60 * 60_000,
} as const

export const SIDEBAR = {
  WIDTH: 240,
  COLLAPSED_WIDTH: 72,
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const

export const DEBOUNCE = {
  SEARCH: 300,
  FILTER: 400,
} as const

export const ROLE_LANDING_PATHS: Record<string, string> = {
  student: '/portal',
  admin: '/dashboard',
  teacher: '/dashboard',
}

export const SELF_MANAGED_SCROLL_PAGES = [
  'roles',
  'users',
  'classes',
  'teachers',
  'student',
  'subject',
  'scores',
  'scores-term-subjects',
  'score-sheet',
  'profile',
] as const

export const ASSESSMENT_TYPES = {
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
  MIDTERM: 'midterm',
  FINAL: 'final',
} as const

export const GOOGLE_OAUTH = {
  SCRIPT_URL: 'https://accounts.google.com/gsi/client',
  USERINFO_URL: 'https://www.googleapis.com/oauth2/v3/userinfo',
} as const

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  GOOGLE_ACCESS_TOKEN: 'google_access_token',
  GOOGLE_EMAIL: 'google_email',
  GS_LAST_SPREADSHEET_URL: 'gs_last_spreadsheet_url',
  GS_LAST_SPREADSHEET_NAME: 'gs_last_spreadsheet_name',
  GS_AUTO_SYNC: 'gs_auto_sync',
} as const

export const GRADE_COLORS: Record<string, string> = {
  'A+': '#10b981',
  'A': '#10b981',
  'A-': '#22c55e',
  'B+': '#3b82f6',
  'B': '#6366f1',
  'B-': '#8b5cf6',
  'C+': '#f59e0b',
  'C': '#f97316',
  'C-': '#ef4444',
  'D': '#dc2626',
  'F': '#991b1b',
}

export const ICON_COLOR_CLASSES = [
  'icon-blue',
  'icon-green',
  'icon-violet',
  'icon-orange',
  'icon-sky',
  'icon-rose',
  'icon-mint',
  'icon-amber',
] as const
