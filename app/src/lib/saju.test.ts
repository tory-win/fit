// 검증 픽스처: 2026-07-25 세션에서 독립 구현 2개(korean-lunar-calendar·lunar-python)로
// 교차 확인한 간지 값 (기획서 §12 사주 엔진 검증 기록)
import { describe, expect, it } from 'vitest'
import { birthDayPillar, dayMasterOf, fortuneFor } from './saju'

describe('만세력 간지 (교차 검증 픽스처)', () => {
  it('2026-07-25 = 병오년 을미월 경자일', () => {
    const f = fortuneFor({ y: 1990, m: 5, d: 15 }, new Date(2026, 6, 25, 10))
    expect(f.yearPillar.ko).toBe('병오')
    expect(f.monthPillar.ko).toBe('을미')
    expect(f.dayPillar.ko).toBe('경자')
    expect(f.todayElement).toBe('금') // 庚 = 금
  })

  it('2000-01-01 일주 = 무오 (일간 戊=토)', () => {
    expect(dayMasterOf({ y: 2000, m: 1, d: 1 })).toBe('토')
    expect(birthDayPillar({ y: 2000, m: 1, d: 1 })).toMatchObject({ gan: '戊', ko: '무오', element: '토' })
  })

  it('생일 일주는 오늘 일진과 별개로 계산된다', () => {
    // 마이 화면의 "내 일간"이 오늘의 일진을 잘못 보여주지 않도록 고정한다.
    const today = fortuneFor({ y: 1990, m: 5, d: 15 }, new Date(2026, 6, 25, 10))
    const mine = birthDayPillar({ y: 1990, m: 5, d: 15 })
    expect(today.dayPillar.ko).toBe('경자')
    expect(mine.ko).toBe('경진')
    expect(mine.element).toBe(today.dayMaster)
  })

  it('입춘 경계(1984-02-04 오전): 연주가 전년(계해)로 계산되어야 함 — 절기 기준 확인', () => {
    const f = fortuneFor({ y: 1990, m: 5, d: 15 }, new Date(1984, 1, 4, 10))
    expect(f.yearPillar.ko).toBe('계해')
  })
})

describe('십성 관계 → 행운색', () => {
  it('일간 경(금) × 일진 경자(금) = 비겁 → 행운색은 식상(수)', () => {
    // 1990-05-15 = 경진일 → 일간 庚(금). 2026-07-25 일진 庚子(금) → 비겁
    const f = fortuneFor({ y: 1990, m: 5, d: 15 }, new Date(2026, 6, 25, 10))
    expect(f.dayMaster).toBe('금')
    expect(f.tenGod).toBe('비겁')
    expect(f.luckyElement).toBe('수') // 금이 생하는 오행
    expect(f.style.palette).toContain('네이비')
  })

  it('일간 무(토) × 일진 경자(금) = 식상 → 행운색은 재성(수)', () => {
    const f = fortuneFor({ y: 2000, m: 1, d: 1 }, new Date(2026, 6, 25, 10))
    expect(f.tenGod).toBe('식상')
    expect(f.luckyElement).toBe('수')
  })

  it('점수는 0~100 범위의 결정론적 값', () => {
    const a = fortuneFor({ y: 1993, m: 10, d: 20 }, new Date(2026, 6, 25, 10))
    const b = fortuneFor({ y: 1993, m: 10, d: 20 }, new Date(2026, 6, 25, 10))
    expect(a.score).toBe(b.score)
    expect(a.score).toBeGreaterThan(0)
    expect(a.score).toBeLessThanOrEqual(100)
  })
})
