// 환경 판별 — M9-기획.md §1·§2. 코드는 하나, 빌드가 둘 (stage superset / real subset).
// 승격(stage→real)은 diff 병합이 아니라 여기 FEATURES 플래그 전환이다.
export type AppEnv = 'stage' | 'real'

/** 값이 정확히 'real'일 때만 real — 플래그가 깨지면 stage로 떨어진다. real 빌드는 항상 명시적(`--mode real`). */
export function resolveAppEnv(raw: unknown): AppEnv {
  return raw === 'real' ? 'real' : 'stage'
}

export const APP_ENV: AppEnv = resolveAppEnv(import.meta.env.VITE_APP_ENV)

export const FEATURES = {
  /** 사주·운세 전체 — 운세 탭, 온보딩 생년월일 단계, 命 근거, 간지 라벨, 사주 프로필. real은 트라이온 집중이라 끈다. */
  saju: APP_ENV === 'stage',
  /** 사기 전에 입어봄 — 상품 이미지를 내 사진에 입혀보고 파트너스 링크로 구매. M10-기획.md §2. 2026-08-01 real 승격(실기기 생성 검증 후). */
  preTryon: true,
} as const
