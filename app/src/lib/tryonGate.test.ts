import { describe, expect, it } from 'vitest'

import { needsTryonMonetization, sameTryonRequest, type TryonRequest } from './tryonGate'

const outfitA: TryonRequest = { kind: 'outfit', outfitId: 'a', outfitKey: 'top-a+bottom-a' }
const outfitB: TryonRequest = { kind: 'outfit', outfitId: 'b', outfitKey: 'top-b+bottom-b' }

describe('tryon monetization gate', () => {
  it('requires monetization before every new AI request', () => {
    expect(needsTryonMonetization(outfitA, null)).toBe(true)
    expect(needsTryonMonetization({ kind: 'shop' }, null)).toBe(true)
  })

  it('allows only the same already-paid failed request to retry', () => {
    expect(needsTryonMonetization(outfitA, outfitA)).toBe(false)
    expect(needsTryonMonetization(outfitB, outfitA)).toBe(true)
    expect(sameTryonRequest({ kind: 'shop' }, { kind: 'shop' })).toBe(true)
  })

  it('does not reuse an outfit payment for a shop request', () => {
    expect(needsTryonMonetization({ kind: 'shop' }, outfitA)).toBe(true)
    expect(needsTryonMonetization(outfitA, { kind: 'shop' })).toBe(true)
  })
})
