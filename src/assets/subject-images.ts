export const subjectColors: Record<string, string> = {
  Mathematics: '#0d6efd',
  'English Literature': '#198754',
  Biology: '#6f42c1',
  Chemistry: '#fd7e14',
  Physics: '#dc3545',
  History: '#20c997',
  Geography: '#0dcaf0',
  ComputerScience: '#6610f2',
  Art: '#e83e8c',
  Music: '#d63384',
  PhysicalEducation: '#ffc107',
  Economics: '#20c997',
}

export function getSubjectColor(name: string): string {
  return subjectColors[name] || '#6c757d'
}
