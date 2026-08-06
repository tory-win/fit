import { beforeEach, describe, expect, it, vi } from 'vitest'

const adMock = vi.hoisted(() => {
  const listeners = new Map<string, () => void>()
  return {
    listeners,
    prepare: vi.fn(async () => undefined),
    show: vi.fn(async () => undefined),
    initialize: vi.fn(async () => undefined),
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
    initialize: adMock.initialize,
    showRewardVideoAd: adMock.show,
  },
}))

async function loadAdsModule() {
  vi.resetModules()
  return import('./ads')
}

beforeEach(() => {
  adMock.listeners.clear()
  adMock.prepare.mockClear()
  adMock.show.mockClear()
  adMock.initialize.mockClear()
  adMock.remove.mockClear()
  vi.unstubAllEnvs()
})

describe('보상형 광고 설정', () => {
  const real = 'ca-app-pub-8548765525846726/4110998335'

  it('광고 단위 ID 가 없으면 구글 테스트 단위로 돈다', async () => {
    const { TEST_REWARDED_UNIT_ID, resolveUnitId } = await loadAdsModule()

    expect(resolveUnitId(undefined)).toBe(TEST_REWARDED_UNIT_ID)
    expect(resolveUnitId('  ')).toBe(TEST_REWARDED_UNIT_ID)
    expect(resolveUnitId(real)).toBe(real)
  })

  it('개발 빌드에서는 실제 ID 가 있어도 테스트 광고를 쓴다', async () => {
    const { resolveTesting } = await loadAdsModule()

    expect(resolveTesting(real, true)).toBe(true)
    expect(resolveTesting(real, false)).toBe(false)
    expect(resolveTesting(undefined, false)).toBe(true)
  })

  it('테스트 단위는 구글이 공개한 iOS 보상형 ID 다', async () => {
    const { TEST_REWARDED_UNIT_ID } = await loadAdsModule()

    expect(TEST_REWARDED_UNIT_ID).toBe('ca-app-pub-3940256099942544/1712485313')
  })

  it('운영 빌드에서 실광고 ID 가 없으면 광고 초기화를 차단한다', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_ADMOB_REWARDED_ID', '')
    const { initializeAds } = await loadAdsModule()

    await expect(initializeAds()).resolves.toEqual({
      available: false,
      testing: false,
      reason: '운영 광고 설정이 없어 광고를 표시할 수 없어요.',
    })
    expect(adMock.initialize).not.toHaveBeenCalled()
  })

  it('운영 빌드에서 실광고 ID 가 없으면 보상형 광고 표시를 차단한다', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_ADMOB_REWARDED_ID', '')
    const { showRewardedAd } = await loadAdsModule()

    await expect(showRewardedAd()).resolves.toBe(false)
    expect(adMock.prepare).not.toHaveBeenCalled()
    expect(adMock.show).not.toHaveBeenCalled()
  })

  it('광고 창이 열렸다는 사실만으로 보상을 주지 않는다', async () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_ADMOB_REWARDED_ID', '')
    const { TEST_REWARDED_UNIT_ID, showRewardedAd } = await loadAdsModule()

    const result = showRewardedAd()
    await vi.waitFor(() => expect(adMock.prepare).toHaveBeenCalledWith({ adId: TEST_REWARDED_UNIT_ID, isTesting: true }))
    await vi.waitFor(() => expect(adMock.show).toHaveBeenCalledOnce())
    adMock.listeners.get('Dismissed')?.()

    await expect(result).resolves.toBe(false)
  })

  it('보상 완료 이벤트가 온 경우에만 생성 권한을 준다', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_ADMOB_REWARDED_ID', real)
    const { showRewardedAd } = await loadAdsModule()

    const result = showRewardedAd()
    await vi.waitFor(() => expect(adMock.show).toHaveBeenCalledOnce())
    adMock.listeners.get('Rewarded')?.()

    await expect(result).resolves.toBe(true)
  })
})
