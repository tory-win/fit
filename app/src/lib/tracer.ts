// 추적 기록기 — 앱 어디서나 부르는 얇은 진입점.
// 저장은 비동기지만 호출부는 기다리지 않는다. 기록이 실패해도 기능은 계속 돌아간다.

import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

import {
  TRACE_KEY,
  appendTrace,
  isDuplicate,
  isTraceEnabled,
  loadTrace,
  sanitise,
  type TraceEvent,
  type TraceKind,
} from './trace'

const BASE = import.meta.env.BASE_URL || '/'
const COLLECTOR = `${BASE.replace(/\/+$/, '')}/__trace`

let enabled = true
let buffer: TraceEvent[] = []
let ready = false
let flushTimer: ReturnType<typeof setTimeout> | null = null
const pending: TraceEvent[] = []

export async function initTracer(): Promise<boolean> {
  enabled = await isTraceEnabled()
  buffer = await loadTrace()
  ready = true
  return enabled
}

export function setTracerEnabled(next: boolean): void {
  enabled = next
}

export function currentTrace(): TraceEvent[] {
  return buffer
}

/** 개발 서버가 있으면 같이 보낸다 — 에이전트가 실기기 로그를 바로 읽을 수 있게. */
async function ship(events: TraceEvent[]): Promise<void> {
  if (!import.meta.env.DEV || events.length === 0) return

  try {
    await fetch(COLLECTOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: Capacitor.getPlatform(),
        events,
      }),
    })
  } catch {
    // 개발 서버가 없으면 그냥 넘어간다.
  }
}

function scheduleFlush(): void {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    const events = pending.splice(0, pending.length)
    void Preferences.set({ key: TRACE_KEY, value: JSON.stringify(buffer) }).catch(() => undefined)
    void ship(events)
  }, 800)
}

export function trace(
  kind: TraceKind,
  scope: string,
  name: string,
  detail?: Record<string, string | number | boolean>,
): void {
  if (!enabled || !ready) return

  const event: TraceEvent = {
    at: new Date().toISOString(),
    kind,
    scope,
    name: sanitise(name),
    ...(detail ? { detail } : {}),
  }
  if (isDuplicate(buffer, event)) return

  buffer = appendTrace(buffer, event)
  pending.push(event)
  scheduleFlush()
}

export function traceError(scope: string, error: unknown, detail?: Record<string, string | number | boolean>): void {
  const message = error instanceof Error ? error.message : String(error)
  trace('error', scope, message, detail)
}

/** 시간이 걸리는 작업을 감싼다 — 성공·실패와 소요 시간이 함께 남는다. */
export async function traced<T>(scope: string, name: string, run: () => Promise<T>): Promise<T> {
  const started = Date.now()
  try {
    const result = await run()
    trace('result', scope, `${name} 성공`, { ms: Date.now() - started })
    return result
  } catch (error) {
    trace('result', scope, `${name} 실패`, { ms: Date.now() - started })
    traceError(scope, error, { during: name })
    throw error
  }
}

export function resetTracer(): void {
  if (flushTimer) {
    globalThis.clearTimeout(flushTimer)
    flushTimer = null
  }
  buffer = []
  pending.length = 0
}
