// 쿠팡 파트너스 — docs/광고-커머스-연동.md §2
// 발급받은 트래킹 링크가 있을 때만 켠다. 없으면 게이트에서 "준비 중"을 유지한다.
// 수수료 고지 문구는 링크가 보이는 화면에 항상 함께 노출한다(파트너스 정책).

const configuredUrl = import.meta.env.VITE_COUPANG_PARTNERS_URL as string | undefined

export const PARTNERS_DISCLOSURE = '이 앱은 쿠팡 파트너스 활동의 일환으로 수수료를 제공받습니다.'

/** https 이고 coupang.com 도메인인 링크만 통과시킨다. */
export function resolvePartnersUrl(configured?: string): string | null {
  const value = configured?.trim()
  if (!value) return null
  return /^https:\/\/[\w.-]*coupang\.com\//.test(value) ? value : null
}

export function partnersUrl(): string | null {
  return resolvePartnersUrl(configuredUrl)
}

export function isPartnersReady(): boolean {
  return partnersUrl() !== null
}
