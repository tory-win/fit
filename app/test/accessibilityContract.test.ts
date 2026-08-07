import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function rgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [0, 2, 4].map(offset => Number.parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number]
}

function luminance(hex: string): number {
  const [red, green, blue] = rgb(hex).map(channel => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function contrast(foreground: string, background: string): number {
  const left = luminance(foreground)
  const right = luminance(background)
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05)
}

describe('접근성 색상 계약', () => {
  it('작은 보조 글자가 실제 카드 배경 모두에서 WCAG AA 대비를 지킨다', () => {
    const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
    const token = (name: string) => {
      const value = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1]
      if (!value) throw new Error(`missing color token: ${name}`)
      return value
    }
    const muted = token('ink-muted')

    for (const background of ['paper', 'paper-raised', 'paper-muted', 'el-soft']) {
      expect(contrast(muted, token(background)), `${background} contrast`).toBeGreaterThanOrEqual(4.5)
    }
  })
})
