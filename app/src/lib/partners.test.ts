import { describe, expect, it } from 'vitest'
import { PARTNERS_DISCLOSURE, resolvePartnersUrl } from './partners'

describe('쿠팡 파트너스 링크', () => {
  it('링크가 없으면 꺼진 상태다', () => {
    expect(resolvePartnersUrl(undefined)).toBeNull()
    expect(resolvePartnersUrl('   ')).toBeNull()
  })

  it('쿠팡 https 링크만 통과시킨다', () => {
    expect(resolvePartnersUrl('https://link.coupang.com/a/fHiUC5OVd6'))
      .toBe('https://link.coupang.com/a/fHiUC5OVd6')
    expect(resolvePartnersUrl('http://link.coupang.com/a/x')).toBeNull()
    expect(resolvePartnersUrl('https://example.com/a/x')).toBeNull()
    expect(resolvePartnersUrl('https://coupang.com.evil.kr/a/x')).toBeNull()
  })

  it('수수료 고지 문구를 그대로 들고 있다', () => {
    expect(PARTNERS_DISCLOSURE).toContain('쿠팡 파트너스')
    expect(PARTNERS_DISCLOSURE).toContain('수수료')
  })
})
