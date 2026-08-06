import { describe, expect, it } from 'vitest'
import { PRE_TRYON_MAX_GARMENTS, isPreTryonKey, mergeGarments, preTryonKey } from './preTryon'
import { outfitKeyOf } from './tryon'

describe('preTryonKey', () => {
  it('저장 경로 규칙에서 살아남는 40자 이하 키를 만든다', () => {
    const key = preTryonKey(new Date(2026, 7, 1, 9, 5, 3))
    expect(key).toBe('pretryon-20260801-090503')
    expect(key.length).toBeLessThanOrEqual(40)
    expect(key.replace(/[^\w+-]/g, '')).toBe(key)
  })

  it('코디 키와 구분된다', () => {
    expect(isPreTryonKey(preTryonKey(new Date()))).toBe(true)
    expect(isPreTryonKey(outfitKeyOf(['top-1', 'bottom-2']))).toBe(false)
  })
})

describe('mergeGarments', () => {
  it('최대 장수를 넘기지 않는다', () => {
    expect(mergeGarments(['a'], ['b', 'c'])).toEqual(['a', 'b'])
    expect(mergeGarments([], ['a'])).toEqual(['a'])
    expect(mergeGarments(['a', 'b'], ['c'])).toEqual(['a', 'b'])
    expect(PRE_TRYON_MAX_GARMENTS).toBe(2)
  })
})
