import { describe, expect, it } from 'vitest'
import { EMPTY_TASTE, hasTaste, parseTaste, tasteBonus, tasteReason } from './taste'
import type { ClosetItem } from './closet'

const item = (color: ClosetItem['color'], fit?: ClosetItem['fit']): ClosetItem => ({
  id: color + (fit ?? ''),
  imagePath: 'p.jpg',
  imageUrl: 'blob:p',
  category: '상의',
  color,
  seasons: ['여름'],
  ...(fit ? { fit } : {}),
  source: 'camera',
  createdAt: '2026-07-26T00:00:00.000Z',
}) as ClosetItem

describe('hasTaste', () => {
  it('상관없음만 고르면 고르지 않은 것으로 본다', () => {
    expect(hasTaste(EMPTY_TASTE)).toBe(false)
    expect(hasTaste({ moods: [], coverage: '상관없음', colorTone: '상관없음' })).toBe(false)
    expect(hasTaste({ moods: ['단정'] })).toBe(true)
  })
})

describe('tasteBonus', () => {
  it('고르지 않으면 점수가 그대로다', () => {
    expect(tasteBonus([item('블랙')], '차분한 톤온톤', EMPTY_TASTE)).toBe(0)
  })

  it('무드가 맞으면 소폭 가산되고 상한을 넘지 않는다', () => {
    const bonus = tasteBonus(
      [item('블랙', 'relaxed'), item('베이지', 'relaxed')],
      '차분한 톤온톤',
      { moods: ['단정', '편안'], silhouette: '여유', colorTone: '차분' },
    )
    expect(bonus).toBeGreaterThan(0)
    expect(bonus).toBeLessThanOrEqual(0.12)
  })

  it('맞지 않는 무드에는 무드 가산이 없다', () => {
    const bonus = tasteBonus([item('블랙')], '과감한 배색', { moods: ['편안'] })
    expect(bonus).toBe(0)
  })
})

describe('tasteReason', () => {
  it('고르지 않으면 근거 줄을 만들지 않는다', () => {
    expect(tasteReason(EMPTY_TASTE, '차분한 톤온톤')).toBeNull()
  })

  it('고른 축을 문장으로 만든다', () => {
    const line = tasteReason({ moods: ['또렷'], colorTone: '선명' }, '과감한 배색')
    expect(line).toContain('또렷')
    expect(line).toContain('선명')
  })
})

describe('parseTaste', () => {
  it('모르는 값은 버린다', () => {
    const parsed = parseTaste(JSON.stringify({ moods: ['단정', '이상한값'], silhouette: '초슬림' }))
    expect(parsed.moods).toEqual(['단정'])
    expect(parsed.silhouette).toBeUndefined()
  })

  it('깨진 값은 빈 취향이다', () => {
    expect(parseTaste('{broken')).toEqual(EMPTY_TASTE)
    expect(parseTaste(null)).toEqual(EMPTY_TASTE)
  })
})
