// 옷점 사주 엔진 — 절기 기준 만세력(lunar-javascript, 6tail) 래퍼
// 룰 출처: 추천엔진_명세.md §4 (십성→보완 오행 표는 역술 감수 전 v0.1)
import { Solar } from 'lunar-javascript'

export type Element = '목' | '화' | '토' | '금' | '수'
export type TenGod = '비겁' | '식상' | '재성' | '관성' | '인성'

const STEM_TO_ELEMENT: Record<string, Element> = {
  甲: '목', 乙: '목', 丙: '화', 丁: '화', 戊: '토',
  己: '토', 庚: '금', 辛: '금', 壬: '수', 癸: '수',
}
const STEM_KO: Record<string, string> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
  己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
}
const BRANCH_KO: Record<string, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사',
  午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
}

// 상생: A가 생하는 오행 / 상극: A가 극하는 오행
const GENERATES: Record<Element, Element> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }
const CONTROLS: Record<Element, Element> = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' }

export interface ElementStyle {
  color: string          // UI 액센트 hex (디자인시안 오방색)
  palette: string[]      // 옷 색 확장 팔레트
  materials: string[]    // 소재/디테일
  hanja: string
}
export const ELEMENT_STYLE: Record<Element, ElementStyle> = {
  목: { hanja: '木', color: '#2e6b4f', palette: ['그린', '카키', '민트', '올리브'], materials: ['린넨', '스트라이프'] },
  화: { hanja: '火', color: '#a23a2e', palette: ['레드', '핑크', '오렌지', '버건디'], materials: ['실크', '광택 소재'] },
  토: { hanja: '土', color: '#b07d2e', palette: ['베이지', '브라운', '카멜', '머스터드'], materials: ['니트', '코듀로이'] },
  금: { hanja: '金', color: '#8d8a7f', palette: ['화이트', '아이보리', '실버', '그레이'], materials: ['크리스프 셔츠', '메탈 포인트'] },
  수: { hanja: '水', color: '#2c3a52', palette: ['블랙', '네이비', '차콜'], materials: ['데님', '플로우 소재'] },
}

const TEN_GOD_THEME: Record<TenGod, { title: string; line: string }> = {
  비겁: { title: '나를 세우는 날', line: '주장이 강해지는 날 — 기운을 가볍게 흘려보내요.' },
  식상: { title: '표현이 트이는 날', line: '발산의 기운 — 포인트를 과감하게 써도 좋아요.' },
  재성: { title: '기회를 붙잡는 날', line: '재물과 성과의 기운 — 실행이 곧 행운이에요.' },
  관성: { title: '책임이 따르는 날', line: '시험과 압박의 기운 — 단정함이 방패가 돼요.' },
  인성: { title: '배움이 쌓이는 날', line: '수용과 안정의 기운 — 편안한 차림이 힘이 돼요.' },
}

export interface Pillar { gan: string; zhi: string; ko: string; element: Element }
export interface DayFortune {
  date: string
  yearPillar: Pillar
  monthPillar: Pillar
  dayPillar: Pillar
  dayMaster: Element        // 내 일간 오행
  todayElement: Element     // 오늘 일진 오행
  tenGod: TenGod
  luckyElement: Element     // 보완 오행 = 오늘의 행운색 계열
  style: ElementStyle
  theme: { title: string; line: string }
  score: number             // 0~100 (v0: 결정론적 플레이스홀더 — 명세 §8 확정 전)
}

function pillar(gan: string, zhi: string): Pillar {
  return { gan, zhi, ko: `${STEM_KO[gan]}${BRANCH_KO[zhi]}`, element: STEM_TO_ELEMENT[gan] }
}

function relation(dayMaster: Element, today: Element): TenGod {
  if (dayMaster === today) return '비겁'
  if (GENERATES[today] === dayMaster) return '인성'
  if (GENERATES[dayMaster] === today) return '식상'
  if (CONTROLS[dayMaster] === today) return '재성'
  return '관성' // CONTROLS[today] === dayMaster
}

// 명세 §4.3: 비겁→식상 / 식상→재성 / 재성·인성→일진 오행 유지 / 관성→인성(나를 생하는 오행)
function luckyElement(dayMaster: Element, today: Element, tenGod: TenGod): Element {
  switch (tenGod) {
    case '비겁': return GENERATES[dayMaster]
    case '식상': return GENERATES[today]
    case '재성': return today
    case '관성': return (Object.keys(GENERATES) as Element[]).find(e => GENERATES[e] === dayMaster)!
    case '인성': return today
  }
}

function eightChar(d: Date) {
  return Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), 0, 0)
    .getLunar()
    .getEightChar()
}

/**
 * 진태양시 보정 — 한국 표준시는 동경 135도 기준인데 서울은 실제 126.98도다.
 * 경도 1도당 4분이라 약 32분 늦다. 시주(時柱)는 두 시간 단위라 경계 근처에서 결과가 갈린다.
 *
 * 기획서 §13의 "진태양시 -30분 보정(확인 필요)"을 여기서 닫는다.
 */
export const SEOUL_LONGITUDE = 126.978
export const KST_MERIDIAN = 135
export const TRUE_SOLAR_OFFSET_MINUTES = Math.round((SEOUL_LONGITUDE - KST_MERIDIAN) * 4)

export interface BirthInputLike {
  y: number
  m: number
  d: number
  hour?: number
  minute?: number
  /** 진태양시 보정을 쓸지 — 기본은 쓴다 */
  trueSolarTime?: boolean
}

/** 보정을 적용한 시각을 돌려준다. 날짜를 넘길 수 있으므로 Date 로 다룬다. */
export function correctedBirthTime(birth: BirthInputLike): Date {
  const base = new Date(birth.y, birth.m - 1, birth.d, birth.hour ?? 12, birth.minute ?? 0, 0)
  if (birth.trueSolarTime === false || birth.hour === undefined) return base
  return new Date(base.getTime() + TRUE_SOLAR_OFFSET_MINUTES * 60_000)
}

/** 시지(時支)가 경계에서 몇 분 떨어져 있는지 — 30분 이내면 화면에서 알려준다. */
export function hourBoundaryMinutes(birth: BirthInputLike): number | null {
  if (birth.hour === undefined) return null
  const corrected = correctedBirthTime(birth)
  const minutes = corrected.getHours() * 60 + corrected.getMinutes()
  // 보정한 시각을 그대로 쓰는 라이브러리 기준으로 자시는 23:00 시작, 이후 120분마다 바뀐다.
  const fromBoundary = ((minutes - 23 * 60) % 120 + 120) % 120
  return Math.min(fromBoundary, 120 - fromBoundary)
}

/** 생년월일(시 선택)의 일주. 시 모름이면 정오로 고정(일주에 영향 없음). */
export function birthDayPillar(birth: BirthInputLike): Pillar {
  const corrected = correctedBirthTime(birth)
  const ec = Solar.fromYmdHms(
    corrected.getFullYear(),
    corrected.getMonth() + 1,
    corrected.getDate(),
    corrected.getHours(),
    corrected.getMinutes(),
    0,
  )
    .getLunar()
    .getEightChar()
  return pillar(ec.getDayGan(), ec.getDayZhi())
}

/** 사주 네 기둥 전체 — 원국 표시에 쓴다. */
export function birthPillars(birth: BirthInputLike): {
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar | null
} {
  const corrected = correctedBirthTime(birth)
  const ec = Solar.fromYmdHms(
    corrected.getFullYear(),
    corrected.getMonth() + 1,
    corrected.getDate(),
    corrected.getHours(),
    corrected.getMinutes(),
    0,
  )
    .getLunar()
    .getEightChar()

  return {
    year: pillar(ec.getYearGan(), ec.getYearZhi()),
    month: pillar(ec.getMonthGan(), ec.getMonthZhi()),
    day: pillar(ec.getDayGan(), ec.getDayZhi()),
    // 시주 접근자는 런타임에는 있지만 타입 선언에는 빠져 있다.
    hour: birth.hour === undefined
      ? null
      : pillar(
          (ec as unknown as { getTimeGan(): string }).getTimeGan(),
          (ec as unknown as { getTimeZhi(): string }).getTimeZhi(),
        ),
  }
}

/** 생년월일(시 선택)로 일간 오행을 구한다. */
export function dayMasterOf(birth: BirthInputLike): Element {
  return birthDayPillar(birth).element
}

/** 오늘(또는 지정일)의 운세 요약 — 홈 브리핑의 데이터 소스 */
export function fortuneFor(birth: BirthInputLike, date = new Date()): DayFortune {
  const ec = eightChar(date)
  const yearPillar = pillar(ec.getYearGan(), ec.getYearZhi())
  const monthPillar = pillar(ec.getMonthGan(), ec.getMonthZhi())
  const dayPillar = pillar(ec.getDayGan(), ec.getDayZhi())
  const dayMaster = dayMasterOf(birth)
  const todayElement = dayPillar.element
  const tenGod = relation(dayMaster, todayElement)
  const lucky = luckyElement(dayMaster, todayElement, tenGod)

  // v0 점수: 관계 기본값 + 날짜·생일 결정론적 변동 (명세 §8 스코어링 확정 전 플레이스홀더)
  const base: Record<TenGod, number> = { 재성: 82, 식상: 78, 인성: 74, 비겁: 68, 관성: 62 }
  const seed = (date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
    + birth.y * 10000 + birth.m * 100 + birth.d) % 13
  const score = Math.min(97, base[tenGod] + (seed % 9))

  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    yearPillar, monthPillar, dayPillar,
    dayMaster, todayElement, tenGod,
    luckyElement: lucky,
    style: ELEMENT_STYLE[lucky],
    theme: TEN_GOD_THEME[tenGod],
    score,
  }
}
