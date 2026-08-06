// AI 착장 미리보기 상태 — M6-기획.md §5.2·§7, 기획서 R-9
// 생성물은 사용자가 직접 지우기 전까지 기기 안에 보관한다.
// 생성 권한은 별도 수익 게이트(`tryonGate.ts`)에서 광고 완료·쿠팡 진입 뒤에만 준다.

import { Directory, Filesystem } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'

import { deleteDeviceFile, deviceImageUrl } from './deviceImage'

export const TRYON_INDEX_KEY = 'ojjeom.tryon.v1'
export const TRYON_VIEWS_KEY = 'ojjeom.tryon.views.v1'
export const TRYON_IMAGE_DIRECTORY = 'tryon/v1'
const LEGACY_TRYON_AUTO_KEY = 'ojjeom.tryon.auto.v1'

export type TryonState = 'no-photo' | 'unavailable' | 'idle' | 'generating' | 'ready' | 'failed'
export type TryonImageKind = 'outfit' | 'shop'

export interface StoredTryonImage {
  date: string
  outfitKey: string
  path: string
  createdAt: string
  /** 예전 저장 데이터에는 없을 수 있어 화면에서 키로 보정한다. */
  kind?: TryonImageKind
  categories?: string[]
  itemIds?: string[]
}

export interface TryonImage extends StoredTryonImage {
  imageUrl: string
}

export interface TryonViewLog {
  date: string
  count: number
}

/** 같은 코디면 같은 키 — 아이템 구성이 바뀌면 새로 생성한다. */
export function outfitKeyOf(itemIds: readonly string[]): string {
  return [...itemIds].sort().join('+')
}

export function parseTryonIndex(value: string | null): StoredTryonImage[] {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is StoredTryonImage => {
      if (!item || typeof item !== 'object') return false
      const entry = item as Partial<StoredTryonImage>
      const valid = (
        typeof entry.date === 'string'
        && typeof entry.outfitKey === 'string'
        && typeof entry.path === 'string'
        && typeof entry.createdAt === 'string'
      )
      if (!valid) return false
      if (entry.kind !== undefined && entry.kind !== 'outfit' && entry.kind !== 'shop') return false
      if (entry.categories !== undefined && (!Array.isArray(entry.categories) || !entry.categories.every(value => typeof value === 'string'))) return false
      if (entry.itemIds !== undefined && (!Array.isArray(entry.itemIds) || !entry.itemIds.every(value => typeof value === 'string'))) return false
      return true
    })
  } catch {
    return []
  }
}

export function parseViewLog(value: string | null): TryonViewLog | null {
  if (!value) return null

  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return null
    const log = parsed as Partial<TryonViewLog>
    if (typeof log.date !== 'string' || typeof log.count !== 'number') return null
    return { date: log.date, count: Math.max(0, Math.floor(log.count)) }
  } catch {
    return null
  }
}

export function viewsUsedOn(log: TryonViewLog | null, today: string): number {
  return log && log.date === today ? log.count : 0
}

export function nextViewLog(
  log: TryonViewLog | null,
  today: string,
): TryonViewLog {
  return { date: today, count: viewsUsedOn(log, today) + 1 }
}

async function readIndex(): Promise<StoredTryonImage[]> {
  const { value } = await Preferences.get({ key: TRYON_INDEX_KEY })
  return parseTryonIndex(value)
}

async function writeIndex(items: StoredTryonImage[]): Promise<void> {
  await Preferences.set({ key: TRYON_INDEX_KEY, value: JSON.stringify(items) })
}

export async function loadViewLog(): Promise<TryonViewLog | null> {
  const { value } = await Preferences.get({ key: TRYON_VIEWS_KEY })
  return parseViewLog(value)
}

export async function recordTryonView(today: string): Promise<TryonViewLog> {
  const next = nextViewLog(await loadViewLog(), today)
  await Preferences.set({ key: TRYON_VIEWS_KEY, value: JSON.stringify(next) })
  return next
}

/** 저장된 모든 결과를 최신순으로 불러온다. 날짜가 바뀌어도 자동 삭제하지 않는다. */
export async function loadTryonImages(_today?: string): Promise<TryonImage[]> {
  const stored = [...await readIndex()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return Promise.all(stored.map(async item => ({
    ...item,
    imageUrl: await deviceImageUrl(item.path),
  })))
}

export async function saveTryonImage(
  today: string,
  outfitKey: string,
  jpegBase64: string,
  metadata: Pick<StoredTryonImage, 'kind' | 'categories' | 'itemIds'> = {},
  now = new Date(),
): Promise<TryonImage> {
  const path = `${TRYON_IMAGE_DIRECTORY}/${today}-${outfitKey.slice(0, 40).replace(/[^\w+-]/g, '')}.jpg`
  await Filesystem.writeFile({
    path,
    data: jpegBase64,
    directory: Directory.Data,
    recursive: true,
  })

  const stored: StoredTryonImage = {
    date: today,
    outfitKey,
    path,
    createdAt: now.toISOString(),
    ...metadata,
  }
  const current = await readIndex()
  const replaced = current.filter(item => item.outfitKey === outfitKey && item.path !== path)
  await Promise.all(replaced.map(item => deleteDeviceFile(item.path)))
  const rest = current.filter(item => item.outfitKey !== outfitKey)
  await writeIndex([stored, ...rest])

  return { ...stored, imageUrl: await deviceImageUrl(path) }
}

export async function deleteTryonImage(outfitKey: string): Promise<void> {
  const items = await readIndex()
  const targets = items.filter(item => item.outfitKey === outfitKey)
  await Promise.all(targets.map(item => deleteDeviceFile(item.path)))
  await writeIndex(items.filter(item => item.outfitKey !== outfitKey))
}

/** 사용자가 내 데이터 전체 삭제를 선택했을 때 호출한다. */
export async function deleteTryonImages(): Promise<void> {
  const items = await readIndex()
  await Promise.all(items.map(item => deleteDeviceFile(item.path)))
  await Preferences.remove({ key: TRYON_INDEX_KEY })
  await Preferences.remove({ key: TRYON_VIEWS_KEY })
  await Preferences.remove({ key: LEGACY_TRYON_AUTO_KEY })
}
