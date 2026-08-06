import { describe, expect, it } from 'vitest'
import { grantPass, isPassActive, parsePass, remainingLabel, PASS_HOURS } from './pass'

const now = new Date('2026-07-25T09:00:00.000Z')

describe('grantPass', () => {
  it('lasts exactly 2 hours', () => {
    const pass = grantPass('welcome', now)
    expect(new Date(pass.expiresAt).getTime() - now.getTime()).toBe(PASS_HOURS * 60 * 60 * 1000)
  })
})

describe('isPassActive', () => {
  const pass = grantPass('welcome', now)

  it('is active up to the expiry instant and not after', () => {
    expect(isPassActive(pass, now)).toBe(true)
    expect(isPassActive(pass, new Date('2026-07-25T10:59:00.000Z'))).toBe(true)
    expect(isPassActive(pass, new Date('2026-07-25T11:00:00.000Z'))).toBe(false)
    expect(isPassActive(null, now)).toBe(false)
  })
})

describe('remainingLabel', () => {
  const pass = grantPass('welcome', now)

  it('reads as hours and minutes', () => {
    expect(remainingLabel(pass, now)).toBe('2시간 남음')
    expect(remainingLabel(pass, new Date('2026-07-25T09:30:00.000Z'))).toBe('1시간 30분 남음')
    expect(remainingLabel(pass, new Date('2026-07-25T10:20:00.000Z'))).toBe('40분 남음')
    expect(remainingLabel(pass, new Date('2026-07-25T11:30:00.000Z'))).toBe('만료됨')
  })
})

describe('parsePass', () => {
  it('drops records it cannot trust', () => {
    expect(parsePass(null)).toBeNull()
    expect(parsePass('{broken')).toBeNull()
    expect(parsePass(JSON.stringify({ reason: 'gift', grantedAt: 'a', expiresAt: 'b' }))).toBeNull()
    expect(parsePass(JSON.stringify({ reason: 'welcome', grantedAt: 'a', expiresAt: 'not-a-date' }))).toBeNull()
    expect(parsePass(JSON.stringify(grantPass('dev', now)))).toEqual(grantPass('dev', now))
  })
})
