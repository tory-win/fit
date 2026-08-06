import { describe, expect, it } from 'vitest'
import {
  isDraftComplete,
  parseClosetIndex,
  splitExpiredTrash,
  trashDaysLeft,
  type ClosetDraft,
  type StoredClosetItem,
} from './closet'

const baseItem: StoredClosetItem = {
  id: 'item-1',
  imagePath: 'closet/v1/images/item-1.jpg',
  category: '상의',
  color: '아이보리',
  seasons: ['봄', '가을'],
  source: 'album',
  createdAt: '2026-07-25T00:00:00.000Z',
}

describe('parseClosetIndex', () => {
  it('keeps only valid records', () => {
    const parsed = parseClosetIndex(JSON.stringify([
      baseItem,
      { ...baseItem, id: 'bad', category: '모름' },
    ]))
    expect(parsed).toEqual([baseItem])
  })

  it('recovers from corrupted preferences data', () => {
    expect(parseClosetIndex('{broken')).toEqual([])
  })
})

describe('isDraftComplete', () => {
  const draft: ClosetDraft = {
    id: 'draft-1',
    previewUrl: 'data:image/jpeg;base64,abc',
    jpegBase64: 'abc',
    source: 'camera',
    category: '상의',
    color: '아이보리',
    seasons: ['봄'],
  }

  it('requires category, color, and at least one season', () => {
    expect(isDraftComplete(draft)).toBe(true)
    expect(isDraftComplete({ ...draft, color: '' })).toBe(false)
    expect(isDraftComplete({ ...draft, seasons: [] })).toBe(false)
  })
})

describe('trashDaysLeft', () => {
  const now = new Date('2026-07-25T09:00:00.000Z').getTime()

  it('counts down from seven and floors at zero', () => {
    expect(trashDaysLeft(baseItem, now)).toBe(7)
    expect(trashDaysLeft({ ...baseItem, deletedAt: '2026-07-25T08:00:00.000Z' }, now)).toBe(7)
    expect(trashDaysLeft({ ...baseItem, deletedAt: '2026-07-22T08:00:00.000Z' }, now)).toBe(4)
    expect(trashDaysLeft({ ...baseItem, deletedAt: '2026-07-18T08:00:00.000Z' }, now)).toBe(0)
    expect(trashDaysLeft({ ...baseItem, deletedAt: '2026-07-01T08:00:00.000Z' }, now)).toBe(0)
  })
})

describe('splitExpiredTrash', () => {
  it('purges only items that have spent seven days in trash', () => {
    const now = new Date('2026-07-25T00:00:00.000Z').getTime()
    const recent = { ...baseItem, id: 'recent', deletedAt: '2026-07-20T00:00:00.000Z' }
    const expired = { ...baseItem, id: 'expired', deletedAt: '2026-07-18T00:00:00.000Z' }

    expect(splitExpiredTrash([baseItem, recent, expired], now)).toEqual({
      kept: [baseItem, recent],
      expired: [expired],
    })
  })
})
