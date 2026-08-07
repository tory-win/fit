export interface OnboardingPlan {
  total: number
  intro: number
  birth: number | null
  body: number
  closet: number
  notification: number | null
}

/**
 * 알림은 iOS 네이티브에서만 실제로 설정할 수 있다. 웹에서는 작동하지 않는
 * 마지막 화면을 세지 않고, 옷 등록을 마지막 단계로 만든다.
 */
export function onboardingPlan(saju: boolean, notificationSupported: boolean): OnboardingPlan {
  const birth = saju ? 2 : null
  const body = saju ? 3 : 2
  const closet = body + 1
  const notification = notificationSupported ? closet + 1 : null

  return {
    total: notification ?? closet,
    intro: 1,
    birth,
    body,
    closet,
    notification,
  }
}
