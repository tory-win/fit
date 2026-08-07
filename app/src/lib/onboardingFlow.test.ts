import { describe, expect, it } from 'vitest'

import { onboardingPlan } from './onboardingFlow'

describe('onboardingPlan', () => {
  it('웹 real에서는 작동하지 않는 알림 단계를 빼고 3단계로 끝낸다', () => {
    expect(onboardingPlan(false, false)).toEqual({
      total: 3,
      intro: 1,
      birth: null,
      body: 2,
      closet: 3,
      notification: null,
    })
  })

  it('iOS real에서는 사용자가 켤 수 있는 알림 단계를 유지한다', () => {
    expect(onboardingPlan(false, true)).toEqual({
      total: 4,
      intro: 1,
      birth: null,
      body: 2,
      closet: 3,
      notification: 4,
    })
  })

  it('사주가 켜진 stage에서도 플랫폼에 따라 총 단계만 조정한다', () => {
    expect(onboardingPlan(true, false)).toMatchObject({ total: 4, birth: 2, body: 3, closet: 4, notification: null })
    expect(onboardingPlan(true, true)).toMatchObject({ total: 5, birth: 2, body: 3, closet: 4, notification: 5 })
  })
})
