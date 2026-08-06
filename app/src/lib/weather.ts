// 날씨 레이어 — 추천엔진_명세.md §5
// 소스: Open-Meteo (서비스키 불필요). 기상청 단기예보 키 확보 시 fetchDailyForecast만 교체한다.
import { Preferences } from '@capacitor/preferences'

export const WEATHER_CACHE_KEY = 'ojjeom.weather.v1'
export const SEOUL = { latitude: 37.5665, longitude: 126.978 } as const

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'

export interface DayWeather {
  status: 'ok'
  date: string
  tMax: number
  tMin: number
  precipProbability: number
  windSpeed: number
}

export interface WeatherUnavailable {
  status: 'unavailable'
  reason: 'offline' | 'error'
}

export type WeatherState = DayWeather | WeatherUnavailable

export interface CachedWeather {
  date: string
  weather: DayWeather
}

/** 명세 §5.1 기온 구간표 → 두께 등급 0(최박)~7(최후) */
export function thicknessGrade(tMax: number): number {
  if (tMax >= 28) return 0
  if (tMax >= 23) return 1
  if (tMax >= 20) return 2
  if (tMax >= 17) return 3
  if (tMax >= 12) return 4
  if (tMax >= 9) return 5
  if (tMax >= 5) return 6
  return 7
}

const GRADE_ADVICE = [
  '반팔·린넨이 편한 날씨',
  '반팔이 편한 날씨',
  '긴팔 하나면 충분한 날씨',
  '얇은 겉옷이 있으면 좋은 날씨',
  '자켓·가디건이 필요한 날씨',
  '도톰한 겉옷이 필요한 날씨',
  '코트가 필요한 추위',
  '패딩이 필요한 강추위',
]

export function gradeAdvice(grade: number): string {
  return GRADE_ADVICE[Math.min(GRADE_ADVICE.length - 1, Math.max(0, grade))]
}

/** 일교차 10°C 이상이면 아우터 슬롯을 필수화한다 (명세 §5.1) */
export function needsOuter(weather: WeatherState): boolean {
  if (weather.status !== 'ok') return false
  return thicknessGrade(weather.tMax) >= 3 || weather.tMax - weather.tMin >= 10
}

export function isRainy(weather: WeatherState): boolean {
  return weather.status === 'ok' && weather.precipProbability >= 60
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function finiteAt(values: unknown, index: number): number | null {
  if (!Array.isArray(values)) return null
  const value = values[index]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** Open-Meteo daily 응답 → DayWeather. 필드가 하나라도 없으면 null (가짜 값을 만들지 않는다). */
export function parseForecast(payload: unknown, date: string): DayWeather | null {
  if (!payload || typeof payload !== 'object') return null
  const daily = (payload as { daily?: unknown }).daily
  if (!daily || typeof daily !== 'object') return null

  const table = daily as Record<string, unknown>
  const times = table.time
  if (!Array.isArray(times)) return null

  const index = times.indexOf(date)
  if (index < 0) return null

  const tMax = finiteAt(table.temperature_2m_max, index)
  const tMin = finiteAt(table.temperature_2m_min, index)
  if (tMax === null || tMin === null) return null

  return {
    status: 'ok',
    date,
    tMax: Math.round(tMax),
    tMin: Math.round(tMin),
    precipProbability: Math.max(0, Math.min(100, Math.round(finiteAt(table.precipitation_probability_max, index) ?? 0))),
    windSpeed: Math.max(0, Math.round(finiteAt(table.wind_speed_10m_max, index) ?? 0)),
  }
}

export function parseCache(raw: string | null): CachedWeather | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const value = parsed as Partial<CachedWeather>
    if (typeof value.date !== 'string') return null
    if (!value.weather || value.weather.status !== 'ok') return null
    if (typeof value.weather.tMax !== 'number' || typeof value.weather.tMin !== 'number') return null
    return { date: value.date, weather: value.weather }
  } catch {
    return null
  }
}

async function fetchDailyForecast(date: string, signal: AbortSignal): Promise<DayWeather | null> {
  const url = `${ENDPOINT}?latitude=${SEOUL.latitude}&longitude=${SEOUL.longitude}`
    + '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max'
    + '&timezone=Asia%2FSeoul&forecast_days=1'

  const response = await fetch(url, { signal })
  if (!response.ok) return null
  return parseForecast(await response.json(), date)
}

/**
 * 오늘 날씨를 가져온다. 같은 날 캐시가 있으면 재호출하지 않고,
 * 실패하면 unavailable을 반환한다 — 추정값을 만들어 채우지 않는다.
 */
export async function loadWeather(date = localDateKey(), timeoutMs = 6000): Promise<WeatherState> {
  try {
    const cached = parseCache((await Preferences.get({ key: WEATHER_CACHE_KEY })).value)
    if (cached && cached.date === date) return cached.weather
  } catch {
    // 캐시를 못 읽어도 네트워크로 계속 진행한다.
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { status: 'unavailable', reason: 'offline' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const weather = await fetchDailyForecast(date, controller.signal)
    if (!weather) return { status: 'unavailable', reason: 'error' }
    await Preferences.set({ key: WEATHER_CACHE_KEY, value: JSON.stringify({ date, weather }) })
    return weather
  } catch {
    return { status: 'unavailable', reason: 'error' }
  } finally {
    clearTimeout(timer)
  }
}
