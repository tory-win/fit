// 행동·오류 추적 — 사용자가 겪은 일을 다음 사람(또는 에이전트)이 그대로 읽게 한다.
//
// 원칙
//  1. 개인정보는 절대 넣지 않는다. 사진·생년월일·체형·이름·코디 기록 값은 기록 대상이 아니다.
//  2. 기기 안에 쌓는다. 개발 빌드에서만 개발 서버로 함께 보낸다(같은 Mac).
//  3. 무엇이 남는지 화면에서 볼 수 있고, 끄고 지울 수 있다.

import { Preferences } from '@capacitor/preferences'

import { FEATURES } from './appEnv'

export const TRACE_KEY = 'ojjeom.trace.v1'
export const TRACE_ENABLED_KEY = 'ojjeom.trace.enabled.v1'
export const TRACE_LIMIT = 300

export type TraceKind = 'nav' | 'action' | 'error' | 'result'

export interface TraceEvent {
  at: string
  kind: TraceKind
  /** 화면 또는 기능 이름 */
  scope: string
  /** 무슨 일이 있었는지 — 값이 아니라 이름만 */
  name: string
  /** 숫자·불리언·짧은 식별자만. 개인정보 금지 */
  detail?: Record<string, string | number | boolean>
}

/** 기록에 남기는 것 — 화면에 그대로 보여준다. */
export const TRACE_FIELDS = [
  '화면 이동',
  '누른 버튼',
  '성공·실패와 걸린 시간',
  '오류 메시지·앱 버전·기기 종류',
] as const

/** 절대 남기지 않는 것 */
export const TRACE_EXCLUDED = [
  '사진',
  FEATURES.saju ? '생년월일·사주' : '생년월일',
  '체형·몸무게',
  '코디 기록 내용',
] as const

/** data URL·파일 경로·주소를 지운다. 오류 메시지에 사진 바이트가 섞여 들어오는 것을 막는다. */
export function sanitise(value: string): string {
  return value
    .replace(/data:[^\s)"']+/g, '[이미지]')
    .replace(/(file|blob|capacitor|https?):\/\/[^\s)"']+/g, '[주소]')
    .slice(0, 200)
}

export function parseTrace(value: string | null): TraceEvent[] {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((entry): entry is TraceEvent => {
      if (!entry || typeof entry !== 'object') return false
      const event = entry as Partial<TraceEvent>
      return typeof event.at === 'string'
        && typeof event.scope === 'string'
        && typeof event.name === 'string'
        && (event.kind === 'nav' || event.kind === 'action' || event.kind === 'error' || event.kind === 'result')
    })
  } catch {
    return []
  }
}

export function appendTrace(
  log: readonly TraceEvent[],
  event: TraceEvent,
  limit = TRACE_LIMIT,
): TraceEvent[] {
  return [event, ...log].slice(0, limit)
}

/** 같은 화면 이동이 연속으로 쌓이면 하나로 본다 — 리렌더로 로그가 부풀지 않게. */
export function isDuplicate(log: readonly TraceEvent[], event: TraceEvent): boolean {
  const last = log[0]
  return Boolean(
    last
    && last.kind === event.kind
    && last.scope === event.scope
    && last.name === event.name
    && event.kind === 'nav',
  )
}

export async function isTraceEnabled(): Promise<boolean> {
  const { value } = await Preferences.get({ key: TRACE_ENABLED_KEY })
  return value !== 'off'
}

export async function setTraceEnabled(enabled: boolean): Promise<void> {
  await Preferences.set({ key: TRACE_ENABLED_KEY, value: enabled ? 'on' : 'off' })
}

export async function loadTrace(): Promise<TraceEvent[]> {
  const { value } = await Preferences.get({ key: TRACE_KEY })
  return parseTrace(value)
}

export async function clearTrace(): Promise<void> {
  await Preferences.remove({ key: TRACE_KEY })
}
