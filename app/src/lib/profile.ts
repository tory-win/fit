export interface BirthInput {
  name: string
  y: number
  m: number
  d: number
  hour?: number
}

export type BirthDraft = {
  name: string
  y: number | ''
  m: number | ''
  d: number | ''
  hour?: number
}

export function daysInBirthMonth(year: number | '', month: number | ''): number {
  if (year === '' || month === '') return 31
  return new Date(year, month, 0).getDate()
}

export function isValidBirthDate<T extends {
  y?: number | ''
  m?: number | ''
  d?: number | ''
}>(value: T): value is T & { y: number; m: number; d: number } {
  const { y, m, d } = value
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false
  if ((y as number) < 1900 || (y as number) > new Date().getFullYear()) return false
  if ((m as number) < 1 || (m as number) > 12) return false
  if ((d as number) < 1 || (d as number) > daysInBirthMonth(y as number, m as number)) return false
  return true
}
