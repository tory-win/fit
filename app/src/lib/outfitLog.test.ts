import { describe, expect, it } from 'vitest'
import { entryForDate, historyFrom, parseOutfitLog, upsertEntry, wearCount, type OutfitEntry } from './outfitLog'

const monday: OutfitEntry = {
  date: '2026-07-20',
  itemIds: ['top-1', 'bottom-1'],
  mood: '단정한 대비',
  confirmedAt: '2026-07-20T00:10:00.000Z',
}
const saturday: OutfitEntry = {
  date: '2026-07-25',
  itemIds: ['top-2', 'bottom-1'],
  mood: '깊은 톤',
  confirmedAt: '2026-07-25T00:10:00.000Z',
}

describe('parseOutfitLog', () => {
  it('keeps only well-formed entries', () => {
    expect(parseOutfitLog(JSON.stringify([monday, { date: '2026-07-21' }]))).toEqual([monday])
    expect(parseOutfitLog('{broken')).toEqual([])
    expect(parseOutfitLog(null)).toEqual([])
  })
})

describe('upsertEntry', () => {
  it('replaces the same day instead of stacking confirmations', () => {
    const changed = { ...saturday, itemIds: ['top-3', 'bottom-2'], mood: '차분한 톤온톤' }
    const result = upsertEntry([monday, saturday], changed)
    expect(result).toEqual([monday, changed])
    expect(entryForDate(result, '2026-07-25')).toEqual(changed)
  })
})

describe('wearCount', () => {
  it('counts a piece once per confirmed day', () => {
    expect(wearCount([monday, saturday], 'bottom-1')).toBe(2)
    expect(wearCount([monday, saturday], 'top-2')).toBe(1)
    expect(wearCount([monday, saturday], 'shoes-1')).toBe(0)
  })
})

describe('historyFrom', () => {
  it('keeps the latest wear date per item', () => {
    expect(historyFrom([saturday, monday]).lastWornAt).toEqual({
      'top-1': '2026-07-20',
      'top-2': '2026-07-25',
      'bottom-1': '2026-07-25',
    })
  })
})
