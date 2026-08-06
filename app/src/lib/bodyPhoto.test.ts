import { describe, expect, it } from 'vitest'
import {
  BODY_PHOTO_CONSENTS,
  isConsentComplete,
  parseBodyPhoto,
  type StoredBodyPhoto,
} from './bodyPhoto'

const stored: StoredBodyPhoto = {
  path: 'body/v1/photo.jpg',
  width: 1152,
  height: 1536,
  createdAt: '2026-07-26T00:00:00.000Z',
  consentAt: '2026-07-26T00:00:00.000Z',
  consentVersion: 'v1',
}

describe('isConsentComplete', () => {
  const all = BODY_PHOTO_CONSENTS.map(consent => consent.id)

  it('requires every consent item', () => {
    expect(isConsentComplete(all)).toBe(true)
    expect(isConsentComplete(all.slice(1))).toBe(false)
    expect(isConsentComplete([])).toBe(false)
  })

  it('ignores unknown ids', () => {
    expect(isConsentComplete(['made-up'])).toBe(false)
    expect(isConsentComplete([...all, 'made-up'])).toBe(true)
  })
})

describe('parseBodyPhoto', () => {
  it('reads a complete record', () => {
    expect(parseBodyPhoto(JSON.stringify(stored))).toEqual(stored)
  })

  it('drops records without a consent trail', () => {
    const { consentAt: _consentAt, ...withoutConsent } = stored
    expect(parseBodyPhoto(JSON.stringify(withoutConsent))).toBeNull()
  })

  it('recovers from missing or corrupted data', () => {
    expect(parseBodyPhoto(null)).toBeNull()
    expect(parseBodyPhoto('{broken')).toBeNull()
    expect(parseBodyPhoto('[]')).toBeNull()
  })
})
