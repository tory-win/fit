// 전신 사진 — M6-기획.md §4, 기획서 O-3
// 원본은 저장하지 않는다. prepareClosetImage 의 캔버스 재인코딩 결과만 남기므로
// EXIF·GPS 는 파일에 존재하지 않고, 방향은 픽셀에 구워진 상태로 저장된다.

import { Directory, Filesystem } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'

import { deleteDeviceFile, deviceImageUrl, readDeviceImageBase64 } from './deviceImage'
import type { PreparedImage } from './image'

export const BODY_PHOTO_KEY = 'ojjeom.bodyPhoto.v1'
export const BODY_PHOTO_PATH = 'body/v1/photo.jpg'
export const BODY_PHOTO_CONSENT_VERSION = 'v2'

/** 동의 화면에서 하나씩 확인받는 항목 — 전부 확인해야 저장한다. */
export const BODY_PHOTO_CONSENTS = [
  {
    id: 'purpose',
    title: '쓰는 곳',
    body: 'AI 착장 미리보기 이미지를 만들 때만 사용해요. 추천 점수 계산에는 쓰지 않아요.',
  },
  {
    id: 'transfer',
    title: '나가는 때',
    body: '미리보기를 열 때만 생성 서버로 보내요. 등록만 하면 기기를 떠나지 않아요.',
  },
  {
    id: 'retention',
    title: '남기지 않기',
    body: '생성이 끝나면 보낸 사진은 서버에서 바로 폐기해요. 결과 이미지는 기기에만 남아요.',
  },
  {
    id: 'owner',
    title: '본인 사진만',
    body: '다른 사람 사진은 올릴 수 없어요. 사진을 삭제해도 이미 만든 결과는 스타일북에 남아요.',
  },
] as const

export type BodyPhotoConsentId = (typeof BODY_PHOTO_CONSENTS)[number]['id']

export interface StoredBodyPhoto {
  path: string
  width: number
  height: number
  createdAt: string
  consentAt: string
  consentVersion: string
}

export interface BodyPhoto extends StoredBodyPhoto {
  imageUrl: string
}

export function isConsentComplete(checked: readonly string[]): boolean {
  return BODY_PHOTO_CONSENTS.every(consent => checked.includes(consent.id))
}

export function parseBodyPhoto(value: string | null): StoredBodyPhoto | null {
  if (!value) return null

  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return null
    const photo = parsed as Partial<StoredBodyPhoto>

    if (
      typeof photo.path !== 'string'
      || typeof photo.width !== 'number'
      || typeof photo.height !== 'number'
      || typeof photo.createdAt !== 'string'
      || typeof photo.consentAt !== 'string'
      || typeof photo.consentVersion !== 'string'
    ) {
      return null
    }

    return {
      path: photo.path,
      width: photo.width,
      height: photo.height,
      createdAt: photo.createdAt,
      consentAt: photo.consentAt,
      consentVersion: photo.consentVersion,
    }
  } catch {
    return null
  }
}

async function readStored(): Promise<StoredBodyPhoto | null> {
  const { value } = await Preferences.get({ key: BODY_PHOTO_KEY })
  return parseBodyPhoto(value)
}

export async function loadBodyPhoto(): Promise<BodyPhoto | null> {
  const stored = await readStored()
  if (!stored) return null

  try {
    return { ...stored, imageUrl: await deviceImageUrl(stored.path) }
  } catch {
    // 파일이 사라졌으면 기록도 남기지 않는다.
    await Preferences.remove({ key: BODY_PHOTO_KEY })
    return null
  }
}

/** 동의를 모두 확인한 뒤에만 호출한다. 이전 사진은 덮어쓴다. */
export async function saveBodyPhoto(
  prepared: PreparedImage,
  checkedConsents: readonly string[],
  now = new Date(),
): Promise<BodyPhoto> {
  if (!isConsentComplete(checkedConsents)) {
    throw new Error('사진 사용 동의 네 가지를 모두 확인해 주세요.')
  }

  await Filesystem.writeFile({
    path: BODY_PHOTO_PATH,
    data: prepared.base64,
    directory: Directory.Data,
    recursive: true,
  })

  const stored: StoredBodyPhoto = {
    path: BODY_PHOTO_PATH,
    width: prepared.width,
    height: prepared.height,
    createdAt: now.toISOString(),
    consentAt: now.toISOString(),
    consentVersion: BODY_PHOTO_CONSENT_VERSION,
  }
  await Preferences.set({ key: BODY_PHOTO_KEY, value: JSON.stringify(stored) })

  return { ...stored, imageUrl: await deviceImageUrl(stored.path) }
}

/** 생성 요청 직전에만 원본 바이트를 읽는다. */
export async function readBodyPhotoBase64(): Promise<string | null> {
  const stored = await readStored()
  if (!stored) return null

  try {
    return await readDeviceImageBase64(stored.path)
  } catch {
    return null
  }
}

/** 사진과 동의 기록을 함께 지운다. 되돌릴 수 없다. */
export async function deleteBodyPhoto(): Promise<void> {
  const stored = await readStored()
  if (stored) await deleteDeviceFile(stored.path)
  await Preferences.remove({ key: BODY_PHOTO_KEY })
}
