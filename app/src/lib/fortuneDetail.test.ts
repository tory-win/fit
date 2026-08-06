import { describe, expect, it } from 'vitest'
import { ELEMENT_STYLE, type DayFortune, type TenGod } from './saju'
import {
  FORTUNE_DOMAINS,
  dailyReadingOf,
  domainFortunes,
  luckyInfoOf,
  relationOf,
} from './fortuneDetail'

const birth = { y: 1995, m: 3, d: 12 }

function fortuneWith(tenGod: TenGod, lucky: DayFortune['luckyElement'] = '금', zhi = '子'): DayFortune {
  return {
    date: '2026-07-25',
    yearPillar: { gan: '丙', zhi: '午', ko: '병오', element: '화' },
    monthPillar: { gan: '乙', zhi: '未', ko: '을미', element: '목' },
    dayPillar: { gan: '壬', zhi, ko: `임${zhi}`, element: '수' },
    dayMaster: '화',
    todayElement: '수',
    tenGod,
    luckyElement: lucky,
    style: ELEMENT_STYLE[lucky],
    theme: { title: '배움이 쌓이는 날', line: '편안한 차림이 힘이 돼요.' },
    score: 80,
  }
}

describe('relationOf', () => {
  it('classifies every ten-god pair into exactly one bucket', () => {
    const tenGods: TenGod[] = ['비겁', '식상', '재성', '관성', '인성']
    const domainGods: TenGod[] = ['식상', '재성', '관성', '인성']
    for (const today of tenGods) {
      for (const domain of domainGods) {
        expect(['stage', 'flows', 'feeds', 'pressed', 'clashes']).toContain(relationOf(today, domain))
      }
    }
  })

  it('follows the ten-god cycle', () => {
    expect(relationOf('재성', '재성')).toBe('stage')
    expect(relationOf('재성', '관성')).toBe('flows')   // 재성이 관성을 생함
    expect(relationOf('재성', '식상')).toBe('feeds')   // 식상이 재성을 생함
    expect(relationOf('재성', '인성')).toBe('pressed') // 재성이 인성을 극함
    expect(relationOf('식상', '관성')).toBe('pressed')
    expect(relationOf('관성', '식상')).toBe('clashes')
  })
})

describe('domainFortunes', () => {
  it('returns all four domains sorted by score', () => {
    const result = domainFortunes(fortuneWith('재성'), birth)
    expect(result.map(entry => entry.domain).sort()).toEqual([...FORTUNE_DOMAINS].sort())
    for (let index = 1; index < result.length; index += 1) {
      expect(result[index - 1].score).toBeGreaterThanOrEqual(result[index].score)
    }
  })

  it('marks exactly one domain as the stage when today matches a domain god', () => {
    const money = domainFortunes(fortuneWith('재성'), birth)
    expect(money.filter(entry => entry.stage).map(entry => entry.domain)).toEqual(['금전'])

    const work = domainFortunes(fortuneWith('관성'), birth)
    expect(work.filter(entry => entry.stage).map(entry => entry.domain)).toEqual(['직장'])
  })

  it('has no stage when today is 비겁 — no domain is governed by it', () => {
    expect(domainFortunes(fortuneWith('비겁'), birth).some(entry => entry.stage)).toBe(false)
  })

  it('is deterministic for the same day and birth', () => {
    expect(domainFortunes(fortuneWith('재성'), birth)).toEqual(domainFortunes(fortuneWith('재성'), birth))
  })

  it('changes with the birth date', () => {
    const mine = domainFortunes(fortuneWith('재성'), birth)
    const other = domainFortunes(fortuneWith('재성'), { y: 1988, m: 11, d: 2 })
    expect(mine.map(entry => entry.score)).not.toEqual(other.map(entry => entry.score))
  })

  it('keeps every score inside 0~97 and carries clothing advice', () => {
    for (const tenGod of ['비겁', '식상', '재성', '관성', '인성'] as TenGod[]) {
      for (const entry of domainFortunes(fortuneWith(tenGod), birth)) {
        expect(entry.score).toBeGreaterThan(0)
        expect(entry.score).toBeLessThanOrEqual(97)
        expect(entry.line.length).toBeGreaterThan(10)
      }
    }
  })
})

describe('dailyReadingOf', () => {
  it('turns the strongest and weakest domains into readable free content', () => {
    const fortune = fortuneWith('식상')
    const domains = domainFortunes(fortune, birth)
    const reading = dailyReadingOf(fortune, domains)
    expect(reading.title).toContain(domains[0].domain)
    expect(reading.overview.length).toBeGreaterThan(20)
    expect(reading.best).toEqual({ domain: domains[0].domain, line: domains[0].line })
    expect(reading.caution).toEqual({
      domain: domains[domains.length - 1].domain,
      line: domains[domains.length - 1].line,
    })
  })
})

describe('luckyInfoOf', () => {
  it('reads colour, material, number, and direction from the complementary element', () => {
    expect(luckyInfoOf(fortuneWith('인성', '금', '子'))).toEqual({
      element: '금',
      color: ELEMENT_STYLE.금.palette[0],
      material: ELEMENT_STYLE.금.materials[0],
      number: 4,
      direction: '서쪽',
    })
  })

  it('picks the other lucky number on an odd branch', () => {
    expect(luckyInfoOf(fortuneWith('인성', '금', '丑')).number).toBe(9)
    expect(luckyInfoOf(fortuneWith('인성', '수', '丑')).number).toBe(6)
    expect(luckyInfoOf(fortuneWith('인성', '수', '子')).number).toBe(1)
  })

  it('maps each element to its direction', () => {
    expect(luckyInfoOf(fortuneWith('인성', '목')).direction).toBe('동쪽')
    expect(luckyInfoOf(fortuneWith('인성', '화')).direction).toBe('남쪽')
    expect(luckyInfoOf(fortuneWith('인성', '토')).direction).toBe('중앙')
  })
})
