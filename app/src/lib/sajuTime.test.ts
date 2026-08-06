import { describe, expect, it } from 'vitest'
import {
  TRUE_SOLAR_OFFSET_MINUTES,
  birthPillars,
  correctedBirthTime,
  hourBoundaryMinutes,
} from './saju'

const BIRTH = { y: 1999, m: 2, d: 12, hour: 14 }

describe('진태양시 보정', () => {
  it('서울 경도 기준으로 32분 당긴다', () => {
    expect(TRUE_SOLAR_OFFSET_MINUTES).toBe(-32)
    const corrected = correctedBirthTime(BIRTH)
    expect(corrected.getHours()).toBe(13)
    expect(corrected.getMinutes()).toBe(28)
  })

  it('보정을 끄면 입력 시각 그대로다', () => {
    const raw = correctedBirthTime({ ...BIRTH, trueSolarTime: false })
    expect(raw.getHours()).toBe(14)
    expect(raw.getMinutes()).toBe(0)
  })

  it('시를 모르면 보정하지 않는다', () => {
    const noon = correctedBirthTime({ y: 1999, m: 2, d: 12 })
    expect(noon.getHours()).toBe(12)
  })

  /** 한국 관행(표준시 13:30부터 未시)을 재현하는지 — 보정 + 라이브러리 정시 경계의 합 */
  it('표준시 13:30 앞뒤로 시지가 갈린다', () => {
    expect(birthPillars({ y: 1999, m: 2, d: 12, hour: 13, minute: 20 }).hour?.zhi).toBe('午')
    expect(birthPillars({ y: 1999, m: 2, d: 12, hour: 13, minute: 40 }).hour?.zhi).toBe('未')
  })
})

describe('birthPillars', () => {
  it('1999-02-12 14시의 네 기둥을 낸다', () => {
    const pillars = birthPillars(BIRTH)
    expect(`${pillars.year.gan}${pillars.year.zhi}`).toBe('己卯')
    expect(`${pillars.month.gan}${pillars.month.zhi}`).toBe('丙寅')
    expect(`${pillars.day.gan}${pillars.day.zhi}`).toBe('乙未')
    expect(`${pillars.hour?.gan}${pillars.hour?.zhi}`).toBe('癸未')
  })

  it('시를 모르면 시주가 없다', () => {
    expect(birthPillars({ y: 1999, m: 2, d: 12 }).hour).toBeNull()
  })
})

describe('hourBoundaryMinutes', () => {
  it('경계에서 얼마나 떨어졌는지 알려준다', () => {
    expect(hourBoundaryMinutes({ y: 1999, m: 2, d: 12 })).toBeNull()
    const near = hourBoundaryMinutes({ y: 1999, m: 2, d: 12, hour: 13, minute: 35 })
    expect(near).not.toBeNull()
    expect(near!).toBeLessThanOrEqual(10)
  })
})
