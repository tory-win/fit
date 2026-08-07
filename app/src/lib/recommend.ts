// 코디 추천 엔진 — 추천엔진_명세.md §3·§7·§8·§9·§10 (v0.1 룰 기반, 결정론적)
//
// M1 태깅 스키마는 category/color/seasons 3축뿐이라 명세의 thickness·pattern·핏 태그가 없다.
// M2-기획.md §3의 파생 규칙으로 근사하고, 근사할 수 없는 항(P 취향·O TPO)은 중립 0.5로 둔다.
import type { ClosetCategory, ClosetColor, ClosetItem } from './closet'
import { ELEMENT_STYLE, type DayFortune, type Element } from './saju'
import { gradeAdvice, needsOuter, thicknessGrade, type WeatherState } from './weather'
import { FIT_PREFERENCE_LABEL, hasBodySignal, shapeAdvice, type BodyProfile } from './body'
import { EMPTY_BIAS, colorPairBias, type PersonalBias } from './feedback'
import { EMPTY_TASTE, tasteBonus, type TastePreference } from './taste'

export const OUTFIT_SLOTS = ['상의', '하의', '신발', '아우터', '가방'] as const
export type OutfitSlot = (typeof OUTFIT_SLOTS)[number]

const REQUIRED_SLOTS: OutfitSlot[] = ['상의', '하의']
/** 두께 등급으로 거를 슬롯 — 신발·가방은 체감 온도와 무관해 계절만 본다 */
const THERMAL_SLOTS: OutfitSlot[] = ['상의', '하의', '아우터']
const SLOT_POOL_LIMIT = 6
const FRESH_DAYS = 21
const STALE_DAYS = 7

/** 명세 §4.2 — M1 색 6종을 오행 5군에 다:1로 매핑 ('기타'는 오행 중립) */
const COLOR_ELEMENT: Record<ClosetColor, Element | null> = {
  아이보리: '금',
  베이지: '토',
  블랙: '수',
  그린: '목',
  블루: '수',
  기타: null,
}

/** 명세 §7-1 뉴트럴 정의 */
const NEUTRAL_COLORS: ClosetColor[] = ['아이보리', '베이지', '블랙', '기타']

/** 0 어두움 · 1 중간 · 2 밝음 — 체형 룰(§6)의 색 기반 근사에 쓴다 */
const COLOR_LIGHTNESS: Record<ClosetColor, number> = {
  아이보리: 2,
  베이지: 2,
  그린: 1,
  블루: 1,
  기타: 1,
  블랙: 0,
}

/** 계절 → 두께 등급 (명세 §5.1 구간의 대표값) */
const SEASON_GRADE: Record<string, number> = { 여름: 1, 봄: 3, 가을: 3, 겨울: 6 }

/**
 * 계절 → 입을 수 있는 두께 등급 구간.
 * 대표값 하나로 필터하면 '봄·여름' 셔츠가 한여름(등급 0)에서 탈락한다.
 * 태그된 계절 전체가 커버하는 구간으로 판정한다.
 */
const SEASON_BAND: Record<string, [number, number]> = {
  여름: [0, 1],
  봄: [2, 4],
  가을: [2, 4],
  겨울: [5, 7],
}

export interface WearHistory {
  /** itemId → 마지막 착용일(YYYY-MM-DD) */
  lastWornAt: Record<string, string>
}

export interface OutfitReasons {
  /** real 환경(사주 없음)에서는 만들지 않는다 — appEnv FEATURES.saju */
  saju?: string
  weather: string
  body: string
}

export interface Outfit {
  id: string
  items: ClosetItem[]
  bySlot: Partial<Record<OutfitSlot, ClosetItem>>
  score: number
  mood: string
  reasons: OutfitReasons
  gaps: OutfitSlot[]
}

export interface RecommendContext {
  closet: ClosetItem[]
  /** null이면 사주 항은 중립(0.5)으로 두고 날씨·체형·취향·신선도만으로 추천한다 */
  fortune: DayFortune | null
  weather: WeatherState
  body: BodyProfile
  history: WearHistory
  /** 피드백으로 쌓인 개인 보정 (없으면 중립) */
  bias?: PersonalBias
  /** 이 옷을 반드시 넣어 코디를 만든다 — 옷장 아이템 상세의 "이 옷으로 코디 만들기" */
  pinnedId?: string
  /** 스타일 취향 — 고르지 않으면 결과가 이전과 같다 (M8-기획 §3.4) */
  taste?: TastePreference
  date?: Date
}

export type RecommendResult =
  | { status: 'ok'; outfits: Outfit[]; relaxed: boolean }
  | { status: 'blocked'; missing: OutfitSlot[]; message: string }

function outfitItemIdentity(items: readonly Pick<ClosetItem, 'id'>[]): string {
  return items.map(item => item.id).sort().join('\u0000')
}

/** 현재 화면의 코디와 실제 아이템 구성이 같은 후보는 "다른 코디"가 아니다. */
export function alternativeOutfits(
  outfits: readonly Outfit[],
  currentItems: readonly Pick<ClosetItem, 'id'>[],
): Outfit[] {
  if (currentItems.length === 0) return [...outfits]
  const currentIdentity = outfitItemIdentity(currentItems)
  return outfits.filter(outfit => outfitItemIdentity(outfit.items) !== currentIdentity)
}

/** 대표 두께 — 스코어 표시·정렬용 */
export function itemThicknessGrade(item: Pick<ClosetItem, 'seasons'>): number {
  if (item.seasons.length === 0) return 3
  const total = item.seasons.reduce((sum, season) => sum + (SEASON_GRADE[season] ?? 3), 0)
  return Math.round(total / item.seasons.length)
}

/** 착용 가능 두께 구간 — 하드 필터용 */
export function itemGradeRange(item: Pick<ClosetItem, 'seasons'>): [number, number] {
  if (item.seasons.length === 0) return [0, 7]
  let min = 7
  let max = 0
  for (const season of item.seasons) {
    const [low, high] = SEASON_BAND[season] ?? [0, 7]
    min = Math.min(min, low)
    max = Math.max(max, high)
  }
  return [min, max]
}

/** 오늘의 두께 등급이 이 옷의 구간에서 얼마나 벗어났는지 (구간 안이면 0) */
export function gradeDistance(item: Pick<ClosetItem, 'seasons'>, target: number): number {
  const [min, max] = itemGradeRange(item)
  if (target < min) return min - target
  if (target > max) return target - max
  return 0
}

export function seasonOf(date: Date): string {
  const month = date.getMonth() + 1
  if (month >= 3 && month <= 5) return '봄'
  if (month >= 6 && month <= 8) return '여름'
  if (month >= 9 && month <= 11) return '가을'
  return '겨울'
}

/**
 * 날씨가 없으면 계절 대표 등급으로 대체한다 (추정 기온을 만들지 않는다).
 * 사용자가 "추웠어요/더웠어요"로 남긴 개인 보정을 마지막에 더한다 (M3-기획.md §4).
 */
export function targetGrade(weather: WeatherState, date: Date, bias: PersonalBias = EMPTY_BIAS): number {
  const base = weather.status === 'ok' ? thicknessGrade(weather.tMax) : (SEASON_GRADE[seasonOf(date)] ?? 3)
  return Math.max(0, Math.min(7, base + bias.thermal))
}

function slotOf(category: ClosetCategory): OutfitSlot | null {
  if (category === '상의' || category === '하의' || category === '신발' || category === '아우터' || category === '가방') {
    return category
  }
  return null // '기타'는 슬롯에 배치하지 않는다
}

function daysBetween(from: string, to: Date): number {
  const parsed = new Date(`${from}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY
  const start = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((start - parsed.getTime()) / 86_400_000)
}

/** 명세 §8 N항 — 최근 착용은 감점, 3주 이상 미착용은 만점 */
export function freshnessOf(item: ClosetItem, history: WearHistory, date: Date): number {
  const worn = history.lastWornAt[item.id]
  if (!worn) return 1
  const days = daysBetween(worn, date)
  if (days >= FRESH_DAYS) return 1
  if (days <= 0) return 0.05
  if (days <= STALE_DAYS) return 0.05 + (days / STALE_DAYS) * 0.35
  return 0.4 + ((days - STALE_DAYS) / (FRESH_DAYS - STALE_DAYS)) * 0.6
}

function luckyColorsFor(element: Element): ClosetColor[] {
  return (Object.keys(COLOR_ELEMENT) as ClosetColor[]).filter(color => COLOR_ELEMENT[color] === element)
}

/** 명세 §8 W항 — 두께 등급 일치도 + 강수 조건 룰 */
function weatherScore(items: ClosetItem[], weather: WeatherState, target: number): number {
  if (weather.status !== 'ok') return 0.5

  // 두께 적합도는 상의·하의·아우터로만 판단한다 (신발·가방은 §5.1 구간표의 대상이 아니다)
  const thermal = items.filter(item => THERMAL_SLOTS.includes(item.category as OutfitSlot))
  const scored = thermal.length > 0 ? thermal : items
  const drift = scored.reduce((sum, item) => sum + gradeDistance(item, target), 0) / scored.length
  let score = Math.max(0, 1 - drift / 3)

  if (weather.precipProbability >= 60) {
    const bottom = items.find(item => item.category === '하의')
    const shoes = items.find(item => item.category === '신발')
    if (bottom && COLOR_LIGHTNESS[bottom.color] === 0) score += 0.1
    if (shoes && COLOR_LIGHTNESS[shoes.color] === 2) score -= 0.1
  }

  return Math.max(0, Math.min(1, score))
}

/** 명세 §7 — 색 3개 이하, 뉴트럴 + 포인트 1개가 기본 (+ 명세 §8 개인 보정) */
function colorScore(items: ClosetItem[], bias: PersonalBias): number {
  const colors = items.map(item => item.color)
  const distinct = new Set(colors)
  const points = colors.filter(color => !NEUTRAL_COLORS.includes(color)).length

  let score = 0.7
  if (distinct.size > 3) score -= 0.3
  if (points === 1) score += 0.25
  else if (points === 0) score += 0.1
  else score -= 0.2

  const top = items.find(item => item.category === '상의')
  const bottom = items.find(item => item.category === '하의')
  if (top && bottom) {
    if (top.color === bottom.color) score -= 0.2
    score += colorPairBias(bias, top.color, bottom.color)
  }

  return Math.max(0, Math.min(1, score))
}

/**
 * 명세 §6 B항 — M1에는 핏·실루엣 태그가 없으므로 명도(색) 기반으로만 근사한다.
 * 근사가 불가능한 체형은 중립에 가깝게 두고, 근거 문구에서 과장하지 않는다.
 */
function bodyScore(items: ClosetItem[], body: BodyProfile): number {
  if (!hasBodySignal(body)) return 0.5

  const top = items.find(item => item.category === '상의')
  const bottom = items.find(item => item.category === '하의')
  if (!top || !bottom) return 0.5
  const fitTagged = [top, bottom].filter(item => item.fit)
  const actionable = Boolean(body.shape || body.chips.length > 0 || (body.fitPreference && fitTagged.length > 0))
  if (!actionable) return 0.5

  const topLight = COLOR_LIGHTNESS[top.color]
  const bottomLight = COLOR_LIGHTNESS[bottom.color]
  let score = 0.55

  const wantsLightTop = body.shape === '삼각' || body.chips.includes('하체 볼륨')
  const wantsDarkTop = body.shape === '역삼각' || body.chips.includes('어깨 넓은 편')

  if (wantsLightTop) score += topLight > bottomLight ? 0.3 : -0.15
  if (wantsDarkTop) score += topLight <= bottomLight ? 0.25 : -0.15
  if (body.shape === '직사각') score += topLight !== bottomLight ? 0.2 : -0.1
  if (body.shape === '라운드') score += topLight <= 1 && bottomLight <= 1 ? 0.25 : -0.1
  if (body.shape === '모래시계') score += 0.05
  if (body.chips.includes('키 커버 원해요')) score += topLight === bottomLight ? 0.15 : -0.05
  if (body.fitPreference && fitTagged.length > 0) {
    const matches = fitTagged.filter(item => item.fit === body.fitPreference).length
    score += (matches / fitTagged.length - 0.5) * 0.28
  }

  return Math.max(0, Math.min(1, score))
}

/** 명세 §7-4 — 행운색은 포인트 1개면 충분, 전신 행운색은 오히려 감점 */
function fortuneScore(items: ClosetItem[], lucky: Element): number {
  const luckyColors = luckyColorsFor(lucky)
  const matches = items.filter(item => luckyColors.includes(item.color)).length
  if (matches === 0) return 0.35
  if (matches === 1) return 1
  if (matches === 2) return 0.8
  return 0.6
}

function freshnessScore(items: ClosetItem[], history: WearHistory, date: Date): number {
  return items.reduce((sum, item) => sum + freshnessOf(item, history, date), 0) / items.length
}

export function scoreOutfit(
  items: ClosetItem[],
  context: {
    weather: WeatherState
    target: number
    body: BodyProfile
    /** null이면 사주 항은 중립 0.5 — real 환경 */
    lucky: Element | null
    history: WearHistory
    date: Date
    bias: PersonalBias
  },
): number {
  const score =
    0.25 * weatherScore(items, context.weather, context.target)
    + 0.20 * colorScore(items, context.bias)
    + 0.15 * bodyScore(items, context.body)
    + 0.15 * (context.lucky ? fortuneScore(items, context.lucky) : 0.5)
    + 0.10 * 0.5 // P 취향 — 취향 태그 미수집, 중립 (M3)
    + 0.10 * freshnessScore(items, context.history, context.date)
    + 0.05 * 0.5 // O TPO — 일정 연동 없음, 중립 (Phase 2)

  return Math.max(0, Math.min(1, score))
}

export function moodOf(items: ClosetItem[]): string {
  const points = items.filter(item => !NEUTRAL_COLORS.includes(item.color)).length
  const lightness = items.reduce((sum, item) => sum + COLOR_LIGHTNESS[item.color], 0) / items.length

  // 포인트 색의 유무가 무드를 먼저 가른다 — 명도는 뉴트럴만 남았을 때 판단한다.
  if (points >= 2) return '과감한 배색'
  if (points === 1) return '단정한 대비'
  if (lightness <= 0.5) return '깊은 톤'
  if (lightness >= 1.7) return '가볍고 밝은'
  return '차분한 톤온톤'
}

function withParticle(word: string, hasFinal: string, noFinal: string): string {
  const last = word.charCodeAt(word.length - 1)
  if (last < 0xac00 || last > 0xd7a3) return `${word}${noFinal}`
  return `${word}${(last - 0xac00) % 28 === 0 ? noFinal : hasFinal}`
}

export function gapMessage(gaps: OutfitSlot[]): string {
  if (gaps.length === 0) return ''
  const label = gaps.slice(0, 2).join('·')
  return `${withParticle(label, '을', '를')} 등록하면 이 조합이 완성돼요.`
}

function reasonsFor(
  items: ClosetItem[],
  fortune: DayFortune | null,
  weather: WeatherState,
  body: BodyProfile,
  target: number,
): OutfitReasons {
  let saju: string | undefined
  if (fortune) {
    const palette = ELEMENT_STYLE[fortune.luckyElement].palette[0]
    const luckyColors = luckyColorsFor(fortune.luckyElement)
    const matched = items.find(item => luckyColors.includes(item.color))
    saju = matched
      ? `오늘은 ${fortune.theme.title}이에요. ${withParticle(`${matched.color} ${matched.category}`, '이', '가')} ${palette} 계열의 기운을 채워줘요.`
      : `오늘은 ${fortune.theme.title}이에요. ${palette} 계열을 하나만 더해도 균형이 잡혀요.`
  }

  const weatherLine = weather.status === 'ok'
    ? `최고 ${weather.tMax}°·최저 ${weather.tMin}°${weather.precipProbability >= 60 ? ' · 비 소식이 있어' : ''} — ${gradeAdvice(target)}에 맞춰 골랐어요.`
    : fortune
      ? '날씨를 불러오지 못해 사주와 색 조화로만 골랐어요.'
      : '날씨를 불러오지 못해 색 조화로만 골랐어요.'

  const bodyLine = body.shape
    ? body.fitPreference && items.some(item => item.fit === body.fitPreference)
      ? `${shapeAdvice(body.shape)}에 ${FIT_PREFERENCE_LABEL[body.fitPreference]} 선호가 맞는 옷을 우선했어요.`
      : `${shapeAdvice(body.shape)} 쪽이 잘 맞아요.`
    : body.chips.length > 0
      ? `${body.chips[0]}을 고려해 위아래 톤을 잡았어요.`
      : body.fitPreference && items.some(item => item.fit === body.fitPreference)
        ? `${FIT_PREFERENCE_LABEL[body.fitPreference]} 선호와 옷 자체 핏이 맞는 조합이에요.`
        : body.heightCm || body.weightKg || body.topSize || body.bottomWaistInch
          ? '신체 기준은 저장했어요. 옷 등록 때 자체 핏을 고르면 조합 순위까지 더 정밀해져요.'
          : '체형을 알려주시면 핏까지 맞춰드려요.'

  return { saju, weather: weatherLine, body: bodyLine }
}

function poolFor(
  closet: ClosetItem[],
  slot: OutfitSlot,
  target: number,
  tolerance: number,
  season: string,
  strictSeason: boolean,
): ClosetItem[] {
  return closet.filter(item => {
    if (slotOf(item.category) !== slot) return false
    if (strictSeason && !item.seasons.includes(season as ClosetItem['seasons'][number])) return false
    if (!THERMAL_SLOTS.includes(slot)) return true
    return gradeDistance(item, target) <= tolerance
  })
}

function rankPool(pool: ClosetItem[], lucky: Element | null, history: WearHistory, date: Date): ClosetItem[] {
  const luckyColors = lucky ? luckyColorsFor(lucky) : []
  return [...pool]
    .sort((a, b) => {
      const weight = (item: ClosetItem) =>
        freshnessOf(item, history, date) + (luckyColors.includes(item.color) ? 0.25 : 0)
      const diff = weight(b) - weight(a)
      return diff !== 0 ? diff : a.id.localeCompare(b.id)
    })
    .slice(0, SLOT_POOL_LIMIT)
}

function jaccard(a: Outfit, b: Outfit): number {
  const left = new Set(a.items.map(item => item.id))
  const right = new Set(b.items.map(item => item.id))
  let shared = 0
  for (const id of left) if (right.has(id)) shared += 1
  return shared / (left.size + right.size - shared)
}

export function recommend(context: RecommendContext, count = 3): RecommendResult {
  const date = context.date ?? new Date()
  const bias = context.bias ?? EMPTY_BIAS
  const season = seasonOf(date)
  const target = targetGrade(context.weather, date, bias)
  const lucky = context.fortune?.luckyElement ?? null

  const missing = REQUIRED_SLOTS.filter(slot => !context.closet.some(item => slotOf(item.category) === slot))
  // 옷장이 완전히 비었을 때만 막는다. 한 벌이라도 있으면 그것으로 보여주고 빈 자리를 안내한다.
  if (context.closet.length === 0) {
    const label = missing.join('와 ')
    return {
      status: 'blocked',
      missing,
      message: `${withParticle(label, '이', '가')} 있어야 코디를 만들 수 있어요.`,
    }
  }

  // 명세 §11 — 후보 전멸 시 필터를 단계적으로 완화한다 (막다른 화면 금지)
  const ladders: { tolerance: number; strictSeason: boolean }[] = [
    { tolerance: 0, strictSeason: true },
    { tolerance: 0, strictSeason: false },
    { tolerance: 2, strictSeason: false },
    { tolerance: 7, strictSeason: false },
  ]

  let tops: ClosetItem[] = []
  let bottoms: ClosetItem[] = []
  let level = 0
  for (; level < ladders.length; level += 1) {
    const { tolerance, strictSeason } = ladders[level]
    tops = poolFor(context.closet, '상의', target, tolerance, season, strictSeason)
    bottoms = poolFor(context.closet, '하의', target, tolerance, season, strictSeason)
    if (tops.length > 0 && bottoms.length > 0) break
  }

  const { tolerance, strictSeason } = ladders[Math.min(level, ladders.length - 1)]
  const shoes = poolFor(context.closet, '신발', target, tolerance, season, strictSeason)
  const outers = poolFor(context.closet, '아우터', target, tolerance, season, strictSeason)
  const bags = poolFor(context.closet, '가방', target, tolerance, season, strictSeason)

  const pinned = context.pinnedId
    ? context.closet.find(item => item.id === context.pinnedId)
    : undefined
  const pinnedSlot = pinned ? slotOf(pinned.category) : undefined
  /** 고정한 옷이 있으면 그 슬롯은 그 한 벌만 남긴다 — 반드시 들어가게 하려고. */
  const pinFor = (slot: OutfitSlot, ranked: ClosetItem[]): ClosetItem[] => (
    pinned && pinnedSlot === slot ? [pinned] : ranked
  )

  const rankedTops = pinFor('상의', rankPool(tops, lucky, context.history, date))
  const rankedBottoms = pinFor('하의', rankPool(bottoms, lucky, context.history, date))
  const rankedShoes = pinFor('신발', rankPool(shoes, lucky, context.history, date))
  const rankedOuters = pinFor('아우터', rankPool(outers, lucky, context.history, date))
  const rankedBags = pinFor('가방', rankPool(bags, lucky, context.history, date))

  // 고정한 옷이 아우터면 날씨와 무관하게 넣는다 — 사용자가 그 옷을 보려고 눌렀기 때문이다.
  const wantOuter = (needsOuter(context.weather) || pinnedSlot === '아우터') && rankedOuters.length > 0
  const scoreContext = { weather: context.weather, target, body: context.body, lucky, history: context.history, date, bias }
  const taste = context.taste ?? EMPTY_TASTE

  const candidates: Outfit[] = []
  // 한쪽이 비어도 진행한다 — undefined 자리는 gaps 로 표시된다.
  const topOptions: (ClosetItem | undefined)[] = rankedTops.length > 0 ? rankedTops : [undefined]
  const bottomOptions: (ClosetItem | undefined)[] = rankedBottoms.length > 0 ? rankedBottoms : [undefined]

  for (const top of topOptions) {
    for (const bottom of bottomOptions) {
      const shoeOptions: (ClosetItem | undefined)[] = rankedShoes.length > 0 ? rankedShoes : [undefined]
      for (const shoe of shoeOptions) {
        const bySlot: Partial<Record<OutfitSlot, ClosetItem>> = {}
        if (top) bySlot.상의 = top
        if (bottom) bySlot.하의 = bottom
        if (shoe) bySlot.신발 = shoe

        const base = [top, bottom, ...(shoe ? [shoe] : [])]
          .filter((item): item is ClosetItem => Boolean(item))
        if (wantOuter) {
          const outer = pickAccessory(rankedOuters, base, scoreContext)
          if (outer) bySlot.아우터 = outer
        }
        const bag = pickAccessory(rankedBags, [...base, ...(bySlot.아우터 ? [bySlot.아우터] : [])], scoreContext)
        if (bag) bySlot.가방 = bag

        const items = OUTFIT_SLOTS.map(slot => bySlot[slot]).filter((item): item is ClosetItem => Boolean(item))
        const gaps = OUTFIT_SLOTS.filter(slot => {
          if (bySlot[slot]) return false
          if (slot === '아우터') return needsOuter(context.weather)
          // 상·하의가 비면 무엇을 더해야 완성인지 그대로 보여준다.
          return slot === '상의' || slot === '하의' || slot === '신발' || slot === '가방'
        })

        candidates.push({
          id: items.map(item => item.id).join('+'),
          items,
          bySlot,
          score: Math.round(
            Math.min(1, scoreOutfit(items, scoreContext) + tasteBonus(items, moodOf(items), taste)) * 100,
          ),
          mood: moodOf(items),
          reasons: reasonsFor(items, context.fortune, context.weather, context.body, target),
          gaps,
        })
      }
    }
  }

  const ranked = candidates.sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id))

  // 명세 §9 — 아이템 중복 50% 이하로 서로 다른 무드를 뽑는다
  const picks: Outfit[] = []
  for (const candidate of ranked) {
    if (picks.length >= count) break
    if (picks.every(picked => jaccard(picked, candidate) <= 0.5)) picks.push(candidate)
  }
  for (const candidate of ranked) {
    if (picks.length >= count) break
    if (!picks.some(picked => picked.id === candidate.id)) picks.push(candidate)
  }

  return { status: 'ok', outfits: picks, relaxed: level > 0 }
}

function pickAccessory(
  pool: ClosetItem[],
  base: ClosetItem[],
  scoreContext: Parameters<typeof scoreOutfit>[1],
): ClosetItem | undefined {
  if (pool.length === 0) return undefined
  let best: ClosetItem | undefined
  let bestScore = -1
  for (const candidate of pool) {
    const value = scoreOutfit([...base, candidate], scoreContext)
    if (value > bestScore) {
      bestScore = value
      best = candidate
    }
  }
  return best
}
