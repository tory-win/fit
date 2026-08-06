import { describe, expect, it } from 'vitest'
import {
  nextViewLog,
  outfitKeyOf,
  parseTryonIndex,
  parseViewLog,
  viewsUsedOn,
  type StoredTryonImage,
} from './tryon'
import { parseTryonProbeResponse } from './tryonService'

const image: StoredTryonImage = {
  date: '2026-07-26',
  outfitKey: 'a+b',
  path: 'tryon/v1/2026-07-26-a+b.jpg',
  createdAt: '2026-07-26T01:00:00.000Z',
}

describe('outfitKeyOf', () => {
  it('does not depend on item order', () => {
    expect(outfitKeyOf(['b', 'a'])).toBe(outfitKeyOf(['a', 'b']))
  })

  it('changes when the outfit changes', () => {
    expect(outfitKeyOf(['a', 'b'])).not.toBe(outfitKeyOf(['a', 'c']))
  })
})

describe('parseTryonIndex', () => {
  it('keeps only complete records', () => {
    expect(parseTryonIndex(JSON.stringify([image, { date: '2026-07-26' }]))).toEqual([image])
  })

  it('recovers from corrupted data', () => {
    expect(parseTryonIndex('{broken')).toEqual([])
    expect(parseTryonIndex(null)).toEqual([])
  })

  it('keeps results from different days and optional gallery metadata', () => {
    const yesterday: StoredTryonImage = {
      ...image,
      date: '2026-07-25',
      outfitKey: 'pretryon-20260725-090000',
      kind: 'shop',
      categories: ['상의'],
    }
    expect(parseTryonIndex(JSON.stringify([image, yesterday]))).toEqual([image, yesterday])
  })
})

describe('generation metrics', () => {
  const today = '2026-07-26'

  it('counts only today', () => {
    expect(viewsUsedOn({ date: '2026-07-25', count: 3 }, today)).toBe(0)
    expect(viewsUsedOn({ date: today, count: 3 }, today)).toBe(3)
  })

  it('increments the generated-view count without granting access', () => {
    expect(nextViewLog(null, today)).toEqual({ date: today, count: 1 })
    expect(nextViewLog({ date: today, count: 4 }, today)).toEqual({ date: today, count: 5 })
  })
})

describe('parseViewLog', () => {
  it('normalises broken counts', () => {
    expect(parseViewLog(JSON.stringify({ date: '2026-07-26', count: -2 }))).toEqual({
      date: '2026-07-26',
      count: 0,
    })
    expect(parseViewLog('{broken')).toBeNull()
    expect(parseViewLog(null)).toBeNull()
  })
})

describe('parseTryonProbeResponse', () => {
  it('accepts healthy payloads', () => {
    expect(parseTryonProbeResponse({ ok: true, status: 200 }, { ok: true })).toEqual({
      ok: true,
      state: 'ok',
      status: 200,
    })
  })

  it('distinguishes HTTP failures from payload failures', () => {
    expect(parseTryonProbeResponse({ ok: false, status: 503 }, { ok: true })).toEqual({
      ok: false,
      state: 'http_error',
      status: 503,
    })

    expect(parseTryonProbeResponse({ ok: true, status: 200 }, { ready: true })).toEqual({
      ok: false,
      state: 'invalid_payload',
      status: 200,
    })
  })
})
