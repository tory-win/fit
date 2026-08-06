// 사기 전에 입어봄 — M10-기획.md §2.
// 상품 이미지는 옷장에 넣지 않는다. 완성된 생성물만 기존 트라이온 인덱스에 함께 저장돼
// 사용자가 직접 지울 때까지 유지되며(lib/tryon.ts), 광고 완료·쿠팡 진입 선행 게이트를 공유한다.

/** 스파이크에서 검증된 조합은 사람 1 + 옷 2(상·하의)까지다 — 트라이온_스파이크.md §0.2 */
export const PRE_TRYON_MAX_GARMENTS = 2

/**
 * 트라이온 인덱스 키. 코디 키(itemId 조합)와 절대 겹치지 않게 접두사를 붙이고,
 * 저장 경로 규칙(`[^\w+-]` 제거, 40자 절단 — lib/tryon.ts)에서 살아남는 문자만 쓴다.
 */
export function preTryonKey(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `pretryon-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
    + `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

export function isPreTryonKey(outfitKey: string): boolean {
  return outfitKey.startsWith('pretryon-')
}

/** 이미 고른 것에 새로 고른 것을 합치되 최대 장수를 넘기지 않는다. */
export function mergeGarments<T>(existing: readonly T[], incoming: readonly T[]): T[] {
  return [...existing, ...incoming].slice(0, PRE_TRYON_MAX_GARMENTS)
}
