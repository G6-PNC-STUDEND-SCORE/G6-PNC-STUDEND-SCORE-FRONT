import type { ScoreColumnType, SpreadsheetResponse } from '@/services/scoreService'

export const SCORE_COLUMN_OPTIONS: Array<{ value: ScoreColumnType; label: string }> = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'project', label: 'Project' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Final' },
]

export const DEFAULT_SCORE_COLUMN_TYPE: ScoreColumnType = 'quiz'

const GRADE_CLASS_MAP: Record<string, string> = {
  A: 'grade-a',
  'B+': 'grade-b-plus',
  B: 'grade-b',
  'C+': 'grade-c-plus',
  C: 'grade-c',
  D: 'grade-d',
  F: 'grade-f',
}

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  const text = String(value)

  if (/["\n,]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

export function getGradeClass(grade: string | null | undefined): string {
  if (!grade) {
    return 'grade-none'
  }

  return GRADE_CLASS_MAP[grade.toUpperCase()] ?? 'grade-none'
}

export function buildScoreCsv(data: SpreadsheetResponse): string {
  let csv = 'Student Name,Student ID'

  data.columns.forEach((column) => {
    csv += `,${escapeCsvValue(`${column.label} (${column.type})`)}`
  })

  csv += ',Total,Grade\n'

  data.rows.forEach((row) => {
    csv += `${escapeCsvValue(row.student_name)},${escapeCsvValue(row.student_number)}`

    data.columns.forEach((column) => {
      const mark = row.details[column.id]
      csv += `,${mark !== null && mark !== undefined ? mark : ''}`
    })

    csv += `,${row.total !== null ? row.total : ''},${row.grade || ''}\n`
  })

  return csv
}
