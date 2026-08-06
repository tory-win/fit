import { describe, expect, it } from 'vitest'
import {
  COLOR_PAIR_LIMIT,
  EMPTY_BIAS,
  applyFeedback,
  biasSummary,
  colorPairBias,
  parseBias,
  shouldAskFeedback,
} from './feedback'

const pair = { topColor: '아이보리', bottomColor: '블랙' }

describe('shouldAskFeedback', () => {
  it('only asks after 18:00 and only once per day', () => {
    expect(shouldAskFeedback(EMPTY_BIAS, '2026-07-25', 17)).toBe(false)
    expect(shouldAskFeedback(EMPTY_BIAS, '2026-07-25', 18)).toBe(true)

    const answered = applyFeedback(EMPTY_BIAS, { date: '2026-07-25', verdict: 'good' }, pair)
    expect(shouldAskFeedback(answered, '2026-07-25', 20)).toBe(false)
    expect(shouldAskFeedback(answered, '2026-07-26', 20)).toBe(true)
  })
})

describe('applyFeedback — thermal', () => {
  it('moves the thickness target one step and stops at the limit', () => {
    let bias = applyFeedback(EMPTY_BIAS, { date: '2026-07-25', verdict: 'bad', reason: '추웠어요' })
    expect(bias.thermal).toBe(1)

    bias = applyFeedback(bias, { date: '2026-07-26', verdict: 'bad', reason: '추웠어요' })
    expect(bias.thermal).toBe(1)

    bias = applyFeedback(bias, { date: '2026-07-27', verdict: 'bad', reason: '더웠어요' })
    expect(bias.thermal).toBe(0)

    bias = applyFeedback(bias, { date: '2026-07-28', verdict: 'bad', reason: '더웠어요' })
    bias = applyFeedback(bias, { date: '2026-07-29', verdict: 'bad', reason: '더웠어요' })
    expect(bias.thermal).toBe(-1)
  })
})

describe('applyFeedback — colour pairs', () => {
  it('nudges the pair up on a thumbs up and down on a colour complaint', () => {
    const good = applyFeedback(EMPTY_BIAS, { date: '2026-07-25', verdict: 'good' }, pair)
    expect(colorPairBias(good, '아이보리', '블랙')).toBeCloseTo(0.02)

    const bad = applyFeedback(good, { date: '2026-07-26', verdict: 'bad', reason: '색이 별로였어요' }, pair)
    expect(colorPairBias(bad, '아이보리', '블랙')).toBeCloseTo(-0.03)
    expect(colorPairBias(bad, '블랙', '아이보리')).toBe(0)
  })

  it('never exceeds ±0.15', () => {
    let bias = EMPTY_BIAS
    for (let day = 1; day <= 20; day += 1) {
      bias = applyFeedback(bias, { date: `2026-08-${String(day).padStart(2, '0')}`, verdict: 'good' }, pair)
    }
    expect(colorPairBias(bias, '아이보리', '블랙')).toBeCloseTo(COLOR_PAIR_LIMIT)

    for (let day = 1; day <= 20; day += 1) {
      bias = applyFeedback(bias, { date: `2026-09-${String(day).padStart(2, '0')}`, verdict: 'bad', reason: '색이 별로였어요' }, pair)
    }
    expect(colorPairBias(bias, '아이보리', '블랙')).toBeCloseTo(-COLOR_PAIR_LIMIT)
  })
})

describe('applyFeedback — fit', () => {
  it('records the complaint without touching any weight', () => {
    const bias = applyFeedback(EMPTY_BIAS, { date: '2026-07-25', verdict: 'bad', reason: '핏이 안 맞았어요' }, pair)
    expect(bias.fitComplaints).toBe(1)
    expect(bias.thermal).toBe(0)
    expect(bias.colorPairs).toEqual({})
  })
})

describe('biasSummary', () => {
  it('explains the correction in plain words', () => {
    expect(biasSummary(EMPTY_BIAS)).toMatchObject({ thermal: '기본', pairs: 0 })
    const warmer = applyFeedback(EMPTY_BIAS, { date: '2026-07-25', verdict: 'bad', reason: '추웠어요' })
    expect(biasSummary(warmer).thermal).toBe('더 두껍게')
    expect(biasSummary(warmer).note).toContain('추웠어요')
  })
})

describe('parseBias', () => {
  it('drops values it cannot trust and clamps the rest', () => {
    expect(parseBias(null)).toEqual(EMPTY_BIAS)
    expect(parseBias('{broken')).toEqual(EMPTY_BIAS)
    expect(parseBias(JSON.stringify({ thermal: 9, colorPairs: { 'a|b': 5, 'c|d': 'x' }, fitComplaints: -3, entries: [{ date: '2026-07-25', verdict: 'nope' }] })))
      .toEqual({ thermal: 1, colorPairs: { 'a|b': 0.15 }, fitComplaints: 0, entries: [] })
  })

  it('round-trips a real bias', () => {
    const bias = applyFeedback(EMPTY_BIAS, { date: '2026-07-25', verdict: 'bad', reason: '추웠어요' }, pair)
    expect(parseBias(JSON.stringify(bias))).toEqual(bias)
  })
})
