import { describe, expect, it } from 'vitest'
import { calculateTargetSize, stripDataUrlPrefix } from './image'

describe('calculateTargetSize', () => {
  it('keeps a small image unchanged', () => {
    expect(calculateTargetSize(1200, 900)).toEqual({ width: 1200, height: 900 })
  })

  it('limits a landscape image to the longest edge', () => {
    expect(calculateTargetSize(4032, 3024)).toEqual({ width: 1600, height: 1200 })
  })

  it('limits a portrait image without changing its ratio', () => {
    expect(calculateTargetSize(3024, 4032)).toEqual({ width: 1200, height: 1600 })
  })

  it('rejects invalid dimensions', () => {
    expect(() => calculateTargetSize(0, 100)).toThrow()
  })
})

describe('stripDataUrlPrefix', () => {
  it('returns only the binary payload from a data URL', () => {
    expect(stripDataUrlPrefix('data:image/jpeg;base64,abc123')).toBe('abc123')
  })

  it('keeps an already bare base64 value', () => {
    expect(stripDataUrlPrefix('abc123')).toBe('abc123')
  })
})
