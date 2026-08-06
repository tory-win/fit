// 스타일 취향 — M8-기획.md §3.4
//
// 전부 선택이고 기본은 미선택이다. 아무것도 고르지 않으면 추천 결과가 이전과 완전히 같아야 한다.
// 행운색과 취향이 부딪히면 행운색이 이긴다 — 그게 이 앱의 정체성이라서다.

import type { ClosetItem } from './closet'

export const TASTE_MOODS = ['단정', '편안', '또렷', '부드러움'] as const
export const TASTE_SILHOUETTES = ['슬림', '기본', '여유'] as const
export const TASTE_COVERAGE = ['가리는 편', '상관없음'] as const
export const TASTE_COLOR_TONES = ['차분', '선명', '상관없음'] as const

export type TasteMood = (typeof TASTE_MOODS)[number]
export type TasteSilhouette = (typeof TASTE_SILHOUETTES)[number]
export type TasteCoverage = (typeof TASTE_COVERAGE)[number]
export type TasteColorTone = (typeof TASTE_COLOR_TONES)[number]

export interface TastePreference {
  moods: TasteMood[]
  silhouette?: TasteSilhouette
  coverage?: TasteCoverage
  colorTone?: TasteColorTone
}

export const EMPTY_TASTE: TastePreference = { moods: [] }
export const TASTE_KEY = 'ojjeom.taste.v1'

export function hasTaste(taste: TastePreference): boolean {
  return taste.moods.length > 0
    || Boolean(taste.silhouette)
    || (Boolean(taste.coverage) && taste.coverage !== '상관없음')
    || (Boolean(taste.colorTone) && taste.colorTone !== '상관없음')
}

export function parseTaste(value: string | null): TastePreference {
  if (!value) return { ...EMPTY_TASTE }

  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_TASTE }
    const taste = parsed as Partial<TastePreference>

    return {
      moods: Array.isArray(taste.moods)
        ? taste.moods.filter((mood): mood is TasteMood => TASTE_MOODS.includes(mood as TasteMood))
        : [],
      ...(TASTE_SILHOUETTES.includes(taste.silhouette as TasteSilhouette) ? { silhouette: taste.silhouette } : {}),
      ...(TASTE_COVERAGE.includes(taste.coverage as TasteCoverage) ? { coverage: taste.coverage } : {}),
      ...(TASTE_COLOR_TONES.includes(taste.colorTone as TasteColorTone) ? { colorTone: taste.colorTone } : {}),
    }
  } catch {
    return { ...EMPTY_TASTE }
  }
}

/** 무드 문자열(moodOf 결과)이 고른 취향과 맞는지 */
const MOOD_MATCH: Record<TasteMood, readonly string[]> = {
  단정: ['단정한 대비', '차분한 톤온톤'],
  편안: ['차분한 톤온톤', '가볍고 밝은'],
  또렷: ['과감한 배색', '단정한 대비'],
  부드러움: ['가볍고 밝은', '차분한 톤온톤'],
}

const VIVID_COLORS = ['그린', '블루'] as const
const CALM_COLORS = ['아이보리', '베이지', '블랙'] as const

/**
 * 취향 보너스 — **0 ~ 0.12** 사이의 작은 가산점이다.
 * 사주·날씨·체형이 정한 순위를 뒤집지 않고 동점 부근만 흔든다.
 */
export function tasteBonus(
  items: readonly ClosetItem[],
  mood: string,
  taste: TastePreference,
): number {
  if (!hasTaste(taste) || items.length === 0) return 0

  let bonus = 0

  if (taste.moods.some(picked => MOOD_MATCH[picked].includes(mood))) bonus += 0.05

  if (taste.silhouette) {
    const wanted = taste.silhouette === '슬림' ? 'slim' : taste.silhouette === '여유' ? 'relaxed' : 'regular'
    const matched = items.filter(item => item.fit === wanted).length
    if (matched > 0) bonus += Math.min(0.04, matched * 0.02)
  }

  if (taste.colorTone === '차분') {
    const calm = items.filter(item => CALM_COLORS.includes(item.color as typeof CALM_COLORS[number])).length
    bonus += Math.min(0.03, calm * 0.01)
  } else if (taste.colorTone === '선명') {
    const vivid = items.filter(item => VIVID_COLORS.includes(item.color as typeof VIVID_COLORS[number])).length
    bonus += Math.min(0.03, vivid * 0.015)
  }

  return Math.min(0.12, bonus)
}

/** 취향이 순위를 바꿨을 때만 근거 줄을 만든다. */
export function tasteReason(taste: TastePreference, mood: string): string | null {
  if (!hasTaste(taste)) return null

  const parts: string[] = []
  const matchedMoods = taste.moods.filter(picked => MOOD_MATCH[picked].includes(mood))
  if (matchedMoods.length > 0) parts.push(matchedMoods.join('·'))
  if (taste.silhouette) parts.push(`${taste.silhouette} 실루엣`)
  if (taste.colorTone && taste.colorTone !== '상관없음') parts.push(`${taste.colorTone}한 색`)
  if (parts.length === 0) return null

  return `${parts.join(', ')}을 좋아한다고 하셔서 그쪽 조합을 위로 올렸어요.`
}
