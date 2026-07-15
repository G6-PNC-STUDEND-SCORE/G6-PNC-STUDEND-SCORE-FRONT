import * as XLSX from 'xlsx'
import { http } from './apiHttp'

export interface ImportRow {
  name: string
  gender: 'Male' | 'Female' | ''
  status: 'active' | 'inactive' | ''
  class: string
}

export interface SkippedRow {
  row: number
  name: string
  reason: string
}

export interface ImportResult {
  message: string
  imported: number
  errors?: string[]
  skipped?: SkippedRow[]
}

/**
 * Generate and download an Excel template for student import.
 */
export function downloadTemplate(): void {
  const headers = [
    ['Name', 'Gender', 'Status', 'Class'],
  ]
  const example = [
    ['Sok Dara', 'Male', 'active', 'Class A'],
    ['Chan Srey', 'Female', 'active', 'Class B'],
    ['Sokha Rith', 'Male', 'inactive', ''],
  ]

  const ws = XLSX.utils.aoa_to_sheet([...headers, ...example])

  // Column widths
  ws['!cols'] = [
    { wch: 25 },
    { wch: 10 },
    { wch: 10 },
    { wch: 15 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Students')
  XLSX.writeFile(wb, 'student-import-template.xlsx')
}

/**
 * Parse an Excel file and return the rows as ImportRow[].
 */
export function parseExcel(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })

        // 🛡️ Validate workbook has sheets
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          reject(new Error('Excel file is empty. Please use the template format.'))
          return
        }

        const sheetName = workbook.SheetNames[0]!
        const sheet = workbook.Sheets[sheetName]

        // 🛡️ Validate sheet exists
        if (!sheet) {
          reject(new Error(`Sheet "${sheetName}" not found. Please use the template format.`))
          return
        }

        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)

        const rows: ImportRow[] = json.map((row: Record<string, string>) => ({
          name: (row['Name'] || '').trim(),
          gender: (row['Gender'] || '').trim() as ImportRow['gender'],
          status: (row['Status'] || '').trim() as ImportRow['status'],
          class: (row['Class'] || '').trim(),
        }))

        resolve(rows.filter((r) => r.name))
      } catch (err) {
        reject(new Error('Failed to parse Excel file. Please use the template format.'))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Send parsed student data to the backend for bulk import.
 */
export async function importStudents(students: ImportRow[]): Promise<ImportResult> {
  const res = await http.post<ImportResult>('/students/import', { students })
  return res.data
}
