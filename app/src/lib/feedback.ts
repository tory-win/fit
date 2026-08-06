// 저녁 만족도 피드백과 개인 보정 — 기획서 §6.3 R-6, 추천엔진_명세.md §8
//
// 명세는 (색군쌍·핏·카테고리쌍) 피처 학습을 요구하지만 M1 태깅에 핏·패턴이 없다.
// M3-기획.md §4에 따라 실제로 계산 가능한 축(두께 성향·색쌍)만 보정하고,
// "핏이 안 맞았어요"는 가중치에 반영하지 않고 체형 재입력 넛지로만 쓴다.
import { Preferences } from '@capacitor/preferences'

export const FEEDBACK_KEY = 'ojjeom.feedback.v1'
export const FEEDBACK_HOUR = 18
export const THERMAL_LIMIT = 1
export const COLOR_PAIR_LIMIT = 0.15
export const COLOR_PAIR_UP = 0.02
export const COLOR_PAIR_DOWN = 0.05

export const FEEDBACK_REASONS = ['추웠어요', '더웠어요', '색이 별로였어요', '핏이 안 맞았어요'] as const
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number]
export type FeedbackVerdict = 'good' | 'bad'

export interface FeedbackEntry {
  date: string
  verdict: FeedbackVerdict
  reason?: FeedbackReason
}

export interface PersonalBias {
  /** 두께 목표 등급 보정 (-1 더 얇게 · 0 기본 · +1 더 두껍게) */
  thermal: number
  /** "상의색|하의색" → C항 가감 (-0.15 ~ +0.15) */
  colorPairs: Record<string, number>
  /** 핏 불만 횟수 — 가중치가 아니라 체형 재입력 넛지의 근거 */
  fitComplaints: number
  entries: FeedbackEntry[]
}

export const EMPTY_BIAS: PersonalBias = { thermal: 0, colorPairs: {}, fitComplaints: 0, entries: [] }

export function colorPairKey(topColor: string, bottomColor: string): string {
  return `${topColor}|${bottomColor}`
}

function clamp(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, Number(value.toFixed(4))))
}

/** 확정한 날 저녁에 한 번만 묻는다. 이미 답했으면 다시 묻지 않는다. */
export function shouldAskFeedback(bias: PersonalBias, date: string, hour: number): boolean {
  if (hour < FEEDBACK_HOUR) return false
  return !bias.entries.some(entry => entry.date === date)
}

export function applyFeedback(
  bias: PersonalBias,
  entry: FeedbackEntry,
  pair?: { topColor: string; bottomColor: string },
): PersonalBias {
  const next: PersonalBias = {
    thermal: bias.thermal,
    colorPairs: { ...bias.colorPairs },
    fitComplaints: bias.fitComplaints,
    entries: [...bias.entries.filter(existing => existing.date !== entry.date), entry]
      .sort((a, b) => a.date.localeCompare(b.date)),
  }

  const key = pair ? colorPairKey(pair.topColor, pair.bottomColor) : null

  if (entry.verdict === 'good') {
    if (key) next.colorPairs[key] = clamp((next.colorPairs[key] ?? 0) + COLOR_PAIR_UP, COLOR_PAIR_LIMIT)
    return next
  }

  switch (entry.reason) {
    case '추웠어요':
      next.thermal = clamp(next.thermal + 1, THERMAL_LIMIT)
      break
    case '더웠어요':
      next.thermal = clamp(next.thermal - 1, THERMAL_LIMIT)
      break
    case '색이 별로였어요':
      if (key) next.colorPairs[key] = clamp((next.colorPairs[key] ?? 0) - COLOR_PAIR_DOWN, COLOR_PAIR_LIMIT)
      break
    case '핏이 안 맞았어요':
      next.fitComplaints += 1
      break
    default:
      break
  }

  return next
}

export function colorPairBias(bias: PersonalBias, topColor: string, bottomColor: string): number {
  return bias.colorPairs[colorPairKey(topColor, bottomColor)] ?? 0
}

/** 마이 화면에 사람 말로 보여줄 요약 */
export function biasSummary(bias: PersonalBias): { thermal: string; pairs: number; note: string } {
  const pairs = Object.values(bias.colorPairs).filter(value => value !== 0).length
  const thermal = bias.thermal > 0 ? '더 두껍게' : bias.thermal < 0 ? '더 얇게' : '기본'

  const note = bias.thermal > 0
    ? '“추웠어요”가 두께 목표를 한 단계 올렸어요.'
    : bias.thermal < 0
      ? '“더웠어요”가 두께 목표를 한 단계 내렸어요.'
      : pairs > 0
        ? '색 조합 선호만 반영하고 있어요.'
        : '아직 보정된 값이 없어요.'

  return { thermal, pairs, note }
}

function isEntry(value: unknown): value is FeedbackEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<FeedbackEntry>
  if (typeof entry.date !== 'string') return false
  if (entry.verdict !== 'good' && entry.verdict !== 'bad') return false
  return entry.reason === undefined || FEEDBACK_REASONS.includes(entry.reason)
}

export function parseBias(raw: string | null): PersonalBias {
  if (!raw) return EMPTY_BIAS
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return EMPTY_BIAS
    const bias = parsed as Partial<PersonalBias>

    const colorPairs: Record<string, number> = {}
    if (bias.colorPairs && typeof bias.colorPairs === 'object') {
      for (const [key, value] of Object.entries(bias.colorPairs)) {
        if (typeof value === 'number' && Number.isFinite(value)) colorPairs[key] = clamp(value, COLOR_PAIR_LIMIT)
      }
    }

    return {
      thermal: typeof bias.thermal === 'number' && Number.isFinite(bias.thermal) ? clamp(bias.thermal, THERMAL_LIMIT) : 0,
      colorPairs,
      fitComplaints: typeof bias.fitComplaints === 'number' && bias.fitComplaints >= 0 ? Math.floor(bias.fitComplaints) : 0,
      entries: Array.isArray(bias.entries) ? bias.entries.filter(isEntry) : [],
    }
  } catch {
    return EMPTY_BIAS
  }
}

export async function loadBias(): Promise<PersonalBias> {
  const { value } = await Preferences.get({ key: FEEDBACK_KEY })
  return parseBias(value)
}

export async function saveBias(bias: PersonalBias): Promise<PersonalBias> {
  await Preferences.set({ key: FEEDBACK_KEY, value: JSON.stringify(bias) })
  return bias
}

export async function clearBias(): Promise<PersonalBias> {
  await Preferences.remove({ key: FEEDBACK_KEY })
  return EMPTY_BIAS
}
