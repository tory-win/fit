import { describe, expect, it } from 'vitest'
import { BACKUP_FORMAT, mergeCloset, mergeLog, parseManifest, summarise } from './backup'
import type { StoredClosetItem } from './closet'
import type { OutfitEntry } from './outfitLog'

const item = (id: string): StoredClosetItem => ({
  id,
  imagePath: `closet/v1/images/${id}.jpg`,
  category: '상의',
  color: '블랙',
  seasons: ['여름'],
  source: 'camera',
  createdAt: '2026-07-20T00:00:00.000Z',
})

const entry = (date: string): OutfitEntry => ({
  date,
  itemIds: ['a'],
  mood: '단정',
  confirmedAt: `${date}T08:00:00.000Z`,
})

describe('parseManifest', () => {
  it('reads a valid manifest and drops broken records', () => {
    const manifest = parseManifest(JSON.stringify({
      format: BACKUP_FORMAT,
      createdAt: '2026-07-26T00:00:00.000Z',
      closet: [item('a'), { id: 'broken' }],
      outfitLog: [entry('2026-07-24')],
      profile: { y: 1995 },
      bodyPhoto: null,
      imageCount: 1,
    }))

    expect(manifest.closet.map(record => record.id)).toEqual(['a'])
    expect(manifest.outfitLog).toHaveLength(1)
    expect(summarise(manifest)).toEqual({
      createdAt: '2026-07-26T00:00:00.000Z',
      closetCount: 1,
      logCount: 1,
      hasProfile: true,
      hasBodyPhoto: false,
    })
  })

  it('refuses files from another app', () => {
    expect(() => parseManifest(JSON.stringify({ format: 'other', closet: [] })))
      .toThrow('입핏 백업 파일이 아니에요.')
  })
})

describe('mergeCloset', () => {
  it('skips items that already exist', () => {
    expect(mergeCloset([item('a')], [item('a'), item('b')]).map(record => record.id))
      .toEqual(['a', 'b'])
  })
})

describe('mergeLog', () => {
  it('keeps the current day when both have the same date and sorts by date', () => {
    const current = [entry('2026-07-25')]
    const incoming = [entry('2026-07-26'), { ...entry('2026-07-25'), mood: '다름' }]
    const merged = mergeLog(current, incoming)

    expect(merged.map(record => record.date)).toEqual(['2026-07-25', '2026-07-26'])
    expect(merged[0].mood).toBe('단정')
  })
})
