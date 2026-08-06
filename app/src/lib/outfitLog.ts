// 코디 확정 기록 — 기획서 §6.3 R-6
// 확정한 코디의 아이템을 착용 카운트로 남기고, 추천 엔진의 N항(신선도) 입력이 된다.
import { Preferences } from '@capacitor/preferences'
import type { WearHistory } from './recommend'

export const OUTFIT_LOG_KEY = 'ojjeom.outfitlog.v1'

export interface OutfitEntry {
  /** 확정한 날짜 (YYYY-MM-DD, 로컬) */
  date: string
  itemIds: string[]
  mood: string
  confirmedAt: string
}

function isEntry(value: unknown): value is OutfitEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<OutfitEntry>
  return (
    typeof entry.date === 'string'
    && Array.isArray(entry.itemIds)
    && entry.itemIds.every(id => typeof id === 'string')
    && typeof entry.mood === 'string'
    && typeof entry.confirmedAt === 'string'
  )
}

export function parseOutfitLog(raw: string | null): OutfitEntry[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isEntry) : []
  } catch {
    return []
  }
}

/** 같은 날짜는 교체한다 — 하루에 확정은 한 번, 변경은 덮어쓰기 */
export function upsertEntry(entries: OutfitEntry[], entry: OutfitEntry): OutfitEntry[] {
  return [...entries.filter(existing => existing.date !== entry.date), entry]
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function entryForDate(entries: OutfitEntry[], date: string): OutfitEntry | undefined {
  return entries.find(entry => entry.date === date)
}

export function wearCount(entries: OutfitEntry[], itemId: string): number {
  return entries.reduce((count, entry) => count + (entry.itemIds.includes(itemId) ? 1 : 0), 0)
}

export function historyFrom(entries: OutfitEntry[]): WearHistory {
  const lastWornAt: Record<string, string> = {}
  for (const entry of entries) {
    for (const id of entry.itemIds) {
      if (!lastWornAt[id] || lastWornAt[id] < entry.date) lastWornAt[id] = entry.date
    }
  }
  return { lastWornAt }
}

export async function loadOutfitLog(): Promise<OutfitEntry[]> {
  const { value } = await Preferences.get({ key: OUTFIT_LOG_KEY })
  return parseOutfitLog(value)
}

export async function saveOutfitLog(entries: OutfitEntry[]): Promise<OutfitEntry[]> {
  await Preferences.set({ key: OUTFIT_LOG_KEY, value: JSON.stringify(entries) })
  return entries
}
