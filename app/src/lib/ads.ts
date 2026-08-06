// 보상형 광고 — 기획서 M-2, docs/광고-커머스-연동.md
// 광고 단위 ID가 없으면 구글 공식 테스트 광고로 돌린다. 고객 화면에는 운영 구분을 노출하지 않는다.
// 실제로 광고가 재생되지 않으면 스타일패스를 주지 않는다.

import { AdMob, RewardAdPluginEvents, type AdMobRewardItem } from '@capacitor-community/admob'
import { Capacitor } from '@capacitor/core'

/** 구글이 공개한 iOS 보상형 테스트 단위 — 실계정 없이 SDK 동작을 검증할 때만 쓴다. */
export const TEST_REWARDED_UNIT_ID = 'ca-app-pub-3940256099942544/1712485313'

const configuredUnitId = import.meta.env.VITE_ADMOB_REWARDED_ID as string | undefined

export interface AdsState {
  /** 이 빌드에서 광고를 실제로 보여줄 수 있는가 */
  available: boolean
  /** 테스트 광고로 도는 중인가 — 진단용이며 고객 문구에는 노출하지 않는다. */
  testing: boolean
  reason?: string
}

/** 설정된 단위가 없으면 테스트 단위로 떨어진다. */
export function resolveUnitId(configured?: string): string {
  return configured?.trim() || TEST_REWARDED_UNIT_ID
}

/**
 * 개발 빌드에서는 실제 광고 단위 ID가 있어도 테스트 광고를 띄운다.
 * 심사 전에 자기 광고를 노출·클릭하면 AdMob 계정이 정지될 수 있다.
 */
export function resolveTesting(configured: string | undefined, dev: boolean): boolean {
  return !configured?.trim() || dev
}

export function adsUnitId(): string {
  return resolveUnitId(configuredUnitId)
}

export function isTestAds(): boolean {
  return resolveTesting(configuredUnitId, import.meta.env.DEV)
}

let initialised = false

export async function initializeAds(): Promise<AdsState> {
  if (!Capacitor.isNativePlatform()) {
    return { available: false, testing: isTestAds(), reason: 'iPhone 앱에서만 광고를 볼 수 있어요.' }
  }

  try {
    if (!initialised) {
      await AdMob.initialize({ initializeForTesting: isTestAds() })
      initialised = true
    }
    return { available: true, testing: isTestAds() }
  } catch (error) {
    return {
      available: false,
      testing: isTestAds(),
      reason: error instanceof Error ? error.message : '광고를 준비하지 못했어요.',
    }
  }
}

/**
 * 보상형 광고를 끝까지 본 경우에만 true 를 돌려준다.
 * 중간에 닫으면 보상 이벤트가 오지 않으므로 false 가 된다.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false

  let settled = false
  let settle: (rewarded: boolean) => void = () => undefined
  const result = new Promise<boolean>(resolve => {
    settle = rewarded => {
      if (settled) return
      settled = true
      resolve(rewarded)
    }
  })

  const [rewardedListener, dismissedListener, failedListener] = await Promise.all([
    AdMob.addListener(RewardAdPluginEvents.Rewarded, (_reward: AdMobRewardItem) => settle(true)),
    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => settle(false)),
    AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => settle(false)),
  ])
  const timeout = globalThis.setTimeout(() => settle(false), 5 * 60_000)

  try {
    await AdMob.prepareRewardVideoAd({
      adId: adsUnitId(),
      isTesting: isTestAds(),
    })
    void AdMob.showRewardVideoAd()
      .catch(() => settle(false))
    return await result
  } finally {
    globalThis.clearTimeout(timeout)
    await Promise.all([
      rewardedListener.remove(),
      dismissedListener.remove(),
      failedListener.remove(),
    ])
  }
}
