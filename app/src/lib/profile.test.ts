import { describe, expect, it } from 'vitest'
import { daysInBirthMonth, isValidBirthDate } from './profile'

describe('birth date validation', () => {
  it('rejects untouched or incomplete birth dates', () => {
    expect(isValidBirthDate({ y: '', m: '', d: '' })).toBe(false)
    expect(isValidBirthDate({ y: 1995, m: 1, d: '' })).toBe(false)
  })

  it('validates real month ends including leap years', () => {
    expect(daysInBirthMonth(2024, 2)).toBe(29)
    expect(isValidBirthDate({ y: 2024, m: 2, d: 29 })).toBe(true)
    expect(isValidBirthDate({ y: 2023, m: 2, d: 29 })).toBe(false)
  })
})
