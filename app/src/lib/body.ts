// 체형 프로필 — 기획서 §6.1 O-3, 추천엔진_명세.md §6
// M5부터 전문 체형명을 직접 고르게 하지 않고 이해하기 쉬운 두 질문에서 파생한다.
// 키·몸무게·평소 사이즈는 모두 선택이며, 몸무게 하나로 체형/사이즈를 추정하지 않는다.

export const BODY_SHAPES = ['삼각', '역삼각', '직사각', '모래시계', '라운드'] as const
export const BODY_CHIPS = ['어깨 넓은 편', '하체 볼륨', '키 커버 원해요', '허리 긴 편'] as const
export const BODY_BALANCES = ['shoulders', 'balanced', 'hips'] as const
export const WAIST_LINES = ['defined', 'straight', 'soft'] as const
export const FIT_PREFERENCES = ['slim', 'regular', 'relaxed'] as const
export const TOP_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const

export type BodyShape = (typeof BODY_SHAPES)[number]
export type BodyChip = (typeof BODY_CHIPS)[number]
export type BodyBalance = (typeof BODY_BALANCES)[number]
export type WaistLine = (typeof WAIST_LINES)[number]
export type FitPreference = (typeof FIT_PREFERENCES)[number]
export type TopSize = (typeof TOP_SIZES)[number]

export interface BodyProfile {
  heightCm?: number
  weightKg?: number
  topSize?: TopSize
  bottomWaistInch?: number
  fitPreference?: FitPreference
  balance?: BodyBalance
  waistLine?: WaistLine
  shape?: BodyShape
  chips: BodyChip[]
}

export const EMPTY_BODY: BodyProfile = { chips: [] }

/** 체형 정보가 하나라도 있으면 B항을 실제로 계산한다. */
export function hasBodySignal(body: BodyProfile | undefined): boolean {
  return Boolean(body && (
    body.heightCm
    || body.weightKg
    || body.topSize
    || body.bottomWaistInch
    || body.fitPreference
    || body.balance
    || body.waistLine
    || body.shape
    || body.chips.length > 0
  ))
}

/** 사용자가 답한 관찰형 질문을 기존 추천 엔진의 체형 값으로 바꾼다. */
export function deriveBodyShape(
  balance: BodyBalance | undefined,
  waistLine: WaistLine | undefined,
): BodyShape | undefined {
  if (!balance || !waistLine) return undefined
  if (balance === 'shoulders') return '역삼각'
  if (balance === 'hips') return '삼각'
  if (waistLine === 'defined') return '모래시계'
  if (waistLine === 'soft') return '라운드'
  return '직사각'
}

export const FIT_PREFERENCE_LABEL: Record<FitPreference, string> = {
  slim: '딱 맞게',
  regular: '기본핏',
  relaxed: '여유 있게',
}

const SHAPE_ADVICE: Record<BodyShape, string> = {
  삼각: '밝은 상의에 어두운 스트레이트 하의',
  역삼각: '브이넥·와이드 하의',
  직사각: '허리선이 보이는 레이어링',
  모래시계: '허리 라인을 살리는 핏',
  라운드: '세로로 떨어지는 톤온톤',
}

const CHIP_ADVICE: Record<BodyChip, string> = {
  '어깨 넓은 편': '어깨가 넓은 편이라면 상의를 차분하게',
  '하체 볼륨': '하체가 신경 쓰이면 하의를 어둡게',
  '키 커버 원해요': '키를 커버하려면 위아래 톤을 맞춰서',
  '허리 긴 편': '허리가 긴 편이면 하이웨스트 쪽으로',
}

export function shapeAdvice(shape: BodyShape): string {
  return SHAPE_ADVICE[shape]
}

export function chipAdvice(chip: BodyChip): string {
  return CHIP_ADVICE[chip]
}

export function parseBodyProfile(value: unknown): BodyProfile {
  if (!value || typeof value !== 'object') return EMPTY_BODY
  const body = value as Partial<BodyProfile>
  const balance = BODY_BALANCES.includes(body.balance as BodyBalance)
    ? (body.balance as BodyBalance)
    : undefined
  const waistLine = WAIST_LINES.includes(body.waistLine as WaistLine)
    ? (body.waistLine as WaistLine)
    : undefined
  const legacyShape = BODY_SHAPES.includes(body.shape as BodyShape) ? (body.shape as BodyShape) : undefined
  const shape = deriveBodyShape(balance, waistLine) ?? legacyShape
  const chips = Array.isArray(body.chips)
    ? body.chips.filter((chip): chip is BodyChip => BODY_CHIPS.includes(chip as BodyChip))
    : []
  const heightCm = typeof body.heightCm === 'number' && body.heightCm >= 130 && body.heightCm <= 210
    ? Math.round(body.heightCm)
    : undefined
  const weightKg = typeof body.weightKg === 'number' && body.weightKg >= 30 && body.weightKg <= 200
    ? Math.round(body.weightKg)
    : undefined
  const topSize = TOP_SIZES.includes(body.topSize as TopSize) ? (body.topSize as TopSize) : undefined
  const bottomWaistInch = typeof body.bottomWaistInch === 'number'
    && body.bottomWaistInch >= 22
    && body.bottomWaistInch <= 50
    ? Math.round(body.bottomWaistInch)
    : undefined
  const fitPreference = FIT_PREFERENCES.includes(body.fitPreference as FitPreference)
    ? (body.fitPreference as FitPreference)
    : undefined

  return {
    heightCm,
    weightKg,
    topSize,
    bottomWaistInch,
    fitPreference,
    balance,
    waistLine,
    shape,
    chips,
  }
}
