import { describe, expect, it } from 'vitest'
import {
  EMPTY_CLOSET_QUERY,
  activeFilterCount,
  applyClosetQuery,
  categoryCounts,
  isDefaultQuery,
  matchesSearch,
  toggleValue,
  wearCounts,
} from './closetFilter'
import type { ClosetItem } from './closet'

function item(partial: Partial<ClosetItem> & { id: string }): ClosetItem {
  return {
    imagePath: `closet/${partial.id}.jpg`,
    imageUrl: `blob:${partial.id}`,
    category: '상의',
    color: '블랙',
    seasons: ['여름'],
    source: 'camera',
    createdAt: '2026-07-20T00:00:00.000Z',
    ...partial,
  } as ClosetItem
}

const closet: ClosetItem[] = [
  item({ id: 'a', category: '상의', color: '블랙', seasons: ['여름'], createdAt: '2026-07-24T00:00:00.000Z' }),
  item({ id: 'b', category: '하의', color: '베이지', seasons: ['봄', '가을'], source: 'album', createdAt: '2026-07-25T00:00:00.000Z' }),
  item({ id: 'c', category: '상의', color: '그린', seasons: ['겨울'], createdAt: '2026-07-23T00:00:00.000Z' }),
]

describe('categoryCounts', () => {
  it('counts every category including empty ones', () => {
    const counts = categoryCounts(closet)
    expect(counts['상의']).toBe(2)
    expect(counts['하의']).toBe(1)
    expect(counts['가방']).toBe(0)
  })
})

describe('applyClosetQuery', () => {
  it('filters by category', () => {
    const result = applyClosetQuery(closet, { ...EMPTY_CLOSET_QUERY, category: '상의' })
    expect(result.map(entry => entry.id)).toEqual(['a', 'c'])
  })

  it('filters by color, season, and source together', () => {
    expect(applyClosetQuery(closet, {
      ...EMPTY_CLOSET_QUERY,
      colors: ['베이지'],
      seasons: ['가을'],
      sources: ['album'],
    }).map(entry => entry.id)).toEqual(['b'])

    expect(applyClosetQuery(closet, {
      ...EMPTY_CLOSET_QUERY,
      colors: ['베이지'],
      sources: ['camera'],
    })).toEqual([])
  })

  it('sorts by newest first by default', () => {
    expect(applyClosetQuery(closet, EMPTY_CLOSET_QUERY).map(entry => entry.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts by wear count and falls back to newest', () => {
    const wear = { a: 3, c: 0 }
    expect(applyClosetQuery(closet, { ...EMPTY_CLOSET_QUERY, sort: 'least-worn' }, wear)
      .map(entry => entry.id)).toEqual(['b', 'c', 'a'])
    expect(applyClosetQuery(closet, { ...EMPTY_CLOSET_QUERY, sort: 'most-worn' }, wear)
      .map(entry => entry.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('matchesSearch', () => {
  it('matches color, category, and season text', () => {
    expect(matchesSearch(closet[0], '블랙')).toBe(true)
    expect(matchesSearch(closet[0], '상의 여름')).toBe(true)
    expect(matchesSearch(closet[0], '블랙 하의')).toBe(false)
  })

  it('treats an empty term as no filter', () => {
    expect(matchesSearch(closet[0], '   ')).toBe(true)
  })
})

describe('wearCounts', () => {
  it('counts how often each item was confirmed', () => {
    expect(wearCounts([
      { date: '2026-07-24', itemIds: ['a', 'b'], mood: '', confirmedAt: '' },
      { date: '2026-07-25', itemIds: ['a'], mood: '', confirmedAt: '' },
    ])).toEqual({ a: 2, b: 1 })
  })
})

describe('filter bookkeeping', () => {
  it('counts active filters without the category axis', () => {
    expect(activeFilterCount(EMPTY_CLOSET_QUERY)).toBe(0)
    expect(activeFilterCount({ ...EMPTY_CLOSET_QUERY, category: '상의' })).toBe(0)
    expect(activeFilterCount({ ...EMPTY_CLOSET_QUERY, colors: ['블랙'], sort: 'least-worn' })).toBe(2)
  })

  it('knows the untouched query', () => {
    expect(isDefaultQuery(EMPTY_CLOSET_QUERY)).toBe(true)
    expect(isDefaultQuery({ ...EMPTY_CLOSET_QUERY, search: '블랙' })).toBe(false)
  })

  it('toggles values in place', () => {
    expect(toggleValue(['봄'], '여름')).toEqual(['봄', '여름'])
    expect(toggleValue(['봄', '여름'], '봄')).toEqual(['여름'])
  })
})
