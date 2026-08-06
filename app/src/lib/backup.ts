// 내 데이터 내보내기·가져오기 — M7-기획.md §4.3
// 계정 없이 파일 하나로 옮긴다. 전신 사진과 착장 이미지는 민감정보라 기본 제외다.
// 가져오기는 임시로 풀어 검증한 뒤에만 반영한다 — 실패해도 지금 옷장은 그대로 남는다.

import { Directory, Filesystem } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'

import {
  CLOSET_INDEX_KEY,
  CLOSET_IMAGE_DIRECTORY,
  parseClosetIndex,
  type StoredClosetItem,
} from './closet'
import { OUTFIT_LOG_KEY, parseOutfitLog, type OutfitEntry } from './outfitLog'
import { BODY_PHOTO_KEY, parseBodyPhoto } from './bodyPhoto'
import { deleteDeviceFile, readDeviceImageBase64 } from './deviceImage'

export const BACKUP_FORMAT = 'ojjeom.backup.v1'
export const BACKUP_MANIFEST = 'manifest.json'
export const PROFILE_STORAGE_KEY = 'ojjeom.profile.v1'

export type ImportMode = 'merge' | 'replace'

export interface BackupOptions {
  includeBodyPhoto: boolean
}

export interface BackupManifest {
  format: string
  createdAt: string
  closet: StoredClosetItem[]
  outfitLog: OutfitEntry[]
  profile: unknown
  bodyPhoto: unknown
  imageCount: number
}

export interface BackupSummary {
  createdAt: string
  closetCount: number
  logCount: number
  hasProfile: boolean
  hasBodyPhoto: boolean
}

export interface BackupResult {
  fileName: string
  bytes: number
  data: Uint8Array
}

function backupFileName(now: Date): string {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return `ojjeom-backup-${date}.zip`
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index])
  return btoa(binary)
}

export function summarise(manifest: BackupManifest): BackupSummary {
  return {
    createdAt: manifest.createdAt,
    closetCount: manifest.closet.length,
    logCount: manifest.outfitLog.length,
    hasProfile: Boolean(manifest.profile),
    hasBodyPhoto: Boolean(manifest.bodyPhoto),
  }
}

export function parseManifest(raw: string): BackupManifest {
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object') throw new Error('백업 파일을 읽지 못했어요.')

  const manifest = parsed as Partial<BackupManifest>
  if (manifest.format !== BACKUP_FORMAT) {
    throw new Error('입핏 백업 파일이 아니에요.')
  }

  return {
    format: BACKUP_FORMAT,
    createdAt: typeof manifest.createdAt === 'string' ? manifest.createdAt : '',
    closet: parseClosetIndex(JSON.stringify(manifest.closet ?? [])),
    outfitLog: parseOutfitLog(JSON.stringify(manifest.outfitLog ?? [])),
    profile: manifest.profile ?? null,
    bodyPhoto: manifest.bodyPhoto ?? null,
    imageCount: typeof manifest.imageCount === 'number' ? manifest.imageCount : 0,
  }
}

/** 옷 사진·기록·프로필을 zip 하나로 만든다. */
export async function createBackup(
  options: BackupOptions,
  now = new Date(),
  onProgress?: (done: number, total: number) => void,
): Promise<BackupResult> {
  const closetRaw = await Preferences.get({ key: CLOSET_INDEX_KEY })
  const closet = parseClosetIndex(closetRaw.value).filter(item => !item.deletedAt)
  const logRaw = await Preferences.get({ key: OUTFIT_LOG_KEY })
  const profileRaw = await Preferences.get({ key: PROFILE_STORAGE_KEY })
  const bodyRaw = await Preferences.get({ key: BODY_PHOTO_KEY })
  const bodyPhoto = options.includeBodyPhoto ? parseBodyPhoto(bodyRaw.value) : null

  const files: Record<string, Uint8Array> = {}
  let done = 0
  for (const item of closet) {
    try {
      files[`images/${item.id}.jpg`] = base64ToBytes(await readDeviceImageBase64(item.imagePath))
    } catch {
      // 파일이 사라진 항목은 사진 없이 기록만 넘긴다.
    }
    done += 1
    onProgress?.(done, closet.length)
  }

  if (bodyPhoto) {
    try {
      files['body/photo.jpg'] = base64ToBytes(await readDeviceImageBase64(bodyPhoto.path))
    } catch {
      // 사진을 못 읽으면 본문에서도 제외한다.
    }
  }

  const manifest: BackupManifest = {
    format: BACKUP_FORMAT,
    createdAt: now.toISOString(),
    closet,
    outfitLog: parseOutfitLog(logRaw.value),
    profile: profileRaw.value ? JSON.parse(profileRaw.value) : null,
    bodyPhoto: files['body/photo.jpg'] ? bodyPhoto : null,
    imageCount: Object.keys(files).length,
  }
  files[BACKUP_MANIFEST] = strToU8(JSON.stringify(manifest))

  const data = zipSync(files, { level: 0 })
  return { fileName: backupFileName(now), bytes: data.length, data }
}

/** 기기에 파일로 남긴다. iOS 파일 앱의 `입핏` 폴더에서 꺼낼 수 있다. */
export async function writeBackupFile(result: BackupResult): Promise<string> {
  await Filesystem.writeFile({
    path: result.fileName,
    data: bytesToBase64(result.data),
    directory: Directory.Documents,
    recursive: true,
  })
  const { uri } = await Filesystem.getUri({ path: result.fileName, directory: Directory.Documents })
  return uri
}

export function readBackup(data: Uint8Array): { manifest: BackupManifest; files: Record<string, Uint8Array> } {
  const files = unzipSync(data)
  const raw = files[BACKUP_MANIFEST]
  if (!raw) throw new Error('백업 파일에 목록이 없어요.')
  return { manifest: parseManifest(strFromU8(raw)), files }
}

/** 합치기는 같은 사진을 다시 담지 않는다 — id 기준. */
export function mergeCloset(
  current: readonly StoredClosetItem[],
  incoming: readonly StoredClosetItem[],
): StoredClosetItem[] {
  const known = new Set(current.map(item => item.id))
  return [...current, ...incoming.filter(item => !known.has(item.id))]
}

export function mergeLog(
  current: readonly OutfitEntry[],
  incoming: readonly OutfitEntry[],
): OutfitEntry[] {
  const known = new Set(current.map(entry => entry.date))
  return [...current, ...incoming.filter(entry => !known.has(entry.date))]
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function applyBackup(
  parsed: { manifest: BackupManifest; files: Record<string, Uint8Array> },
  mode: ImportMode,
): Promise<{ added: number; logDays: number }> {
  const { manifest, files } = parsed
  const currentRaw = await Preferences.get({ key: CLOSET_INDEX_KEY })
  const current = parseClosetIndex(currentRaw.value)
  const currentLogRaw = await Preferences.get({ key: OUTFIT_LOG_KEY })
  const currentLog = parseOutfitLog(currentLogRaw.value)

  const incoming = mode === 'replace'
    ? manifest.closet
    : manifest.closet.filter(item => !current.some(existing => existing.id === item.id))

  // 사진을 먼저 다 쓰고, 하나라도 실패하면 새로 쓴 파일만 지우고 인덱스는 건드리지 않는다.
  const written: string[] = []
  try {
    for (const item of incoming) {
      const image = files[`images/${item.id}.jpg`]
      if (!image) continue
      const path = `${CLOSET_IMAGE_DIRECTORY}/${item.id}.jpg`
      await Filesystem.writeFile({
        path,
        data: bytesToBase64(image),
        directory: Directory.Data,
        recursive: true,
      })
      written.push(path)
    }

    if (mode === 'replace') {
      for (const item of current) {
        if (!incoming.some(next => next.id === item.id)) await deleteDeviceFile(item.imagePath)
      }
    }

    const nextCloset = mode === 'replace' ? manifest.closet : mergeCloset(current, incoming)
    const nextLog = mode === 'replace' ? manifest.outfitLog : mergeLog(currentLog, manifest.outfitLog)
    await Preferences.set({ key: CLOSET_INDEX_KEY, value: JSON.stringify(nextCloset) })
    await Preferences.set({ key: OUTFIT_LOG_KEY, value: JSON.stringify(nextLog) })

    if (mode === 'replace' && manifest.profile) {
      await Preferences.set({ key: PROFILE_STORAGE_KEY, value: JSON.stringify(manifest.profile) })
    }

    return { added: incoming.length, logDays: nextLog.length }
  } catch (error) {
    await Promise.all(written.map(deleteDeviceFile))
    throw error
  }
}
