import { describe, expect, it } from 'vitest'
import { APP_ENV, FEATURES, resolveAppEnv } from './appEnv'
import { normalizeTryonEndpoint } from './tryonService'

describe('resolveAppEnv', () => {
  it("정확히 'real'일 때만 real이 된다", () => {
    expect(resolveAppEnv('real')).toBe('real')
  })

  it('그 외 모든 값은 stage로 떨어진다 — real 빌드는 항상 명시적', () => {
    expect(resolveAppEnv('stage')).toBe('stage')
    expect(resolveAppEnv(undefined)).toBe('stage')
    expect(resolveAppEnv('')).toBe('stage')
    expect(resolveAppEnv('REAL')).toBe('stage')
    expect(resolveAppEnv('production')).toBe('stage')
    expect(resolveAppEnv(1)).toBe('stage')
  })
})

describe('FEATURES', () => {
  it('테스트 실행 환경은 stage이고 사주가 켜져 있다', () => {
    expect(APP_ENV).toBe('stage')
    expect(FEATURES.saju).toBe(true)
  })
})

describe('normalizeTryonEndpoint', () => {
  it('외부 URL이 host만 주어지면 /__tryon 을 한 번만 붙인다', () => {
    expect(normalizeTryonEndpoint('http://127.0.0.1:8319', '/')).toBe('http://127.0.0.1:8319/__tryon')
  })

  it('외부 URL에 /__tryon 이 이미 있거나 끝 슬래시가 있어도 중복하지 않는다', () => {
    expect(normalizeTryonEndpoint('http://127.0.0.1:8319/__tryon', '/')).toBe('http://127.0.0.1:8319/__tryon')
    expect(normalizeTryonEndpoint('http://127.0.0.1:8319/__tryon/', '/')).toBe('http://127.0.0.1:8319/__tryon')
  })

  it('외부 URL이 없으면 BASE_URL 기반 내장 엔드포인트를 사용한다', () => {
    expect(normalizeTryonEndpoint(undefined, '/ipfit/')).toBe('/ipfit/__tryon')
  })
})
