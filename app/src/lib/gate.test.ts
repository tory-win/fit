import { describe, expect, it } from 'vitest'
import { WELCOME_CREDITS, addCredits, emptyGate, openOutfit, parseGate, withWelcome } from './gate'

const TODAY = '2026-07-26'

describe('parseGate', () => {
  it('날짜가 바뀌면 열림은 풀리고 열람권은 남는다', () => {
    const yesterday = JSON.stringify({ date: '2026-07-25', outfitUnlocked: true, credits: 2 })
    expect(parseGate(yesterday, TODAY)).toEqual({ date: TODAY, outfitUnlocked: false, credits: 2 })
  })

  it('깨진 값은 빈 상태로 돌아간다', () => {
    expect(parseGate('{broken', TODAY)).toEqual(emptyGate(TODAY))
    expect(parseGate(null, TODAY)).toEqual(emptyGate(TODAY))
  })

  it('음수 열람권은 0으로 본다', () => {
    expect(parseGate(JSON.stringify({ date: TODAY, credits: -5 }), TODAY).credits).toBe(0)
  })
})

describe('withWelcome', () => {
  it('첫 실행에 한 번만 준다', () => {
    const first = withWelcome(emptyGate(TODAY), TODAY)
    expect(first.credits).toBe(WELCOME_CREDITS)
    expect(withWelcome(first, TODAY)).toBe(first)
  })
})

describe('openOutfit', () => {
  it('열람권을 한 장 쓰고 오늘 코디를 연다', () => {
    const result = openOutfit(addCredits(emptyGate(TODAY), 2))
    expect(result.opened).toBe(true)
    expect(result.gate.credits).toBe(1)
    expect(result.gate.outfitUnlocked).toBe(true)
  })

  it('이미 열려 있으면 다시 차감하지 않는다', () => {
    const opened = openOutfit(addCredits(emptyGate(TODAY), 1)).gate
    const again = openOutfit(opened)
    expect(again.opened).toBe(true)
    expect(again.gate.credits).toBe(0)
    expect(again.gate).toBe(opened)
  })

  it('열람권이 없으면 열리지 않는다', () => {
    const result = openOutfit(emptyGate(TODAY))
    expect(result.opened).toBe(false)
    expect(result.gate.outfitUnlocked).toBe(false)
  })
})
