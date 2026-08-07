// 스타일패스 — 이제 **운세 상세 열람권**이다 (2026-07-26 정책 변경).
//
// 코디(옷) 열람은 `lib/gate.ts` 의 열람권(크레딧)으로 옮겼다.
// 광고·쿠팡 1회를 보면 코디 열람권 1장과 운세 2시간 패스를 함께 받는다.
import { Preferences } from '@capacitor/preferences'

export const PASS_KEY = 'ojjeom.pass.v1'
export const PASS_HOURS = 2

export type PassReason = 'welcome' | 'dev' | 'ad' | 'coupang'

export interface StylePass {
  reason: PassReason
  grantedAt: string
  expiresAt: string
}

export function grantPass(reason: PassReason, now = new Date()): StylePass {
  return {
    reason,
    grantedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PASS_HOURS * 60 * 60 * 1000).toISOString(),
  }
}

export function isPassActive(pass: StylePass | null, now = new Date()): boolean {
  if (!pass) return false
  const expires = new Date(pass.expiresAt).getTime()
  return Number.isFinite(expires) && expires > now.getTime()
}

export function remainingMinutes(pass: StylePass | null, now = new Date()): number {
  if (!isPassActive(pass, now)) return 0
  return Math.ceil((new Date(pass!.expiresAt).getTime() - now.getTime()) / 60_000)
}

export function remainingLabel(pass: StylePass | null, now = new Date()): string {
  const minutes = remainingMinutes(pass, now)
  if (minutes <= 0) return '만료됨'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}분 남음`
  if (rest === 0) return `${hours}시간 남음`
  return `${hours}시간 ${rest}분 남음`
}

export function parsePass(raw: string | null): StylePass | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const pass = parsed as Partial<StylePass>
    if (pass.reason !== 'welcome' && pass.reason !== 'dev' && pass.reason !== 'ad' && pass.reason !== 'coupang') return null
    if (typeof pass.grantedAt !== 'string' || typeof pass.expiresAt !== 'string') return null
    if (!Number.isFinite(new Date(pass.expiresAt).getTime())) return null
    return { reason: pass.reason, grantedAt: pass.grantedAt, expiresAt: pass.expiresAt }
  } catch {
    return null
  }
}

export async function loadPass(): Promise<StylePass | null> {
  const { value } = await Preferences.get({ key: PASS_KEY })
  return parsePass(value)
}

export async function savePass(pass: StylePass): Promise<StylePass> {
  await Preferences.set({ key: PASS_KEY, value: JSON.stringify(pass) })
  return pass
}

/** 첫 실행에만 환영 패스를 준다. 이미 한 번 받았으면 다시 주지 않는다. */
export async function ensureWelcomePass(now = new Date()): Promise<StylePass | null> {
  const existing = await loadPass()
  if (existing) return existing
  return savePass(grantPass('welcome', now))
}
