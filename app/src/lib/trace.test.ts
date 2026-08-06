import { describe, expect, it } from 'vitest'
import { TRACE_LIMIT, appendTrace, isDuplicate, parseTrace, sanitise, type TraceEvent } from './trace'

const event = (name: string, kind: TraceEvent['kind'] = 'nav', scope = 'home'): TraceEvent => ({
  at: '2026-07-26T09:00:00.000Z',
  kind,
  scope,
  name,
})

describe('sanitise', () => {
  it('이미지 데이터와 주소를 지운다', () => {
    expect(sanitise('실패 data:image/jpeg;base64,AAAA 뒤')).toBe('실패 [이미지] 뒤')
    expect(sanitise('capacitor://localhost/x.js 에서')).toBe('[주소] 에서')
  })

  it('길이를 200자로 자른다', () => {
    expect(sanitise('가'.repeat(400))).toHaveLength(200)
  })
})

describe('appendTrace', () => {
  it('최신이 앞이고 상한을 넘지 않는다', () => {
    let log: TraceEvent[] = []
    for (let index = 0; index < TRACE_LIMIT + 10; index += 1) log = appendTrace(log, event(`e${index}`))
    expect(log).toHaveLength(TRACE_LIMIT)
    expect(log[0].name).toBe(`e${TRACE_LIMIT + 9}`)
  })
})

describe('isDuplicate', () => {
  it('같은 화면 이동이 연달아 오면 중복으로 본다', () => {
    const log = [event('화면 열림')]
    expect(isDuplicate(log, event('화면 열림'))).toBe(true)
    expect(isDuplicate(log, event('화면 열림', 'nav', 'closet'))).toBe(false)
    expect(isDuplicate(log, event('버튼', 'action'))).toBe(false)
  })
})

describe('parseTrace', () => {
  it('깨진 기록을 걸러낸다', () => {
    expect(parseTrace(JSON.stringify([event('ok'), { at: 1 }]))).toHaveLength(1)
    expect(parseTrace('{broken')).toEqual([])
    expect(parseTrace(null)).toEqual([])
  })
})
