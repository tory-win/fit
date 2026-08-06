import { describe, expect, it } from 'vitest'
import { APP_ENV, FEATURES, resolveAppEnv } from './appEnv'

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
