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
const BRAND_DARK: [number, number, number] = [29, 78, 216]
const ZEBRA: [number, number, number] = [248, 250, 252]
const INK: [number, number, number] = [15, 23, 42]
const MUTED: [number, number, number] = [100, 116, 139]
const BORDER: [number, number, number] = [226, 232, 240]
const PASS_COLOR: [number, number, number] = [16, 185, 129]
const PASS_TINT: [number, number, number] = [236, 253, 245]
const FAIL_COLOR: [number, number, number] = [239, 68, 68]
const FAIL_TINT: [number, number, number] = [254, 242, 242]

/** Gold accent for certificate-grade feel */
const GOLD: [number, number, number] = [212, 175, 55]

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

/**
 * Branded footer with page numbers.
 * When `frameColor` is provided, also draws a decorative certificate-style
 * double-line border frame around every page.
 */
function drawFooter(doc: any, frameColor?: [number, number, number] | null) {
  const pages = doc.internal.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)

    // ── Certificate-style frame on every page ──
    if (frameColor) {
      // Outer border
      doc.setDrawColor(180, 190, 210)
      doc.setLineWidth(0.6)
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S')

      // Inner border (lighter)
      doc.setDrawColor(210, 218, 235)
      doc.setLineWidth(0.3)
      doc.rect(7.5, 7.5, pageWidth - 15, pageHeight - 15, 'S')

      // Corner accent marks (small decorative squares at each corner)
      const cornerSize = 4
      doc.setDrawColor(...GOLD)
      doc.setLineWidth(0.4)
      // Top-left
      doc.line(5, 5 + cornerSize, 5, 5)
      doc.line(5, 5, 5 + cornerSize, 5)
      // Top-right
      doc.line(pageWidth - 10 - cornerSize, 5, pageWidth - 10, 5)
      doc.line(pageWidth - 10, 5, pageWidth - 10, 5 + cornerSize)
      // Bottom-left
      doc.line(5, pageHeight - 10 - cornerSize, 5, pageHeight - 10)
      doc.line(5, pageHeight - 10, 5 + cornerSize, pageHeight - 10)
      // Bottom-right
      doc.line(pageWidth - 10 - cornerSize, pageHeight - 10, pageWidth - 10, pageHeight - 10)
      doc.line(pageWidth - 10, pageHeight - 10, pageWidth - 10, pageHeight - 10 - cornerSize)
    }

    // Separator line
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.4)
    doc.line(14, pageHeight - 13, pageWidth - 14, pageHeight - 13)

    doc.setFontSize(7.5)
    doc.setTextColor(...MUTED)
    doc.setFont('helvetica', 'normal')
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
 * Polished, professional student report card PDF.
 * Elegant border → brand header → profile card with accent bar →
 * performance table → colored stat cards → achievement card → footer.
 */
export async function exportReportCardToPdf(card: StudentReportCard): Promise<void> {
  const doc = await createDoc('portrait')
  const { student, summary, scope } = card
  const PW = doc.internal.pageSize.getWidth()
  const PH = doc.internal.pageSize.getHeight()
  const M = 14
  const CW = PW - M * 2
  const SC: [number, number, number] = summary.result === 'pass' ? PASS_COLOR : FAIL_COLOR

  // ── Subtle page border ──
  doc.setDrawColor(210, 218, 230)
  doc.setLineWidth(0.4)
  doc.rect(5, 5, PW - 10, PH - 10, 'S')
  doc.setDrawColor(222, 228, 240)
  doc.setLineWidth(0.2)
  doc.rect(7, 7, PW - 14, PH - 14, 'S')

  // ══════════════════════════════════════════════════════════════════
  // 1. HEADER
  // ══════════════════════════════════════════════════════════════════
  const hH = 30
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, PW, hH, 'F')
  doc.setFillColor(...BRAND_DARK)
  doc.rect(0, hH * 0.55, PW, hH * 0.45, 'F')
  // Accent bar
  doc.setDrawColor(96, 165, 250)
  doc.setLineWidth(1)
  doc.line(0, hH, PW, hH)

  const logo = await loadLogoDataUrl()
  if (logo) { try { doc.addImage(logo, 'PNG', 12, 5, 18, 18) } catch {} }
  const tx = logo ? 36 : 14

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(SCHOOL_NAME, tx, 12.5)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text(APP_DESCRIPTION, tx, 18.5)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Student Report Card', PW - M, 12.5, { align: 'right' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleString(), PW - M, 18.5, { align: 'right' })

  let y = hH + 12

  // ══════════════════════════════════════════════════════════════════
  // 2. PROFILE CARD — clean & minimal: flat avatar, one meta row,
  // one plain performance line, flat grade badge. No layered decoration.
  // ══════════════════════════════════════════════════════════════════
  const ct = y, ch = 38
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 231, 240)
  doc.setLineWidth(0.4)
  doc.roundedRect(M, ct, CW, ch, 8, 8, 'FD')

  // ── Grade badge (far right) — declared early so layout math can reference bx ──
  const bw = 38, bh = ch - 16
  const bx = PW - M - bw - 12
  const by = ct + (ch - bh) / 2

  // ── Flat avatar circle ──
  const ax = M + 19, ay = ct + ch / 2
  doc.setFillColor(...BRAND)
  doc.circle(ax, ay, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(initialsOf(student.name), ax, ay + 4, { align: 'center' })

  // ── Content column (name → meta row → performance line) ──
  const ix = M + 38
  const contentRight = bx - 8
  const contentW = contentRight - ix

  doc.setTextColor(...INK)
  doc.setFontSize(15.5)
  doc.setFont('helvetica', 'bold')
  doc.text(student.name ?? 'Unknown Student', ix, ct + 14, { maxWidth: contentW })

  // ── Meta row: ID · Class · Batch · Term, plain text separated by dots ──
  const meta: string[] = [
    student.student_number ? `ID ${student.student_number}` : '',
    student.class_name ?? '',
    student.generation ?? '',
    scope.terms.length ? scope.terms.join(', ') : '',
  ].filter(Boolean)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(meta.join('   ·   '), ix, ct + 20.5, { maxWidth: contentW })

  // ── Thin divider ──
  const divY = ct + 25.5
  doc.setDrawColor(236, 239, 244)
  doc.setLineWidth(0.3)
  doc.line(ix, divY, contentRight, divY)

  // ── Performance line: Rank and Class Average as plain labeled text ──
  const perfY = ct + 31.5
  let perfX = ix
  const perfItems: Array<{ label: string; value: string }> = []
  if (summary.rank) perfItems.push({ label: 'Class Rank', value: `#${summary.rank} of ${summary.class_size}` })
  if (summary.class_average !== null) perfItems.push({ label: 'Class Average', value: summary.class_average.toFixed(2) })

  perfItems.forEach((item, i) => {
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MUTED)
    doc.text(`${item.label}  `, perfX, perfY)
    const labelW = doc.getTextWidth(`${item.label}  `)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND)
    doc.text(item.value, perfX + labelW, perfY)
    const valueW = doc.getTextWidth(item.value)

    perfX += labelW + valueW + 10
    if (i < perfItems.length - 1) {
      doc.setFillColor(214, 220, 230)
      doc.circle(perfX - 5, perfY - 1.5, 0.5, 'F')
    }
  })

  // ── Flat grade badge ──
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...MUTED)
  doc.text('OVERALL GRADE', bx + bw / 2, ct + 8, { align: 'center' })

  doc.setFillColor(...SC)
  doc.roundedRect(bx, by, bw, bh, 6, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(summary.grade, bx + bw / 2, by + bh / 2 + 3, { align: 'center' })
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.text(summary.result.toUpperCase(), bx + bw / 2, by + bh - 4, { align: 'center' })

  y = ct + ch + 14

  // ══════════════════════════════════════════════════════════════════
  // 3. ACADEMIC PERFORMANCE TABLE
  // ══════════════════════════════════════════════════════════════════
  // Section header
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(M, y, CW, 10, 5, 5, 'FD')
  doc.setFillColor(...BRAND)
  doc.roundedRect(M, y, 3, 10, 1.5, 1.5, 'F')
  doc.setTextColor(...INK)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('ACADEMIC PERFORMANCE', M + 12, y + 6.5)
  y += 14

  // A stable, human-familiar column order (Quiz → Assignment → Midterm → Final,
  // then anything else alphabetically) instead of "whichever subject listed it first".
  const CANONICAL_ORDER = ['quiz', 'assignment', 'midterm', 'final']
  const an = Array.from(new Set(card.subjects.flatMap(s => s.assessments.map(a => a.name))))
    .sort((a, b) => {
      const ia = CANONICAL_ORDER.indexOf(a.toLowerCase())
      const ib = CANONICAL_ORDER.indexOf(b.toLowerCase())
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
      return a.localeCompare(b)
    })
  const head = ['#', 'Subject', ...an, 'Total', 'Grade', 'Result']
  const body = card.subjects.map((subj, i) => [
    String(i + 1),
    subj.subject_name,
    ...an.map(n => { const f = subj.assessments.find(a => a.name === n); return f?.average != null ? f.average.toFixed(1) : '\u2014' }),
    subj.total != null ? subj.total.toFixed(2) : '\u2014',
    subj.grade ?? '\u2014',
    subj.result ? subj.result.toUpperCase() : '\u2014',
  ])

  ;(doc as any).autoTable({
    head: [head], body, startY: y,
    styles: { fontSize: 7.5, cellPadding: { top: 3, right: 4, bottom: 3, left: 4 }, lineColor: [241, 245, 249], lineWidth: 0.2, textColor: INK },
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7, halign: 'center' },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles: { 0: { cellWidth: 8, halign: 'center', textColor: [148, 163, 184] } },
    didParseCell: (data: any) => {
      if (data.section !== 'body') return
      const rc = head.length - 1
      if (data.column.index === rc) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.textColor = data.cell.raw === 'PASS' ? PASS_COLOR : FAIL_COLOR
      }
    },
  })

  // ══════════════════════════════════════════════════════════════════
  // 4. STAT CARDS (each with distinct colored value)
  // ══════════════════════════════════════════════════════════════════
  const sy = (doc as any).lastAutoTable.finalY + 12
  const sw = (CW - 9) / 4, sg = 3, sh = 24
  const stats = [
    { label: 'TOTAL SCORE', value: summary.total_score.toFixed(2), sub: `/ ${summary.max_possible}`, color: BRAND },
    { label: 'AVERAGE', value: summary.average.toFixed(2), sub: `${summary.graded_count} subs`, color: [99, 102, 241] },
    { label: 'GRADE', value: summary.grade, sub: summary.result.toUpperCase(), color: SC },
    { label: 'RANK', value: summary.rank != null ? `#${summary.rank}` : '\u2014', sub: summary.rank != null ? `of ${summary.class_size}` : '', color: [245, 158, 11] },
  ]

  stats.forEach((stat, i) => {
    const sx = M + i * (sw + sg)
    // Card shadow
    doc.setFillColor(240, 244, 250)
    doc.roundedRect(sx + 0.5, sy + 0.5, sw, sh, 5, 5, 'F')
    // Card
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(sx, sy, sw, sh, 5, 5, 'FD')
    // Top accent
    doc.setFillColor(...stat.color)
    doc.roundedRect(sx, sy, sw, 2.5, 1.5, 1.5, 'F')
    // Label
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...MUTED)
    doc.text(stat.label, sx + sw/2, sy + 7.5, { align: 'center' })
    // Value (colored)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...stat.color)
    doc.text(stat.value, sx + sw/2, sy + 17, { align: 'center' })
    // Sub
    doc.setFontSize(5.8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MUTED)
    doc.text(stat.sub, sx + sw/2, sy + 20.5, { align: 'center' })
  })

  // ══════════════════════════════════════════════════════════════════
  // 5. ACHIEVEMENT CARD
  // ══════════════════════════════════════════════════════════════════
  const my = sy + sh + 12
  const mh = 20
  const fn = (student.name ?? 'Student').split(' ')[0]
  const isPass = summary.result === 'pass'
  const pm = scope.pass_mark

  let msg: string
  if (isPass && summary.rank === 1) msg = `Outstanding Performance, ${fn}! You ranked #1 in your class this term.`
  else if (isPass) msg = `Great job, ${fn}! Keep up the strong performance.`
  else msg = `${fn}, this term didn't go as planned \u2014 talk to your teacher about a plan to catch up next term.`

  const mc = isPass ? PASS_COLOR : FAIL_COLOR
  const mbg = isPass ? PASS_TINT : FAIL_TINT
  const mbd: [number, number, number] = isPass ? [167, 243, 208] : [254, 202, 202]

  // Card
  doc.setFillColor(...mbg)
  doc.setDrawColor(...mbd)
  doc.roundedRect(M, my, CW, mh, 5, 5, 'FD')
  // Left accent
  doc.setFillColor(...mc)
  doc.roundedRect(M, my, 3, mh, 1.5, 1.5, 'F')
  // Decorative dot
  doc.setFillColor(...mc)
  doc.circle(M + 10, my + mh/2, 1.5, 'F')
  doc.setFillColor(...mbg)
  doc.circle(M + 10, my + mh/2, 0.7, 'F')
  // Text
  doc.setTextColor(...mc)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(msg, M + 16, my + mh/2 + 1.5, { maxWidth: CW - 30 })

  // Disclaimer
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(
    `Pass mark: ${pm}. A student passes when the average clears the pass mark and no single subject is failed.`,
    M, my + mh + 6,
  )

  // ══════════════════════════════════════════════════════════════════
  // 6. SIGNATURE BLOCK
  // Anchored near the bottom of the page so the layout reads as complete
  // rather than trailing off into empty space below the achievement card.
  // Falls back to sitting right under the disclaimer if a long subject list
  // has already pushed content close to the footer.
  // ══════════════════════════════════════════════════════════════════
  const disclaimerBottom = my + mh + 10
  const sigLineY = Math.min(Math.max(PH - 34, disclaimerBottom + 22), PH - 22)
  const sigW = (CW - 20) / 2
  const signatures = [
    { x: M, label: 'Class Teacher' },
    { x: M + sigW + 20, label: 'Parent / Guardian' },
  ]
  signatures.forEach((sig) => {
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(sig.x, sigLineY, sig.x + sigW, sigLineY)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...MUTED)
    doc.text(sig.label, sig.x, sigLineY + 5)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MUTED)
    doc.text('Signature & Date', sig.x, sigLineY - 3)
  })

  drawFooter(doc)
  doc.save(`report-card-${student.student_number ?? student.id}.pdf`)
}

