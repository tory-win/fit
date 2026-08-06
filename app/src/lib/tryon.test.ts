import { beforeEach, describe, expect, it, vi } from 'vitest'

const preferenceStore = new Map<string, string>()
const writtenPaths: string[] = []
const deletedPaths: string[] = []

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({ value: preferenceStore.get(key) ?? null })),
    set: vi.fn(async ({ key, value }: { key: string, value: string }) => {
      preferenceStore.set(key, value)
    }),
    remove: vi.fn(async ({ key }: { key: string }) => {
      preferenceStore.delete(key)
    }),
  },
}))

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Data: 'DATA' },
  Filesystem: {
    writeFile: vi.fn(async ({ path }: { path: string }) => {
      writtenPaths.push(path)
    }),
  },
}))

vi.mock('./deviceImage', () => ({
  deleteDeviceFile: vi.fn(async (path: string) => {
    deletedPaths.push(path)
  }),
  deviceImageUrl: vi.fn(async (path: string) => `device://${path}`),
}))

import {
  TRYON_INDEX_KEY,
  deleteTryonImage,
  loadTryonImages,
  nextViewLog,
  outfitKeyOf,
  parseTryonIndex,
  parseViewLog,
  saveTryonImage,
  viewsUsedOn,
  type StoredTryonImage,
} from './tryon'
import { parseTryonProbeResponse } from './tryonService'

beforeEach(() => {
  preferenceStore.clear()
  writtenPaths.length = 0
  deletedPaths.length = 0
})

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

describe('try-on storage identity', () => {
  it('keeps outfit and shop results for the same outfitKey separate and deletes only the targeted kind', async () => {
    const today = '2026-07-26'
    const outfitKey = 'a+b'

    const outfit = await saveTryonImage(today, outfitKey, 'outfit-base64', {
      kind: 'outfit',
      itemIds: ['a', 'b'],
    })
    const shop = await saveTryonImage(today, outfitKey, 'shop-base64', {
      kind: 'shop',
      itemIds: ['a', 'b'],
    })

    expect(outfit.path).toBe('tryon/v1/2026-07-26-outfit-a+b.jpg')
    expect(shop.path).toBe('tryon/v1/2026-07-26-shop-a+b.jpg')
    expect(writtenPaths).toEqual([
      'tryon/v1/2026-07-26-outfit-a+b.jpg',
      'tryon/v1/2026-07-26-shop-a+b.jpg',
    ])

    const storedBeforeDelete = parseTryonIndex(preferenceStore.get(TRYON_INDEX_KEY) ?? null)
    expect(storedBeforeDelete.map(item => item.kind)).toEqual(['shop', 'outfit'])

    await deleteTryonImage(outfitKey, 'shop')

    expect(deletedPaths).toEqual(['tryon/v1/2026-07-26-shop-a+b.jpg'])
    expect(await loadTryonImages()).toEqual([{ ...outfit, imageUrl: 'device://tryon/v1/2026-07-26-outfit-a+b.jpg' }])

    const storedAfterDelete = parseTryonIndex(preferenceStore.get(TRYON_INDEX_KEY) ?? null)
    expect(storedAfterDelete).toEqual([expect.objectContaining({ outfitKey, kind: 'outfit' })])
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
