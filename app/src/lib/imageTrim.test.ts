import { describe, expect, it } from 'vitest'
import { TRIM_MIN_AREA_RATIO, findContentBox } from './image'

/** 배경 위에 사각형 하나를 그린 가짜 픽셀 버퍼를 만든다. */
function frame(width: number, height: number, box: { x: number; y: number; w: number; h: number } | null) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let index = 0; index < width * height; index += 1) {
    data[index * 4] = 240
    data[index * 4 + 1] = 238
    data[index * 4 + 2] = 232
    data[index * 4 + 3] = 255
  }
  if (box) {
    for (let y = box.y; y < box.y + box.h; y += 1) {
      for (let x = box.x; x < box.x + box.w; x += 1) {
        const index = (y * width + x) * 4
        data[index] = 40
        data[index + 1] = 60
        data[index + 2] = 100
      }
    }
  }
  return data
}

describe('findContentBox', () => {
  it('배경 위의 옷 영역을 찾아 여백을 남기고 자른다', () => {
    const box = findContentBox(frame(200, 200, { x: 60, y: 50, w: 80, h: 100 }), 200, 200)
    expect(box).not.toBeNull()
    expect(box!.left).toBeLessThan(60)
    expect(box!.right).toBeGreaterThan(139)
    expect(box!.top).toBeLessThan(50)
  })

  it('배경만 있으면 자르지 않는다', () => {
    expect(findContentBox(frame(200, 200, null), 200, 200)).toBeNull()
  })

  it('너무 작게 잡히면 자르지 않는다', () => {
    const tiny = findContentBox(frame(200, 200, { x: 98, y: 98, w: 4, h: 4 }), 200, 200)
    expect(tiny).toBeNull()
    expect(TRIM_MIN_AREA_RATIO).toBe(0.25)
  })

  it('화면을 거의 채우면 그대로 둔다', () => {
    expect(findContentBox(frame(200, 200, { x: 1, y: 1, w: 198, h: 198 }), 200, 200)).toBeNull()
  })
})
