import type { StudentReportCard } from '@/types'
import { APP_DESCRIPTION } from '@/constants'
import schoolLogoUrl from '@/assets/images/pnc-logo.png'

type Cell = string | number
type Orientation = 'portrait' | 'landscape'

export interface TableExport {
  title: string
  subtitle?: string
  head: string[]
  body: Cell[][]
  filename: string
  orientation?: Orientation
}

const SCHOOL_NAME = 'Passerelles Numériques Cambodia'
const BRAND: [number, number, number] = [37, 99, 235]
const ZEBRA: [number, number, number] = [248, 250, 252]
const INK: [number, number, number] = [15, 23, 42]
const MUTED: [number, number, number] = [100, 116, 139]
const PASS_COLOR: [number, number, number] = [16, 185, 129]
const PASS_TINT: [number, number, number] = [236, 253, 245]
const FAIL_COLOR: [number, number, number] = [239, 68, 68]
const FAIL_TINT: [number, number, number] = [254, 242, 242]

/**
 * jspdf-autotable ships as both a plugin and a standalone function depending on
 * the build; ScoreSheetView already normalises it this way, so reports do too.
 */
async function createDoc(orientation: Orientation) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  doc.setFont('helvetica', 'normal')

  if (typeof (doc as any).autoTable !== 'function' && typeof autoTableModule?.default === 'function') {
    const plugin = autoTableModule.default
    ;(doc as any).autoTable = (opts: any) => plugin(doc, opts)
  }

  return doc
}

/**
 * The logo is bundled locally and fetched once as a data URL — jsPDF's
 * addImage needs actual image data, not a bare URL, and this avoids a
 * network dependency (or CORS failure) on every export.
 */
let cachedLogo: string | null | undefined
async function loadLogoDataUrl(): Promise<string | null> {
  if (cachedLogo !== undefined) return cachedLogo
  try {
    const response = await fetch(schoolLogoUrl)
    const blob = await response.blob()
    cachedLogo = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    // Export still works without a logo if the asset can't be read.
    cachedLogo = null
  }
  return cachedLogo
}

/**
 * Shared branded header: a blue banner with the school logo/name on the left
 * and the report title/timestamp on the right, followed by an optional
 * filter-scope line. Returns the Y position content can start at.
 */
async function drawBrandedHeader(doc: any, title: string, subtitle?: string): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth()
  const bannerHeight = 26

  doc.setFillColor(...BRAND)
  doc.rect(0, 0, pageWidth, bannerHeight, 'F')

  const logo = await loadLogoDataUrl()
  const textX = logo ? 32 : 14
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 12, 5, 16, 16)
    } catch {
      // Corrupt/unreadable image data — fall back to text-only header.
    }
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(SCHOOL_NAME, textX, 12)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(APP_DESCRIPTION, textX, 17.5)

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth - 14, 12, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - 14, 18, { align: 'right' })

  let y = bannerHeight + 8
  if (subtitle) {
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(subtitle, 14, y)
    y += 5
  }

  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'normal')
  return y
}

/** Branded footer with page numbers, added once the document has laid out every page. */
function drawFooter(doc: any) {
  const pages = doc.internal.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setDrawColor(226, 232, 240)
    doc.line(14, pageHeight - 13, pageWidth - 14, pageHeight - 13)
    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.text(SCHOOL_NAME, 14, pageHeight - 8)
    doc.text(`Page ${page} of ${pages}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
  }
}

export async function exportTableToPdf(options: TableExport): Promise<void> {
  const doc = await createDoc(options.orientation ?? 'landscape')
  const startY = await drawBrandedHeader(doc, options.title, options.subtitle)

  ;(doc as any).autoTable({
    head: [options.head],
    body: options.body.map((row) => row.map((cell) => String(cell ?? ''))),
    startY,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: ZEBRA },
  })

  drawFooter(doc)
  doc.save(`${options.filename}.pdf`)
}

export async function exportTableToExcel(options: Omit<TableExport, 'orientation'>): Promise<void> {
  const { utils, writeFile } = await import('xlsx')
  const sheet = utils.aoa_to_sheet([
    [options.title],
    [options.subtitle ?? ''],
    [`Generated ${new Date().toLocaleString()}`],
    [],
    options.head,
    ...options.body,
  ])
  const book = utils.book_new()
  utils.book_append_sheet(book, sheet, 'Report')
  writeFile(book, `${options.filename}.xlsx`)
}

export function exportTableToCsv(options: Omit<TableExport, 'orientation'>): void {
  const escape = (cell: Cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`
  const csv = [options.head, ...options.body].map((row) => row.map(escape).join(',')).join('\n')

  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  link.download = `${options.filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}

function initialsOf(name: string | null): string {
  const parts = (name ?? '').split(' ').filter(Boolean).slice(0, 2)
  if (!parts.length) return '?'
  return parts.map((p) => p.charAt(0).toUpperCase()).join('')
}

/**
 * A single student's report card as a portrait PDF, designed to feel like an
 * actual certificate rather than a data dump: branded header, an identity
 * card with an avatar and a colored grade/result stamp, the subject table,
 * a totals summary, and a short encouraging note.
 */
export async function exportReportCardToPdf(card: StudentReportCard): Promise<void> {
  const doc = await createDoc('portrait')
  const { student, summary, scope } = card
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 14
  const contentWidth = pageWidth - marginX * 2

  let y = await drawBrandedHeader(doc, 'Official Student Report Card')

  // ── Identity card: avatar, name/meta on the left, grade stamp on the right ──
  const cardTop = y
  const cardHeight = 30
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(marginX, cardTop, contentWidth, cardHeight, 3, 3, 'FD')

  const avatarCx = marginX + 15
  const avatarCy = cardTop + cardHeight / 2
  doc.setFillColor(...BRAND)
  doc.circle(avatarCx, avatarCy, 9, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(initialsOf(student.name), avatarCx, avatarCy + 3.2, { align: 'center' })

  doc.setTextColor(...INK)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(student.name ?? 'Unknown Student', marginX + 32, cardTop + 11)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  const metaLine = [student.student_number, student.class_name, student.generation]
    .filter(Boolean)
    .join('   •   ')
  doc.text(metaLine, marginX + 32, cardTop + 17)

  const scopeLine = [
    scope.terms.length ? scope.terms.join(', ') : null,
    summary.rank ? `Rank ${summary.rank} of ${summary.class_size}` : null,
  ].filter(Boolean).join('   •   ')
  if (scopeLine) doc.text(scopeLine, marginX + 32, cardTop + 23)

  const stampColor = summary.result === 'pass' ? PASS_COLOR : FAIL_COLOR
  const stampWidth = 38
  const stampX = pageWidth - marginX - stampWidth
  doc.setFillColor(...stampColor)
  doc.roundedRect(stampX, cardTop + 5, stampWidth, cardHeight - 10, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(summary.grade, stampX + stampWidth / 2, cardTop + 16, { align: 'center' })
  doc.setFontSize(8)
  doc.text(summary.result.toUpperCase(), stampX + stampWidth / 2, cardTop + 22, { align: 'center' })

  y = cardTop + cardHeight + 8
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'normal')

  // ── Subject table (assessment columns built from the data, weights vary per school) ──
  const assessmentNames = Array.from(
    new Set(card.subjects.flatMap((s) => s.assessments.map((a) => a.name))),
  )

  const head = ['#', 'Subject', ...assessmentNames, 'Total', 'Grade', 'Result']
  const body = card.subjects.map((subject, index) => [
    String(index + 1),
    subject.subject_name,
    ...assessmentNames.map((name) => {
      const found = subject.assessments.find((a) => a.name === name)
      return found?.average != null ? found.average.toFixed(1) : '—'
    }),
    subject.total != null ? subject.total.toFixed(2) : '—',
    subject.grade ?? '—',
    subject.result ? subject.result.toUpperCase() : '—',
  ])

  ;(doc as any).autoTable({
    head: [head],
    body,
    startY: y,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles: { 0: { cellWidth: 8, halign: 'center' } },
    didParseCell: (data: any) => {
      if (data.section !== 'body') return
      const resultCol = head.length - 1
      if (data.column.index === resultCol) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.textColor = data.cell.raw === 'PASS' ? PASS_COLOR : FAIL_COLOR
      }
    },
  })

  // ── Summary totals ──
  ;(doc as any).autoTable({
    body: [
      ['Total Score', `${summary.total_score.toFixed(2)} / ${summary.max_possible}`],
      ['Average Score', summary.average.toFixed(2)],
      ['Grade', summary.grade],
      ['Subjects Failed', String(summary.failed_subjects)],
      ['Result', summary.result.toUpperCase()],
      ['Class Average', summary.class_average != null ? summary.class_average.toFixed(2) : '—'],
    ],
    startY: (doc as any).lastAutoTable.finalY + 6,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, fillColor: ZEBRA } },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 1 && data.row.raw[0] === 'Result') {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.textColor = data.row.raw[1] === 'PASS' ? PASS_COLOR : FAIL_COLOR
      }
    },
  })

  // ── A short, student-facing note — the part a report full of numbers is missing ──
  const firstName = (student.name ?? 'Student').split(' ')[0]
  const message = summary.result === 'pass'
    ? summary.rank === 1
      ? `Outstanding work, ${firstName}! You're ranked #1 in your class this term.`
      : `Great job, ${firstName}! Keep up the strong performance.`
    : `${firstName}, this term didn't go as planned — talk to your teacher about a plan to catch up next term.`

  const messageY = (doc as any).lastAutoTable.finalY + 8
  const messageHeight = 14
  doc.setFillColor(...(summary.result === 'pass' ? PASS_TINT : FAIL_TINT))
  doc.roundedRect(marginX, messageY, contentWidth, messageHeight, 3, 3, 'F')
  doc.setTextColor(...(summary.result === 'pass' ? PASS_COLOR : FAIL_COLOR))
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'bold')
  doc.text(message, pageWidth / 2, messageY + messageHeight / 2 + 1.2, {
    align: 'center',
    maxWidth: contentWidth - 12,
  })

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(
    `Pass mark: ${scope.pass_mark}. A student passes when the average clears the pass mark and no single subject is failed.`,
    marginX,
    messageY + messageHeight + 6,
  )

  drawFooter(doc)
  doc.save(`report-card-${student.student_number ?? student.id}.pdf`)
}
