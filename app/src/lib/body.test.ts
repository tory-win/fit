import { describe, expect, it } from 'vitest'
import {
  deriveBodyShape,
  hasBodySignal,
  parseBodyProfile,
} from './body'

describe('deriveBodyShape', () => {
  it('derives the legacy recommendation shape from understandable answers', () => {
    expect(deriveBodyShape('shoulders', 'straight')).toBe('역삼각')
    expect(deriveBodyShape('hips', 'defined')).toBe('삼각')
    expect(deriveBodyShape('balanced', 'defined')).toBe('모래시계')
    expect(deriveBodyShape('balanced', 'straight')).toBe('직사각')
    expect(deriveBodyShape('balanced', 'soft')).toBe('라운드')
  })

  it('does not guess a shape from an incomplete answer', () => {
    expect(deriveBodyShape('balanced', undefined)).toBeUndefined()
  })
})

describe('parseBodyProfile', () => {
  it('keeps valid optional measurements and derives a shape', () => {
    expect(parseBodyProfile({
      heightCm: 174.4,
      weightKg: 70.2,
      topSize: 'M',
      bottomWaistInch: 30,
      fitPreference: 'regular',
      balance: 'balanced',
      waistLine: 'defined',
      chips: [],
    })).toEqual({
      heightCm: 174,
      weightKg: 70,
      topSize: 'M',
      bottomWaistInch: 30,
      fitPreference: 'regular',
      balance: 'balanced',
      waistLine: 'defined',
      shape: '모래시계',
      chips: [],
    })
  })

  it('filters unsafe values without discarding a valid legacy shape', () => {
    const parsed = parseBodyProfile({
      weightKg: 999,
      topSize: 'unknown',
      shape: '삼각',
      chips: ['하체 볼륨', 'unknown'],
    })
    expect(parsed.weightKg).toBeUndefined()
    expect(parsed.topSize).toBeUndefined()
    expect(parsed.shape).toBe('삼각')
    expect(parsed.chips).toEqual(['하체 볼륨'])
  })
})

describe('hasBodySignal', () => {
  it('treats an optional measurement or fit preference as an explicit signal', () => {
    expect(hasBodySignal({ weightKg: 70, chips: [] })).toBe(true)
    expect(hasBodySignal({ fitPreference: 'relaxed', chips: [] })).toBe(true)
    expect(hasBodySignal({ chips: [] })).toBe(false)
  })
})
