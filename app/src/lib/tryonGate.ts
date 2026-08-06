export type TryonRequest =
  | { kind: 'outfit'; outfitId: string; outfitKey: string }
  | { kind: 'shop' }

export function sameTryonRequest(
  left: TryonRequest | null,
  right: TryonRequest | null,
): boolean {
  if (!left || !right || left.kind !== right.kind) return false
  if (left.kind === 'shop' || right.kind === 'shop') return true
  return left.outfitKey === right.outfitKey
}

/**
 * 새 AI 생성은 반드시 수익 행동을 먼저 거친다.
 * 이미 수익 행동을 마쳤지만 생성이 실패한 동일 요청만 바로 재시도한다.
 */
export function needsTryonMonetization(
  request: TryonRequest,
  paidRetry: TryonRequest | null,
): boolean {
  return !sameTryonRequest(request, paidRetry)
}
