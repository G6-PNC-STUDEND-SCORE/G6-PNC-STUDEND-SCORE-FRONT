import { APP_DESCRIPTION } from '@/constants'
import type { PortalData, TermScores } from '@/types'
import schoolLogoUrl from '@/assets/images/pnc-logo.png'

type Cell = string | number
type Orientation = 'portrait' | 'landscape'

const SCHOOL_NAME = 'Passerelles Numériques Cambodia'
const DARK = [30, 41, 59] as [number, number, number]
const MUTED = [100, 116, 139] as [number, number, number]
const LIGHT_BG = [248, 250, 252] as [number, number, number]
const BORDER = [226, 232, 240] as [number, number, number]
const WHITE = [255, 255, 255] as [number, number, number]

const PASS_MARK = 50
const MX = 16       // margin X
const PW = 210      // page width
const CW = PW - MX * 2  // content width

function computeGrade(t: number | null): string | null {
  if (t === null) return null
  if (t >= 90) return 'A'
  if (t >= 80) return 'B+'
  if (t >= 70) return 'B'
  if (t >= 60) return 'C'
  if (t >= 50) return 'D'
  return 'F'
}

function termAvg(subjects: Array<{ total: number | null }>): number {
  const s = subjects.filter(x => x.total !== null)
  return s.length ? s.reduce((a, b) => a + (b.total ?? 0), 0) / s.length : 0
}

function initialsOf(name: string | null): string {
  const p = (name ?? '').split(' ').filter(Boolean).slice(0, 2)
  return p.length ? p.map(x => x.charAt(0).toUpperCase()).join('') : '?'
}

function fmt(n: (number | null)[]): string {
  const f = n.filter((v): v is number => v !== null)
  return f.length ? (f.reduce((a, b) => a + b, 0) / f.length).toFixed(1) : '—'
}

function imgFmt(url: string): string {
  if (url.startsWith('data:image/png')) return 'PNG'
  if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) return 'JPEG'
  if (url.startsWith('data:image/webp')) return 'WEBP'
  if (url.startsWith('data:image/gif')) return 'GIF'
  return 'JPEG'
}

async function createDoc(orientation: Orientation) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  doc.setFont('helvetica', 'normal')
  if (typeof (doc as any).autoTable !== 'function' && typeof autoTableModule?.default === 'function') {
    ;(doc as any).autoTable = (opts: any) => autoTableModule.default(doc, opts)
  }
  return doc
}

// ── Logo ──────────────────────────────────────────────────────
let logoCache: string | null | undefined
async function loadLogo(): Promise<string | null> {
  if (logoCache !== undefined) return logoCache
  try {
    const r = await fetch(schoolLogoUrl)
    const b = await r.blob()
    logoCache = await new Promise((res, rej) => {
      const fr = new FileReader()
      fr.onload = () => res(fr.result as string)
      fr.onerror = () => rej(fr.error)
      fr.readAsDataURL(b)
    })
  } catch { logoCache = null }
  return logoCache
}

// ═══════════════════════════════════════════════════════════════
//  SIMPLE HEADER — just text, thin line
// ═══════════════════════════════════════════════════════════════
async function drawHeader(doc: any): Promise<number> {
  const logo = await loadLogo()
  const tx = logo ? 36 : 16
  if (logo) {
    try { doc.addImage(logo, 'PNG', 14, 6, 16, 16) } catch { /* ok */ }
  }
  doc.setTextColor(...DARK)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(SCHOOL_NAME, tx, 14)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(APP_DESCRIPTION, tx, 20)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text('STUDENT SCORE CARD', PW - MX, 14, { align: 'right' })

  // Thin separator
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.5)
  doc.line(MX, 26, PW - MX, 26)

  return 32
}

// ═══════════════════════════════════════════════════════════════
//  SIMPLE FOOTER
// ═══════════════════════════════════════════════════════════════
function drawFooter(doc: any) {
  const n = doc.internal.getNumberOfPages()
  for (let p = 1; p <= n; p++) {
    doc.setPage(p)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(MX, 284, PW - MX, 284)
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(SCHOOL_NAME, MX, 289)
    doc.text(`Page ${p} of ${n}`, PW - MX, 289, { align: 'right' })
  }
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT INTERFACE
// ═══════════════════════════════════════════════════════════════
export interface ScoreCardExportData {
  profile: PortalData['profile']
  terms: TermScores[]
  overallAverage: number
  overallGrade: string | null
  totalSubjects: number
  passedCount: number
  failedCount: number
  overallResult: 'pass' | 'fail'
  gpa: string
  avatarDataUrl: string
}

// ═══════════════════════════════════════════════════════════════
//  MAIN — Clean, Simple, Black & White
// ═══════════════════════════════════════════════════════════════
export async function exportScoreCardToPdf(data: ScoreCardExportData): Promise<void> {
  const doc = await createDoc('portrait')
  const { profile, terms, oa, og, ts, pc, fc, ors, gpa, avatarDataUrl } = {
    ...data,
    oa: data.overallAverage,
    og: data.overallGrade,
    ts: data.totalSubjects,
    pc: data.passedCount,
    fc: data.failedCount,
    ors: data.overallResult,
  }
  const cx = PW / 2

  let y = await drawHeader(doc)

  // ═══ 1. Student Info — simple rows ═════════════════════════
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.5)
  doc.rect(MX, y, CW, 32, 'S')

  // Avatar square
  const avX = MX + 14
  const avY = y + 2
  const avS = 28
  let avatarRendered = false
  if (avatarDataUrl) {
    try {
      doc.addImage(avatarDataUrl, imgFmt(avatarDataUrl), avX, avY, avS, avS)
      avatarRendered = true
    } catch { /* avatar failed, fall through to initials */ }
  }
  if (!avatarRendered) {
    doc.setFillColor(...LIGHT_BG)
    doc.rect(avX, avY, avS, avS, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...MUTED)
    doc.text(initialsOf(profile.name), avX + avS / 2, avY + avS / 2 + 3, { align: 'center' })
  }

  // Name + info
  doc.setTextColor(...DARK)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(profile.name ?? 'Student', MX + 48, y + 11)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  const line1 = [profile.studentId, profile.class, profile.generation].filter(Boolean)
  if (line1.length) doc.text(line1.join('  ·  '), MX + 48, y + 17.5)
  const line2 = [profile.department, profile.currentTerm, profile.academicStatus].filter(Boolean)
  if (line2.length) doc.text(line2.join('  ·  '), MX + 48, y + 23)
  if (profile.email) doc.text(profile.email, MX + 48, y + 28.5)

  // Grade + Result — simple text on the right
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text(og ?? '—', PW - MX - 4, y + 17, { align: 'right' })
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(ors === 'pass' ? 'PASS' : 'FAIL', PW - MX - 4, y + 23, { align: 'right' })

  y += 38

  // ═══ 2. Key Stats — plain text row ════════════════════════
  const stats = [
    `Grand GPA: ${gpa}`,
    `Average: ${oa.toFixed(1)}`,
    `Passed: ${pc}/${ts}`,
    `Failed: ${fc}`,
  ]
  // Simple horizontal layout with separators
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  const statW = CW / stats.length
  stats.forEach((s, i) => {
    doc.text(s, MX + statW * i + statW / 2, y, { align: 'center' })
  })

  y += 8

  // ═══ 3. Scores by Term ════════════════════════════════════
  for (let t = 0; t < terms.length; t++) {
    const term = terms[t]
    const ta = termAvg(term.subjects)
    const tg = computeGrade(ta) ?? '—'
    const tr = ta >= PASS_MARK ? 'PASS' : 'FAIL'

    if (y > 250) { drawFooter(doc); doc.addPage(); y = 20 }

    // Term title
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.4)
    doc.setFillColor(...LIGHT_BG)
    doc.rect(MX, y, CW, 9, 'FD')
    doc.setTextColor(...DARK)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.text(term.term, MX + 6, y + 6.5)
    doc.text(`Avg: ${ta.toFixed(1)}  ·  ${tg}  ·  ${tr}`, PW - MX - 6, y + 6.5, { align: 'right' })
    y += 12

    // Table
    const head = ['#', 'Subject', 'Quiz', 'Asgn', 'Mid', 'Final', 'Total', 'Grade', 'Result']
    const body: Cell[][] = term.subjects.map((s, i) => [
      String(i + 1),
      s.subject ?? '—',
      s.quiz != null ? s.quiz.toFixed(1) : '—',
      s.assignment != null ? s.assignment.toFixed(1) : '—',
      s.midterm != null ? s.midterm.toFixed(1) : '—',
      s.final != null ? s.final.toFixed(1) : '—',
      { content: s.total != null ? s.total.toFixed(1) : '—', styles: { fontStyle: 'bold' } } as any,
      s.grade ?? '—',
      s.total != null ? (s.total >= PASS_MARK ? 'P' : 'F') : '—',
    ])

    const qv = fmt(term.subjects.map(s => s.quiz))
    const av = fmt(term.subjects.map(s => s.assignment))
    const mv = fmt(term.subjects.map(s => s.midterm))
    const fv = fmt(term.subjects.map(s => s.final))

    body.push([
      { content: 'AVG', colSpan: 2, styles: { fontStyle: 'bold', fontSize: 7, fillColor: LIGHT_BG } } as any,
      qv, av, mv, fv,
      { content: ta.toFixed(1), styles: { fontStyle: 'bold' } } as any,
      tg, tr,
    ])

    ;(doc as any).autoTable({
      head: [head],
      body,
      startY: y,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 }, lineColor: BORDER, lineWidth: 0.3 },
      headStyles: { fillColor: LIGHT_BG, textColor: MUTED, fontStyle: 'bold', fontSize: 6.5, lineWidth: 0 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 44 },
        2: { cellWidth: 16, halign: 'right' },
        3: { cellWidth: 16, halign: 'right' },
        4: { cellWidth: 16, halign: 'right' },
        5: { cellWidth: 16, halign: 'right' },
        6: { cellWidth: 18, halign: 'right' },
        7: { cellWidth: 14, halign: 'center' },
        8: { cellWidth: 12, halign: 'center' },
      },
      margin: { left: MX, right: MX },
    })

    y = (doc as any).lastAutoTable.finalY + 6
  }

  // ═══ 4. Overall Result — plain grid ════════════════════════
  if (y > 255) { drawFooter(doc); doc.addPage(); y = 20 }

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.5)
  doc.line(MX, y, PW - MX, y)
  y += 5

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text('Overall Academic Result', cx, y, { align: 'center' })
  y += 9

  // Simple table-like grid
  const grid = [
    ['Overall Average', oa.toFixed(1), 'Total Subjects', String(ts)],
    ['Subjects Passed', String(pc), 'Subjects Failed', String(fc)],
    ['Final Grade', og ?? '—', 'Grand GPA', gpa],
  ]

  ;(doc as any).autoTable({
    body: grid,
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 36, fillColor: LIGHT_BG, halign: 'left' },
      1: { cellWidth: 28 },
      2: { fontStyle: 'bold', cellWidth: 36, fillColor: LIGHT_BG, halign: 'left' },
      3: { cellWidth: 28 },
    },
    margin: { left: MX, right: MX },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ═══ 5. Simple Note ═══════════════════════════════════════
  const firstName = (profile.name ?? 'Student').split(' ')[0]
  const msg = ors === 'pass'
    ? `${firstName} passed with ${oa.toFixed(1)}% average.`
    : `${firstName} scored ${oa.toFixed(1)}%. Below the pass mark of ${PASS_MARK}.`

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.4)
  doc.setFillColor(...LIGHT_BG)
  doc.rect(MX, y, CW, 12, 'FD')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text(msg, cx, y + 7.5, { align: 'center', maxWidth: CW - 10 })

  y += 16
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTED)
  doc.text(
    `Pass mark: ${PASS_MARK}. Grand GPA: ${gpa} out of 4.00.`,
    cx, y, { align: 'center', maxWidth: CW },
  )

  drawFooter(doc)
  doc.save(`score-card-${profile.studentId ?? 'student'}.pdf`)
}
