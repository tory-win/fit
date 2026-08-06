import { describe, expect, it } from 'vitest'
import {
  gradeAdvice,
  isRainy,
  localDateKey,
  needsOuter,
  parseCache,
  parseForecast,
  thicknessGrade,
  type DayWeather,
} from './weather'

const summer: DayWeather = {
  status: 'ok',
  date: '2026-07-25',
  tMax: 31,
  tMin: 24,
  precipProbability: 20,
  windSpeed: 3,
}

describe('thicknessGrade', () => {
  it('maps the Korean dressing table boundaries', () => {
    expect(thicknessGrade(31)).toBe(0)
    expect(thicknessGrade(28)).toBe(0)
    expect(thicknessGrade(27)).toBe(1)
    expect(thicknessGrade(20)).toBe(2)
    expect(thicknessGrade(17)).toBe(3)
    expect(thicknessGrade(12)).toBe(4)
    expect(thicknessGrade(9)).toBe(5)
    expect(thicknessGrade(5)).toBe(6)
    expect(thicknessGrade(-3)).toBe(7)
  })

  it('always has advice copy for every grade', () => {
    for (let grade = 0; grade <= 7; grade += 1) {
      expect(gradeAdvice(grade).length).toBeGreaterThan(0)
    }
  })
})

describe('parseForecast', () => {
  const payload = {
    daily: {
      time: ['2026-07-25'],
      temperature_2m_max: [31.4],
      temperature_2m_min: [23.6],
      precipitation_probability_max: [20],
      wind_speed_10m_max: [3.2],
    },
  }

  it('reads the row that matches the requested date', () => {
    expect(parseForecast(payload, '2026-07-25')).toEqual(summer)
  })

  it('returns null instead of inventing values', () => {
    expect(parseForecast(payload, '2026-07-26')).toBeNull()
    expect(parseForecast({ daily: { time: ['2026-07-25'] } }, '2026-07-25')).toBeNull()
    expect(parseForecast(null, '2026-07-25')).toBeNull()
    expect(parseForecast({ daily: { time: ['2026-07-25'], temperature_2m_max: ['hot'], temperature_2m_min: [20] } }, '2026-07-25')).toBeNull()
  })

  it('defaults only the optional fields it can safely default', () => {
    const parsed = parseForecast({
      daily: { time: ['2026-07-25'], temperature_2m_max: [31.4], temperature_2m_min: [23.6] },
    }, '2026-07-25')
    expect(parsed).toMatchObject({ precipProbability: 0, windSpeed: 0 })
  })
})

describe('parseCache', () => {
  it('rejects anything that is not a successful reading', () => {
    expect(parseCache(null)).toBeNull()
    expect(parseCache('{broken')).toBeNull()
    expect(parseCache(JSON.stringify({ date: '2026-07-25', weather: { status: 'unavailable' } }))).toBeNull()
    expect(parseCache(JSON.stringify({ date: '2026-07-25', weather: summer }))).toEqual({ date: '2026-07-25', weather: summer })
  })
})

describe('condition rules', () => {
  it('requires an outer layer when it is cool or the swing is wide', () => {
    expect(needsOuter(summer)).toBe(false)
    expect(needsOuter({ ...summer, tMax: 18, tMin: 15 })).toBe(true)
    expect(needsOuter({ ...summer, tMax: 30, tMin: 19 })).toBe(true)
    expect(needsOuter({ status: 'unavailable', reason: 'offline' })).toBe(false)
  })

  it('treats 60% and above as a rainy day', () => {
    expect(isRainy(summer)).toBe(false)
    expect(isRainy({ ...summer, precipProbability: 60 })).toBe(true)
  })
})

describe('localDateKey', () => {
  it('formats the local calendar day, not UTC', () => {
    expect(localDateKey(new Date(2026, 6, 5, 1, 30))).toBe('2026-07-05')
  })
})
