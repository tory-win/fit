// 항목별 운세 + 파생 행운 정보 — 기획서 §6.4 F-2, 추천엔진_명세.md §4.4
//
// 룰 출처: M3-기획.md §3 (역술 감수 전 v0.1). 십성 생극으로 기준점을 잡고
// 총운과 같은 방식의 결정론적 변동만 더한다 — 같은 날 같은 사람은 항상 같은 값이다.
import { ELEMENT_STYLE, type DayFortune, type Element, type TenGod } from './saju'

export const FORTUNE_DOMAINS = ['애정', '금전', '직장', '건강'] as const
export type FortuneDomain = (typeof FORTUNE_DOMAINS)[number]

/** M3-기획.md §3.1 — 항목을 관장하는 십성 */
const DOMAIN_TEN_GOD: Record<FortuneDomain, TenGod> = {
  애정: '식상',
  금전: '재성',
  직장: '관성',
  건강: '인성',
}

const DOMAIN_MARK: Record<FortuneDomain, string> = {
  애정: '情',
  금전: '財',
  직장: '職',
  건강: '健',
}

// 십성 순환은 오행과 같다 — 생: 비겁→식상→재성→관성→인성→비겁
const TEN_GOD_GENERATES: Record<TenGod, TenGod> = {
  비겁: '식상',
  식상: '재성',
  재성: '관성',
  관성: '인성',
  인성: '비겁',
}

// 극: 하나 건너뛰기
const TEN_GOD_CONTROLS: Record<TenGod, TenGod> = {
  비겁: '재성',
  식상: '관성',
  재성: '인성',
  관성: '비겁',
  인성: '식상',
}

export type DomainRelation = 'stage' | 'flows' | 'feeds' | 'pressed' | 'clashes'

/** M3-기획.md §3.2 기준점 */
const RELATION_BASE: Record<DomainRelation, number> = {
  stage: 86,
  flows: 76,
  feeds: 70,
  clashes: 63,
  pressed: 58,
}

const RELATION_TONE: Record<FortuneDomain, Record<DomainRelation, string>> = {
  애정: {
    stage: '마음을 드러내기 가장 좋은 날이에요.',
    flows: '표현이 자연스럽게 트이는 흐름이에요.',
    feeds: '먼저 다가가면 그만큼 돌아오는 날이에요.',
    clashes: '말이 부딪히기 쉬워요. 한 박자 쉬어가세요.',
    pressed: '감정을 눌러두기 쉬운 날이에요. 무리해서 꺼내지 마세요.',
  },
  금전: {
    stage: '재물의 기운이 그대로 무대에 올라요.',
    flows: '들어온 기회가 결실로 이어지는 흐름이에요.',
    feeds: '먼저 움직여야 손에 잡히는 날이에요.',
    clashes: '지출이 부딪히기 쉬워요. 큰 결정은 미루세요.',
    pressed: '새는 곳이 생기기 쉬운 날이에요. 지갑을 닫는 편이 나아요.',
  },
  직장: {
    stage: '책임이 곧 성과가 되는 날이에요.',
    flows: '맡은 일이 순조롭게 흘러가요.',
    feeds: '먼저 정리해두면 인정으로 돌아와요.',
    clashes: '윗선과 부딪히기 쉬워요. 속도를 조절하세요.',
    pressed: '압박이 들어오는 날이에요. 단정함이 방패가 돼요.',
  },
  건강: {
    stage: '회복이 가장 잘 붙는 날이에요.',
    flows: '몸이 편하게 따라오는 흐름이에요.',
    feeds: '조금만 챙기면 컨디션이 올라와요.',
    clashes: '무리하면 바로 티가 나요. 쉬는 시간을 두세요.',
    pressed: '기운이 눌리는 날이에요. 따뜻하고 편하게 입으세요.',
  },
}

const DOMAIN_ADVICE: Record<FortuneDomain, (palette: string, material: string) => string> = {
  애정: palette => `${palette} 계열을 얼굴 가까이 두면 인상이 부드러워져요.`,
  금전: palette => `${palette} 포인트를 하나만 얹어보세요.`,
  직장: (_palette, material) => `${material} 하나면 단정함이 완성돼요.`,
  건강: () => '조이지 않는 핏이 오늘은 더 편해요.',
}

export interface DomainFortune {
  domain: FortuneDomain
  mark: string
  tenGod: TenGod
  relation: DomainRelation
  /** 오늘의 십성과 같은 항목 — "오늘의 무대" */
  stage: boolean
  score: number
  line: string
}

export interface DailyReading {
  title: string
  overview: string
  best: { domain: FortuneDomain; line: string }
  caution: { domain: FortuneDomain; line: string }
}

const DAILY_OVERVIEW: Record<TenGod, string> = {
  비겁: '내 기준을 분명히 하되, 다른 사람의 속도까지 밀어붙이지 않으면 흐름이 편안해져요.',
  식상: '머릿속에만 둔 생각을 말과 행동으로 꺼낼수록 막혀 있던 흐름이 열려요.',
  재성: '눈앞의 기회를 작게라도 실행에 옮기면 오늘의 성과가 손에 잡혀요.',
  관성: '해야 할 일을 한 번에 넓히기보다 우선순위를 세우면 압박이 성과로 바뀌어요.',
  인성: '서두르기보다 받아들이고 정리하는 시간이 다음 움직임을 단단하게 만들어줘요.',
}

/** 총운 점수만 보여주지 않고, 가장 강한 항목과 주의 항목을 실제 읽을거리로 묶는다. */
export function dailyReadingOf(fortune: DayFortune, domains: DomainFortune[]): DailyReading {
  const best = domains[0]
  const caution = domains[domains.length - 1]
  if (!best || !caution) {
    throw new Error('오늘의 항목별 운세가 필요해요.')
  }

  return {
    title: `${best.domain}의 흐름을 먼저 살려보세요`,
    overview: DAILY_OVERVIEW[fortune.tenGod],
    best: { domain: best.domain, line: best.line },
    caution: { domain: caution.domain, line: caution.line },
  }
}

export function relationOf(today: TenGod, domain: TenGod): DomainRelation {
  if (today === domain) return 'stage'
  if (TEN_GOD_GENERATES[today] === domain) return 'flows'
  if (TEN_GOD_GENERATES[domain] === today) return 'feeds'
  if (TEN_GOD_CONTROLS[today] === domain) return 'pressed'
  return 'clashes' // TEN_GOD_CONTROLS[domain] === today
}

function variance(fortune: DayFortune, birth: { y: number; m: number; d: number }, index: number): number {
  const [year, month, day] = fortune.date.split('-').map(Number)
  const seed = (year * 10000 + month * 100 + day + birth.y * 10000 + birth.m * 100 + birth.d) % 13
  return (seed + index * 3) % 9
}

/** 점수 높은 순으로 정렬해 반환한다 (동점은 고정 순서). */
export function domainFortunes(
  fortune: DayFortune,
  birth: { y: number; m: number; d: number },
): DomainFortune[] {
  const style = ELEMENT_STYLE[fortune.luckyElement]
  const palette = style.palette[0]
  const material = style.materials[0]

  return FORTUNE_DOMAINS
    .map((domain, index) => {
      const tenGod = DOMAIN_TEN_GOD[domain]
      const relation = relationOf(fortune.tenGod, tenGod)
      const score = Math.min(97, RELATION_BASE[relation] + variance(fortune, birth, index))
      return {
        domain,
        mark: DOMAIN_MARK[domain],
        tenGod,
        relation,
        stage: relation === 'stage',
        score,
        line: `${RELATION_TONE[domain][relation]} ${DOMAIN_ADVICE[domain](palette, material)}`,
      }
    })
    .sort((a, b) => (b.score - a.score) || FORTUNE_DOMAINS.indexOf(a.domain) - FORTUNE_DOMAINS.indexOf(b.domain))
}

// --- 명세 §4.4 파생 행운 정보 ---

const ELEMENT_NUMBERS: Record<Element, [number, number]> = {
  목: [3, 8],
  화: [2, 7],
  토: [5, 10],
  금: [4, 9],
  수: [1, 6],
}

const ELEMENT_DIRECTION: Record<Element, string> = {
  목: '동쪽',
  화: '남쪽',
  토: '중앙',
  금: '서쪽',
  수: '북쪽',
}

const BRANCH_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export interface LuckyInfo {
  element: Element
  color: string
  material: string
  number: number
  direction: string
}

/**
 * 행운 숫자는 보완 오행의 두 정수 중 하나를 오늘 일진 지지 순번으로 고른다.
 * 명세 §4.4의 "지지 순번과 합이 맞는 것 1개"를 결정론적으로 해석한 v0.1 규칙이다.
 */
export function luckyInfoOf(fortune: DayFortune): LuckyInfo {
  const style = ELEMENT_STYLE[fortune.luckyElement]
  const numbers = ELEMENT_NUMBERS[fortune.luckyElement]
  const branchIndex = Math.max(0, BRANCH_ORDER.indexOf(fortune.dayPillar.zhi))

  return {
    element: fortune.luckyElement,
    color: style.palette[0],
    material: style.materials[0],
    number: numbers[branchIndex % 2],
    direction: ELEMENT_DIRECTION[fortune.luckyElement],
  }
}


/* ── 하루 운세 상세 — 점신형 상세 보기 (M9) ──
   같은 날 같은 사람은 항상 같은 문장이 나온다. 역술 감수 전 v0.1 이므로 화면에 "참고용"을 유지한다. */

export interface FortuneFlowSlot {
  label: string
  hours: string
  line: string
}

export interface DomainDetail {
  domain: FortuneDomain
  headline: string
  body: string
  flow: FortuneFlowSlot[]
  todo: string[]
  avoid: string[]
  styleTip: string
}

const RELATION_HEADLINE: Record<DomainRelation, string> = {
  stage: '오늘의 무대예요',
  flows: '흐름이 트여 있어요',
  feeds: '주면 돌아오는 날이에요',
  clashes: '부딪힘이 있는 날이에요',
  pressed: '눌러두기 쉬운 날이에요',
}

const RELATION_BODY: Record<DomainRelation, string> = {
  stage: '오늘의 기운이 이 자리에 그대로 얹혀요. 미뤄둔 것을 꺼내기 좋고, 먼저 움직인 만큼 결과가 붙습니다.',
  flows: '기운이 이쪽으로 흘러가요. 크게 애쓰지 않아도 진행이 되니 방향만 잡아두면 됩니다.',
  feeds: '내가 먼저 내어주는 자리예요. 오늘 들인 품이 바로 오늘 돌아오지는 않지만 며칠 안에 형태가 생깁니다.',
  clashes: '기운이 서로 밀어내요. 결론을 오늘 안에 내려 하기보다 재료만 모아두는 편이 낫습니다.',
  pressed: '눌리는 자리라 평소보다 힘이 덜 실려요. 새로 벌이기보다 이미 있는 것을 지키는 쪽이 편합니다.',
}

const FLOW_LABELS: { label: string; hours: string }[] = [
  { label: '아침', hours: '06–11시' },
  { label: '낮', hours: '11–17시' },
  { label: '저녁', hours: '17–23시' },
]

/** 점수와 관계에서 시간대 흐름을 만든다 — 높은 항목은 아침부터, 눌린 항목은 저녁에 풀린다. */
function flowFor(entry: DomainFortune): FortuneFlowSlot[] {
  const rising = entry.relation === 'pressed' || entry.relation === 'clashes'
  const lines = rising
    ? [
        '서두르면 걸려요. 오전에는 상황만 파악해 두세요.',
        '가장 조심할 구간이에요. 결정을 미루면 손해가 줄어요.',
        '한숨 돌릴 수 있어요. 정리와 회복을 여기에 두세요.',
      ]
    : [
        '가장 잘 붙는 시간이에요. 중요한 것을 먼저 꺼내세요.',
        '속도가 유지돼요. 벌여둔 일을 이어가기 좋아요.',
        '마무리에 힘을 아껴두세요. 새로 시작하기엔 늦은 시간이에요.',
      ]

  return FLOW_LABELS.map((slot, index) => ({ ...slot, line: lines[index] }))
}

const DOMAIN_TODO: Record<FortuneDomain, string[]> = {
  애정: ['먼저 안부를 묻기', '표정이 보이는 자리에서 이야기하기'],
  금전: ['고정지출 한 줄 점검하기', '오늘 안 사도 되는 것 미루기'],
  직장: ['맡은 것부터 눈에 보이게 정리하기', '짧은 보고 한 번 더 하기'],
  건강: ['자세를 바꿔 앉기', '물과 잠을 먼저 채우기'],
}

const DOMAIN_AVOID: Record<FortuneDomain, string[]> = {
  애정: ['확인받으려고 되묻기', '지난 이야기 다시 꺼내기'],
  금전: ['큰 금액을 오늘 결정하기', '충동적으로 결제하기'],
  직장: ['혼자 끌어안기', '즉답을 요구하기'],
  건강: ['무리한 강도', '늦은 시간 카페인'],
}

export function domainDetail(entry: DomainFortune, fortune: DayFortune): DomainDetail {
  const palette = ELEMENT_STYLE[fortune.luckyElement].palette[0]

  return {
    domain: entry.domain,
    headline: `${entry.domain}, ${RELATION_HEADLINE[entry.relation]}`,
    body: `${RELATION_BODY[entry.relation]} ${entry.line}`,
    flow: flowFor(entry),
    todo: DOMAIN_TODO[entry.domain],
    avoid: DOMAIN_AVOID[entry.domain],
    styleTip: `${palette} 계열을 ${entry.domain === '애정' ? '얼굴 가까이' : '눈에 보이는 곳에'} 하나 두면 오늘 기운과 맞아요.`,
  }
}
