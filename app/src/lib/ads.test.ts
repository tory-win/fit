import { beforeEach, describe, expect, it, vi } from 'vitest'

const adMock = vi.hoisted(() => {
  const listeners = new Map<string, () => void>()
  return {
    listeners,
    prepare: vi.fn(async () => undefined),
    show: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
  }
})

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
}))

vi.mock('@capacitor-community/admob', () => ({
  RewardAdPluginEvents: {
    Rewarded: 'Rewarded',
    Dismissed: 'Dismissed',
    FailedToShow: 'FailedToShow',
  },
  AdMob: {
    addListener: vi.fn(async (event: string, callback: () => void) => {
      adMock.listeners.set(event, callback)
      return { remove: adMock.remove }
    }),
    prepareRewardVideoAd: adMock.prepare,
    showRewardVideoAd: adMock.show,
  },
}))

import { TEST_REWARDED_UNIT_ID, resolveTesting, resolveUnitId, showRewardedAd } from './ads'

beforeEach(() => {
  adMock.listeners.clear()
  adMock.prepare.mockClear()
  adMock.show.mockClear()
  adMock.remove.mockClear()
})

describe('보상형 광고 설정', () => {
  const real = 'ca-app-pub-8548765525846726/4110998335'

  it('광고 단위 ID 가 없으면 구글 테스트 단위로 돈다', () => {
    expect(resolveUnitId(undefined)).toBe(TEST_REWARDED_UNIT_ID)
    expect(resolveUnitId('  ')).toBe(TEST_REWARDED_UNIT_ID)
    expect(resolveUnitId(real)).toBe(real)
  })

  it('개발 빌드에서는 실제 ID 가 있어도 테스트 광고를 쓴다', () => {
    expect(resolveTesting(real, true)).toBe(true)
    expect(resolveTesting(real, false)).toBe(false)
    expect(resolveTesting(undefined, false)).toBe(true)
  })

  it('테스트 단위는 구글이 공개한 iOS 보상형 ID 다', () => {
    expect(TEST_REWARDED_UNIT_ID).toBe('ca-app-pub-3940256099942544/1712485313')
  })

  it('광고 창이 열렸다는 사실만으로 보상을 주지 않는다', async () => {
    const result = showRewardedAd()
    await vi.waitFor(() => expect(adMock.show).toHaveBeenCalledOnce())
    adMock.listeners.get('Dismissed')?.()

    await expect(result).resolves.toBe(false)
  })

  it('보상 완료 이벤트가 온 경우에만 생성 권한을 준다', async () => {
    const result = showRewardedAd()
    await vi.waitFor(() => expect(adMock.show).toHaveBeenCalledOnce())
    adMock.listeners.get('Rewarded')?.()

    await expect(result).resolves.toBe(true)
  })
})
