// 옷장 필터·정렬·검색 — M7-기획.md §4.1
// 정본 `와이어프레임.html` 화면 13이 요구하던 축을 그대로 되살린다.
// 이름 검색은 만들지 않는다 — 상품명 데이터가 없어서 지어낼 수밖에 없기 때문이다.

import type {
  ClosetCategory,
  ClosetColor,
  ClosetItem,
  ClosetSeason,
  ClosetSource,
} from './closet'
import { CLOSET_CATEGORIES } from './closet'
import type { OutfitEntry } from './outfitLog'

export const CLOSET_SORTS = ['recent', 'least-worn', 'most-worn'] as const
export type ClosetSort = (typeof CLOSET_SORTS)[number]

export const CLOSET_SORT_LABEL: Record<ClosetSort, string> = {
  recent: '최근 등록순',
  'least-worn': '안 입은 순',
  'most-worn': '자주 입은 순',
}

export const CLOSET_SOURCE_LABEL: Record<ClosetSource, string> = {
  camera: '촬영',
  album: '앨범',
}

export interface ClosetQuery {
  category: ClosetCategory | '전체'
  colors: ClosetColor[]
  seasons: ClosetSeason[]
  sources: ClosetSource[]
  sort: ClosetSort
  search: string
}

export const EMPTY_CLOSET_QUERY: ClosetQuery = {
  category: '전체',
  colors: [],
  seasons: [],
  sources: [],
  sort: 'recent',
  search: '',
}

/** 카테고리 칩은 필터 개수에 넣지 않는다 — 항상 보이는 1차 축이라서다. */
export function activeFilterCount(query: ClosetQuery): number {
  return query.colors.length
    + query.seasons.length
    + query.sources.length
    + (query.sort === 'recent' ? 0 : 1)
}

export function isDefaultQuery(query: ClosetQuery): boolean {
  return query.category === '전체' && activeFilterCount(query) === 0 && query.search.trim() === ''
}

/** 0벌인 카테고리도 숨기지 않는다 — 옷장의 빈틈을 보여주는 편이 낫다. */
export function categoryCounts(closet: readonly ClosetItem[]): Record<ClosetCategory, number> {
  const counts = Object.fromEntries(
    CLOSET_CATEGORIES.map(category => [category, 0]),
  ) as Record<ClosetCategory, number>

  for (const item of closet) counts[item.category] += 1
  return counts
}

export function wearCounts(log: readonly OutfitEntry[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const entry of log) {
    for (const id of entry.itemIds) counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}

/** 태그 검색 — 색·종류·계절 텍스트만 본다. */
export function matchesSearch(item: ClosetItem, search: string): boolean {
  const term = search.trim()
  if (!term) return true

  const haystack = `${item.color} ${item.category} ${item.seasons.join(' ')}`
  return term.split(/\s+/).every(word => haystack.includes(word))
}

export function applyClosetQuery(
  closet: readonly ClosetItem[],
  query: ClosetQuery,
  wear: Record<string, number> = {},
): ClosetItem[] {
  const filtered = closet.filter(item => (
    (query.category === '전체' || item.category === query.category)
    && (query.colors.length === 0 || query.colors.includes(item.color))
    && (query.seasons.length === 0 || item.seasons.some(season => query.seasons.includes(season)))
    && (query.sources.length === 0 || query.sources.includes(item.source))
    && matchesSearch(item, query.search)
  ))

  const worn = (item: ClosetItem) => wear[item.id] ?? 0
  return [...filtered].sort((a, b) => {
    if (query.sort === 'least-worn') {
      const diff = worn(a) - worn(b)
      if (diff !== 0) return diff
    }
    if (query.sort === 'most-worn') {
      const diff = worn(b) - worn(a)
      if (diff !== 0) return diff
    }
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export function toggleValue<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value]
}

export type { ClosetColor, ClosetSeason, ClosetSource }
