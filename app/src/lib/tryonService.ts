// 생성 경로 — M6-기획.md §6.1, M10-기획.md §3
// 기본은 개발 서버 내장 엔드포인트. VITE_TRYON_API_URL 을 주면 독립 tryon-api(도커)를 쓴다.
// 어느 쪽이든 없으면 앱은 "준비 중"만 보여주고 생성 버튼을 만들지 않는다.

const BASE = import.meta.env.BASE_URL || '/'
const EXTERNAL = (import.meta.env.VITE_TRYON_API_URL as string | undefined)?.replace(/\/+$/, '')

export function normalizeTryonEndpoint(external: string | undefined, base: string): string {
  const normalizedExternal = external?.replace(/\/+$/, '')
  if (normalizedExternal) {
    return normalizedExternal.endsWith('/__tryon')
      ? normalizedExternal
      : `${normalizedExternal}/__tryon`
  }

  return `${base.replace(/\/+$/, '')}/__tryon`
}

const ENDPOINT = normalizeTryonEndpoint(EXTERNAL, BASE)

export const TRYON_PROBE_TIMEOUT_MS = 3_000
export const TRYON_GENERATE_TIMEOUT_MS = 240_000

export type TryonProbeState =
  | 'ok'
  | 'timeout'
  | 'http_error'
  | 'invalid_payload'
  | 'network_error'

export interface TryonProbeStatus {
  ok: boolean
  state: TryonProbeState
  status?: number
}

export interface TryonGeneration {
  base64: string
  elapsedMs: number
  model: string
}

export function tryonEndpoint(): string {
  return ENDPOINT
}

/** iOS 15 웹뷰에는 AbortSignal.timeout 이 없다. */
function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms)

  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

function isAbortError(error: unknown): boolean {
  return Boolean(
    error
    && typeof error === 'object'
    && 'name' in error
    && (error as { name?: unknown }).name === 'AbortError',
  )
}

export function parseTryonProbeResponse(
  response: Pick<Response, 'ok' | 'status'>,
  payload: unknown,
): TryonProbeStatus {
  if (!response.ok) {
    return {
      ok: false,
      state: 'http_error',
      status: response.status,
    }
  }

  if (!payload || typeof payload !== 'object' || (payload as { ok?: unknown }).ok !== true) {
    return {
      ok: false,
      state: 'invalid_payload',
      status: response.status,
    }
  }

  return {
    ok: true,
    state: 'ok',
    status: response.status,
  }
}

/** 이 빌드에서 실제 생성이 가능한지 한 번만 확인한다. */
export async function probeTryonServiceStatus(): Promise<TryonProbeStatus> {
  try {
    const response = await fetch(`${ENDPOINT}/health`, {
      signal: timeoutSignal(TRYON_PROBE_TIMEOUT_MS),
    })

    const payload: unknown = await response.json().catch(() => null)
    return parseTryonProbeResponse(response, payload)
  } catch (error) {
    return {
      ok: false,
      state: isAbortError(error) ? 'timeout' : 'network_error',
    }
  }
}

export async function probeTryonService(): Promise<boolean> {
  const status = await probeTryonServiceStatus()
  return status.ok
}

export async function generateTryon(
  personBase64: string,
  garmentsBase64: readonly string[],
): Promise<TryonGeneration> {
  if (garmentsBase64.length === 0) {
    throw new Error('입힐 옷 사진이 없어요.')
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ person: personBase64, garments: garmentsBase64 }),
    signal: timeoutSignal(TRYON_GENERATE_TIMEOUT_MS),
  })

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const reason = payload && typeof payload === 'object'
      ? String((payload as { error?: unknown }).error ?? '')
      : ''
    throw new Error(reason || `생성 서버 HTTP ${response.status} 오류예요.`)
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('생성 서버 응답 형식이 올바르지 않아요.')
  }

  const result = payload as { image?: unknown; elapsedMs?: unknown; model?: unknown }
  if (typeof result.image !== 'string' || result.image.length === 0) {
    throw new Error('생성 결과 이미지를 받지 못했어요.')
  }

  return {
    base64: result.image,
    elapsedMs: typeof result.elapsedMs === 'number' ? result.elapsedMs : 0,
    model: typeof result.model === 'string' ? result.model : 'unknown',
  }
}
