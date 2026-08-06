import { Directory, Filesystem } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'

import { deleteDeviceFile, deviceImageUrl } from './deviceImage'

export const CLOSET_INDEX_KEY = 'ojjeom.closet.index.v1'
export const CLOSET_IMAGE_DIRECTORY = 'closet/v1/images'
export const CLOSET_TRASH_DAYS = 7

export const CLOSET_CATEGORIES = ['상의', '하의', '아우터', '신발', '가방', '기타'] as const
export const CLOSET_COLORS = ['아이보리', '베이지', '블랙', '그린', '블루', '기타'] as const
export const CLOSET_SEASONS = ['봄', '여름', '가을', '겨울'] as const
export const CLOSET_FITS = ['slim', 'regular', 'relaxed'] as const

export type ClosetCategory = (typeof CLOSET_CATEGORIES)[number]
export type ClosetColor = (typeof CLOSET_COLORS)[number]
export type ClosetSeason = (typeof CLOSET_SEASONS)[number]
export type ClosetFit = (typeof CLOSET_FITS)[number]
export type ClosetSource = 'camera' | 'album'

export interface ClosetDraft {
  id: string
  previewUrl: string
  jpegBase64: string
  /** 자동 여백 정리를 적용했는지 — 확인 화면에서 원본으로 되돌릴 수 있다 (M8-기획 §3.1) */
  trimmed?: boolean
  originalUrl?: string
  originalBase64?: string
  source: ClosetSource
  category: ClosetCategory | ''
  color: ClosetColor | ''
  seasons: ClosetSeason[]
  /** 옷 자체의 실루엣. 선택 태그이며 체형 프로필의 선호 핏과 실제 대조한다. */
  fit?: ClosetFit | ''
}

export interface StoredClosetItem {
  id: string
  imagePath: string
  category: ClosetCategory
  color: ClosetColor
  seasons: ClosetSeason[]
  fit?: ClosetFit
  source: ClosetSource
  createdAt: string
  deletedAt?: string
}

export interface ClosetItem extends StoredClosetItem {
  imageUrl: string
}

function isOneOf<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === 'string' && values.includes(value as T[number])
}

function isStoredClosetItem(value: unknown): value is StoredClosetItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<StoredClosetItem>

  return (
    typeof item.id === 'string'
    && typeof item.imagePath === 'string'
    && isOneOf(CLOSET_CATEGORIES, item.category)
    && isOneOf(CLOSET_COLORS, item.color)
    && Array.isArray(item.seasons)
    && item.seasons.every(season => isOneOf(CLOSET_SEASONS, season))
    && (item.fit === undefined || isOneOf(CLOSET_FITS, item.fit))
    && (item.source === 'camera' || item.source === 'album')
    && typeof item.createdAt === 'string'
    && (item.deletedAt === undefined || typeof item.deletedAt === 'string')
  )
}

export function parseClosetIndex(value: string | null): StoredClosetItem[] {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(isStoredClosetItem) : []
  } catch {
    return []
  }
}

export function isDraftComplete(draft: ClosetDraft): boolean {
  return Boolean(draft.category && draft.color && draft.seasons.length > 0)
}

export function splitExpiredTrash(
  items: StoredClosetItem[],
  now = Date.now(),
): { kept: StoredClosetItem[]; expired: StoredClosetItem[] } {
  const trashWindow = CLOSET_TRASH_DAYS * 24 * 60 * 60 * 1000
  const kept: StoredClosetItem[] = []
  const expired: StoredClosetItem[] = []

  for (const item of items) {
    if (item.deletedAt && now - new Date(item.deletedAt).getTime() >= trashWindow) {
      expired.push(item)
    } else {
      kept.push(item)
    }
  }

  return { kept, expired }
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function readIndex(): Promise<StoredClosetItem[]> {
  const { value } = await Preferences.get({ key: CLOSET_INDEX_KEY })
  return parseClosetIndex(value)
}

async function writeIndex(items: StoredClosetItem[]): Promise<void> {
  await Preferences.set({ key: CLOSET_INDEX_KEY, value: JSON.stringify(items) })
}

export async function loadClosetItems(): Promise<ClosetItem[]> {
  const stored = await readIndex()
  const { kept, expired } = splitExpiredTrash(stored)

  if (expired.length > 0) {
    await Promise.all(expired.map(item => deleteDeviceFile(item.imagePath)))
    await writeIndex(kept)
  }

  const active = kept
    .filter(item => !item.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return Promise.all(active.map(async item => ({
    ...item,
    imageUrl: await deviceImageUrl(item.imagePath),
  })))
}

/** 남은 보관 일수 (0이면 오늘까지) — 기획서 C-3 */
export function trashDaysLeft(item: StoredClosetItem, now = Date.now()): number {
  if (!item.deletedAt) return CLOSET_TRASH_DAYS
  const elapsed = now - new Date(item.deletedAt).getTime()
  return Math.max(0, CLOSET_TRASH_DAYS - Math.floor(elapsed / 86_400_000))
}

/** 휴지통 목록 — 삭제일 최신순 */
export async function loadTrashItems(): Promise<ClosetItem[]> {
  const stored = await readIndex()
  const { kept, expired } = splitExpiredTrash(stored)

  if (expired.length > 0) {
    await Promise.all(expired.map(item => deleteDeviceFile(item.imagePath)))
    await writeIndex(kept)
  }

  const trashed = kept
    .filter(item => item.deletedAt)
    .sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''))

  return Promise.all(trashed.map(async item => ({
    ...item,
    imageUrl: await deviceImageUrl(item.imagePath),
  })))
}

/** 논리 삭제 — 파일은 그대로 두고 7일 뒤 만료 (U-8 되돌리기 가능) */
export async function moveToTrash(id: string, now = new Date()): Promise<void> {
  const items = await readIndex()
  await writeIndex(items.map(item => (
    item.id === id ? { ...item, deletedAt: now.toISOString() } : item
  )))
}

/** 복구 — 같은 파일을 다시 쓴다 */
export async function restoreFromTrash(id: string): Promise<void> {
  const items = await readIndex()
  await writeIndex(items.map(item => {
    if (item.id !== id) return item
    const { deletedAt: _deletedAt, ...rest } = item
    return rest
  }))
}

/** 완전 삭제 — 파일과 인덱스를 함께 지운다. 되돌릴 수 없다. */
export async function purgeFromTrash(ids: string[]): Promise<void> {
  const items = await readIndex()
  const targets = items.filter(item => ids.includes(item.id) && item.deletedAt)
  await Promise.all(targets.map(item => deleteDeviceFile(item.imagePath)))
  await writeIndex(items.filter(item => !targets.some(target => target.id === item.id)))
}

/** 내 데이터 전체 삭제 — 기획서 §10 계정 삭제 */
export async function wipeCloset(): Promise<void> {
  const items = await readIndex()
  await Promise.all(items.map(item => deleteDeviceFile(item.imagePath)))
  await Preferences.remove({ key: CLOSET_INDEX_KEY })
}

export async function saveClosetDrafts(drafts: ClosetDraft[]): Promise<ClosetItem[]> {
  if (drafts.length === 0 || drafts.some(draft => !isDraftComplete(draft))) {
    throw new Error('모든 사진의 종류·색·계절을 확인해 주세요.')
  }

  const current = await readIndex()
  const writtenPaths: string[] = []
  const createdAt = new Date().toISOString()
  const nextItems: StoredClosetItem[] = []

  try {
    for (const draft of drafts) {
      const id = makeId()
      const imagePath = `${CLOSET_IMAGE_DIRECTORY}/${id}.jpg`
      await Filesystem.writeFile({
        path: imagePath,
        data: draft.jpegBase64,
        directory: Directory.Data,
        recursive: true,
      })
      writtenPaths.push(imagePath)
      nextItems.push({
        id,
        imagePath,
        category: draft.category as ClosetCategory,
        color: draft.color as ClosetColor,
        seasons: draft.seasons,
        ...(draft.fit && isOneOf(CLOSET_FITS, draft.fit) ? { fit: draft.fit } : {}),
        source: draft.source,
        createdAt,
      })
    }

    await writeIndex([...current, ...nextItems])
  } catch (error) {
    await Promise.all(writtenPaths.map(deleteDeviceFile))
    throw error
  }

  return loadClosetItems()
}
