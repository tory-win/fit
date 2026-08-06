import { describe, expect, it } from 'vitest'
import type { ClosetItem, ClosetCategory, ClosetColor, ClosetFit, ClosetSeason } from './closet'
import { ELEMENT_STYLE, type DayFortune } from './saju'
import type { DayWeather, WeatherState } from './weather'
import { EMPTY_BODY, type BodyProfile } from './body'
import { EMPTY_BIAS, applyFeedback } from './feedback'
import {
  freshnessOf,
  gapMessage,
  gradeDistance,
  itemGradeRange,
  itemThicknessGrade,
  moodOf,
  recommend,
  seasonOf,
  targetGrade,
  type WearHistory,
} from './recommend'

const TODAY = new Date(2026, 6, 25, 9, 0, 0)

function item(
  id: string,
  category: ClosetCategory,
  color: ClosetColor,
  seasons: ClosetSeason[] = ['여름'],
  fit?: ClosetFit,
): ClosetItem {
  return {
    id,
    imagePath: `closet/v1/images/${id}.jpg`,
    imageUrl: `blob:${id}`,
    category,
    color,
    seasons,
    fit,
    source: 'camera',
    createdAt: '2026-07-20T00:00:00.000Z',
  }
}

// 일간 火 · 일진 水 = 관성 → 보완 오행 목 (명세 §4.3)
const fortune: DayFortune = {
  date: '2026-07-25',
  yearPillar: { gan: '丙', zhi: '午', ko: '병오', element: '화' },
  monthPillar: { gan: '乙', zhi: '未', ko: '을미', element: '목' },
  dayPillar: { gan: '壬', zhi: '子', ko: '임자', element: '수' },
  dayMaster: '화',
  todayElement: '수',
  tenGod: '관성',
  luckyElement: '목',
  style: ELEMENT_STYLE.목,
  theme: { title: '책임이 따르는 날', line: '단정함이 방패가 돼요.' },
  score: 71,
}

const summer: DayWeather = {
  status: 'ok',
  date: '2026-07-25',
  tMax: 31,
  tMin: 24,
  precipProbability: 20,
  windSpeed: 3,
}

const noHistory: WearHistory = { lastWornAt: {} }

function context(overrides: Partial<Parameters<typeof recommend>[0]> = {}) {
  return {
    closet: [],
    fortune,
    weather: summer as WeatherState,
    body: EMPTY_BODY as BodyProfile,
    history: noHistory,
    date: TODAY,
    ...overrides,
  }
}

describe('itemThicknessGrade', () => {
  it('derives thickness from the tagged seasons', () => {
    expect(itemThicknessGrade({ seasons: ['여름'] })).toBe(1)
    expect(itemThicknessGrade({ seasons: ['봄', '가을'] })).toBe(3)
    expect(itemThicknessGrade({ seasons: ['겨울'] })).toBe(6)
    expect(itemThicknessGrade({ seasons: ['봄', '여름', '가을', '겨울'] })).toBe(3)
  })
})

describe('itemGradeRange / gradeDistance', () => {
  it('covers every grade the tagged seasons span', () => {
    expect(itemGradeRange({ seasons: ['여름'] })).toEqual([0, 1])
    expect(itemGradeRange({ seasons: ['봄', '여름'] })).toEqual([0, 4])
    expect(itemGradeRange({ seasons: ['겨울'] })).toEqual([5, 7])
    expect(itemGradeRange({ seasons: ['봄', '여름', '가을', '겨울'] })).toEqual([0, 7])
  })

  it('keeps a spring-summer shirt in play on the hottest day', () => {
    expect(gradeDistance({ seasons: ['봄', '여름'] }, 0)).toBe(0)
    expect(gradeDistance({ seasons: ['겨울'] }, 0)).toBe(5)
    expect(gradeDistance({ seasons: ['여름'] }, 7)).toBe(6)
  })
})

describe('targetGrade', () => {
  it('falls back to the season when weather is unavailable', () => {
    expect(targetGrade(summer, TODAY)).toBe(0)
    expect(targetGrade({ status: 'unavailable', reason: 'offline' }, TODAY)).toBe(1)
    expect(seasonOf(new Date(2026, 0, 10))).toBe('겨울')
    expect(targetGrade({ status: 'unavailable', reason: 'error' }, new Date(2026, 0, 10))).toBe(6)
  })
})

describe('recommend — 부분 코디', () => {
  it('상의만 있어도 코디를 만들고 빈 자리를 알려준다', () => {
    const result = recommend(context({
      closet: [item('t1', '상의', '아이보리'), item('t2', '상의', '블랙'), item('t3', '상의', '그린')],
    }))
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.outfits[0].items).toHaveLength(1)
    expect(result.outfits[0].gaps).toContain('하의')
  })

  it('신발 한 켤레만 있어도 막지 않는다', () => {
    const result = recommend(context({ closet: [item('s1', '신발', '베이지')] }))
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.outfits[0].gaps).toEqual(expect.arrayContaining(['상의', '하의']))
  })

  it('옷장이 완전히 비었을 때만 막는다', () => {
    const result = recommend(context({ closet: [] }))
    expect(result.status).toBe('blocked')
    if (result.status !== 'blocked') return
    expect(result.missing).toEqual(['상의', '하의'])
  })
})

describe('recommend — happy path', () => {
  const closet = [
    item('top-ivory', '상의', '아이보리'),
    item('top-green', '상의', '그린'),
    item('bottom-black', '하의', '블랙'),
    item('bottom-beige', '하의', '베이지'),
    item('shoes-ivory', '신발', '아이보리'),
  ]

  it('builds outfits from top, bottom, and shoes', () => {
    const result = recommend(context({ closet }))
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return

    expect(result.outfits.length).toBeGreaterThan(0)
    const [best] = result.outfits
    expect(best.bySlot.상의).toBeDefined()
    expect(best.bySlot.하의).toBeDefined()
    expect(best.bySlot.신발).toBeDefined()
    expect(best.score).toBeGreaterThan(0)
    expect(best.score).toBeLessThanOrEqual(100)
  })

  it('keeps shoes and bags out of the thickness filter', () => {
    // 최고 31° → 두께 등급 0. 봄·여름·가을 신발(등급 2)은 상·하의였다면 걸러졌겠지만 신발은 남는다.
    const result = recommend(context({
      closet: [
        item('top-ivory', '상의', '아이보리'),
        item('bottom-black', '하의', '블랙'),
        item('shoes-all', '신발', '베이지', ['봄', '여름', '가을']),
        item('bag-all', '가방', '그린', ['봄', '여름', '가을', '겨울']),
      ],
    }))
    if (result.status !== 'ok') throw new Error('expected outfits')
    expect(result.outfits[0].bySlot.신발?.id).toBe('shoes-all')
    expect(result.outfits[0].bySlot.가방?.id).toBe('bag-all')
    expect(result.outfits[0].gaps).toEqual([])
  })

  it('reports the empty bag slot as a gap rather than hiding it', () => {
    const result = recommend(context({ closet }))
    if (result.status !== 'ok') throw new Error('expected outfits')
    expect(result.outfits[0].gaps).toContain('가방')
    expect(gapMessage(result.outfits[0].gaps)).toBe('가방을 등록하면 이 조합이 완성돼요.')
  })

  it('prefers the outfit carrying exactly one lucky colour', () => {
    const result = recommend(context({ closet }))
    if (result.status !== 'ok') throw new Error('expected outfits')
    // 보완 오행 목 = 그린. 상위 코디는 그린을 정확히 한 벌 포함한다.
    const greens = result.outfits[0].items.filter(entry => entry.color === '그린').length
    expect(greens).toBe(1)
    expect(result.outfits[0].reasons.saju).toContain('그린')
  })

  it('attaches the right subject particle to the lucky item', () => {
    const result = recommend(context({
      closet: [
        item('top-ivory', '상의', '아이보리'),
        item('bottom-black', '하의', '블랙'),
        item('shoes-green', '신발', '그린'),
      ],
    }))
    if (result.status !== 'ok') throw new Error('expected outfits')
    expect(result.outfits[0].reasons.saju).toContain('그린 신발이')
  })

  it('returns outfits that are not near-duplicates of each other', () => {
    const result = recommend(context({ closet }))
    if (result.status !== 'ok') throw new Error('expected outfits')
    const ids = result.outfits.map(outfit => outfit.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is deterministic for the same inputs', () => {
    const first = recommend(context({ closet }))
    const second = recommend(context({ closet }))
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })
})

describe('recommend — real 환경 (fortune 없음)', () => {
  const closet = [
    item('top-ivory', '상의', '아이보리'),
    item('top-green', '상의', '그린'),
    item('bottom-black', '하의', '블랙'),
    item('shoe-beige', '신발', '베이지'),
  ]

  it('fortune이 null이어도 코디를 만들고 사주 근거를 넣지 않는다', () => {
    const result = recommend(context({ closet, fortune: null }))
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.outfits.length).toBeGreaterThan(0)
    for (const outfit of result.outfits) {
      expect(outfit.reasons.saju).toBeUndefined()
      expect(outfit.reasons.weather).toBeTruthy()
      expect(outfit.reasons.body).toBeTruthy()
    }
  })

  it('결정론 유지 — 같은 입력이면 같은 결과', () => {
    const first = recommend(context({ closet, fortune: null }))
    const second = recommend(context({ closet, fortune: null }))
    expect(first).toEqual(second)
  })

  it('날씨까지 없으면 색 조화 문구만 남는다 (사주 언급 금지)', () => {
    const result = recommend(context({
      closet,
      fortune: null,
      weather: { status: 'unavailable', reason: 'offline' },
    }))
    if (result.status !== 'ok') throw new Error('expected outfits')
    expect(result.outfits[0].reasons.weather).toBe('날씨를 불러오지 못해 색 조화로만 골랐어요.')
    expect(result.outfits[0].reasons.weather).not.toContain('사주')
  })
})

describe('recommend — weather unavailable', () => {
  it('still recommends and says so in the reason line', () => {
    const closet = [
      item('top-ivory', '상의', '아이보리'),
      item('bottom-black', '하의', '블랙'),
      item('shoes-beige', '신발', '베이지'),
    ]
    const result = recommend(context({ closet, weather: { status: 'unavailable', reason: 'offline' } }))
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.outfits[0].reasons.weather).toBe('날씨를 불러오지 못해 사주와 색 조화로만 골랐어요.')
  })
})

describe('recommend — cold start and relaxation', () => {
  it('relaxes the thickness filter instead of returning nothing', () => {
    const winter = new Date(2026, 0, 10)
    const closet = [
      item('top-linen', '상의', '아이보리', ['여름']),
      item('bottom-short', '하의', '베이지', ['여름']),
      item('shoes-sandal', '신발', '블랙', ['여름']),
    ]
    const result = recommend(context({
      closet,
      date: winter,
      weather: { status: 'ok', date: '2026-01-10', tMax: 1, tMin: -6, precipProbability: 10, windSpeed: 4 },
    }))
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.relaxed).toBe(true)
    expect(result.outfits.length).toBeGreaterThan(0)
  })
})

describe('recommend — body profile changes the ranking', () => {
  const closet = [
    item('top-ivory', '상의', '아이보리'),
    item('top-black', '상의', '블랙'),
    item('bottom-black', '하의', '블랙'),
    item('bottom-ivory', '하의', '아이보리'),
    item('shoes-beige', '신발', '베이지'),
  ]

  it('puts a light top over a dark bottom for the triangle shape', () => {
    const result = recommend(context({ closet, body: { shape: '삼각', chips: [] } }))
    if (result.status !== 'ok') throw new Error('expected outfits')
    const best = result.outfits[0]
    expect(best.bySlot.상의?.color).toBe('아이보리')
    expect(best.bySlot.하의?.color).toBe('블랙')
    expect(best.reasons.body).toContain('밝은 상의')
  })

  it('flips to a dark top for the inverted triangle shape', () => {
    const result = recommend(context({ closet, body: { shape: '역삼각', chips: [] } }))
    if (result.status !== 'ok') throw new Error('expected outfits')
    expect(result.outfits[0].bySlot.상의?.color).toBe('블랙')
  })

  it('nudges instead of claiming a fit reason when nothing was entered', () => {
    const result = recommend(context({ closet }))
    if (result.status !== 'ok') throw new Error('expected outfits')
    expect(result.outfits[0].reasons.body).toBe('체형을 알려주시면 핏까지 맞춰드려요.')
  })

  it('uses the selected fit preference when closet items carry fit tags', () => {
    const tagged = [
      item('top-slim', '상의', '아이보리', ['여름'], 'slim'),
      item('top-relaxed', '상의', '아이보리', ['여름'], 'relaxed'),
      item('bottom-slim', '하의', '블랙', ['여름'], 'slim'),
      item('bottom-relaxed', '하의', '블랙', ['여름'], 'relaxed'),
      item('shoes-beige', '신발', '베이지'),
    ]
    const result = recommend(context({
      closet: tagged,
      body: { fitPreference: 'relaxed', chips: [] },
    }))
    if (result.status !== 'ok') throw new Error('expected outfits')
    expect(result.outfits[0].bySlot.상의?.fit).toBe('relaxed')
    expect(result.outfits[0].bySlot.하의?.fit).toBe('relaxed')
    expect(result.outfits[0].reasons.body).toContain('여유 있게')
  })
})

describe('recommend — personal bias from feedback', () => {
  it('raises the thickness target after "추웠어요"', () => {
    const warmer = applyFeedback(EMPTY_BIAS, { date: '2026-07-25', verdict: 'bad', reason: '추웠어요' })
    expect(targetGrade(summer, TODAY)).toBe(0)
    expect(targetGrade(summer, TODAY, warmer)).toBe(1)
  })

  it('never pushes the target outside 0~7', () => {
    const cooler = applyFeedback(EMPTY_BIAS, { date: '2026-07-25', verdict: 'bad', reason: '더웠어요' })
    expect(targetGrade(summer, TODAY, cooler)).toBe(0)
    const warmer = applyFeedback(EMPTY_BIAS, { date: '2026-07-25', verdict: 'bad', reason: '추웠어요' })
    const freezing = { ...summer, tMax: -5, tMin: -12 }
    expect(targetGrade(freezing, TODAY, warmer)).toBe(7)
  })

  it('demotes a colour pair the user disliked', () => {
    const closet = [
      item('top-ivory', '상의', '아이보리'),
      item('top-beige', '상의', '베이지'),
      item('bottom-black', '하의', '블랙'),
      item('shoes-black', '신발', '블랙'),
    ]
    const neutral = recommend(context({ closet }))
    if (neutral.status !== 'ok') throw new Error('expected outfits')
    const first = neutral.outfits[0].bySlot.상의?.color
    expect(first).toBeDefined()

    let bias = EMPTY_BIAS
    for (let day = 1; day <= 5; day += 1) {
      bias = applyFeedback(
        bias,
        { date: `2026-07-0${day}`, verdict: 'bad', reason: '색이 별로였어요' },
        { topColor: first as string, bottomColor: '블랙' },
      )
    }
    const adjusted = recommend(context({ closet, bias }))
    if (adjusted.status !== 'ok') throw new Error('expected outfits')
    expect(adjusted.outfits[0].bySlot.상의?.color).not.toBe(first)
  })
})

describe('freshnessOf', () => {
  const piece = item('top-1', '상의', '아이보리')

  it('penalises what was worn today and forgives what rested three weeks', () => {
    expect(freshnessOf(piece, { lastWornAt: {} }, TODAY)).toBe(1)
    expect(freshnessOf(piece, { lastWornAt: { 'top-1': '2026-07-25' } }, TODAY)).toBeLessThan(0.1)
    expect(freshnessOf(piece, { lastWornAt: { 'top-1': '2026-07-01' } }, TODAY)).toBe(1)
    expect(freshnessOf(piece, { lastWornAt: { 'top-1': '2026-07-22' } }, TODAY)).toBeLessThan(0.4)
  })

  it('demotes a recently worn piece in the ranking', () => {
    const closet = [
      item('top-a', '상의', '아이보리'),
      item('top-b', '상의', '베이지'),
      item('bottom-1', '하의', '블랙'),
      item('shoes-1', '신발', '블랙'),
    ]
    const rested = recommend(context({ closet }))
    const wornToday = recommend(context({ closet, history: { lastWornAt: { 'top-a': '2026-07-25' } } }))
    if (rested.status !== 'ok' || wornToday.status !== 'ok') throw new Error('expected outfits')
    expect(rested.outfits[0].bySlot.상의?.id).toBe('top-a')
    expect(wornToday.outfits[0].bySlot.상의?.id).toBe('top-b')
  })
})

describe('moodOf', () => {
  it('labels the palette without repeating itself', () => {
    expect(moodOf([item('a', '상의', '그린'), item('b', '하의', '블루')])).toBe('과감한 배색')
    expect(moodOf([item('a', '상의', '블랙'), item('b', '하의', '블랙')])).toBe('깊은 톤')
    expect(moodOf([item('a', '상의', '아이보리'), item('b', '하의', '베이지')])).toBe('가볍고 밝은')
    expect(moodOf([item('a', '상의', '그린'), item('b', '하의', '블랙')])).toBe('단정한 대비')
  })
})

describe('gapMessage', () => {
  it('picks the right particle', () => {
    expect(gapMessage([])).toBe('')
    expect(gapMessage(['신발'])).toBe('신발을 등록하면 이 조합이 완성돼요.')
    expect(gapMessage(['아우터'])).toBe('아우터를 등록하면 이 조합이 완성돼요.')
  })
})
