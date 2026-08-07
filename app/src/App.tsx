import { useEffect, useMemo, useRef, useState } from 'react'
import { AppLauncher } from '@capacitor/app-launcher'
import { Camera as NativeCamera, CameraDirection, EncodingType, MediaTypeSelection, type MediaResult } from '@capacitor/camera'
import { CameraPreview } from '@capacitor-community/camera-preview'
import { Capacitor, type PermissionState } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import {
  AlertCircle,
  Bell,
  BookOpen,
  Camera as CameraIcon,
  CameraOff,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Download,
  Compass,
  Clock3,
  Hash,
  Images,
  Info,
  LayoutGrid,
  LoaderCircle,
  Lock,
  MoonStar,
  Palette,
  PencilLine,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  ShoppingBag,
  Shirt,
  Sparkles,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Undo2,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import './App.css'
import './App.polish.css'
import {
  CLOSET_CATEGORIES,
  CLOSET_COLORS,
  CLOSET_FITS,
  CLOSET_SEASONS,
  isDraftComplete,
  loadClosetItems,
  loadTrashItems,
  moveToTrash,
  purgeFromTrash,
  restoreFromTrash,
  saveClosetDrafts,
  trashDaysLeft,
  wipeCloset,
  type ClosetCategory,
  type ClosetColor,
  type ClosetDraft,
  type ClosetFit,
  type ClosetItem,
  type ClosetSeason,
  type ClosetSource,
} from './lib/closet'
import { Filesystem } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'
import { prepareClosetImage, type PreparedImage } from './lib/image'
import {
  BODY_PHOTO_CONSENTS,
  deleteBodyPhoto,
  isConsentComplete,
  loadBodyPhoto,
  readBodyPhotoBase64,
  saveBodyPhoto,
  type BodyPhoto,
} from './lib/bodyPhoto'
import {
  deleteTryonImage,
  deleteTryonImages,
  loadTryonImages,
  outfitKeyOf,
  recordTryonView,
  saveTryonImage,
  type TryonImage,
} from './lib/tryon'
import { generateTryon, probeTryonService } from './lib/tryonService'
import { initializeAds, isTestAds, showRewardedAd, type AdsState } from './lib/ads'
import { PARTNERS_DISCLOSURE, isPartnersReady, partnersUrl } from './lib/partners'
import { needsTryonMonetization, type TryonRequest } from './lib/tryonGate'
import {
  CLOSET_SORTS,
  CLOSET_SORT_LABEL,
  CLOSET_SOURCE_LABEL,
  EMPTY_CLOSET_QUERY,
  activeFilterCount,
  applyClosetQuery,
  categoryCounts,
  toggleValue,
  wearCounts,
  type ClosetQuery,
} from './lib/closetFilter'
import { readDeviceImageBase64 } from './lib/deviceImage'
import {
  EMPTY_TASTE,
  TASTE_COLOR_TONES,
  TASTE_COVERAGE,
  TASTE_KEY,
  TASTE_MOODS,
  TASTE_SILHOUETTES,
  hasTaste,
  parseTaste,
  tasteReason,
  type TasteMood,
  type TastePreference,
} from './lib/taste'
import {
  clearTrace,
  setTraceEnabled,
} from './lib/trace'
import {
  initTracer,
  resetTracer,
  setTracerEnabled,
  trace,
  traceError,
} from './lib/tracer'
import {
  applyBackup,
  createBackup,
  readBackup,
  summarise,
  writeBackupFile,
  type BackupManifest,
  type BackupSummary,
  type ImportMode,
} from './lib/backup'
import {
  TRUE_SOLAR_OFFSET_MINUTES,
  birthDayPillar,
  birthPillars,
  fortuneFor,
  hourBoundaryMinutes,
  type DayFortune,
  type Element,
} from './lib/saju'
import {
  BODY_BALANCES,
  BODY_CHIPS,
  EMPTY_BODY,
  FIT_PREFERENCE_LABEL,
  FIT_PREFERENCES,
  TOP_SIZES,
  WAIST_LINES,
  deriveBodyShape,
  hasBodySignal,
  parseBodyProfile,
  type BodyBalance,
  type BodyChip,
  type FitPreference,
  type BodyProfile,
  type TopSize,
  type WaistLine,
} from './lib/body'
import {
  gradeAdvice,
  loadWeather,
  localDateKey,
  thicknessGrade,
  WEATHER_CACHE_KEY,
  type WeatherState,
} from './lib/weather'
import {
  OUTFIT_SLOTS,
  alternativeOutfits,
  gapMessage,
  recommend,
  targetGrade,
  type Outfit,
  type OutfitSlot,
  type RecommendResult,
} from './lib/recommend'
import {
  OUTFIT_LOG_KEY,
  entryForDate,
  historyFrom,
  loadOutfitLog,
  saveOutfitLog,
  upsertEntry,
  wearCount,
  type OutfitEntry,
} from './lib/outfitLog'
import {
  addCredits,
  loadGate,
  openOutfit,
  removeGate,
  saveGate,
  withWelcome,
  type GateState,
} from './lib/gate'
import {
  ensureWelcomePass,
  grantPass,
  isPassActive,
  remainingLabel,
  savePass,
  PASS_KEY,
  type PassReason,
  type StylePass,
} from './lib/pass'
import {
  dailyReadingOf,
  domainDetail,
  domainFortunes,
  luckyInfoOf,
  type DomainFortune,
  type FortuneDomain,
} from './lib/fortuneDetail'
import {
  EMPTY_BIAS,
  FEEDBACK_REASONS,
  applyFeedback,
  clearBias,
  loadBias,
  saveBias,
  shouldAskFeedback,
  type FeedbackReason,
  type FeedbackVerdict,
  type PersonalBias,
} from './lib/feedback'
import {
  DEFAULT_MORNING_NOTIFICATION,
  cancelMorningNotification,
  checkMorningNotificationPermission,
  listenForNotification,
  loadMorningNotification,
  loadEveningNotification,
  saveEveningNotification,
  scheduleEveningNotification,
  cancelEveningNotification,
  removeEveningNotificationSettings,
  updateEveningNotification,
  DEFAULT_EVENING_NOTIFICATION,
  EVENING_NOTIFICATION_KIND,
  MORNING_NOTIFICATION_KIND,
  morningTimeLabel,
  morningTimeValue,
  parseMorningTime,
  removeMorningNotificationSettings,
  requestMorningNotificationPermission,
  saveMorningNotification,
  scheduleMorningNotification,
  updateMorningNotification,
  type MorningNotificationSettings,
} from './lib/morningNotification'
import {
  daysInBirthMonth,
  isValidBirthDate,
  type BirthInput,
} from './lib/profile'
import { FEATURES } from './lib/appEnv'
import { PRE_TRYON_MAX_GARMENTS, isPreTryonKey, mergeGarments, preTryonKey } from './lib/preTryon'
import { onboardingPlan, type OnboardingPlan } from './lib/onboardingFlow'

interface Profile extends BirthInput {
  body: BodyProfile
}

type TabRoute = 'home' | 'closet' | 'fortune' | 'stylebook' | 'my'
type Route = TabRoute | 'add' | 'camera' | 'review' | 'alternatives' | 'body' | 'profile' | 'item' | 'trash'
  | 'photo' | 'tryon' | 'data' | 'fortuneDetail' | 'taste' | 'shopTryon'
type AlbumMode = 'new' | 'append' | 'replace'
type ShopGarment = PreparedImage & { category: ClosetCategory }

interface Confirm {
  title: string
  message: string
  action: string
  destructive: boolean
  run: () => void
}

interface Notice {
  title: string
  message: string
  settings?: boolean
}

type MorningPermission = PermissionState | 'checking' | 'unsupported'

const PROFILE_KEY = 'ojjeom.profile.v1'
const LAST_ROUTE_KEY = 'ojjeom.route.v1'
const CAMERA_TIPS_KEY = 'ojjeom.cameraTips.v1'
/** 촬영·확인처럼 임시 상태가 필요한 화면은 복원하지 않는다 — M8-기획.md §3.2 */
const RESTORABLE_ROUTES: Route[] = (['home', 'closet', 'fortune', 'stylebook', 'my'] as Route[])
  .filter(route => FEATURES.saju || route !== 'fortune')
const FIRST_RUN_KEY = 'ojjeom.firstRun.v1'
/** 가치 소개 · (생년월일: stage만) · 체형 · 첫 옷 등록 · (iOS만) 알림 */
const ONBOARDING_POINTS = [
  // M10 피벗 — 옷장 코디에 더해 "사기 전에 입어봄"이 동급 가치다
  { icon: Shirt, title: '내 옷장도, 사려는 옷도', body: '가진 옷으로 오늘 코디를 고르고, 살까 말까 한 옷은 사기 전에 미리 입어봐요.' },
  FEATURES.saju
    ? { icon: Sparkles, title: '오늘의 기운과 날씨', body: '사주·날씨·체형을 함께 봐서 오늘 입을 한 벌을 정해요.' }
    : { icon: Sparkles, title: '오늘의 날씨와 체형', body: '날씨와 체형을 함께 봐서 오늘 입을 한 벌을 정해요.' },
  { icon: ShieldCheck, title: '내가 고른 사진만', body: '사진은 평소 이 기기에 보관하고, 입어보기를 실행할 때 선택한 사진만 생성에 사용해요.' },
] as const
/** 스파이크에서 통과한 조합은 상·하의 동시까지다 — 트라이온_스파이크.md §0.2 */
const OUTFIT_TRYON_SLOTS = ['상의', '하의'] as const
const MAX_CAPTURE_COUNT = 4
/** 조합이 풍부해지는 기준 — 코디 자체는 한 벌부터 만든다 */
const OUTFIT_RICH_COUNT = 5
const OUTFIT_READY_COUNT = 1
const CAMERA_CATEGORIES: ClosetCategory[] = ['상의', '하의', '아우터', '신발', '가방', '기타']
const CLOSET_FIT_LABEL: Record<ClosetFit, string> = {
  slim: '슬림핏',
  regular: '레귤러핏',
  relaxed: '여유핏',
}

const ACCENT: Record<Element, { el: string; deep: string; soft: string }> = {
  목: { el: '#2e6b4f', deep: '#1d4a35', soft: '#dce8dc' },
  화: { el: '#a23a2e', deep: '#7c2a1e', soft: '#f0ddd7' },
  토: { el: '#b07d2e', deep: '#7c5620', soft: '#efe4cd' },
  금: { el: '#5f5d55', deep: '#494740', soft: '#e4e2dc' },
  수: { el: '#2c3a52', deep: '#1d2839', soft: '#dde2ea' },
}

/** 오행색은 stage의 운세 콘텐츠 안에서만 쓴다. 앱 셸과 핵심 CTA는 real과 같은 입핏 녹색을 유지한다. */
function fortuneAccent(element: Element): React.CSSProperties {
  const accent = ACCENT[element]
  return {
    '--el': accent.el,
    '--el-deep': accent.deep,
    '--el-soft': accent.soft,
  } as React.CSSProperties
}

/** real 온보딩은 생년월일을 받지 않는다 — 가짜 날짜 대신 명시적 미입력(0,0,0)으로 저장한다. M9-기획.md §4 */
const UNSET_BIRTH: BirthInput = { name: '', y: 0, m: 0, d: 0 }

function hasBirth(profile: Profile): boolean {
  return isValidBirthDate(profile)
}

function parseStoredProfile(raw: string | null): Profile | null {
  try {
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Profile>
    const birthUnset = parsed.y === 0 && parsed.m === 0 && parsed.d === 0
    if (!birthUnset && !isValidBirthDate(parsed)) return null
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      y: parsed.y as number,
      m: parsed.m as number,
      d: parsed.d as number,
      hour: !birthUnset && typeof parsed.hour === 'number' ? parsed.hour : undefined,
      body: parseBodyProfile(parsed.body),
    }
  } catch {
    return null
  }
}

function loadProfile(): Profile | null {
  return parseStoredProfile(localStorage.getItem(PROFILE_KEY))
}

function makeDraftId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isCancellation(error: unknown): boolean {
  return /cancel|취소/i.test(errorMessage(error))
}

// 네이티브 미리보기 플러그인은 start()마다 새 백그라운드 큐에서 AVCaptureSession을
// 구성한다. 두 start()가 겹치면 addInput:이 잡을 수 없는 예외를 던져 앱이 종료되므로
// 모든 start/stop을 하나의 체인으로 직렬화한다.
let cameraPreviewQueue: Promise<unknown> = Promise.resolve()

function withCameraPreview<T>(task: () => Promise<T>): Promise<T> {
  const next = cameraPreviewQueue.then(task, task)
  cameraPreviewQueue = next.catch(() => undefined)
  return next
}

async function stopCameraPreview(): Promise<void> {
  try {
    const running = await CameraPreview.isCameraStarted()
    if (running.value) await CameraPreview.stop()
  } catch {
    // 실행 중인 미리보기가 없는 것도 정상 상태다.
  }
}

/**
 * 사진 결과를 캔버스에 그릴 수 있는 소스로 바꾼다.
 *
 * `capacitor://` 파일 URL 을 그대로 쓰면, 웹을 원격에서 받아오는 연결형 빌드에서
 * 캔버스가 교차 출처로 오염돼 `toDataURL()` 이 SecurityError 로 죽는다.
 * 그래서 파일 시스템으로 직접 읽어 data URL 로 만든다.
 */
async function mediaSource(result: MediaResult): Promise<string> {
  const mime = result.metadata?.format === 'png' ? 'image/png' : 'image/jpeg'

  if (result.uri) {
    try {
      const file = await Filesystem.readFile({ path: result.uri })
      if (typeof file.data === 'string') return `data:${mime};base64,${file.data}`
      return await blobToDataUrl(file.data)
    } catch {
      // 파일을 못 읽으면 아래 경로로 떨어진다.
    }
  }

  if (result.webPath) return result.webPath
  if (result.thumbnail) return `data:${mime};base64,${result.thumbnail}`
  throw new Error('선택한 사진을 읽지 못했어요.')
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('사진을 읽지 못했어요.'))
    reader.readAsDataURL(blob)
  })
}

async function openExternalUrl(url: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    const opened = window.open(url, '_blank')
    if (!opened) return false
    opened.opener = null
    return true
  }

  return (await AppLauncher.openUrl({ url })).completed
}

async function draftFromSource(
  imageSource: string,
  source: ClosetSource,
  category: ClosetCategory | '' = '',
): Promise<ClosetDraft> {
  const prepared = await prepareClosetImage(imageSource, { trim: true })
  return {
    id: makeDraftId(),
    previewUrl: prepared.dataUrl,
    jpegBase64: prepared.base64,
    ...(prepared.trimmed && prepared.original
      ? { trimmed: true, originalUrl: prepared.original.dataUrl, originalBase64: prepared.original.base64 }
      : {}),
    source,
    category,
    color: '',
    seasons: [],
    fit: '',
  }
}

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(loadProfile)
  const [profileReady, setProfileReady] = useState(!Capacitor.isNativePlatform())
  const [route, setRoute] = useState<Route>(() => {
    try {
      const saved = sessionStorage.getItem(LAST_ROUTE_KEY) as Route | null
      return saved && RESTORABLE_ROUTES.includes(saved) ? saved : 'home'
    } catch {
      return 'home'
    }
  })
  const routeRef = useRef<Route>('home')
  const [closet, setCloset] = useState<ClosetItem[]>([])
  const [closetLoading, setClosetLoading] = useState(true)
  const [drafts, setDrafts] = useState<ClosetDraft[]>([])
  const [uploadCategory, setUploadCategory] = useState<ClosetCategory>('상의')
  const [photosLimited, setPhotosLimited] = useState(false)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [toast, setToast] = useState('')

  const [weather, setWeather] = useState<WeatherState>({ status: 'unavailable', reason: 'error' })
  const [pass, setPass] = useState<StylePass | null>(null)
  const [outfitLog, setOutfitLog] = useState<OutfitEntry[]>([])
  const [gateOpen, setGateOpen] = useState(false)
  const [gate, setGate] = useState<GateState>({ date: '', outfitUnlocked: false, credits: 0 })
  const [clock, setClock] = useState(() => new Date())
  const [bias, setBias] = useState<PersonalBias>(EMPTY_BIAS)
  const [taste, setTaste] = useState<TastePreference>(EMPTY_TASTE)
  const [trash, setTrash] = useState<ClosetItem[]>([])
  const [openItemId, setOpenItemId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [openDomain, setOpenDomain] = useState<FortuneDomain | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [morningSettings, setMorningSettings] = useState<MorningNotificationSettings>(
    DEFAULT_MORNING_NOTIFICATION,
  )
  const [morningPermission, setMorningPermission] = useState<MorningPermission>(
    Capacitor.isNativePlatform() ? 'checking' : 'unsupported',
  )
  const [morningBusy, setMorningBusy] = useState(false)
  const [eveningSettings, setEveningSettings] = useState<MorningNotificationSettings>(
    DEFAULT_EVENING_NOTIFICATION,
  )
  const [eveningBusy, setEveningBusy] = useState(false)

  const [firstRun, setFirstRun] = useState<'body' | 'closet' | 'notify' | null>(null)
  const [bodyPhoto, setBodyPhoto] = useState<BodyPhoto | null>(null)
  const [photoDraft, setPhotoDraft] = useState<PreparedImage | null>(null)
  const [photoReturnRoute, setPhotoReturnRoute] = useState<Route>('my')
  const [tryonAvailable, setTryonAvailable] = useState(false)
  // 상품 원본은 화면 상태로만 들고, 완성된 입어보기 결과만 스타일북에 저장한다.
  const [shopGarments, setShopGarments] = useState<ShopGarment[]>([])
  const [shopResultKey, setShopResultKey] = useState<string | null>(null)
  const [shopBusy, setShopBusy] = useState(false)
  const [shopError, setShopError] = useState('')
  const [tryonImages, setTryonImages] = useState<TryonImage[]>([])
  const [tryonOutfitId, setTryonOutfitId] = useState<string | null>(null)
  const [pendingTryon, setPendingTryon] = useState<TryonRequest | null>(null)
  const [paidTryonRetry, setPaidTryonRetry] = useState<TryonRequest | null>(null)
  const [ads, setAds] = useState<AdsState>({ available: false, testing: isTestAds() })
  const [chargeBusy, setChargeBusy] = useState('')
  const [backupBusy, setBackupBusy] = useState('')
  const [backupSaved, setBackupSaved] = useState('')
  const [importPreview, setImportPreview] = useState<
    { parsed: { manifest: BackupManifest; files: Record<string, Uint8Array> }; summary: BackupSummary } | null
  >(null)
  const [tryonBusy, setTryonBusy] = useState(false)
  const [tryonError, setTryonError] = useState('')
  const firstRunPlan = onboardingPlan(FEATURES.saju, morningPermission !== 'unsupported')

  const openBodyPhoto = (returnRoute: Route) => {
    setPhotoReturnRoute(returnRoute)
    setRoute('photo')
  }

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let active = true
    const localProfile = loadProfile()
    Preferences.get({ key: PROFILE_KEY })
      .then(async ({ value }) => {
        const nativeProfile = parseStoredProfile(value)
        const resolved = nativeProfile ?? localProfile
        if (!nativeProfile && localProfile) {
          await Preferences.set({ key: PROFILE_KEY, value: JSON.stringify(localProfile) })
        }
        if (nativeProfile) {
          localStorage.setItem(PROFILE_KEY, JSON.stringify(nativeProfile))
        }
        if (active) setProfile(resolved)
      })
      .catch(() => {
        if (active) setProfile(localProfile)
      })
      .finally(() => {
        if (active) setProfileReady(true)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    loadClosetItems()
      .then(items => {
        if (active) setCloset(items)
      })
      .catch(() => {
        if (active) {
          setNotice({
            title: '옷장을 불러오지 못했어요',
            message: '앱을 다시 열어도 계속되면 저장 공간을 확인해 주세요.',
          })
        }
      })
      .finally(() => {
        if (active) setClosetLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // 스플래시는 첫 화면이 준비된 뒤에 내린다 — 웹이 뜨는 동안의 흰 화면을 없앤다.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let hidden = false
    const hide = () => {
      if (hidden) return
      hidden = true
      void SplashScreen.hide({ fadeOutDuration: 220 }).catch(() => undefined)
    }

    // 연결형 개발 빌드에서 원격 웹이 늦게 오더라도 스플래시에 갇히지 않게 한다.
    const failsafe = setTimeout(hide, 3_000)
    if (profileReady) hide()

    return () => clearTimeout(failsafe)
  }, [profileReady])

  // 보상형 광고 SDK — 실패해도 게이트의 다른 수단은 그대로 쓴다.
  useEffect(() => {
    let active = true
    void initializeAds().then(state => {
      if (active) setAds(state)
    })
    return () => {
      active = false
    }
  }, [])

  // 행동·오류 추적 — 사용자가 겪은 일을 그대로 남긴다 (개인정보 제외)
  useEffect(() => {
    let active = true

    void initTracer().then(() => {
      if (!active) return
      trace('nav', 'app', '앱 시작', { platform: Capacitor.getPlatform() })
    }).catch(() => undefined)

    const onError = (event: ErrorEvent) => {
      traceError(routeRef.current, event.message)
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      traceError(routeRef.current, event.reason)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      active = false
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  // 화면 이동을 남긴다 — "자꾸 홈으로 간다" 같은 제보를 기록으로 확인하려고.
  useEffect(() => {
    trace('nav', route, '화면 열림')
  }, [route])

  // 기존 사용자는 첫 실행 흐름을 다시 보지 않는다 — 플래그가 없으면 완료로 기록한다
  useEffect(() => {
    let active = true
    void Preferences.get({ key: FIRST_RUN_KEY }).then(async ({ value }) => {
      if (!active || value) return
      await Preferences.set({ key: FIRST_RUN_KEY, value: 'done' })
    }).catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  // 전신 사진과 사용자가 지우기 전까지 보관하는 착장 이미지 — M6-기획.md §4.1
  useEffect(() => {
    let active = true
    const dateKey = localDateKey()

    void loadBodyPhoto().then(photo => {
      if (active) setBodyPhoto(photo)
    }).catch(() => undefined)
    void loadTryonImages(dateKey).then(images => {
      if (!active) return
      setTryonImages(images)
      const latestShop = images.find(image => image.kind === 'shop' || isPreTryonKey(image.outfitKey))
      setShopResultKey(latestShop?.outfitKey ?? null)
    }).catch(() => undefined)
    void probeTryonService().then(available => {
      if (active) setTryonAvailable(available)
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    void loadWeather().then(result => {
      if (active) setWeather(result)
    })
    void loadOutfitLog().then(entries => {
      if (active) setOutfitLog(entries)
    })
    void ensureWelcomePass().then(granted => {
      if (active) setPass(granted)
    })
    void loadGate(localDateKey()).then(async loaded => {
      const welcomed = withWelcome(loaded, localDateKey())
      if (welcomed !== loaded) await saveGate(welcomed)
      if (active) setGate(welcomed)
    }).catch(() => undefined)
    void loadBias().then(loaded => {
      if (active) setBias(loaded)
    })
    void Preferences.get({ key: TASTE_KEY }).then(({ value }) => {
      if (active) setTaste(parseTaste(value))
    }).catch(() => undefined)
    void loadTrashItems().then(items => {
      if (active) setTrash(items)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    void (async () => {
      const saved = await loadMorningNotification()
      if (!active) return

      if (!Capacitor.isNativePlatform()) {
        setMorningSettings(saved)
        setEveningSettings(await loadEveningNotification())
        setMorningPermission('unsupported')
        return
      }

      const permission = await checkMorningNotificationPermission()
      if (!active) return

      const reconciled = saved.enabled && permission !== 'granted'
        ? { ...saved, enabled: false }
        : saved

      if (reconciled.enabled !== saved.enabled) {
        await saveMorningNotification(reconciled)
      }

      if (reconciled.enabled && permission === 'granted') {
        try {
          await scheduleMorningNotification(reconciled)
        } catch {
          const disabled = { ...reconciled, enabled: false }
          await cancelMorningNotification().catch(() => undefined)
          await saveMorningNotification(disabled).catch(() => undefined)
          if (!active) return
          setMorningSettings(disabled)
          setMorningPermission(permission)
          setNotice({
            title: '아침 알림을 다시 예약하지 못했어요',
            message: '알림을 꺼 두었어요. 마이에서 다시 켜 주세요.',
          })
          return
        }
      }

      setMorningSettings(reconciled)
      setMorningPermission(permission)

      // 저녁 피드백 알림도 같은 권한을 쓴다 — 권한이 없으면 꺼진 상태로 맞춘다.
      const evening = await loadEveningNotification()
      if (!active) return
      const eveningReconciled = evening.enabled && permission !== 'granted'
        ? { ...evening, enabled: false }
        : evening
      if (eveningReconciled.enabled !== evening.enabled) {
        await saveEveningNotification(eveningReconciled)
      }
      if (eveningReconciled.enabled && permission === 'granted') {
        await scheduleEveningNotification(eveningReconciled).catch(() => undefined)
      }
      if (active) setEveningSettings(eveningReconciled)
    })().catch(() => {
      if (!active) return
      setMorningPermission(Capacitor.isNativePlatform() ? 'prompt' : 'unsupported')
      setNotice({
        title: '아침 알림을 확인하지 못했어요',
        message: '저장된 시간은 그대로예요. 마이에서 알림을 다시 켜 주세요.',
      })
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let active = true
    let removeListener: (() => Promise<void>) | undefined

    void listenForNotification(
      [MORNING_NOTIFICATION_KIND, EVENING_NOTIFICATION_KIND],
      () => setRoute('home'),
    )
      .then(handle => {
        if (active) {
          removeListener = () => handle.remove()
        } else {
          void handle.remove()
        }
      })
      .catch(() => undefined)

    return () => {
      active = false
      if (removeListener) void removeListener()
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  /** real은 사주 없이 돈다. stage에서도 생년월일 미입력(real에서 만든 프로필)이면 계산하지 않는다. */
  const fortune: DayFortune | null = useMemo(
    () => (FEATURES.saju && profile && hasBirth(profile) ? fortuneFor(profile) : null),
    [profile],
  )
  const history = useMemo(() => historyFrom(outfitLog), [outfitLog])
  const today = localDateKey(clock)
  const todayEntry = useMemo(() => entryForDate(outfitLog, today), [outfitLog, today])

  const recommendation: RecommendResult | null = useMemo(() => {
    if (!profile || closet.length < OUTFIT_READY_COUNT) return null
    return recommend({ closet, fortune, weather, body: profile.body, history, bias, taste })
  }, [profile, fortune, closet, weather, history, bias, taste])

  /** 옷장 아이템 상세에서 부른 코디 — 그 옷을 반드시 넣는다 (M7 G-11) */
  const pinnedRecommendation: RecommendResult | null = useMemo(() => {
    if (!pinnedId || !profile || closet.length < OUTFIT_READY_COUNT) return null
    return recommend({ closet, fortune, weather, body: profile.body, history, bias, taste, pinnedId })
  }, [pinnedId, profile, fortune, closet, weather, history, bias, taste])

  routeRef.current = route
  // 앱이 다시 뜨거나 개발 중 새로고침돼도 보던 탭으로 돌아온다 — M8-기획.md §3.2
  useEffect(() => {
    try {
      if (RESTORABLE_ROUTES.includes(route)) sessionStorage.setItem(LAST_ROUTE_KEY, route)
    } catch {
      // 저장 공간을 못 쓰면 복원을 포기한다. 기능에는 영향이 없다.
    }
  }, [route])

  /** 꺼진 기능의 화면으로 들어와도 홈으로 돌린다 — M9-기획.md §3, M10-기획.md §2 */
  useEffect(() => {
    if (!FEATURES.saju && (route === 'fortune' || route === 'fortuneDetail' || route === 'profile')) {
      setRoute('home')
    }
    if (!FEATURES.preTryon && route === 'shopTryon') {
      setRoute('home')
    }
  }, [route])

  /** 코디는 열람권으로, 운세 상세는 2시간 패스로 나뉜다 — lib/gate.ts */
  const unlocked = gate.date === today && gate.outfitUnlocked
  const fortunePass = isPassActive(pass, clock)
  const domains: DomainFortune[] = useMemo(
    () => (profile && fortune ? domainFortunes(fortune, profile) : []),
    [profile, fortune],
  )
  const openItem = useMemo(() => closet.find(item => item.id === openItemId) ?? null, [closet, openItemId])
  const bestOutfit = recommendation?.status === 'ok' ? recommendation.outfits[0] ?? null : null
  const bestTryonImage = bestOutfit
    ? tryonImages.find(image => image.outfitKey === outfitKeyOf(bestOutfit.items.map(item => item.id))) ?? null
    : null
  const tryonOutfits = recommendation?.status === 'ok' ? recommendation.outfits : []
  const tryonOutfit = tryonOutfits.find(outfit => outfit.id === tryonOutfitId) ?? tryonOutfits[0] ?? null

  const confirmedItems = useMemo(() => {
    if (!todayEntry) return []
    return todayEntry.itemIds
      .map(id => closet.find(item => item.id === id))
      .filter((item): item is ClosetItem => Boolean(item))
  }, [todayEntry, closet])
  const currentHomeItems = confirmedItems.length > 0 ? confirmedItems : (bestOutfit?.items ?? [])
  const homeAlternatives = recommendation?.status === 'ok'
    ? alternativeOutfits(recommendation.outfits, currentHomeItems)
    : []
  const alternativeRouteOutfits = pinnedId
    ? (pinnedRecommendation?.status === 'ok' ? pinnedRecommendation.outfits : null)
    : (recommendation?.status === 'ok' ? homeAlternatives : null)

  const openCamera = (category: ClosetCategory = uploadCategory) => {
    setUploadCategory(category)
    setDrafts([])
    setRoute('camera')
  }

  const importAlbum = async (
    mode: AlbumMode = 'new',
    replaceIndex?: number,
    category: ClosetCategory = uploadCategory,
  ) => {
    if (mode === 'new') setUploadCategory(category)
    const available = mode === 'append' ? MAX_CAPTURE_COUNT - drafts.length : MAX_CAPTURE_COUNT
    if (available <= 0) {
      setToast('한 번에 최대 4벌까지 확인할 수 있어요.')
      return
    }

    setBusy('앨범을 여는 중…')
    try {
      const media = await NativeCamera.chooseFromGallery({
        mediaType: MediaTypeSelection.Photo,
        allowMultipleSelection: mode !== 'replace',
        limit: mode === 'replace' ? 1 : available,
        includeMetadata: false,
        quality: 82,
        targetWidth: 1600,
        targetHeight: 1600,
        correctOrientation: true,
        webUseInput: true,
      })

      const selected = media.results.slice(0, mode === 'replace' ? 1 : available)
      if (selected.length === 0) return

      setBusy('사진을 안전하게 변환하는 중…')
      const prepared: ClosetDraft[] = []
      for (const result of selected) {
        prepared.push(await draftFromSource(await mediaSource(result), 'album', category))
      }

      if (mode === 'replace' && replaceIndex !== undefined) {
        setDrafts(current => current.map((draft, index) => (
          index === replaceIndex
            ? {
                ...prepared[0],
                category: draft.category,
                color: draft.color,
                seasons: draft.seasons,
                fit: draft.fit,
              }
            : draft
        )))
      } else if (mode === 'append') {
        setDrafts(current => [...current, ...prepared].slice(0, MAX_CAPTURE_COUNT))
      } else {
        setDrafts(prepared)
      }

      const permissions = await NativeCamera.checkPermissions()
      const limited = permissions.photos === 'limited'
      setPhotosLimited(limited)
      if (limited) {
        trace('result', 'album', '제한된 사진 접근')
        setNotice({
          title: '앨범이 좁게 보여요',
          message: '사진 접근이 "선택한 사진만"으로 되어 있어요. 설정에서 모든 사진을 허용하면 앨범·즐겨찾기·검색이 모두 보여요.',
          settings: true,
        })
      }
      setRoute('review')
    } catch (error) {
      if (!isCancellation(error)) {
        const denied = /denied|permission|권한/i.test(errorMessage(error))
        setNotice({
          title: denied ? '사진 접근이 필요해요' : '사진을 가져오지 못했어요',
          message: denied
            ? '설정에서 사진 접근을 허용하거나 카메라로 직접 촬영해 주세요.'
            : '사진은 그대로 남아 있어요. 잠시 후 다시 선택해 주세요.',
          settings: denied,
        })
      }
    } finally {
      setBusy('')
    }
  }

  // 전신 사진 — M6-기획.md §5.1. 동의 화면을 거치기 전에는 저장하지 않는다.
  const pickBodyPhoto = async (source: ClosetSource) => {
    setBusy(source === 'camera' ? '카메라를 여는 중…' : '앨범을 여는 중…')
    try {
      const media = source === 'camera'
        ? await NativeCamera.takePhoto({
            quality: 82,
            targetWidth: 1600,
            targetHeight: 1600,
            correctOrientation: true,
            encodingType: EncodingType.JPEG,
            saveToGallery: false,
            cameraDirection: CameraDirection.Rear,
            editable: 'no',
            includeMetadata: false,
            webUseInput: true,
          })
        : (await NativeCamera.chooseFromGallery({
            mediaType: MediaTypeSelection.Photo,
            allowMultipleSelection: false,
            limit: 1,
            includeMetadata: false,
            quality: 82,
            targetWidth: 1600,
            targetHeight: 1600,
            correctOrientation: true,
            webUseInput: true,
          })).results[0]

      if (!media) return
      setBusy('사진을 안전하게 변환하는 중…')
      setPhotoDraft(await prepareClosetImage(await mediaSource(media)))
    } catch (error) {
      if (!isCancellation(error)) {
        setNotice({
          title: '사진을 가져오지 못했어요',
          message: '다른 사진으로 다시 시도해 주세요. 저장된 정보는 그대로예요.',
        })
      }
    } finally {
      setBusy('')
    }
  }

  const confirmBodyPhoto = async (checked: string[]) => {
    if (!photoDraft) return

    setBusy('사진을 기기에 저장하는 중…')
    try {
      const saved = await saveBodyPhoto(photoDraft, checked)
      setBodyPhoto(saved)
      setPhotoDraft(null)
      setToast('전신 사진을 이 기기에만 저장했어요.')
    } catch (error) {
      setNotice({ title: '사진을 저장하지 못했어요', message: errorMessage(error) })
    } finally {
      setBusy('')
    }
  }

  const removeBodyPhoto = async () => {
    setBusy('사진을 지우는 중…')
    try {
      await deleteBodyPhoto()
      setBodyPhoto(null)
      setPendingTryon(null)
      setPaidTryonRetry(null)
      setToast('전신 사진을 지웠어요. 저장한 입어보기 결과는 그대로예요.')
    } catch (error) {
      setNotice({ title: '사진을 지우지 못했어요', message: errorMessage(error) })
    } finally {
      setBusy('')
    }
  }

  const removeTryonResult = async (outfitKey: string) => {
    try {
      await deleteTryonImage(outfitKey)
      setTryonImages(current => current.filter(image => image.outfitKey !== outfitKey))
      setShopResultKey(current => current === outfitKey ? null : current)
      setToast('입어보기 결과를 삭제했어요.')
    } catch (error) {
      setNotice({ title: '결과를 삭제하지 못했어요', message: errorMessage(error) })
    }
  }

  // AI 착장 미리보기 — 광고 완료 또는 쿠팡 진입으로 승인된 요청만 이 함수에 들어온다.
  const runTryon = async (outfit: Outfit, request: TryonRequest) => {
    if (tryonBusy || !bodyPhoto || !tryonAvailable) return

    const key = outfitKeyOf(outfit.items.map(item => item.id))
    if (request.kind !== 'outfit' || request.outfitKey !== key) return
    if (tryonImages.some(image => image.outfitKey === key)) return

    setTryonBusy(true)
    setTryonError('')
    try {
      const person = await readBodyPhotoBase64()
      if (!person) throw new Error('저장된 전신 사진을 읽지 못했어요.')

      const wearable = OUTFIT_TRYON_SLOTS
        .map(slot => outfit.bySlot[slot])
        .filter((item): item is ClosetItem => Boolean(item))
      if (wearable.length === 0) throw new Error('입힐 상·하의를 찾지 못했어요.')

      const garments = await Promise.all(wearable.map(item => readDeviceImageBase64(item.imagePath)))
      const generated = await generateTryon(person, garments)
      const saved = await saveTryonImage(today, key, generated.base64, {
        kind: 'outfit',
        categories: wearable.map(item => item.category),
        itemIds: wearable.map(item => item.id),
      })

      setTryonImages(current => [...current.filter(image => image.outfitKey !== key), saved])
      await recordTryonView(today)
      setPaidTryonRetry(null)
      trace('action', 'tryon', '수익 확인 뒤 AI 생성 완료', { outfitKey: key })
    } catch (error) {
      setTryonError(errorMessage(error))
    } finally {
      setTryonBusy(false)
    }
  }

  const requestTryon = (outfit: Outfit) => {
    if (tryonBusy || !bodyPhoto || !tryonAvailable) return

    const request: TryonRequest = {
      kind: 'outfit',
      outfitId: outfit.id,
      outfitKey: outfitKeyOf(outfit.items.map(item => item.id)),
    }
    if (tryonImages.some(image => image.outfitKey === request.outfitKey)) return

    if (!needsTryonMonetization(request, paidTryonRetry)) {
      void runTryon(outfit, request)
      return
    }

    setPendingTryon(request)
    trace('action', 'tryon', 'AI 생성 전 수익 게이트', { outfitKey: request.outfitKey })
    setGateOpen(true)
  }

  // 사기 전에 입어봄 — M10-기획.md §2. 파이프라인·게이트는 코디 트라이온과 공유한다.
  const pickShopGarments = async (category: ClosetCategory) => {
    const room = PRE_TRYON_MAX_GARMENTS - shopGarments.length
    if (room <= 0) {
      setToast(`상품 사진은 최대 ${PRE_TRYON_MAX_GARMENTS}장까지예요.`)
      return
    }

    setBusy('앨범을 여는 중…')
    try {
      const media = await NativeCamera.chooseFromGallery({
        mediaType: MediaTypeSelection.Photo,
        allowMultipleSelection: room > 1,
        limit: room,
        includeMetadata: false,
        quality: 82,
        targetWidth: 1600,
        targetHeight: 1600,
        correctOrientation: true,
        webUseInput: true,
      })

      const selected = media.results.slice(0, room)
      if (selected.length === 0) return

      setBusy('사진을 안전하게 변환하는 중…')
      const prepared: ShopGarment[] = []
      for (const result of selected) {
        prepared.push({
          ...await prepareClosetImage(await mediaSource(result), { trim: true }),
          category,
        })
      }
      setShopGarments(current => mergeGarments(current, prepared))
      setPaidTryonRetry(current => current?.kind === 'shop' ? null : current)
      setShopError('')
    } catch (error) {
      if (!isCancellation(error)) {
        setNotice({
          title: '사진을 가져오지 못했어요',
          message: '쇼핑몰에서 저장한 상품 이미지를 다시 선택해 주세요.',
        })
      }
    } finally {
      setBusy('')
    }
  }

  const runShopTryon = async (request: TryonRequest) => {
    if (shopBusy || !bodyPhoto || !tryonAvailable || shopGarments.length === 0) return
    if (request.kind !== 'shop') return

    setShopBusy(true)
    setShopError('')
    try {
      const person = await readBodyPhotoBase64()
      if (!person) throw new Error('저장된 전신 사진을 읽지 못했어요.')

      const generated = await generateTryon(person, shopGarments.map(garment => garment.base64))
      const key = preTryonKey(new Date())
      const saved = await saveTryonImage(today, key, generated.base64, {
        kind: 'shop',
        categories: shopGarments.map(garment => garment.category),
      })

      setTryonImages(current => [...current.filter(image => image.outfitKey !== key), saved])
      setShopResultKey(key)
      await recordTryonView(today)
      setPaidTryonRetry(null)
      trace('action', 'shopTryon', '수익 확인 뒤 AI 생성 완료', { outfitKey: key })
    } catch (error) {
      setShopError(errorMessage(error))
    } finally {
      setShopBusy(false)
    }
  }

  const requestShopTryon = () => {
    if (shopBusy || !bodyPhoto || !tryonAvailable || shopGarments.length === 0) return

    const request: TryonRequest = { kind: 'shop' }
    if (!needsTryonMonetization(request, paidTryonRetry)) {
      void runShopTryon(request)
      return
    }

    setPendingTryon(request)
    trace('action', 'shopTryon', 'AI 생성 전 수익 게이트')
    setGateOpen(true)
  }

  const openShopPartners = async () => {
    const url = partnersUrl()
    if (!url) return
    try {
      if (!await openExternalUrl(url)) throw new Error('쿠팡 링크가 열리지 않았어요.')
    } catch (error) {
      setNotice({ title: '쿠팡을 열지 못했어요', message: errorMessage(error) })
    }
  }

  // 내 데이터 — M7-기획.md §4.3
  const exportBackup = async (includeBodyPhoto: boolean) => {
    setBackupBusy('백업 파일을 만드는 중…')
    setBackupSaved('')
    try {
      const result = await createBackup({ includeBodyPhoto }, new Date(), (done, total) => {
        setBackupBusy(`사진을 담는 중… ${done} / ${total}`)
      })

      if (Capacitor.isNativePlatform()) {
        await writeBackupFile(result)
        setBackupSaved(`파일 앱 > 입핏 > ${result.fileName}`)
      } else {
        const url = URL.createObjectURL(new Blob([result.data as BlobPart], { type: 'application/zip' }))
        const link = document.createElement('a')
        link.href = url
        link.download = result.fileName
        link.click()
        URL.revokeObjectURL(url)
        setBackupSaved(result.fileName)
      }
      setToast(`백업을 만들었어요 (${Math.round(result.bytes / 1024 / 1024)}MB)`)
    } catch (error) {
      setNotice({ title: '백업을 만들지 못했어요', message: errorMessage(error) })
    } finally {
      setBackupBusy('')
    }
  }

  const openBackupFile = async (file: File) => {
    setBackupBusy('백업 파일을 확인하는 중…')
    try {
      const parsed = readBackup(new Uint8Array(await file.arrayBuffer()))
      setImportPreview({ parsed, summary: summarise(parsed.manifest) })
    } catch (error) {
      setNotice({ title: '가져올 수 없는 파일이에요', message: errorMessage(error) })
    } finally {
      setBackupBusy('')
    }
  }

  const runImport = async (mode: ImportMode) => {
    if (!importPreview) return

    setBackupBusy(mode === 'replace' ? '옷장을 교체하는 중…' : '옷장에 합치는 중…')
    try {
      const result = await applyBackup(importPreview.parsed, mode)
      setCloset(await loadClosetItems())
      setOutfitLog(await loadOutfitLog())
      setImportPreview(null)
      setToast(`${result.added}벌을 가져왔어요. 코디 기록 ${result.logDays}일.`)
    } catch (error) {
      setNotice({
        title: '가져오지 못했어요',
        message: `${errorMessage(error)} 지금 옷장은 그대로예요.`,
      })
    } finally {
      setBackupBusy('')
    }
  }

  const saveDrafts = async () => {
    setBusy('옷장에 안전하게 저장하는 중…')
    try {
      const items = await saveClosetDrafts(drafts)
      setCloset(items)
      setDrafts([])
      setPhotosLimited(false)
      setRoute(firstRun === 'closet' ? 'home' : 'closet')
      setToast(`${drafts.length}벌을 이 기기에 저장했어요.`)
    } catch (error) {
      setNotice({
        title: '저장하지 못했어요',
        message: `${errorMessage(error)} 사진과 입력한 태그는 유지했어요.`,
      })
    } finally {
      setBusy('')
    }
  }

  const openSettings = async () => {
    try {
      await AppLauncher.openUrl({ url: 'app-settings:' })
    } catch {
      setToast('iPhone 설정에서 입핏의 권한을 확인해 주세요.')
    }
  }

  const persistProfile = (next: Profile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
    setProfile(next)
    void Preferences.set({ key: PROFILE_KEY, value: JSON.stringify(next) }).catch(() => {
      setNotice({
        title: '프로필을 기기에 저장하지 못했어요',
        message: '현재 화면에는 반영했지만 앱을 다시 열면 입력을 다시 확인해야 할 수 있어요.',
      })
    })
  }

  const completeFirstRun = () => {
    setFirstRun(null)
    void Preferences.set({ key: FIRST_RUN_KEY, value: 'done' })
  }

  const confirmOutfit = async (outfit: Outfit) => {
    const entry: OutfitEntry = {
      date: today,
      itemIds: outfit.items.map(item => item.id),
      mood: outfit.mood,
      confirmedAt: new Date().toISOString(),
    }
    const next = upsertEntry(outfitLog, entry)
    setOutfitLog(next)
    setRoute('home')
    setToast('오늘의 코디를 확정했어요.')
    try {
      await saveOutfitLog(next)
    } catch {
      setNotice({
        title: '기록을 저장하지 못했어요',
        message: '확정은 화면에 반영했지만 저장 공간 문제로 다음 실행에는 남지 않을 수 있어요.',
      })
    }
  }

  /** 열람권이 있으면 바로 연다. 없을 때만 충전 시트를 띄운다. */
  const requestUnlock = () => {
    const result = openOutfit(gate.date === today ? gate : { ...gate, date: today, outfitUnlocked: false })
    if (result.opened) {
      setGate(result.gate)
      void saveGate(result.gate)
      trace('action', 'home', '코디 열람권 사용', { left: result.gate.credits })
      setToast(`코디를 열었어요. 남은 열람권 ${result.gate.credits}장`)
      return
    }
    setPendingTryon(null)
    setGateOpen(true)
  }

  /** 광고·쿠팡으로 받은 보상 — 열람권 1장과 운세 2시간 패스를 함께 준다. */
  const grantCharge = async (reason: PassReason) => {
    const charged = addCredits(gate.date === today ? gate : { ...gate, date: today }, 1)
    const opened = openOutfit(charged)
    setGate(opened.gate)
    await saveGate(opened.gate)

    const granted = grantPass(reason)
    setPass(granted)
    setClock(new Date())
    await savePass(granted)
    setGateOpen(false)
    setToast(FEATURES.saju ? '코디를 열었어요. 운세 상세는 2시간 동안 볼 수 있어요.' : '코디를 열었어요.')
  }

  /** 수익 행동이 확인된 동일 요청만 AI를 시작한다. 생성 실패 시 그 요청의 재시도 권한은 유지한다. */
  const completeCharge = async (reason: PassReason) => {
    const request = pendingTryon
    await grantCharge(reason)
    if (!request) return

    setPendingTryon(null)
    setPaidTryonRetry(request)
    setToast('확인했어요. 입은 모습을 만들기 시작했어요.')

    if (request.kind === 'shop') {
      void runShopTryon(request)
      return
    }

    const outfit = tryonOutfits.find(candidate => candidate.id === request.outfitId)
    if (outfit) {
      void runTryon(outfit, request)
      return
    }

    setNotice({
      title: '코디를 다시 선택해 주세요',
      message: '방금 확인한 이용권은 유지했어요. 같은 코디에서 다시 누르면 바로 이어서 만들어요.',
    })
  }

  const openAlternatives = () => {
    if (homeAlternatives.length === 0) {
      setRoute('add')
      return
    }
    // 잠금 해제는 이름이 정확한 "코디 열어보기"에서만 한다.
    if (!unlocked && !todayEntry) return
    setRoute('alternatives')
  }

  const answerFeedback = async (verdict: FeedbackVerdict, reason?: FeedbackReason) => {
    const top = confirmedItems.find(item => item.category === '상의')
    const bottom = confirmedItems.find(item => item.category === '하의')
    const pair = top && bottom ? { topColor: top.color, bottomColor: bottom.color } : undefined
    const next = applyFeedback(bias, { date: today, verdict, reason }, pair)
    setBias(next)
    setToast(verdict === 'good' ? '기억해둘게요.' : '다음 추천에 반영할게요.')
    await saveBias(next)
  }

  const toggleMorningNotification = async () => {
    if (!Capacitor.isNativePlatform()) {
      setNotice({
        title: 'iPhone 앱에서 켤 수 있어요',
        message: '아침 브리핑은 앱이 닫혀 있어도 알려드려야 해서 iPhone 앱에서만 예약해요.',
      })
      return
    }

    setMorningBusy(true)
    try {
      if (morningSettings.enabled && morningPermission === 'granted') {
        const next = { ...morningSettings, enabled: false }
        await updateMorningNotification(morningSettings, next)
        setMorningSettings(next)
        setToast('아침 브리핑 알림을 껐어요.')
        return
      }

      let permission = await checkMorningNotificationPermission()
      if (permission !== 'granted') {
        permission = await requestMorningNotificationPermission()
      }
      setMorningPermission(permission)

      if (permission !== 'granted') {
        setNotice({
          title: '알림 권한이 꺼져 있어요',
          message: 'iPhone 설정에서 입핏 알림을 허용한 뒤 다시 켜 주세요.',
          settings: permission === 'denied',
        })
        return
      }

      const next = { ...morningSettings, enabled: true }
      await updateMorningNotification(morningSettings, next)
      setMorningSettings(next)
      setToast(`매일 ${morningTimeLabel(next)}에 알려드릴게요.`)
    } catch {
      setNotice({
        title: '아침 알림을 예약하지 못했어요',
        message: '시간은 그대로 남아 있어요. 잠시 후 다시 켜 주세요.',
      })
    } finally {
      setMorningBusy(false)
    }
  }

  const toggleEveningNotification = async () => {
    if (!Capacitor.isNativePlatform()) {
      setNotice({
        title: 'iPhone 앱에서 켤 수 있어요',
        message: '저녁 알림도 앱이 닫혀 있을 때 알려드려야 해서 iPhone 앱에서만 예약해요.',
      })
      return
    }

    setEveningBusy(true)
    try {
      if (eveningSettings.enabled && morningPermission === 'granted') {
        const next = { ...eveningSettings, enabled: false }
        await updateEveningNotification(eveningSettings, next)
        setEveningSettings(next)
        setToast('저녁 피드백 알림을 껐어요.')
        return
      }

      let permission = await checkMorningNotificationPermission()
      if (permission !== 'granted') permission = await requestMorningNotificationPermission()
      setMorningPermission(permission)

      if (permission !== 'granted') {
        setNotice({
          title: '알림 권한이 꺼져 있어요',
          message: 'iPhone 설정에서 입핏 알림을 허용한 뒤 다시 켜 주세요.',
          settings: permission === 'denied',
        })
        return
      }

      const next = { ...eveningSettings, enabled: true }
      await updateEveningNotification(eveningSettings, next)
      setEveningSettings(next)
      setToast(`매일 ${morningTimeLabel(next)}에 오늘 코디를 물어볼게요.`)
    } catch {
      setNotice({
        title: '저녁 알림을 예약하지 못했어요',
        message: '시간은 그대로 남아 있어요. 잠시 후 다시 켜 주세요.',
      })
    } finally {
      setEveningBusy(false)
    }
  }

  const changeEveningTime = async (value: string) => {
    const time = parseMorningTime(value)
    if (!time) return

    const previous = eveningSettings
    const next = { ...previous, ...time }
    setEveningSettings(next)
    setEveningBusy(true)

    try {
      await updateEveningNotification(previous, next)
      setToast(
        next.enabled
          ? `저녁 알림을 ${morningTimeLabel(next)}로 바꿨어요.`
          : `기본 시간을 ${morningTimeLabel(next)}로 저장했어요.`,
      )
    } catch {
      setEveningSettings(previous)
      setNotice({
        title: '알림 시간을 바꾸지 못했어요',
        message: '기존 예약은 그대로예요. 잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setEveningBusy(false)
    }
  }

  const changeMorningTime = async (value: string) => {
    const time = parseMorningTime(value)
    if (!time) return

    const previous = morningSettings
    const next = { ...previous, ...time }
    setMorningSettings(next)
    setMorningBusy(true)

    try {
      await updateMorningNotification(previous, next)
      setToast(
        next.enabled
          ? `아침 알림을 ${morningTimeLabel(next)}로 바꿨어요.`
          : `기본 시간을 ${morningTimeLabel(next)}로 저장했어요.`,
      )
    } catch {
      setMorningSettings(previous)
      setNotice({
        title: '알림 시간을 바꾸지 못했어요',
        message: '기존 예약은 그대로예요. 잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setMorningBusy(false)
    }
  }

  const deleteItem = async (id: string) => {
    await moveToTrash(id)
    setCloset(await loadClosetItems())
    setTrash(await loadTrashItems())
    setOpenItemId(null)
    setRoute('closet')
    setToast('휴지통으로 옮겼어요. 7일 안에 되돌릴 수 있어요.')
  }

  const restoreItem = async (id: string) => {
    await restoreFromTrash(id)
    setCloset(await loadClosetItems())
    setTrash(await loadTrashItems())
    setToast('옷장으로 되돌렸어요.')
  }

  const purgeItems = async (ids: string[]) => {
    await purgeFromTrash(ids)
    setTrash(await loadTrashItems())
    setToast('완전히 삭제했어요.')
  }

  const wipeEverything = async () => {
    try {
      await cancelMorningNotification()
      await cancelEveningNotification()
    } catch {
      setNotice({
        title: '알림 예약을 지우지 못했어요',
        message: '데이터 삭제를 멈췄어요. 잠시 후 다시 시도해 주세요.',
      })
      return
    }

    await wipeCloset()
    await deleteBodyPhoto()
    await deleteTryonImages()
    await Preferences.remove({ key: OUTFIT_LOG_KEY })
    await Preferences.remove({ key: PASS_KEY })
    await removeGate()
    await Preferences.remove({ key: WEATHER_CACHE_KEY })
    await Preferences.remove({ key: PROFILE_KEY })
    await removeMorningNotificationSettings()
    await removeEveningNotificationSettings()
    await clearBias()
    await Preferences.remove({ key: TASTE_KEY })
    setTracerEnabled(false)
    resetTracer()
    await setTraceEnabled(false)
    await clearTrace()
    localStorage.removeItem(PROFILE_KEY)
    localStorage.removeItem(CAMERA_TIPS_KEY)
    sessionStorage.removeItem(LAST_ROUTE_KEY)
    setCloset([])
    setTrash([])
    setDrafts([])
    setOutfitLog([])
    setBias(EMPTY_BIAS)
    setTaste(EMPTY_TASTE)
    setPass(null)
    setGate({ date: '', outfitUnlocked: false, credits: 0 })
    setMorningSettings(DEFAULT_MORNING_NOTIFICATION)
    setEveningSettings(DEFAULT_EVENING_NOTIFICATION)
    setBodyPhoto(null)
    setPhotoDraft(null)
    setShopGarments([])
    setShopResultKey(null)
    setShopError('')
    setTryonImages([])
    setTryonOutfitId(null)
    setTryonError('')
    setPendingTryon(null)
    setPaidTryonRetry(null)
    setBackupSaved('')
    setImportPreview(null)
    setProfile(null)
    setRoute('home')
  }

  /** 광고를 끝까지 본 경우에만 패스를 준다 — 중간에 닫으면 아무 일도 없다. */
  const chargeWithAd = async () => {
    if (!ads.available || chargeBusy) return

    setChargeBusy('광고를 불러오는 중…')
    try {
      const rewarded = await showRewardedAd()
      if (!rewarded) {
        setToast(pendingTryon
          ? '광고를 끝까지 보면 입어보기를 계속할 수 있어요.'
          : '광고를 끝까지 봐야 스타일패스가 열려요.')
        return
      }

      await completeCharge('ad')
    } catch (error) {
      setNotice({ title: '광고를 열지 못했어요', message: errorMessage(error) })
    } finally {
      setChargeBusy('')
    }
  }

  /** 쿠팡 파트너스 링크로 이동한 뒤 패스를 연다 — 링크가 없으면 버튼 자체를 만들지 않는다. */
  const chargeWithPartners = async () => {
    const url = partnersUrl()
    if (!url || chargeBusy) return

    setChargeBusy('쿠팡을 여는 중…')
    try {
      if (!await openExternalUrl(url)) {
        setToast(pendingTryon
          ? '쿠팡이 열리면 입어보기를 계속할 수 있어요.'
          : '쿠팡이 실제로 열려야 스타일패스가 열려요.')
        return
      }
      await completeCharge('coupang')
    } catch (error) {
      setNotice({ title: '쿠팡을 열지 못했어요', message: errorMessage(error) })
    } finally {
      setChargeBusy('')
    }
  }

  if (!profileReady) {
    return (
      <main className="app-screen profile-loading" aria-busy="true">
        <span aria-hidden="true">핏</span>
        <p>기기 안의 프로필을 불러오고 있어요</p>
      </main>
    )
  }

  if (!profile) {
    return (
      <Onboarding
        plan={firstRunPlan}
        onDone={next => {
          persistProfile(next)
          setFirstRun('closet')
        }}
      />
    )
  }

  return (
    <>
      {route === 'home' && firstRun === 'body' && (
        <main className="app-screen onboarding">
          <StepIndicator step={firstRunPlan.body} total={firstRunPlan.total} />
          <BodyForm
            title={<>핏까지 맞추려면<br /><em>내 몸의 기준</em>을 알려주세요</>}
            initial={profile.body}
            submitLabel="저장하고 계속"
            onSubmit={body => {
              persistProfile({ ...profile, body })
              setFirstRun('closet')
            }}
          />
        </main>
      )}

      {route === 'home' && firstRun === 'closet' && (
        <FirstRunCloset
          count={closet.length}
          onBack={() => setFirstRun('body')}
          onCamera={category => openCamera(category)}
          onAlbum={category => void importAlbum('new', undefined, category)}
          step={firstRunPlan.closet}
          total={firstRunPlan.total}
          onNext={() => (firstRunPlan.notification ? setFirstRun('notify') : completeFirstRun())}
        />
      )}

      {route === 'home' && firstRun === 'notify' && firstRunPlan.notification !== null && (
        <FirstRunNotify
          settings={morningSettings}
          permission={morningPermission}
          busy={morningBusy}
          onToggle={() => void toggleMorningNotification()}
          onTimeChange={value => void changeMorningTime(value)}
          onBack={() => setFirstRun('closet')}
          step={firstRunPlan.notification}
          total={firstRunPlan.total}
          onDone={completeFirstRun}
        />
      )}

      {route === 'home' && firstRun === null && (
        <HomeScreen
          profile={profile}
          fortune={fortune}
          closet={closet}
          loading={closetLoading}
          weather={weather}
          recommendation={recommendation}
          hasAlternatives={homeAlternatives.length > 0}
          unlocked={unlocked}
          confirmedItems={confirmedItems}
          confirmedAt={todayEntry?.confirmedAt}
          confirmedMood={todayEntry?.mood}
          askFeedback={Boolean(todayEntry) && shouldAskFeedback(bias, today, clock.getHours())}
          bias={bias}
          onCamera={() => setRoute('add')}
          onCloset={() => setRoute('closet')}
          onEditBody={() => setRoute('body')}
          onUnlock={requestUnlock}
          taste={taste}
          tryonImage={bestTryonImage}
          tryonBusy={tryonBusy}
          onAlternatives={openAlternatives}
          onTryon={outfit => {
            setTryonOutfitId(outfit.id)
            setTryonError('')
            setRoute('tryon')
          }}
          onConfirm={outfit => void confirmOutfit(outfit)}
          onFeedback={(verdict, reason) => void answerFeedback(verdict, reason)}
          onShopTryon={() => setRoute('shopTryon')}
          onNavigate={setRoute}
        />
      )}

      {route === 'fortune' && FEATURES.saju && !fortune && (
        <main className="app-screen fortune-screen">
          <header className="home-header"><span>오늘의 운세</span></header>
          <section className="tryon-empty">
            <MoonStar aria-hidden="true" />
            <h2>생년월일을 알려주시면 운세를 볼 수 있어요</h2>
            <p>다른 기능은 생년월일 없이 그대로 쓸 수 있어요.</p>
            <button className="primary-button" onClick={() => setRoute('profile')}>사주 프로필 입력</button>
          </section>
          <BottomTabs active="fortune" onNavigate={setRoute} />
        </main>
      )}

      {route === 'fortune' && fortune && (
        <FortuneScreen
          fortune={fortune}
          domains={domains}
          hasBirthHour={profile.hour !== undefined}
          fortunePass={fortunePass}
          passLabel={remainingLabel(pass, clock)}
          onOpenDomain={domain => {
            if (!fortunePass) {
              trace('action', 'fortune', '운세 상세 게이트')
              setPendingTryon(null)
              setGateOpen(true)
              return
            }
            setOpenDomain(domain)
            setRoute('fortuneDetail')
          }}
          onNavigate={setRoute}
        />
      )}

      {route === 'stylebook' && (
        <StylebookScreen
          log={outfitLog}
          closet={closet}
          bias={bias}
          today={today}
          tryonImages={tryonImages}
          onDeleteResult={image => setConfirm({
            title: '이 입어보기 결과를 삭제할까요?',
            message: '기기에서 완전히 삭제되고 되돌릴 수 없어요.',
            action: '결과 삭제',
            destructive: true,
            run: () => void removeTryonResult(image.outfitKey),
          })}
          onNavigate={setRoute}
        />
      )}

      {route === 'my' && (
        <MyScreen
          profile={profile}
          pass={pass}
          passLabel={remainingLabel(pass, clock)}
          trashCount={trash.length}
          bodyPhoto={bodyPhoto}
          morningSettings={morningSettings}
          morningPermission={morningPermission}
          morningBusy={morningBusy}
          eveningSettings={eveningSettings}
          eveningBusy={eveningBusy}
          taste={taste}
          onEditTaste={() => setRoute('taste')}
          onEditProfile={() => setRoute('profile')}
          onEditBody={() => setRoute('body')}
          onEditPhoto={() => openBodyPhoto('my')}
          onTrash={() => setRoute('trash')}
          onData={() => setRoute('data')}
          onToggleMorning={() => void toggleMorningNotification()}
          onMorningTimeChange={value => void changeMorningTime(value)}
          onToggleEvening={() => void toggleEveningNotification()}
          onEveningTimeChange={value => void changeEveningTime(value)}
          onNavigate={setRoute}
        />
      )}

      {route === 'profile' && (
        <ProfileScreen
          profile={profile}
          onBack={() => setRoute('my')}
          onSave={next => {
            persistProfile(next)
            setRoute('my')
            setToast('사주 프로필을 저장했어요.')
          }}
        />
      )}

      {route === 'item' && openItem && (
        <ItemDetailScreen
          item={openItem}
          closet={closet}
          log={outfitLog}
          onBack={() => {
            setOpenItemId(null)
            setRoute('closet')
          }}
          onMakeOutfit={() => {
            setPinnedId(openItem.id)
            setRoute('alternatives')
          }}
          onDelete={() => setConfirm({
            title: '이 옷을 휴지통으로 옮길까요?',
            message: '7일 동안 휴지통에 보관되고 그 안에는 언제든 되돌릴 수 있어요.',
            action: '휴지통으로',
            destructive: true,
            run: () => void deleteItem(openItem.id),
          })}
        />
      )}

      {route === 'trash' && (
        <TrashScreen
          items={trash}
          onBack={() => setRoute('my')}
          onRestore={id => void restoreItem(id)}
          onPurge={id => setConfirm({
            title: '완전히 삭제할까요?',
            message: '사진까지 함께 지워지고 되돌릴 수 없어요.',
            action: '완전 삭제',
            destructive: true,
            run: () => void purgeItems([id]),
          })}
          onPurgeAll={() => setConfirm({
            title: '휴지통을 비울까요?',
            message: `${trash.length}벌의 사진이 함께 지워지고 되돌릴 수 없어요.`,
            action: '휴지통 비우기',
            destructive: true,
            run: () => void purgeItems(trash.map(item => item.id)),
          })}
        />
      )}

      {route === 'alternatives' && alternativeRouteOutfits && (
        <AlternativesScreen
          outfits={alternativeRouteOutfits}
          pinnedLabel={pinnedId ? closet.find(item => item.id === pinnedId) : undefined}
          unlocked={unlocked}
          onBack={() => {
            setPinnedId(null)
            setRoute(pinnedId ? 'item' : 'home')
          }}
          onUnlock={requestUnlock}
          onConfirm={outfit => void confirmOutfit(outfit)}
        />
      )}

      {route === 'body' && (
        <BodyScreen
          body={profile.body}
          onBack={() => setRoute('home')}
          onSave={body => {
            persistProfile({ ...profile, body })
            setRoute('home')
            setToast('체형을 반영해 다시 추천했어요.')
          }}
        />
      )}

      {route === 'data' && (
        <DataScreen
          closetCount={closet.length}
          logCount={outfitLog.length}
          resultCount={tryonImages.length}
          hasBodyPhoto={Boolean(bodyPhoto)}
          busy={backupBusy}
          saved={backupSaved}
          preview={importPreview?.summary ?? null}
          onBack={() => setRoute('my')}
          onExport={include => void exportBackup(include)}
          onPickFile={file => void openBackupFile(file)}
          onImport={mode => {
            if (mode === 'replace') {
              setConfirm({
                title: '지금 옷장을 덮어쓸까요?',
                message: '이 기기의 옷과 코디 기록이 백업 파일 내용으로 바뀌어요. 되돌릴 수 없어요.',
                action: '덮어쓰기',
                destructive: true,
                run: () => void runImport('replace'),
              })
              return
            }
            void runImport('merge')
          }}
          onCancelImport={() => setImportPreview(null)}
          onWipe={() => setConfirm({
            title: '내 데이터를 전부 지울까요?',
            message: FEATURES.saju
              ? '옷 사진·입어보기 결과·코디 기록·사주와 체형 정보가 이 기기에서 즉시 사라져요. 되돌릴 수 없어요.'
              : '옷 사진·입어보기 결과·코디 기록·체형 정보가 이 기기에서 즉시 사라져요. 되돌릴 수 없어요.',
            action: '전부 삭제',
            destructive: true,
            run: () => void wipeEverything(),
          })}
        />
      )}

      {route === 'fortuneDetail' && fortune && openDomain && (
        <FortuneDetailScreen
          entry={domains.find(entry => entry.domain === openDomain) ?? domains[0]}
          fortune={fortune}
          onBack={() => setRoute('fortune')}
          onCoordinate={() => setRoute('home')}
        />
      )}

      {route === 'taste' && (
        <TasteScreen
          taste={taste}
          onBack={() => setRoute('my')}
          onChange={setTaste}
          onSave={() => {
            void Preferences.set({ key: TASTE_KEY, value: JSON.stringify(taste) })
            trace('action', 'taste', '취향 저장', { picked: hasTaste(taste) })
            setRoute('home')
            setToast(hasTaste(taste) ? '취향을 반영해 다시 추천했어요.' : '취향을 비웠어요.')
          }}
        />
      )}

      {route === 'photo' && (
        <BodyPhotoScreen
          photo={bodyPhoto}
          draft={photoDraft}
          available={tryonAvailable}
          onBack={() => {
            setPhotoDraft(null)
            setRoute(photoReturnRoute)
          }}
          onPick={source => void pickBodyPhoto(source)}
          onCancelDraft={() => setPhotoDraft(null)}
          onConsent={checked => void confirmBodyPhoto(checked)}
          onDelete={() => setConfirm({
            title: '전신 사진을 지울까요?',
            message: '전신 사진만 삭제해요. 스타일북에 저장한 입어보기 결과는 그대로 남아요.',
            action: '사진 삭제',
            destructive: true,
            run: () => void removeBodyPhoto(),
          })}
        />
      )}

      {route === 'tryon' && (
        <TryonScreen
          outfits={tryonOutfits}
          outfit={tryonOutfit}
          images={tryonImages}
          photo={bodyPhoto}
          available={tryonAvailable}
          busy={tryonBusy}
          error={tryonError}
          onBack={() => setRoute('home')}
          onSelect={id => {
            setTryonOutfitId(id)
            setTryonError('')
          }}
          onGenerate={requestTryon}
          onRegisterPhoto={() => openBodyPhoto('tryon')}
          onConfirm={outfit => void confirmOutfit(outfit)}
        />
      )}

      {route === 'shopTryon' && FEATURES.preTryon && (
        <ShopTryonScreen
          garments={shopGarments}
          result={tryonImages.find(image => image.outfitKey === shopResultKey) ?? null}
          photo={bodyPhoto}
          available={tryonAvailable}
          busy={shopBusy}
          error={shopError}
          partnersReady={isPartnersReady()}
          onBack={() => setRoute('home')}
          onPick={category => void pickShopGarments(category)}
          onRemove={index => {
            setShopGarments(current => current.filter((_, i) => i !== index))
            setPaidTryonRetry(current => current?.kind === 'shop' ? null : current)
          }}
          onGenerate={requestShopTryon}
          onRegisterPhoto={() => openBodyPhoto('shopTryon')}
          onBuy={() => void openShopPartners()}
          onReset={() => {
            setShopGarments([])
            setShopResultKey(null)
            setShopError('')
            setPaidTryonRetry(current => current?.kind === 'shop' ? null : current)
          }}
        />
      )}

      {route === 'closet' && (
        <ClosetScreen
          closet={closet}
          log={outfitLog}
          trashCount={trash.length}
          onAdd={() => setRoute('add')}
          onOpenItem={id => {
            setOpenItemId(id)
            setRoute('item')
          }}
          onTrash={() => setRoute('trash')}
          onNavigate={setRoute}
        />
      )}

      {route === 'add' && (
        <AddHub
          onBack={() => setRoute('closet')}
          onCamera={category => openCamera(category)}
          onAlbum={category => void importAlbum('new', undefined, category)}
        />
      )}

      {route === 'camera' && (
        <CameraScreen
          drafts={drafts}
          setDrafts={setDrafts}
          initialCategory={uploadCategory}
          onClose={() => setRoute(closet.length > 0 ? 'closet' : 'home')}
          onReview={() => setRoute('review')}
          onAlbum={category => void importAlbum('new', undefined, category)}
          onSettings={() => void openSettings()}
        />
      )}

      {route === 'review' && drafts.length > 0 && (
        <BatchReview
          drafts={drafts}
          photosLimited={photosLimited}
          onChange={setDrafts}
          onBack={() => setRoute('camera')}
          onReplace={index => void importAlbum('replace', index, drafts[index]?.category || uploadCategory)}
          onToggleTrim={(index, useTrimmed) => {
            setDrafts(current => current.map((draft, position) => {
              if (position !== index || !draft.originalBase64 || !draft.originalUrl) return draft
              if (useTrimmed === Boolean(draft.trimmed)) return draft
              // 원본과 정리본을 서로 맞바꾼다 — 어느 쪽을 골라도 되돌릴 수 있게.
              return {
                ...draft,
                trimmed: useTrimmed,
                previewUrl: draft.originalUrl,
                jpegBase64: draft.originalBase64,
                originalUrl: draft.previewUrl,
                originalBase64: draft.jpegBase64,
              }
            }))
          }}
          onAddPhotos={() => void importAlbum('append', undefined, uploadCategory)}
          onSave={() => void saveDrafts()}
        />
      )}

      {gateOpen && (
        <GateSheet
          mode={pendingTryon ? 'tryon' : 'access'}
          credits={gate.date === today ? gate.credits : gate.credits}
          ads={ads}
          partnersReady={isPartnersReady()}
          chargeBusy={chargeBusy}
          onChargeAd={() => void chargeWithAd()}
          onChargePartners={() => void chargeWithPartners()}
          onClose={() => {
            setGateOpen(false)
            setPendingTryon(null)
          }}
        />
      )}

      {busy && (
        <div className="busy-overlay" role="status" aria-live="polite">
          <div><LoaderCircle aria-hidden="true" />{busy}</div>
        </div>
      )}

      {confirm && (
        <div className="modal-layer" role="presentation">
          <section className="notice-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
            <AlertCircle aria-hidden="true" />
            <h2 id="confirm-title">{confirm.title}</h2>
            <p>{confirm.message}</p>
            <div className="dialog-actions">
              <button className="secondary-button" onClick={() => setConfirm(null)}>취소</button>
              <button
                className={confirm.destructive ? 'danger-button' : 'primary-button'}
                onClick={() => {
                  const run = confirm.run
                  setConfirm(null)
                  run()
                }}
              >
                {confirm.action}
              </button>
            </div>
          </section>
        </div>
      )}

      {notice && (
        <div className="modal-layer" role="presentation">
          <section className="notice-dialog" role="alertdialog" aria-modal="true" aria-labelledby="notice-title">
            <AlertCircle aria-hidden="true" />
            <h2 id="notice-title">{notice.title}</h2>
            <p>{notice.message}</p>
            <div className="dialog-actions">
              {notice.settings && Capacitor.isNativePlatform() && (
                <button className="secondary-button" onClick={() => void openSettings()}>
                  <Settings aria-hidden="true" />설정 열기
                </button>
              )}
              <button className="primary-button" onClick={() => setNotice(null)}>확인</button>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </>
  )
}

function Onboarding({ plan, onDone }: { plan: OnboardingPlan; onDone: (profile: Profile) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [birth, setBirth] = useState<BirthInput | null>(null)

  const finish = (body: BodyProfile) => {
    // real은 생년월일을 받지 않는다 — 가짜 날짜 대신 명시적 미입력으로 저장 (M9-기획.md §4)
    if (FEATURES.saju && !birth) return
    onDone({ ...(birth ?? UNSET_BIRTH), body })
  }

  if (step === 3) {
    return (
      <main className="app-screen onboarding">
        <StepIndicator step={plan.body} total={plan.total} onBack={() => setStep(FEATURES.saju ? 2 : 1)} />
        <BodyForm
          title={<>핏까지 맞추려면<br /><em>내 몸의 기준</em>을 알려주세요</>}
          initial={EMPTY_BODY}
          submitLabel="저장하고 계속"
          onSubmit={finish}
        />
      </main>
    )
  }

  if (step === 2 && FEATURES.saju) {
    return (
      <main className="app-screen onboarding">
        <StepIndicator step={plan.birth ?? 2} total={plan.total} onBack={() => setStep(1)} />
        <BirthForm
          initial={birth ?? undefined}
          submitLabel="다음"
          intro={
            <>
              <div className="seal" aria-label="입핏">핏</div>
              <div>
                <p className="eyebrow">나만의 아침 입핏</p>
                <h1 className="onboarding-title">
                  태어난 날의 기운을<br />
                  <em>매일 입을 옷</em>으로 풀어드려요
                </h1>
                <p className="onboarding-copy">실명 인증 없이 시작하고 언제든 바꿀 수 있어요.</p>
              </div>
            </>
          }
          onSubmit={next => {
            setBirth(next)
            setStep(3)
          }}
        />
      </main>
    )
  }

  return (
    <main className="app-screen onboarding intro-screen">
      <StepIndicator step={plan.intro} total={plan.total} />
      <div className="seal" aria-label="입핏">핏</div>
      <h1 className="onboarding-title">아침마다 뭐 입을지<br /><em>대신 골라드려요</em></h1>

      <ul className="intro-points">
        {ONBOARDING_POINTS.map(point => (
          <li key={point.title}>
            <span className="intro-mark" aria-hidden="true"><point.icon /></span>
            <span>
              <b>{point.title}</b>
              <small>{point.body}</small>
            </span>
          </li>
        ))}
      </ul>

      <button className="primary-button" onClick={() => setStep(FEATURES.saju ? 2 : 3)}>시작하기</button>
    </main>
  )
}

/** 온보딩 4 · 첫 옷 등록 — M7-와이어프레임 화면 5 */
function FirstRunCloset({
  count,
  onBack,
  onCamera,
  onAlbum,
  step,
  total,
  onNext,
}: {
  count: number
  onBack: () => void
  onCamera: (category: ClosetCategory) => void
  onAlbum: (category: ClosetCategory) => void
  step: number
  total: number
  onNext: () => void
}) {
  const enough = count >= OUTFIT_RICH_COUNT
  const [category, setCategory] = useState<ClosetCategory | null>(null)

  return (
    <main className="app-screen onboarding first-run">
      <StepIndicator step={step} total={total} onBack={onBack} />
      <h1 className="onboarding-title">한 벌만 있어도<br /><em>코디를 보여드려요</em></h1>
      <p className="onboarding-copy">지금 몇 벌만 담아도 괜찮아요. 나중에 계속 추가할 수 있어요.</p>

      <div className="first-run-progress">
        <span className="track" aria-hidden="true">
          <i style={{ width: `${Math.min(100, (count / OUTFIT_RICH_COUNT) * 100)}%` }} />
        </span>
        <small>{enough ? `${count}벌 준비됨 · 조합이 넉넉해요` : `${count}벌 · ${OUTFIT_RICH_COUNT}벌이면 조합이 확 늘어요`}</small>
      </div>

      <ClothingCategoryPicker value={category} onChange={setCategory} compact />

      <button className="primary-button" disabled={!category} onClick={() => category && onCamera(category)}>
        <CameraIcon aria-hidden="true" />카메라로 연속 등록
      </button>
      <button className="secondary-button" disabled={!category} onClick={() => category && onAlbum(category)}>
        <Images aria-hidden="true" />앨범에서 가져오기
      </button>

      <button className="onboarding-next" onClick={onNext}>
        {enough ? '다음' : count > 0 ? '이만큼으로 시작하기' : '나중에 등록할래요'}
      </button>
    </main>
  )
}

/** 온보딩 5 · 알림 허용 — 스위치를 켜는 동작에서만 OS 권한을 요청한다 (M4 규칙) */
function FirstRunNotify({
  settings,
  permission,
  busy,
  onToggle,
  onTimeChange,
  onBack,
  step,
  total,
  onDone,
}: {
  settings: MorningNotificationSettings
  permission: MorningPermission
  busy: boolean
  onToggle: () => void
  onTimeChange: (value: string) => void
  onBack: () => void
  step: number
  total: number
  onDone: () => void
}) {
  const active = settings.enabled && permission === 'granted'

  return (
    <main className="app-screen onboarding first-run">
      <StepIndicator step={step} total={total} onBack={onBack} />
      <h1 className="onboarding-title">아침 브리핑을<br /><em>받아볼까요?</em></h1>
      <p className="onboarding-copy">매일 한 번, 오늘의 코디를 알려드려요. 소리는 나지 않아요.</p>

      <div className="my-card notification-card">
        <span className="notification-summary">
          <small>{permission === 'unsupported' ? 'iPhone 앱에서 설정할 수 있어요' : '켤 때만 권한을 물어봐요'}</small>
          <strong><Bell aria-hidden="true" />{morningTimeLabel(settings)}</strong>
        </span>
        <button
          type="button"
          className={`notification-switch ${active ? 'on' : ''}`}
          role="switch"
          aria-checked={active}
          aria-label="아침 브리핑 알림"
          disabled={busy || permission === 'checking' || permission === 'unsupported'}
          onClick={onToggle}
        >
          <span aria-hidden="true" />
        </button>
        <label className="notification-time">
          <Clock3 aria-hidden="true" />
          <span>알림 시간</span>
          <input
            type="time"
            aria-label="아침 브리핑 시간"
            value={morningTimeValue(settings)}
            disabled={busy || permission === 'unsupported'}
            onChange={event => onTimeChange(event.target.value)}
          />
        </label>
      </div>

      <p className="onboarding-copy">나중에 마이에서 언제든 바꿀 수 있어요.</p>
      <button className="primary-button" onClick={onDone}>입핏 시작하기</button>
    </main>
  )
}

function BirthForm({
  initial,
  submitLabel,
  intro,
  onSubmit,
}: {
  initial?: BirthInput
  submitLabel: string
  intro?: React.ReactNode
  onSubmit: (birth: BirthInput) => void
}) {
  const now = new Date()
  const [name, setName] = useState(initial?.name ?? '')
  const [year, setYear] = useState<number | ''>(initial?.y ?? '')
  const [month, setMonth] = useState<number | ''>(initial?.m ?? '')
  const [day, setDay] = useState<number | ''>(initial?.d ?? '')
  const [hour, setHour] = useState<number | undefined>(initial?.hour)
  const days = daysInBirthMonth(year, month)
  const complete = isValidBirthDate({ y: year, m: month, d: day })

  useEffect(() => {
    setDay(current => current === '' ? '' : Math.min(current, days))
  }, [days])

  const submit = () => {
    const candidate = { name: name.trim(), y: year, m: month, d: day, hour }
    if (!isValidBirthDate(candidate)) return
    onSubmit(candidate)
  }

  return (
    <div className="birth-form">
      {intro}

      <label className="form-field">
        <span>부르는 이름 <small>선택</small></span>
        <input
          name="displayName"
          value={name}
          placeholder="예: 승현"
          maxLength={8}
          onChange={event => setName(event.target.value)}
        />
      </label>

      <fieldset className="form-field" aria-describedby="birth-date-hint">
        <legend>생년월일 <small>필수</small></legend>
        <div className="date-inputs">
          <select
            id="birth-year"
            name="birthYear"
            aria-label="태어난 연도"
            value={year}
            onChange={event => setYear(event.target.value ? Number(event.target.value) : '')}
          >
            <option value="" disabled>연도</option>
            {Array.from({ length: 80 }, (_, index) => now.getFullYear() - 14 - index).map(value => (
              <option key={value} value={value}>{value}년</option>
            ))}
          </select>
          <select
            id="birth-month"
            name="birthMonth"
            aria-label="태어난 월"
            value={month}
            onChange={event => setMonth(event.target.value ? Number(event.target.value) : '')}
          >
            <option value="" disabled>월</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map(value => (
              <option key={value} value={value}>{value}월</option>
            ))}
          </select>
          <select
            id="birth-day"
            name="birthDay"
            aria-label="태어난 일"
            value={day}
            disabled={year === '' || month === ''}
            onChange={event => setDay(event.target.value ? Number(event.target.value) : '')}
          >
            <option value="" disabled>일</option>
            {Array.from({ length: days }, (_, index) => index + 1).map(value => (
              <option key={value} value={value}>{value}일</option>
            ))}
          </select>
        </div>
        <p className="form-hint" id="birth-date-hint">연·월·일을 모두 골라야 다음으로 갈 수 있어요.</p>
      </fieldset>

      <label className="form-field">
        <span>태어난 시간 <small>모르면 건너뛰어도 돼요</small></span>
        <select
          id="birth-hour"
          name="birthHour"
          value={hour ?? -1}
          onChange={event => setHour(Number(event.target.value) === -1 ? undefined : Number(event.target.value))}
        >
          <option value={-1}>모름 · 일주 기준으로 보기</option>
          {Array.from({ length: 24 }, (_, value) => (
            <option key={value} value={value}>{String(value).padStart(2, '0')}시</option>
          ))}
        </select>
      </label>

      <button
        className="primary-button onboarding-submit"
        disabled={!complete}
        onClick={submit}
      >
        {complete ? submitLabel : '생년월일을 먼저 골라주세요'}<ChevronRight aria-hidden="true" />
      </button>
    </div>
  )
}

function StepIndicator({
  step,
  total,
  onBack,
}: {
  step: number
  total: number
  onBack?: () => void
}) {
  return (
    <div className="step-row">
      {onBack && (
        <button className="onboarding-back" onClick={onBack}>
          <ChevronLeft aria-hidden="true" />이전
        </button>
      )}
      <span>{step} / {total}</span>
      <span className="step-track" aria-hidden="true"><span style={{ width: `${(step / total) * 100}%` }} /></span>
    </div>
  )
}

const BODY_BALANCE_LABEL: Record<BodyBalance, string> = {
  shoulders: '어깨가 더 넓어요',
  balanced: '비슷해요',
  hips: '골반이 더 넓어요',
}

const WAIST_LINE_LABEL: Record<WaistLine, string> = {
  defined: '굴곡이 보여요',
  straight: '비교적 일자예요',
  soft: '복부가 중심이에요',
}

function BodyForm({
  title,
  initial,
  submitLabel,
  onSubmit,
}: {
  title: React.ReactNode
  initial: BodyProfile
  submitLabel: string
  onSubmit: (body: BodyProfile) => void
}) {
  const [heightCm, setHeightCm] = useState<number | undefined>(initial.heightCm)
  const [weightKg, setWeightKg] = useState<number | undefined>(initial.weightKg)
  const [topSize, setTopSize] = useState<TopSize | undefined>(initial.topSize)
  const [bottomWaistInch, setBottomWaistInch] = useState<number | undefined>(initial.bottomWaistInch)
  const [fitPreference, setFitPreference] = useState<FitPreference | undefined>(initial.fitPreference)
  const [balance, setBalance] = useState<BodyBalance | undefined>(initial.balance)
  const [waistLine, setWaistLine] = useState<WaistLine | undefined>(initial.waistLine)
  const [chips, setChips] = useState<BodyChip[]>(initial.chips)
  const [moreOpen, setMoreOpen] = useState(Boolean(
    initial.heightCm || initial.weightKg || initial.topSize || initial.bottomWaistInch || initial.chips.length,
  ))
  const guidedStarted = Boolean(balance || waistLine)
  const shape = deriveBodyShape(balance, waistLine) ?? (guidedStarted ? undefined : initial.shape)
  const nextBody: BodyProfile = {
    heightCm,
    weightKg,
    topSize,
    bottomWaistInch,
    fitPreference,
    balance,
    waistLine,
    shape,
    chips,
  }
  const hasSignal = hasBodySignal(nextBody)

  const toggleChip = (chip: BodyChip) => {
    setChips(current => (current.includes(chip) ? current.filter(value => value !== chip) : [...current, chip]))
  }

  return (
    <div className="body-form">
      <h1 className="onboarding-title">{title}</h1>
      <p className="onboarding-copy">추천에 도움 되는 것만 골라주세요. 모두 선택이라 바로 넘어가도 돼요.</p>

      <fieldset className="form-field body-question">
        <legend>어깨와 골반을 비교하면? <small>거울로 봤을 때</small></legend>
        <div className="guided-choice-grid">
          {BODY_BALANCES.map(value => (
            <button
              key={value}
              type="button"
              className={`body-choice ${balance === value ? 'active' : ''}`}
              aria-pressed={balance === value}
              onClick={() => setBalance(current => current === value ? undefined : value)}
            >
              {BODY_BALANCE_LABEL[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-field body-question">
        <legend>허리선은 어떤 편인가요? <small>편하게 섰을 때</small></legend>
        <div className="guided-choice-grid">
          {WAIST_LINES.map(value => (
            <button
              key={value}
              type="button"
              className={`body-choice ${waistLine === value ? 'active' : ''}`}
              aria-pressed={waistLine === value}
              onClick={() => setWaistLine(current => current === value ? undefined : value)}
            >
              {WAIST_LINE_LABEL[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-field body-question">
        <legend>좋아하는 핏 <small>선택</small></legend>
        <div className="guided-choice-grid">
          {FIT_PREFERENCES.map(value => (
            <button
              key={value}
              type="button"
              className={`body-choice ${fitPreference === value ? 'active' : ''}`}
              aria-pressed={fitPreference === value}
              onClick={() => setFitPreference(current => current === value ? undefined : value)}
            >
              {value === 'slim' ? '딱 맞게' : value === 'regular' ? '기본핏' : '여유 있게'}
            </button>
          ))}
        </div>
      </fieldset>

      <details className="body-more" open={moreOpen} onToggle={event => setMoreOpen(event.currentTarget.open)}>
        <summary>
          <span>키·몸무게·평소 사이즈 더 알려주기</span>
          <small>선택</small>
        </summary>
        <div className="body-more-fields">
          <div className="measurement-grid">
            <label className="form-field">
              <span>키 <small>선택</small></span>
              <select
                id="body-height"
                name="heightCm"
                value={heightCm ?? -1}
                onChange={event => setHeightCm(Number(event.target.value) === -1 ? undefined : Number(event.target.value))}
              >
                <option value={-1}>선택 안 함</option>
                {Array.from({ length: 61 }, (_, index) => 140 + index).map(value => (
                  <option key={value} value={value}>{value} cm</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>몸무게 <small>선택</small></span>
              <select
                id="body-weight"
                name="weightKg"
                value={weightKg ?? -1}
                onChange={event => setWeightKg(Number(event.target.value) === -1 ? undefined : Number(event.target.value))}
              >
                <option value={-1}>선택 안 함</option>
                {Array.from({ length: 121 }, (_, index) => 35 + index).map(value => (
                  <option key={value} value={value}>{value} kg</option>
                ))}
              </select>
            </label>
          </div>

          <div className="measurement-grid">
            <label className="form-field">
              <span>평소 상의 <small>선택</small></span>
              <select
                id="body-top-size"
                value={topSize ?? ''}
                onChange={event => setTopSize(event.target.value ? event.target.value as TopSize : undefined)}
              >
                <option value="">선택 안 함</option>
                {TOP_SIZES.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>하의 허리 <small>선택</small></span>
              <select
                id="body-bottom-size"
                value={bottomWaistInch ?? -1}
                onChange={event => setBottomWaistInch(Number(event.target.value) === -1 ? undefined : Number(event.target.value))}
              >
                <option value={-1}>선택 안 함</option>
                {Array.from({ length: 21 }, (_, index) => 23 + index).map(value => (
                  <option key={value} value={value}>{value} inch</option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="form-field">
            <legend>이런 점이 신경 쓰여요 <small>복수 · 선택</small></legend>
            <div className="chip-row">
              {BODY_CHIPS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  className={`tag-choice ${chips.includes(chip) ? 'active' : ''}`}
                  aria-pressed={chips.includes(chip)}
                  onClick={() => toggleChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </details>

      <p className="privacy-line">
        <ShieldCheck aria-hidden="true" />
        기기 안의 핏 계산에만 사용해요. 몸무게 하나로 체형이나 사이즈를 단정하지 않아요.
      </p>

      <button
        className="primary-button onboarding-submit"
        onClick={() => onSubmit(nextBody)}
      >
        {hasSignal ? submitLabel : submitLabel === '저장하기' ? '선택 없이 저장하기' : '선택 없이 계속'}
      </button>
    </div>
  )
}

function BodyScreen({
  body,
  onBack,
  onSave,
}: {
  body: BodyProfile
  onBack: () => void
  onSave: (body: BodyProfile) => void
}) {
  return (
    <main className="app-screen body-screen">
      <ScreenHeader title="체형 프로필" onBack={onBack} />
      <BodyForm
        title={<>핏까지 맞추려면<br /><em>내 몸의 기준</em>을 알려주세요</>}
        initial={body}
        submitLabel="저장하기"
        onSubmit={onSave}
      />
    </main>
  )
}

function HomeScreen({
  profile,
  fortune,
  closet,
  loading,
  weather,
  recommendation,
  hasAlternatives,
  unlocked,
  confirmedItems,
  confirmedAt,
  confirmedMood,
  askFeedback,
  bias,
  onCamera,
  onCloset,
  onEditBody,
  taste,
  tryonImage,
  tryonBusy,
  onUnlock,
  onAlternatives,
  onTryon,
  onConfirm,
  onFeedback,
  onShopTryon,
  onNavigate,
}: {
  profile: Profile
  fortune: DayFortune | null
  closet: ClosetItem[]
  loading: boolean
  weather: WeatherState
  recommendation: RecommendResult | null
  hasAlternatives: boolean
  unlocked: boolean
  confirmedItems: ClosetItem[]
  confirmedAt?: string
  confirmedMood?: string
  askFeedback: boolean
  bias: PersonalBias
  onCamera: () => void
  onCloset: () => void
  onEditBody: () => void
  onUnlock: () => void
  taste: TastePreference
  tryonImage: TryonImage | null
  tryonBusy: boolean
  onAlternatives: () => void
  onTryon: (outfit: Outfit) => void
  onConfirm: (outfit: Outfit) => void
  onFeedback: (verdict: FeedbackVerdict, reason?: FeedbackReason) => void
  onShopTryon: () => void
  onNavigate: (route: TabRoute) => void
}) {
  const today = new Date()
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일 ${'일월화수목금토'[today.getDay()]}요일${
    fortune ? ` · ${fortune.yearPillar.gan}${fortune.yearPillar.zhi}年` : ''
  }`
  const count = closet.length
  const ready = count >= OUTFIT_READY_COUNT
  const best = recommendation?.status === 'ok' ? recommendation.outfits[0] : null
  const confirmed = confirmedItems.length > 0

  return (
    <main className="app-screen home-screen">
      <header className="home-header">
        <span className="home-brand"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />입핏</span>
        <time>{dateLabel}</time>
      </header>

      {askFeedback && <FeedbackCard onAnswer={onFeedback} />}

      {fortune && <BriefingCard fortune={fortune} weather={weather} />}

      {FEATURES.preTryon && (
        <aside className="nudge shop-nudge">
          <span className="shop-nudge-mark" aria-hidden="true"><ShoppingBag /></span>
          <span className="shop-nudge-copy">
            <b>사기 전에 입어봄</b>
            <small>쇼핑몰 상품 사진으로 내 핏을 먼저 확인해요.</small>
          </span>
          <button onClick={onShopTryon}>입어보기<ChevronRight aria-hidden="true" /></button>
        </aside>
      )}

      {!ready && (
        <>
          <section className="home-intro">
            <h1>
              {profile.name ? `${profile.name}님,` : '오늘,'}<br />
              <em>옷장을 먼저</em> 채워볼까요?
            </h1>
            <p>{FEATURES.saju
              ? '한 벌만 등록해도 오늘의 기운과 날씨에 맞춰 바로 보여드려요.'
              : '한 벌만 등록해도 오늘의 날씨와 체형에 맞춰 바로 보여드려요.'}</p>
          </section>

          {count === 0 ? (
            <div className="empty-visual" aria-hidden="true">
              <div><Shirt /></div>
            </div>
          ) : (
            <section className="recent-item" aria-label="최근 등록한 옷">
              <img src={closet[0].imageUrl} alt={`${closet[0].color} ${closet[0].category}`} />
              <div>
                <span>최근 등록</span>
                <strong>{closet[0].color} {closet[0].category}</strong>
                <small>옷장에 안전하게 저장됨</small>
              </div>
              <button className="icon-button" onClick={onCloset} aria-label="옷장 보기">
                <ChevronRight aria-hidden="true" />
              </button>
            </section>
          )}

          <div className="closet-progress">
            <div><span>옷장</span><b>{loading ? '—' : `${count}벌`}</b></div>
            <div className="progress-track" aria-label={`옷 등록 진행률 ${Math.round(Math.min(100, (count / OUTFIT_READY_COUNT) * 100))}퍼센트`}>
              <span style={{ width: `${Math.min(100, (count / OUTFIT_READY_COUNT) * 100)}%` }} />
            </div>
          </div>

          <div className="home-actions">
            <button className="primary-button" onClick={onCamera}>
              <Plus aria-hidden="true" />옷 등록하기
            </button>
            <button className="secondary-button" onClick={onCloset}>
              <LayoutGrid aria-hidden="true" />내 옷장 보기
            </button>
            <p><ShieldCheck aria-hidden="true" />사진은 평소 이 기기에 저장돼요</p>
          </div>
        </>
      )}

      {ready && recommendation?.status === 'blocked' && (
        <section className="blocked-card">
          <div className="blocked-mark" aria-hidden="true"><Shirt /></div>
          <h2>{recommendation.message}</h2>
          <p>지금 옷장엔 {count}벌이 있어요. {recommendation.missing.join('·')}만 더하면 바로 첫 코디를 만들어드릴게요.</p>
          <button className="primary-button" onClick={onCamera}>
            <Plus aria-hidden="true" />{recommendation.missing.join('·')} 등록하기
          </button>
        </section>
      )}

      {ready && confirmed && (
        <section className="confirmed-section">
          <div className="confirmed-badge">
            <Check aria-hidden="true" />
            <b>오늘의 코디 확정</b>
            <span>{confirmedAt ? new Date(confirmedAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) : ''}</span>
          </div>
          <div className="outfit-card">
            <OutfitGrid items={confirmedItems} gaps={[]} />
            {confirmedMood && (
              <div className="outfit-meta">
                <span className="mood">{confirmedMood}</span>
                <span className="fit-score">{confirmedItems.length}벌 착용 기록</span>
              </div>
            )}
          </div>
          <p className="wear-note">
            <Info aria-hidden="true" />이 옷들의 착용 기록을 남겼어요. 다음 추천에서는 잠시 뒤로 물러나요.
          </p>
          <div className="home-actions">
            {hasAlternatives ? (
              <button className="secondary-button" onClick={onAlternatives}>
                <RefreshCw aria-hidden="true" />다른 코디로 바꾸기
              </button>
            ) : (
              <button className="secondary-button" onClick={onCamera}>
                <Plus aria-hidden="true" />옷 더 등록하기
              </button>
            )}
          </div>
        </section>
      )}

      {ready && !confirmed && best && (
        <section className="today-section">
          <header className="outfit-head">
            <h2>오늘의 코디</h2>
            <span>{unlocked ? '오늘 열림' : '열람권으로 열기'}</span>
          </header>

          <div className={`outfit-card ${unlocked ? '' : 'locked'}`}>
            {unlocked && tryonImage ? (
              <figure className="outfit-worn">
                <img src={tryonImage.imageUrl} alt="내 사진으로 만든 오늘의 착장" />
                <figcaption>
                  <span className="worn-badge">입은 모습</span>
                  <span className="worn-watermark">입핏 AI</span>
                </figcaption>
                <OutfitStrip items={best.items} />
              </figure>
            ) : unlocked && tryonBusy ? (
              <div className="outfit-drawing" aria-busy="true">
                <LoaderCircle className="spin" aria-hidden="true" />
                <span>입은 모습을 그리는 중이에요</span>
                <OutfitStrip items={best.items} />
              </div>
            ) : (
              <OutfitGrid items={best.items} gaps={best.gaps} />
            )}
            {unlocked ? (
              <div className="outfit-meta">
                <span className="mood">{best.mood}</span>
                <span className="fit-score">적합도 <b>{best.score}</b></span>
              </div>
            ) : (
              <div className="lock-layer">
                <Lock aria-hidden="true" />
                <strong>스타일패스로 열어보세요</strong>
                <span>브리핑과 점수는 계속 무료예요</span>
                <button className="lock-cta" onClick={onUnlock}>코디 열어보기</button>
              </div>
            )}
          </div>

          <ReasonList
            reasons={best.reasons}
            unlocked={unlocked}
            hideBody={!hasBodySignal(profile.body)}
            tasteLine={unlocked ? tasteReason(taste, best.mood) : null}
          />

          {unlocked && best.gaps.length > 0 && (
            <p className="gap-note"><Info aria-hidden="true" />{gapMessage(best.gaps)}</p>
          )}

        </section>
      )}

      {ready && !hasBodySignal(profile.body) && (
        <aside className="nudge">
          <PencilLine aria-hidden="true" />
          <span>체형을 알려주시면 핏까지 맞춰드려요.</span>
          <button onClick={onEditBody}>입력</button>
        </aside>
      )}

      {ready && hasBodySignal(profile.body) && bias.fitComplaints > 0 && (
        <aside className="nudge">
          <PencilLine aria-hidden="true" />
          <span>핏이 안 맞는다는 답이 {bias.fitComplaints}번 있었어요. 체형을 다시 알려주시겠어요?</span>
          <button onClick={onEditBody}>수정</button>
        </aside>
      )}

      {ready && !confirmed && best && (
        <div className="home-actionbar">
          <button className="primary-button" onClick={() => (unlocked ? onConfirm(best) : onUnlock())}>
            <Check aria-hidden="true" />{unlocked ? '이 코디로 입을게요' : '코디 열어보기'}
          </button>
          {hasAlternatives ? (
            unlocked && (
              <button className="bar-icon" onClick={onAlternatives} aria-label="다른 코디 보기">
                <RefreshCw aria-hidden="true" /><small>다른 코디</small>
              </button>
            )
          ) : (
            <button className="bar-icon" onClick={onCamera} aria-label="옷 더 등록하기">
              <Plus aria-hidden="true" /><small>옷 더 등록</small>
            </button>
          )}
          {unlocked && (
            <button className="bar-icon" onClick={() => onTryon(best)} aria-label="입은 모습 보기">
              <Sparkles aria-hidden="true" /><small>입은 모습</small>
            </button>
          )}
        </div>
      )}

      <BottomTabs active="home" onNavigate={onNavigate} />
    </main>
  )
}

function FeedbackCard({ onAnswer }: { onAnswer: (verdict: FeedbackVerdict, reason?: FeedbackReason) => void }) {
  const [reason, setReason] = useState<FeedbackReason | null>(null)
  const [asking, setAsking] = useState(false)

  const effect: Record<FeedbackReason, string> = {
    추웠어요: '내일부터 한 단계 더 두꺼운 옷을 먼저 보여드릴게요.',
    더웠어요: '내일부터 한 단계 더 얇은 옷을 먼저 보여드릴게요.',
    '색이 별로였어요': '이 색 조합은 뒤로 미뤄둘게요.',
    '핏이 안 맞았어요': '핏은 아직 태그가 없어 추천을 바꾸지 못해요. 체형을 다시 알려주시면 반영할게요.',
  }

  return (
    <section className="feedback" aria-label="오늘 코디 만족도">
      <strong>오늘 이 코디, 어땠어요?</strong>
      <p>알려주시면 내일 추천이 조금 더 맞아져요.</p>

      {!asking ? (
        <div className="thumbs">
          <button className="thumb" onClick={() => onAnswer('good')}>
            <ThumbsUp aria-hidden="true" />좋았어요
          </button>
          <button className="thumb" onClick={() => setAsking(true)}>
            <ThumbsDown aria-hidden="true" />아쉬웠어요
          </button>
        </div>
      ) : (
        <>
          <div className="chip-row" role="radiogroup" aria-label="아쉬웠던 이유">
            {FEEDBACK_REASONS.map(value => (
              <button
                key={value}
                className={`tag-choice ${reason === value ? 'active' : ''}`}
                aria-pressed={reason === value}
                onClick={() => setReason(value)}
              >
                {value}
              </button>
            ))}
          </div>
          {reason && <p className="effect"><Sparkles aria-hidden="true" />{effect[reason]}</p>}
          <button
            className="primary-button feedback-submit"
            disabled={!reason}
            onClick={() => reason && onAnswer('bad', reason)}
          >
            알려주기
          </button>
        </>
      )}
    </section>
  )
}

function BriefingCard({ fortune, weather }: { fortune: DayFortune; weather: WeatherState }) {
  const grade = weather.status === 'ok' ? thicknessGrade(weather.tMax) : targetGrade(weather, new Date())

  return (
    <section className="briefing" aria-label="오늘의 브리핑" style={fortuneAccent(fortune.luckyElement)}>
      <div className="gauge" style={{ background: `conic-gradient(var(--el) 0 ${fortune.score}%, var(--paper-deep) ${fortune.score}% 100%)` }}>
        <div>{fortune.score}</div>
        <small>SCORE</small>
      </div>
      <div className="briefing-copy">
        <strong>{fortune.theme.title} · 행운색 {fortune.style.hanja}</strong>
        <p>{fortune.theme.line}</p>
      </div>
      {weather.status === 'ok' ? (
        <div className="weather-row">
          {weather.precipProbability >= 60 ? <CloudRain aria-hidden="true" /> : <Sun aria-hidden="true" />}
          <span>서울 <b>{weather.tMax}° / {weather.tMin}°</b></span>
          <span>강수 {weather.precipProbability}%</span>
          <span>{gradeAdvice(grade)}</span>
        </div>
      ) : (
        <div className="weather-row failed">
          <AlertCircle aria-hidden="true" />
          <span>날씨를 불러오지 못했어요 · 사주와 색 조화로만 추천했어요</span>
        </div>
      )}
    </section>
  )
}

/** 착장 이미지 아래에 어떤 옷을 입혔는지 작은 띠로 남긴다 — 이미지만 보면 무슨 옷인지 알 수 없다. */
function OutfitStrip({ items }: { items: ClosetItem[] }) {
  return (
    <div className="outfit-strip" aria-label="이 코디의 옷">
      {items.slice(0, 4).map(item => (
        <img key={item.id} src={item.imageUrl} alt={`${item.color} ${item.category}`} />
      ))}
    </div>
  )
}

function OutfitGrid({ items, gaps }: { items: ClosetItem[]; gaps: OutfitSlot[] }) {
  const bySlot = new Map<OutfitSlot, ClosetItem>()
  for (const item of items) {
    const slot = OUTFIT_SLOTS.find(value => value === (item.category as OutfitSlot))
    if (slot && !bySlot.has(slot)) bySlot.set(slot, item)
  }
  const slots = OUTFIT_SLOTS.filter(slot => bySlot.has(slot) || gaps.includes(slot))

  return (
    <div className="outfit-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, slots.length)}, 1fr)` }}>
      {slots.map(slot => {
        const item = bySlot.get(slot)
        return (
          <div key={slot} className={`outfit-slot ${item ? '' : 'empty'}`}>
            <i aria-hidden="true">{slot}</i>
            {item
              ? <img src={item.imageUrl} alt={`${item.color} ${item.category}`} />
              : <span className="slot-placeholder" role="img" aria-label={`${slot} 없음`} />}
          </div>
        )
      })}
    </div>
  )
}

function ReasonList({
  reasons,
  unlocked,
  hideBody = false,
  tasteLine = null,
}: {
  reasons: Outfit['reasons']
  unlocked: boolean
  /** 체형을 아직 안 알려준 경우 — 같은 문구가 아래 넛지와 겹치므로 여기서는 뺀다 */
  hideBody?: boolean
  /** 취향이 순위를 바꿨을 때만 들어온다 */
  tasteLine?: string | null
}) {
  return (
    <div className="reasons">
      {reasons.saju && <p className="reason"><em>命</em><span>{reasons.saju}</span></p>}
      {unlocked ? (
        <>
          <p className="reason"><em>天</em><span>{reasons.weather}</span></p>
          {!hideBody && <p className="reason"><em>形</em><span>{reasons.body}</span></p>}
          {tasteLine && <p className="reason"><em>好</em><span>{tasteLine}</span></p>}
        </>
      ) : (
        <>
          <p className="reason muted"><em>天</em><span>날씨 근거는 코디를 열면 보여요.</span></p>
          <p className="reason muted"><em>形</em><span>체형 근거는 코디를 열면 보여요.</span></p>
        </>
      )}
    </div>
  )
}

function AlternativesScreen({
  outfits,
  pinnedLabel,
  unlocked,
  onBack,
  onUnlock,
  onConfirm,
}: {
  outfits: Outfit[]
  pinnedLabel?: ClosetItem
  unlocked: boolean
  onBack: () => void
  onUnlock: () => void
  onConfirm: (outfit: Outfit) => void
}) {
  const [index, setIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const current = outfits[Math.min(index, outfits.length - 1)]

  // 카드 폭이 뷰포트에 따라 달라지므로 중심에 가장 가까운 카드를 현재 위치로 삼는다.
  const handleScroll = () => {
    const track = trackRef.current
    if (!track) return
    const center = track.scrollLeft + track.clientWidth / 2
    let nearest = 0
    let best = Number.POSITIVE_INFINITY
    Array.from(track.children).forEach((child, position) => {
      const node = child as HTMLElement
      const distance = Math.abs(node.offsetLeft + node.offsetWidth / 2 - center)
      if (distance < best) {
        best = distance
        nearest = position
      }
    })
    setIndex(nearest)
  }

  if (!current) {
    return (
      <main className="app-screen alternatives-screen">
        <ScreenHeader title={pinnedLabel ? `${pinnedLabel.color} ${pinnedLabel.category} 코디` : '다른 코디'} onBack={onBack} />
        <p className="empty-line">지금 옷장으로는 대안을 만들지 못했어요.</p>
      </main>
    )
  }

  return (
    <main className="app-screen alternatives-screen">
      <ScreenHeader title={pinnedLabel ? `${pinnedLabel.color} ${pinnedLabel.category} 코디` : '다른 코디'} onBack={onBack} />
      <p className="screen-lead">
        {pinnedLabel
          ? `${pinnedLabel.color} ${pinnedLabel.category}를 넣고 오늘 날씨·행운색에 맞춰 조합했어요.`
          : '같은 날씨·같은 행운색에서 조합을 다르게 골랐어요.'}
      </p>

      <div className="outfit-track" ref={trackRef} onScroll={handleScroll}>
        {outfits.map(outfit => (
          <article className={`outfit-card ${unlocked ? '' : 'locked'}`} key={outfit.id}>
            <OutfitGrid items={outfit.items} gaps={outfit.gaps} />
            <div className="outfit-meta">
              <span className="mood">{outfit.mood}</span>
              <span className="fit-score">적합도 <b>{unlocked ? outfit.score : '—'}</b></span>
            </div>
            {!unlocked && (
              <div className="lock-layer">
                <Lock aria-hidden="true" />
                <strong>코디를 열면 조합을 볼 수 있어요</strong>
                <span>열람권은 아래 버튼을 누를 때만 사용돼요.</span>
              </div>
            )}
          </article>
        ))}
      </div>

      {outfits.length > 1 && (
        <div className="pager" aria-label={`${outfits.length}벌 중 ${index + 1}번째`}>
          {outfits.map((outfit, position) => (
            <i key={outfit.id} className={position === index ? 'on' : ''} />
          ))}
        </div>
      )}

      <ReasonList reasons={current.reasons} unlocked={unlocked} />

      {unlocked && current.gaps.length > 0 && (
        <p className="gap-note"><Info aria-hidden="true" />{gapMessage(current.gaps)}</p>
      )}

      <div className="home-actions">
        <button className="primary-button" onClick={() => (unlocked ? onConfirm(current) : onUnlock())}>
          <Check aria-hidden="true" />{unlocked ? '이 코디로 입을게요' : '코디 열어보기'}
        </button>
      </div>
    </main>
  )
}

function GateSheet({
  mode,
  credits,
  ads,
  partnersReady,
  chargeBusy,
  onChargeAd,
  onChargePartners,
  onClose,
}: {
  mode: 'access' | 'tryon'
  credits: number
  ads: AdsState
  partnersReady: boolean
  chargeBusy: string
  onChargeAd: () => void
  onChargePartners: () => void
  onClose: () => void
}) {
  const tryonMode = mode === 'tryon'

  return (
    <div className="modal-layer sheet-layer" role="presentation" onClick={onClose}>
      <section
        className="gate-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <h2 id="gate-title">
          {tryonMode ? '입은 모습을 만들어볼까요?' : (credits > 0 ? '오늘 코디를 확인할까요?' : '오늘 코디를 열어볼까요?')}
        </h2>
        {tryonMode ? (
          <p>광고를 끝까지 보거나 쿠팡을 연 다음 만들기 시작해요. 완성된 이미지는 스타일북에 저장돼요.</p>
        ) : FEATURES.saju ? (
          <p>한 번 보면 <b>오늘의 코디</b>가 열리고, <b>운세 상세는 2시간</b> 동안 볼 수 있어요.</p>
        ) : (
          <p>한 번 보면 <b>오늘의 코디</b>가 열려요.</p>
        )}

        <ul className="charge-list">
          <li className={`charge ${ads.available ? '' : 'disabled'}`}>
            <button
              type="button"
              disabled={!ads.available || Boolean(chargeBusy)}
              onClick={() => void onChargeAd()}
            >
              <span className="charge-icon"><Play aria-hidden="true" /></span>
              <span>
                <strong>{tryonMode ? '광고 보고 계속' : '광고 보고 열기'}</strong>
                <small>{ads.available
                  ? (tryonMode ? '끝까지 본 뒤 바로 시작해요' : (FEATURES.saju ? '코디 1회 + 운세 2시간' : '코디 1회'))
                  : '광고를 준비하고 있어요'}</small>
              </span>
              <span className="charge-state">{ads.available ? (chargeBusy ? '여는 중' : '보기') : '준비 중'}</span>
            </button>
          </li>
          <li className={`charge ${partnersReady ? '' : 'disabled'}`}>
            <button
              type="button"
              disabled={!partnersReady || Boolean(chargeBusy)}
              onClick={() => void onChargePartners()}
            >
              <span className="charge-icon"><ShoppingBag aria-hidden="true" /></span>
              <span>
                <strong>{tryonMode ? '쿠팡 둘러보고 계속' : '쿠팡 둘러보고 열기'}</strong>
                <small>{partnersReady
                  ? (tryonMode ? '쿠팡을 연 뒤 바로 시작해요' : (FEATURES.saju ? '코디 1회 + 운세 2시간' : '코디 1회'))
                  : '파트너스 링크 준비 중'}</small>
              </span>
              <span className="charge-state">{partnersReady ? (chargeBusy ? '여는 중' : '이동') : '준비 중'}</span>
            </button>
          </li>
        </ul>

        {partnersReady && <p className="fine-print">{PARTNERS_DISCLOSURE}</p>}

        <button className="text-button" onClick={onClose}>
          {tryonMode ? '다음에 입어볼게요' : '닫고 브리핑만 볼게요'}
        </button>
      </section>
    </div>
  )
}

function FortuneScreen({
  fortune,
  domains,
  hasBirthHour,
  fortunePass,
  passLabel,
  onOpenDomain,
  onNavigate,
}: {
  fortune: DayFortune
  domains: DomainFortune[]
  hasBirthHour: boolean
  fortunePass: boolean
  passLabel: string
  onOpenDomain: (domain: FortuneDomain) => void
  onNavigate: (route: TabRoute) => void
}) {
  const lucky = luckyInfoOf(fortune)
  const reading = dailyReadingOf(fortune, domains)
  const today = new Date()

  return (
    <main className="app-screen fortune-screen" style={fortuneAccent(fortune.luckyElement)}>
      <header className="home-header">
        <span>
          {today.getMonth() + 1}월 {today.getDate()}일 · 일주 {fortune.dayPillar.ko}({fortune.dayPillar.gan}{fortune.dayPillar.zhi})
          {hasBirthHour ? '' : ' · 삼주 기준'}
        </span>
      </header>

      <section className="briefing" aria-label="오늘의 총운">
        <div className="gauge" style={{ background: `conic-gradient(var(--el) 0 ${fortune.score}%, var(--paper-deep) ${fortune.score}% 100%)` }}>
          <div>{fortune.score}</div>
          <small>총운</small>
        </div>
        <div className="briefing-copy">
          <strong>{fortune.theme.title}</strong>
          <p>{fortune.theme.line}</p>
        </div>
      </section>

      <section className="fortune-reading" aria-label="오늘의 해석">
        <small>오늘의 해석</small>
        <h2>{reading.title}</h2>
        <p>{reading.overview}</p>
        <div className="fortune-reading-points">
          <p><b>잘 풀리는 일 · {reading.best.domain}</b>{reading.best.line}</p>
          <p><b>한 번 더 볼 일 · {reading.caution.domain}</b>{reading.caution.line}</p>
        </div>
      </section>

      <h2 className="section-title">
        항목별 운세<small>{fortunePass ? `상세 열람 ${passLabel}` : '점수·한 줄 무료 · 상세는 잠김'}</small>
      </h2>
      <div className="domain-list">
        {domains.map(entry => (
          <button className="domain" key={entry.domain} onClick={() => onOpenDomain(entry.domain)}>
            <header className="domain-head">
              <span className="domain-mark" aria-hidden="true">{entry.mark}</span>
              <span className="domain-name">
                {entry.domain}
                {entry.stage && <span className="stage-badge">오늘의 무대</span>}
              </span>
              <span className="domain-score">{entry.score}</span>
            </header>
            <p>{entry.line}</p>
            <span className="domain-bar" aria-hidden="true"><span style={{ width: `${entry.score}%` }} /></span>
            <span className="domain-more">
              {fortunePass ? '자세히 보기' : '자세히 보기 · 잠김'} <ChevronRight aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>

      <h2 className="section-title">오늘의 행운<small>무료</small></h2>
      <div className="lucky-grid">
        <div className="lucky"><Palette aria-hidden="true" /><small>색</small><b>{lucky.color}</b></div>
        <div className="lucky"><Shirt aria-hidden="true" /><small>소재</small><b>{lucky.material}</b></div>
        <div className="lucky"><Hash aria-hidden="true" /><small>숫자</small><b>{lucky.number}</b></div>
        <div className="lucky"><Compass aria-hidden="true" /><small>방향</small><b>{lucky.direction}</b></div>
      </div>

      <button className="link-row" onClick={() => onNavigate('home')}>
        <BookOpen aria-hidden="true" />
        <span>이 색으로 만든 오늘의 코디</span>
        <b>보러 가기</b>
      </button>

      <BottomTabs active="fortune" onNavigate={onNavigate} />
    </main>
  )
}

function StylebookScreen({
  log,
  closet,
  bias,
  today,
  tryonImages,
  onDeleteResult,
  onNavigate,
}: {
  log: OutfitEntry[]
  closet: ClosetItem[]
  bias: PersonalBias
  today: string
  tryonImages: TryonImage[]
  onDeleteResult: (image: TryonImage) => void
  onNavigate: (route: TabRoute) => void
}) {
  const now = new Date()
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))
  const [selected, setSelected] = useState(today)
  const [openResult, setOpenResult] = useState<TryonImage | null>(null)

  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  const monthCount = log.filter(entry => entry.date.startsWith(monthKey)).length

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekKey = localDateKey(weekStart)
  const weekCount = log.filter(entry => entry.date >= weekKey && entry.date <= today).length

  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  const entry = entryForDate(log, selected)
  const entryItems = entry
    ? entry.itemIds.map(id => closet.find(item => item.id === id) ?? null)
    : []
  const verdict = entry ? bias.entries.find(value => value.date === entry.date) : undefined

  return (
    <main className="app-screen stylebook-screen">
      <header className="page-heading">
        <div>
          <h1>스타일북</h1>
          <p>만든 모습과 실제로 입은 코디를 모아봐요.</p>
        </div>
      </header>

      <section className="saved-results" aria-labelledby="saved-results-title">
        <header className="content-heading">
          <div><h2 id="saved-results-title">내 입어보기</h2><p>만든 이미지는 직접 지우기 전까지 보관돼요.</p></div>
          <span>{tryonImages.length}</span>
        </header>

        {tryonImages.length > 0 ? (
          <div className="tryon-gallery">
            {tryonImages.map(image => {
              const shop = image.kind === 'shop' || isPreTryonKey(image.outfitKey)
              return (
                <button key={image.outfitKey} onClick={() => setOpenResult(image)}>
                  <img src={image.imageUrl} alt={shop ? '쇼핑 옷 입어보기 결과' : '오늘 코디 입어보기 결과'} />
                  <span>
                    <b>{shop ? '쇼핑 옷 입어보기' : '내 옷장 코디'}</b>
                    <small>{new Date(image.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</small>
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="inline-empty">
            <Sparkles aria-hidden="true" />
            <div><b>아직 만든 모습이 없어요</b><span>오늘 탭에서 코디를 골라 입어보세요.</span></div>
            <button onClick={() => onNavigate('home')}>입어보기</button>
          </div>
        )}
      </section>

      <section className="outfit-history" aria-labelledby="outfit-history-title">
        <header className="content-heading">
          <div><h2 id="outfit-history-title">코디 기록</h2><p>실제로 입기로 정한 날을 달력에서 확인해요.</p></div>
        </header>

        {log.length > 0 ? (
          <>
            <div className="streak">
              <div><small>이번 주</small><b>{weekCount}회</b></div>
              <div><small>이번 달</small><b>{monthCount}회</b></div>
            </div>

            <div className="cal-head">
              <strong>{month.getFullYear()}년 {month.getMonth() + 1}월</strong>
              <span className="cal-nav">
                <button aria-label="이전 달" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft aria-hidden="true" /></button>
                <button aria-label="다음 달" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight aria-hidden="true" /></button>
              </span>
            </div>

            <div className="weekdays" aria-hidden="true">
              {['일', '월', '화', '수', '목', '금', '토'].map(label => <span key={label}>{label}</span>)}
            </div>

            <div className="calendar" role="grid" aria-label={`${month.getFullYear()}년 ${month.getMonth() + 1}월 코디 기록`}>
              {Array.from({ length: firstWeekday }, (_, index) => <span className="day blank" key={`blank-${index}`} />)}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1
                const key = `${monthKey}-${String(day).padStart(2, '0')}`
                const dayEntry = entryForDate(log, key)
                const cover = dayEntry ? closet.find(item => dayEntry.itemIds.includes(item.id)) : undefined
                const classes = ['day']
                if (dayEntry) classes.push('has')
                if (key === today) classes.push('today')
                if (key === selected) classes.push('sel')
                return (
                  <button className={classes.join(' ')} key={key} aria-pressed={key === selected} aria-label={`${day}일${dayEntry ? ' 코디 확정' : ''}`} onClick={() => setSelected(key)}>
                    {cover ? <img src={cover.imageUrl} alt="" /> : null}<span>{day}</span>
                  </button>
                )
              })}
            </div>

            {entry ? (
              <section className="picked" aria-label={`${selected} 코디`}>
                <div className="outfit-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, entryItems.length)}, 1fr)` }}>
                  {entryItems.map((item, index) => (
                    <div className={`outfit-slot ${item ? '' : 'empty'}`} key={entry.itemIds[index]}>
                      {item ? <img src={item.imageUrl} alt={`${item.color} ${item.category}`} /> : <span className="slot-gone">삭제된 옷</span>}
                    </div>
                  ))}
                </div>
                <div className="outfit-meta">
                  <span className="mood">{entry.mood}</span>
                  <span className="fit-score">{verdict ? (verdict.verdict === 'good' ? '좋았어요' : verdict.reason ?? '아쉬웠어요') : '피드백 없음'}</span>
                </div>
              </section>
            ) : <p className="empty-line">이 날은 기록이 없어요.</p>}
          </>
        ) : (
          <div className="inline-empty compact">
            <BookOpen aria-hidden="true" />
            <div><b>아직 코디 기록이 없어요</b><span>입을 코디를 확정하면 하루씩 쌓여요.</span></div>
          </div>
        )}
      </section>

      {openResult && (
        <div className="result-viewer-layer" role="presentation" onClick={() => setOpenResult(null)}>
          <section className="result-viewer" role="dialog" aria-modal="true" aria-label="저장한 입어보기 결과" onClick={event => event.stopPropagation()}>
            <button className="result-viewer-close" onClick={() => setOpenResult(null)} aria-label="닫기"><X aria-hidden="true" /></button>
            <img src={openResult.imageUrl} alt="저장한 입어보기 결과 크게 보기" />
            <div>
              <span><b>{openResult.kind === 'shop' || isPreTryonKey(openResult.outfitKey) ? '쇼핑 옷 입어보기' : '내 옷장 코디'}</b><small>{new Date(openResult.createdAt).toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' })}</small></span>
              <button className="danger-button" onClick={() => { setOpenResult(null); onDeleteResult(openResult) }}><Trash2 aria-hidden="true" />결과 삭제</button>
            </div>
          </section>
        </div>
      )}

      <BottomTabs active="stylebook" onNavigate={onNavigate} />
    </main>
  )
}

function MyScreen({
  profile,
  pass,
  passLabel,
  trashCount,
  bodyPhoto,
  morningSettings,
  morningPermission,
  morningBusy,
  eveningSettings,
  eveningBusy,
  taste,
  onEditTaste,
  onEditProfile,
  onEditBody,
  onEditPhoto,
  onTrash,
  onData,
  onToggleMorning,
  onMorningTimeChange,
  onToggleEvening,
  onEveningTimeChange,
  onNavigate,
}: {
  profile: Profile
  pass: StylePass | null
  passLabel: string
  trashCount: number
  bodyPhoto: BodyPhoto | null
  morningSettings: MorningNotificationSettings
  morningPermission: MorningPermission
  morningBusy: boolean
  eveningSettings: MorningNotificationSettings
  eveningBusy: boolean
  taste: TastePreference
  onEditTaste: () => void
  onEditProfile: () => void
  onEditBody: () => void
  onEditPhoto: () => void
  onTrash: () => void
  onData: () => void
  onToggleMorning: () => void
  onMorningTimeChange: (value: string) => void
  onToggleEvening: () => void
  onEveningTimeChange: (value: string) => void
  onNavigate: (route: TabRoute) => void
}) {
  /** real이거나(사주 기능 꺼짐) real에서 만든 미입력 프로필이면 사주를 계산하지 않는다 */
  const sajuReady = FEATURES.saju && hasBirth(profile)
  const birthPillar = sajuReady ? birthDayPillar(profile) : null
  const pillars = sajuReady ? birthPillars(profile) : null
  const tasteSummary = hasTaste(taste)
    ? [...taste.moods, taste.silhouette, taste.colorTone && taste.colorTone !== '상관없음' ? `${taste.colorTone}한 색` : '']
      .filter(Boolean).join(' · ')
    : '아직 고르지 않음'
  const boundary = sajuReady ? hourBoundaryMinutes(profile) : null
  const bodyParts = [
    profile.body.heightCm ? `${profile.body.heightCm}cm` : '',
    profile.body.weightKg ? `${profile.body.weightKg}kg` : '',
    profile.body.topSize ? `상의 ${profile.body.topSize}` : '',
    profile.body.bottomWaistInch ? `하의 ${profile.body.bottomWaistInch}in` : '',
    profile.body.fitPreference ? FIT_PREFERENCE_LABEL[profile.body.fitPreference] : '',
    profile.body.shape ?? '',
    ...profile.body.chips,
  ].filter(Boolean)
  const bodyLabel = bodyParts.length > 0 ? bodyParts.join(' · ') : '아직 알려주지 않음'
  const morningActive = morningSettings.enabled && morningPermission === 'granted'
  const eveningActive = eveningSettings.enabled && morningPermission === 'granted'
  const morningStatus = morningPermission === 'unsupported'
    ? 'iPhone 앱에서 설정할 수 있어요'
    : morningPermission === 'checking'
      ? '알림 상태 확인 중…'
      : morningPermission === 'denied'
        ? 'iPhone 설정에서 알림 권한을 켜 주세요'
        : morningActive
          ? '매일 이 시간에 오늘 탭으로 안내'
          : '켜면 매일 한 번 오늘 코디를 알려드려요'

  return (
    <main className="app-screen my-screen">
      <header className="page-heading">
        <div><h1>마이</h1><p>내 스타일과 앱 설정을 관리해요.</p></div>
      </header>

      {FEATURES.saju && (birthPillar && pillars ? (
        <>
          <h2 className="section-title">내 사주</h2>
          <div className="my-card">
            <span>
              <small>{profile.y}년 {profile.m}월 {profile.d}일 · {profile.hour === undefined ? '태어난 시간 모름' : `${String(profile.hour).padStart(2, '0')}시`}</small>
              <strong>일간 {birthPillar.gan}({birthPillar.ko[0]}) · {birthPillar.element}의 기운{profile.hour === undefined ? ' · 삼주 기준' : ''}</strong>
            </span>
            <button className="edit" aria-label="사주 프로필 수정" onClick={onEditProfile}>수정</button>
          </div>

          <div className="pillar-card">
            <div className="pillar-row">
              {[
                { label: '연주', value: pillars.year },
                { label: '월주', value: pillars.month },
                { label: '일주', value: pillars.day },
                ...(pillars.hour ? [{ label: '시주', value: pillars.hour }] : []),
              ].map(entry => (
                <span className="pillar" key={entry.label}>
                  <small>{entry.label}</small>
                  <b>{entry.value.gan}{entry.value.zhi}</b>
                  <em>{entry.value.ko}</em>
                </span>
              ))}
            </div>
            <p className="pillar-note">
              절기 기준으로 계산했고, 태어난 시간은 <b>진태양시 {Math.abs(TRUE_SOLAR_OFFSET_MINUTES)}분</b>을 당겨서 봤어요
              (서울 경도 기준).
              {boundary !== null && boundary <= 10 && (
                <> 태어난 시각이 시주가 바뀌는 경계에서 <b>{boundary}분</b> 거리라, 실제 출생 시각이 조금만 달라도 시주가 바뀔 수 있어요.</>
              )}
            </p>
          </div>
        </>
      ) : (
        <>
          <h2 className="section-title">내 사주</h2>
          <div className="my-card">
            <span>
              <small>생년월일 미입력</small>
              <strong>입력하면 오늘의 운세를 볼 수 있어요</strong>
            </span>
            <button className="edit" aria-label="사주 프로필 입력" onClick={onEditProfile}>입력</button>
          </div>
        </>
      ))}

      <h2 className="section-title">체형</h2>
      <div className="my-card">
        <span>
          <small>선택 정보는 이 기기의 핏 계산에만 사용</small>
          <strong>{bodyLabel}</strong>
        </span>
        <button className="edit" aria-label="체형 수정" onClick={onEditBody}>수정</button>
      </div>

      <h2 className="section-title">내 사진</h2>
      <div className="my-card">
        <span>
          <small>입어보기용 전신 사진 · 이 기기에 저장</small>
          <strong>{bodyPhoto ? '전신 사진 1장 등록됨' : '아직 등록하지 않음'}</strong>
        </span>
        <button className="edit" aria-label={bodyPhoto ? '내 사진 관리' : '내 사진 등록'} onClick={onEditPhoto}>{bodyPhoto ? '관리' : '등록'}</button>
      </div>

      <h2 className="section-title">아침 브리핑</h2>
      <div className="my-card notification-card">
        <span className="notification-summary">
          <small>{morningStatus}</small>
          <strong><Bell aria-hidden="true" />{morningTimeLabel(morningSettings)}</strong>
        </span>
        <button
          type="button"
          className={`notification-switch ${morningActive ? 'on' : ''}`}
          role="switch"
          aria-checked={morningActive}
          aria-label="아침 브리핑 알림"
          disabled={morningBusy || morningPermission === 'checking' || morningPermission === 'unsupported'}
          onClick={onToggleMorning}
        >
          <span aria-hidden="true" />
        </button>
        <label className="notification-time">
          <Clock3 aria-hidden="true" />
          <span>알림 시간</span>
          <input
            type="time"
            aria-label="아침 브리핑 시간"
            value={morningTimeValue(morningSettings)}
            disabled={morningBusy || morningPermission === 'unsupported'}
            onChange={event => onMorningTimeChange(event.target.value)}
          />
        </label>
      </div>

      <h2 className="section-title">스타일 취향</h2>
      <div className="my-card">
        <span>
          <small>고른 것만 추천에 반영해요</small>
          <strong>{tasteSummary}</strong>
        </span>
        <button className="edit" aria-label="스타일 취향 수정" onClick={onEditTaste}>수정</button>
      </div>

      <h2 className="section-title">저녁 피드백 알림</h2>
      <div className="my-card notification-card">
        <span className="notification-summary">
          <small>{eveningActive ? '이 시간에 오늘 코디를 물어봐요' : '켜면 하루 한 번 만족도를 여쭤봐요'}</small>
          <strong><MoonStar aria-hidden="true" />{morningTimeLabel(eveningSettings)}</strong>
        </span>
        <button
          type="button"
          className={`notification-switch ${eveningActive ? 'on' : ''}`}
          role="switch"
          aria-checked={eveningActive}
          aria-label="저녁 피드백 알림"
          disabled={eveningBusy || morningPermission === 'checking' || morningPermission === 'unsupported'}
          onClick={onToggleEvening}
        >
          <span aria-hidden="true" />
        </button>
        <label className="notification-time">
          <Clock3 aria-hidden="true" />
          <span>알림 시간</span>
          <input
            type="time"
            aria-label="저녁 피드백 알림 시간"
            value={morningTimeValue(eveningSettings)}
            disabled={eveningBusy || morningPermission === 'unsupported'}
            onChange={event => onEveningTimeChange(event.target.value)}
          />
        </label>
      </div>

      <h2 className="section-title">오늘의 스타일 이용권</h2>
      <div className="my-card">
        <span>
          <small>오늘의 코디와 상세 콘텐츠를 편하게 볼 수 있어요</small>
          <strong>{isPassActive(pass, new Date()) ? `${passLabel} 이용 가능` : '필요할 때 다시 열 수 있어요'}</strong>
        </span>
      </div>

      <h2 className="section-title">휴지통</h2>
      <div className="my-card">
        <span>
          <small>7일 후 사진까지 완전 삭제</small>
          <strong>{trashCount}벌 보관 중</strong>
        </span>
        <button className="edit" aria-label="휴지통 열기" onClick={onTrash}>열기</button>
      </div>

      <h2 className="section-title">내 데이터</h2>
      <div className="my-card">
        <span>
          <small>백업 파일 만들기 · 가져오기 · 전체 삭제</small>
          <strong>이 기기에만 저장돼 있어요</strong>
        </span>
        <button className="edit" aria-label="내 데이터 열기" onClick={onData}>열기</button>
      </div>

      <BottomTabs active="my" onNavigate={onNavigate} />
    </main>
  )
}

function ProfileScreen({
  profile,
  onBack,
  onSave,
}: {
  profile: Profile
  onBack: () => void
  onSave: (profile: Profile) => void
}) {
  return (
    <main className="app-screen body-screen">
      <ScreenHeader title="사주 프로필" onBack={onBack} />
      <BirthForm
        initial={hasBirth(profile) ? profile : undefined}
        submitLabel="저장하기"
        onSubmit={birth => onSave({ ...profile, ...birth })}
      />
    </main>
  )
}

function ItemDetailScreen({
  item,
  closet,
  log,
  onBack,
  onDelete,
  onMakeOutfit,
}: {
  item: ClosetItem
  closet: ClosetItem[]
  log: OutfitEntry[]
  onBack: () => void
  onDelete: () => void
  onMakeOutfit: () => void
}) {
  const worn = wearCount(log, item.id)
  const lastWorn = log
    .filter(entry => entry.itemIds.includes(item.id))
    .map(entry => entry.date)
    .sort()
    .pop()

  const pairs = new Map<string, number>()
  for (const entry of log) {
    if (!entry.itemIds.includes(item.id)) continue
    for (const id of entry.itemIds) {
      if (id !== item.id) pairs.set(id, (pairs.get(id) ?? 0) + 1)
    }
  }
  const topPairs = [...pairs.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([id, count]) => ({ item: closet.find(entry => entry.id === id), count }))
    .filter((entry): entry is { item: ClosetItem; count: number } => Boolean(entry.item))

  // 달력 기준으로 센다 — 오늘 저녁에 확정한 옷이 "1일 전"으로 보이면 안 된다.
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const daysAgo = lastWorn
    ? Math.round((startOfToday.getTime() - new Date(`${lastWorn}T00:00:00`).getTime()) / 86_400_000)
    : null

  return (
    <main className="app-screen item-screen">
      <ScreenHeader title={`${item.color} ${item.category}`} onBack={onBack} />

      <div className="detail-photo">
        <img src={item.imageUrl} alt={`${item.color} ${item.category}`} />
      </div>

      <div className="tag-row">
        <span className="tag">{item.category}</span>
        <span className="tag">{item.color}</span>
        <span className="tag">{item.seasons.join(' · ')}</span>
        {item.fit && <span className="tag">{CLOSET_FIT_LABEL[item.fit]}</span>}
        <span className="tag">{item.source === 'camera' ? '카메라 등록' : '앨범 등록'}</span>
      </div>

      <div className="stat-row">
        <div className="stat"><small>착용 횟수</small><b>{worn}회</b></div>
        <div className="stat">
          <small>마지막 착용</small>
          <b>{daysAgo === null ? '없음' : daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}</b>
        </div>
      </div>

      {topPairs.length > 0 && (
        <>
          <h2 className="section-title">함께 입은 옷<small>상위 {topPairs.length}</small></h2>
          <div className="pair-row">
            {topPairs.map(pair => (
              <span className="pair" key={pair.item.id}>
                <img src={pair.item.imageUrl} alt="" />
                {pair.item.color} {pair.item.category} {pair.count}회
              </span>
            ))}
          </div>
        </>
      )}

      <button className="primary-button" onClick={onMakeOutfit}>
        <Sparkles aria-hidden="true" />이 옷으로 코디 만들기
      </button>

      <button className="danger-button" onClick={onDelete}>
        <Trash2 aria-hidden="true" />휴지통으로 옮기기
      </button>
      <p className="fine-print">휴지통에서 7일 동안 되돌릴 수 있어요.</p>
    </main>
  )
}

function TrashScreen({
  items,
  onBack,
  onRestore,
  onPurge,
  onPurgeAll,
}: {
  items: ClosetItem[]
  onBack: () => void
  onRestore: (id: string) => void
  onPurge: (id: string) => void
  onPurgeAll: () => void
}) {
  return (
    <main className="app-screen trash-screen">
      <ScreenHeader title="휴지통" onBack={onBack} />

      {items.length === 0 ? (
        <section className="blocked-card">
          <div className="blocked-mark" aria-hidden="true"><Trash2 /></div>
          <h2>휴지통이 비어 있어요</h2>
          <p>옷장에서 지운 옷이 7일 동안 여기 머물러요.</p>
        </section>
      ) : (
        <>
          <p className="trash-note">
            <Info aria-hidden="true" />7일이 지나면 사진까지 완전히 지워져요.
          </p>
          <div className="trash-list">
            {items.map(item => {
              const left = trashDaysLeft(item)
              return (
                <article className="trash-item" key={item.id}>
                  <img src={item.imageUrl} alt={`${item.color} ${item.category}`} />
                  <span>
                    <strong>{item.color} {item.category}</strong>
                    <small>{left === 0 ? '오늘까지' : `${left}일 남음`}</small>
                  </span>
                  <span className="trash-actions">
                    <button className="restore" onClick={() => onRestore(item.id)}>
                      <Undo2 aria-hidden="true" />되돌리기
                    </button>
                    <button className="icon-button" aria-label="완전 삭제" onClick={() => onPurge(item.id)}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </span>
                </article>
              )
            })}
          </div>
          <button className="danger-button" onClick={onPurgeAll}>
            <Trash2 aria-hidden="true" />휴지통 비우기
          </button>
        </>
      )}
    </main>
  )
}

function ClothingCategoryPicker({
  value,
  onChange,
  compact = false,
}: {
  value: ClosetCategory | null
  onChange: (category: ClosetCategory) => void
  compact?: boolean
}) {
  return (
    <fieldset className={`category-picker ${compact ? 'compact' : ''}`}>
      <legend>
        <span>어떤 옷인가요?</span>
        <small>{value ? `${value} 선택됨` : '먼저 종류를 선택해 주세요'}</small>
      </legend>
      <div>
        {CLOSET_CATEGORIES.map(category => (
          <button
            key={category}
            type="button"
            className={value === category ? 'active' : ''}
            aria-pressed={value === category}
            onClick={() => onChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function AddHub({
  onBack,
  onCamera,
  onAlbum,
}: {
  onBack: () => void
  onCamera: (category: ClosetCategory) => void
  onAlbum: (category: ClosetCategory) => void
}) {
  const [category, setCategory] = useState<ClosetCategory | null>(null)

  return (
    <main className="app-screen add-screen">
      <ScreenHeader title="옷 등록" onBack={onBack} />
      <section className="add-intro">
        <h1>옷 종류를 먼저<br />골라주세요</h1>
        <p>종류를 먼저 고르면 사진 등록이 더 빨라요.</p>
      </section>

      <ClothingCategoryPicker value={category} onChange={setCategory} />

      <div className="method-list">
        <button className="method-card recommended" disabled={!category} onClick={() => category && onCamera(category)}>
          <span className="method-icon"><CameraIcon aria-hidden="true" /></span>
          <span className="method-copy">
            <small>추천 · 여러 벌</small>
            <strong>카메라로 촬영</strong>
            <span>멈추지 않고 1–4벌을 이어서 찍어요</span>
          </span>
          <ChevronRight aria-hidden="true" />
        </button>
        <button className="method-card" disabled={!category} onClick={() => category && onAlbum(category)}>
          <span className="method-icon"><Images aria-hidden="true" /></span>
          <span className="method-copy">
            <strong>앨범에서 선택</strong>
            <span>이미 찍은 사진을 한 번에 가져와요</span>
          </span>
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <aside className="storage-note">
        <ShieldCheck aria-hidden="true" />
        <p><b>평소 이 기기에 보관</b><br />입어보기 때 고른 사진만 생성에 사용하고, 촬영 위치 정보는 저장 전에 제거해요.</p>
      </aside>
    </main>
  )
}

/** 스타일 취향 — M8-기획.md §3.4. 전부 선택이고 안 고르면 이전과 결과가 같다. */
function TasteScreen({
  taste,
  onBack,
  onChange,
  onSave,
}: {
  taste: TastePreference
  onBack: () => void
  onChange: (next: TastePreference) => void
  onSave: () => void
}) {
  return (
    <main className="app-screen data-screen">
      <ScreenHeader title="스타일 취향" onBack={onBack} />

      <h2 className="photo-title">어떤 느낌으로<br /><em>입고 싶으세요?</em></h2>
      <p className="photo-lead">고르지 않아도 괜찮아요. 고른 것만 추천에 반영해요.</p>

      <div className="taste-axis">
        <b>무드<small>복수 선택</small></b>
        <div className="chip-row">
          {TASTE_MOODS.map(mood => (
            <button
              key={mood}
              className={taste.moods.includes(mood) ? 'active' : ''}
              aria-pressed={taste.moods.includes(mood)}
              onClick={() => onChange({
                ...taste,
                moods: taste.moods.includes(mood)
                  ? taste.moods.filter(value => value !== mood)
                  : [...taste.moods, mood as TasteMood],
              })}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      <div className="taste-axis">
        <b>실루엣</b>
        <div className="chip-row">
          {TASTE_SILHOUETTES.map(value => (
            <button
              key={value}
              className={taste.silhouette === value ? 'active' : ''}
              aria-pressed={taste.silhouette === value}
              onClick={() => onChange({ ...taste, silhouette: taste.silhouette === value ? undefined : value })}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="taste-axis">
        <b>노출</b>
        <div className="chip-row">
          {TASTE_COVERAGE.map(value => (
            <button
              key={value}
              className={taste.coverage === value ? 'active' : ''}
              aria-pressed={taste.coverage === value}
              onClick={() => onChange({ ...taste, coverage: taste.coverage === value ? undefined : value })}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="taste-axis">
        <b>색 취향</b>
        <div className="chip-row">
          {TASTE_COLOR_TONES.map(value => (
            <button
              key={value}
              className={taste.colorTone === value ? 'active' : ''}
              aria-pressed={taste.colorTone === value}
              onClick={() => onChange({ ...taste, colorTone: taste.colorTone === value ? undefined : value })}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <p className="photo-note">
        행운색과 취향이 부딪히면 <b>행운색이 이겨요</b> — 그게 이 앱의 재미니까요.
      </p>

      <button className="primary-button" onClick={onSave}>
        <Check aria-hidden="true" />저장하고 다시 추천받기
      </button>
    </main>
  )
}

/** 하루 운세 상세 — 점신형 상세 보기. 항목 카드에서 들어온다. */
function FortuneDetailScreen({
  entry,
  fortune,
  onBack,
  onCoordinate,
}: {
  entry: DomainFortune
  fortune: DayFortune
  onBack: () => void
  onCoordinate: () => void
}) {
  const detail = domainDetail(entry, fortune)

  return (
    <main className="app-screen fortune-detail-screen" style={fortuneAccent(fortune.luckyElement)}>
      <ScreenHeader title={`${entry.domain} 운세`} onBack={onBack} />

      <section className="detail-hero">
        <span className="domain-mark" aria-hidden="true">{entry.mark}</span>
        <div>
          <h2>{detail.headline}</h2>
          <span className="detail-score">오늘 {entry.score}점 · {fortune.dayPillar.gan}{fortune.dayPillar.zhi}일</span>
        </div>
      </section>

      <p className="detail-body">{detail.body}</p>

      <h2 className="section-title">하루 흐름</h2>
      <ol className="flow-list">
        {detail.flow.map(slot => (
          <li key={slot.label}>
            <span className="flow-when"><b>{slot.label}</b><small>{slot.hours}</small></span>
            <p>{slot.line}</p>
          </li>
        ))}
      </ol>

      <div className="advice-grid">
        <section className="advice good">
          <h3>오늘 해보면 좋아요</h3>
          <ul>{detail.todo.map(line => <li key={line}>{line}</li>)}</ul>
        </section>
        <section className="advice bad">
          <h3>오늘은 피하세요</h3>
          <ul>{detail.avoid.map(line => <li key={line}>{line}</li>)}</ul>
        </section>
      </div>

      <p className="detail-style"><Palette aria-hidden="true" />{detail.styleTip}</p>

      <button className="primary-button" onClick={onCoordinate}>
        <Shirt aria-hidden="true" />이 기운에 맞춘 오늘의 코디 보기
      </button>

      <p className="fine-print">
        운세 해석은 역술 감수 전 v0.1이에요. 재미와 참고용으로 봐주세요.
      </p>
    </main>
  )
}

function DataScreen({
  closetCount,
  logCount,
  resultCount,
  hasBodyPhoto,
  busy,
  saved,
  preview,
  onBack,
  onExport,
  onPickFile,
  onImport,
  onCancelImport,
  onWipe,
}: {
  closetCount: number
  logCount: number
  resultCount: number
  hasBodyPhoto: boolean
  busy: string
  saved: string
  preview: BackupSummary | null
  onBack: () => void
  onExport: (includeBodyPhoto: boolean) => void
  onPickFile: (file: File) => void
  onImport: (mode: ImportMode) => void
  onCancelImport: () => void
  onWipe: () => void
}) {
  const [includeBodyPhoto, setIncludeBodyPhoto] = useState(false)
  const [mode, setMode] = useState<ImportMode>('merge')
  const fileInput = useRef<HTMLInputElement>(null)

  if (preview) {
    return (
      <main className="app-screen data-screen">
        <ScreenHeader title="가져오기 확인" onBack={onCancelImport} />

        <div className="my-card">
          <span>
            <small>{preview.createdAt ? new Date(preview.createdAt).toLocaleDateString('ko-KR') : '날짜 없음'} 백업</small>
            <strong>옷 {preview.closetCount}벌 · 코디 기록 {preview.logCount}일</strong>
            <p>{preview.hasProfile ? (FEATURES.saju ? '사주·체형 프로필 있음' : '체형 프로필 있음') : '프로필 없음'} · {preview.hasBodyPhoto ? '전신 사진 포함' : '전신 사진 미포함'}</p>
          </span>
        </div>

        {closetCount > 0 && (
          <p className="data-warn">
            <AlertCircle aria-hidden="true" />
            지금 이 기기에는 옷 {closetCount}벌이 있어요. 어떻게 할지 골라주세요.
          </p>
        )}

        <div className="data-choices">
          <button
            className={mode === 'merge' ? 'active' : ''}
            aria-pressed={mode === 'merge'}
            onClick={() => setMode('merge')}
          >
            <b>합치기</b>
            <small>중복은 건너뛰고 새 옷만 추가해요 (권장)</small>
          </button>
          <button
            className={mode === 'replace' ? 'active' : ''}
            aria-pressed={mode === 'replace'}
            onClick={() => setMode('replace')}
          >
            <b>덮어쓰기</b>
            <small>지금 옷장을 지우고 파일 내용으로 바꿔요</small>
          </button>
        </div>

        <p className="photo-note">파일을 먼저 검사한 뒤 반영해요. 중간에 실패하면 지금 옷장은 그대로 남아요.</p>

        <button className="primary-button" disabled={Boolean(busy)} onClick={() => onImport(mode)}>
          {busy || (mode === 'merge' ? '합치기로 가져오기' : '덮어쓰기로 가져오기')}
        </button>
        <button className="onboarding-next" onClick={onCancelImport}>취소</button>
      </main>
    )
  }

  return (
    <main className="app-screen data-screen">
      <ScreenHeader title="내 데이터" onBack={onBack} />

      <div className="my-card">
        <span>
          <small>이 기기에 저장된 것</small>
          <strong>옷 {closetCount}벌 · 입어보기 {resultCount}장</strong>
          <p>코디 기록 {logCount}일 · {FEATURES.saju ? '사주·체형 프로필' : '체형 프로필'}{hasBodyPhoto ? ' · 전신 사진 1장' : ''}</p>
        </span>
      </div>

      <h2 className="section-title">백업 파일 만들기</h2>
      <button
        type="button"
        className={`consent-item ${includeBodyPhoto ? 'on' : ''}`}
        role="checkbox"
        aria-checked={includeBodyPhoto}
        disabled={!hasBodyPhoto}
        onClick={() => setIncludeBodyPhoto(current => !current)}
      >
        <span className="consent-tick" aria-hidden="true"><Check /></span>
        <span>
          <b>전신 사진도 담기</b>
          <small>민감정보라 기본은 제외예요. {hasBodyPhoto ? '' : '등록한 전신 사진이 없어요.'}</small>
        </span>
      </button>

      <button className="primary-button" disabled={Boolean(busy) || closetCount === 0} onClick={() => onExport(includeBodyPhoto)}>
        <Download aria-hidden="true" />{busy || '백업 파일 만들기'}
      </button>
      {saved && <p className="data-saved"><Check aria-hidden="true" />{saved}</p>}

      <h2 className="section-title">백업 파일 가져오기</h2>
      <input
        ref={fileInput}
        type="file"
        accept=".zip,application/zip"
        style={{ display: 'none' }}
        onChange={event => {
          const file = event.target.files?.[0]
          if (file) onPickFile(file)
          event.target.value = ''
        }}
      />
      <button className="secondary-button" disabled={Boolean(busy)} onClick={() => fileInput.current?.click()}>
        <Upload aria-hidden="true" />파일 고르기
      </button>
      <p className="photo-note">다른 기기에서 만든 백업 파일을 고르면 내용을 먼저 확인할 수 있어요.</p>

      <button className="danger-button" onClick={onWipe}>
        <Trash2 aria-hidden="true" />내 데이터 전체 삭제
      </button>
    </main>
  )
}

const GARMENT_TIPS = [
  { title: '바닥에 펼치고 위에서', body: '구겨진 채로 두면 색과 기장이 다르게 잡혀요.' },
  { title: '그림자 지지 않게', body: '창을 등지면 옷이 어둡게 나와요. 옆에서 빛이 오게 두세요.' },
  { title: '한 번에 한 벌', body: '겹쳐 놓으면 어떤 옷인지 구분하지 못해요.' },
] as const

const BODY_TIPS = [
  { title: '머리부터 발까지', body: '무릎에서 잘리면 하의 기장을 못 맞춰요.' },
  { title: '밝은 곳에서 정면으로', body: '어두우면 옷 색이 실제와 다르게 합성돼요.' },
  { title: '몸에 붙는 옷일수록 정확', body: '두꺼운 외투를 입고 찍으면 체형이 뭉개져요.' },
] as const

/** 촬영 팁 — M8-기획.md §3.3. 좋은 예/아쉬운 예를 도형으로 보여준다. */
function TipList({ tips }: { tips: readonly { title: string; body: string }[] }) {
  return (
    <ul className="tip-list">
      {tips.map((tip, index) => (
        <li key={tip.title}>
          <span className="tip-demo" aria-hidden="true">
            <span className={`tip-shot ok shape-${index}`}><em>좋아요</em></span>
            <span className={`tip-shot bad shape-${index}`}><em>아쉬워요</em></span>
          </span>
          <span>
            <b>{tip.title}</b>
            <small>{tip.body}</small>
          </span>
        </li>
      ))}
    </ul>
  )
}

function CameraTipSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="옷 사진 잘 찍는 법">
      <button className="sheet-dim" onClick={onClose} aria-label="닫기" />
      <section className="filter-sheet tip-sheet">
        <span className="sheet-handle" aria-hidden="true" />
        <h2>옷 사진 잘 찍는 법</h2>
        <TipList tips={GARMENT_TIPS} />
        <button className="primary-button" onClick={onClose}>알겠어요</button>
      </section>
    </div>
  )
}

/** 내 사진 — M6-기획.md §5.1 (없음 / 동의 / 등록됨) */
function BodyPhotoScreen({
  photo,
  draft,
  available,
  onBack,
  onPick,
  onCancelDraft,
  onConsent,
  onDelete,
}: {
  photo: BodyPhoto | null
  draft: PreparedImage | null
  available: boolean
  onBack: () => void
  onPick: (source: ClosetSource) => void
  onCancelDraft: () => void
  onConsent: (checked: string[]) => void
  onDelete: () => void
}) {
  const [checked, setChecked] = useState<string[]>([])

  useEffect(() => {
    if (!draft) setChecked([])
  }, [draft])

  const toggle = (id: string) => {
    setChecked(current => (
      current.includes(id) ? current.filter(value => value !== id) : [...current, id]
    ))
  }

  if (draft) {
    return (
      <main className="app-screen photo-screen">
        <ScreenHeader title="사진 사용 동의" onBack={onCancelDraft} />

        <p className="photo-lead">네 가지를 모두 확인해야 등록할 수 있어요.</p>

        <ul className="consent-list">
          {BODY_PHOTO_CONSENTS.map(consent => (
            <li key={consent.id}>
              <button
                type="button"
                className={`consent-item ${checked.includes(consent.id) ? 'on' : ''}`}
                role="checkbox"
                aria-checked={checked.includes(consent.id)}
                onClick={() => toggle(consent.id)}
              >
                <span className="consent-tick" aria-hidden="true"><Check /></span>
                <span>
                  <b>{consent.title}</b>
                  <small>{consent.body}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <button
          className="primary-button consent-submit"
          disabled={!isConsentComplete(checked)}
          onClick={() => onConsent(checked)}
        >
          <ShieldCheck aria-hidden="true" />
          {isConsentComplete(checked) ? '동의하고 등록' : '네 가지를 모두 확인해 주세요'}
        </button>
      </main>
    )
  }

  return (
    <main className="app-screen photo-screen">
      <ScreenHeader title="내 사진" onBack={onBack} />

      {photo ? (
        <>
          <h2 className="photo-title">등록됐어요</h2>
          <p className="photo-lead">오늘 코디에서 <em>입은 모습 보기</em>를 누르면 이 사진으로 만들어요.</p>
          <div className="photo-card">
            <img src={photo.imageUrl} alt="등록한 전신 사진" />
            <div>
              <b>전신 사진</b>
              <p>
                {new Date(photo.createdAt).toLocaleDateString('ko-KR')} 등록<br />
                {photo.width} × {photo.height} · 위치정보 없음
              </p>
              <span className="photo-state">
                {available ? '미리보기에 사용 중' : '생성 준비 중'}
              </span>
            </div>
          </div>
          <button className="secondary-button" onClick={() => onPick('album')}>
            <Images aria-hidden="true" />사진 바꾸기
          </button>
          <button className="danger-button" onClick={onDelete}>
            <Trash2 aria-hidden="true" />사진 삭제
          </button>
          <p className="photo-note">
            삭제해도 스타일북에 저장한 입어보기 결과는 그대로 남아요.
          </p>
        </>
      ) : (
        <>
          <p className="photo-eyebrow">AI 착장 미리보기 준비</p>
          <h2 className="photo-title">내 전신 사진 <em>한 장</em>이면<br />입은 모습까지 볼 수 있어요</h2>
          <p className="photo-lead">
            정면으로 서서 전신이 다 나온 사진이 가장 잘 맞아요. 사진은 기기 안에만 저장하고,
            미리보기를 열 때만 생성에 사용해요.
          </p>
          <div className="body-photo-tips"><TipList tips={BODY_TIPS} /></div>
          <div className="photo-actions">
            <button className="primary-button" onClick={() => onPick('camera')}>
              <CameraIcon aria-hidden="true" />지금 촬영하기
            </button>
            <button className="secondary-button" onClick={() => onPick('album')}>
              <Images aria-hidden="true" />앨범에서 고르기
            </button>
          </div>
          <p className="photo-note">등록하지 않아도 오늘의 코디 추천은 그대로 받을 수 있어요.</p>
        </>
      )}
    </main>
  )
}

/** AI 착장 미리보기 — M6-기획.md §5.2 (사진 없음 / 준비 중 / 생성 / 열람 / 실패 / 게이트) */
function TryonScreen({
  outfits,
  outfit,
  images,
  photo,
  available,
  busy,
  error,
  onBack,
  onSelect,
  onGenerate,
  onRegisterPhoto,
  onConfirm,
}: {
  outfits: Outfit[]
  outfit: Outfit | null
  images: TryonImage[]
  photo: BodyPhoto | null
  available: boolean
  busy: boolean
  error: string
  onBack: () => void
  onSelect: (id: string) => void
  onGenerate: (outfit: Outfit) => void
  onRegisterPhoto: () => void
  onConfirm: (outfit: Outfit) => void
}) {
  const current = outfit
    ? images.find(image => image.outfitKey === outfitKeyOf(outfit.items.map(item => item.id))) ?? null
    : null

  return (
    <main className="app-screen tryon-screen">
      <ScreenHeader title="AI 착장 미리보기" onBack={onBack} />

      {outfits.length > 1 && (
        <div className="tryon-tabs" role="tablist">
          {outfits.slice(0, 3).map((option, index) => {
            const made = images.some(
              image => image.outfitKey === outfitKeyOf(option.items.map(item => item.id)),
            )
            return (
              <button
                key={option.id}
                role="tab"
                aria-selected={option.id === outfit?.id}
                className={option.id === outfit?.id ? 'active' : ''}
                onClick={() => onSelect(option.id)}
              >
                {index === 0 ? '오늘의 추천' : `대안 ${index}`}
                <small>{made ? '저장됨' : '아직 만들지 않음'}</small>
              </button>
            )
          })}
        </div>
      )}

      {!photo ? (
        <section className="tryon-empty">
          <UserRound aria-hidden="true" />
          <h2>아직 내 사진이 없어요</h2>
          <p>전신 사진 한 장을 등록하면 오늘 코디를 입은 모습으로 볼 수 있어요.</p>
          <button className="primary-button" onClick={onRegisterPhoto}>
            <Plus aria-hidden="true" />내 사진 등록하기
          </button>
        </section>
      ) : !available ? (
        <section className="tryon-empty">
          <Sparkles aria-hidden="true" />
          <h2>지금은 입어보기를 쉬고 있어요</h2>
          <p>
            잠시 후 다시 열어 주세요. 등록한 사진과 스타일북은 그대로 보관돼요.
          </p>
          <p className="photo-note">등록한 사진은 그대로 기기 안에 있어요.</p>
        </section>
      ) : current ? (
        <>
          <figure className="tryon-figure">
            <img src={current.imageUrl} alt="AI가 만든 착장 미리보기" />
            <figcaption>
              <span className="tryon-time">
                {new Date(current.createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })} 생성
              </span>
              <span className="tryon-watermark">입핏 AI</span>
            </figcaption>
          </figure>
          <p className="tryon-note">
            <Info aria-hidden="true" />
            <span><b>실제와 다를 수 있어요.</b> 색·핏은 참고용이고, 몸의 형태를 그대로 옮기지 못할 수 있어요.</span>
          </p>
          <p className="photo-note">만든 이미지는 스타일북에 계속 저장돼요.</p>
          {outfit && (
            <button className="primary-button" onClick={() => onConfirm(outfit)}>
              <Check aria-hidden="true" />이 코디로 입을게요
            </button>
          )}
        </>
      ) : busy ? (
        <section className="tryon-progress" aria-busy="true">
          <LoaderCircle className="spin" aria-hidden="true" />
          <h2>입은 모습을 그리는 중이에요</h2>
          <p>보통 1~2분 걸려요. 이 화면을 벗어나도 계속 만들고, 완성되면 스타일북에 저장해요.</p>
          <div className="tryon-bar"><i /></div>
        </section>
      ) : error ? (
        <section className="tryon-empty">
          <AlertCircle aria-hidden="true" />
          <h2>이번엔 잘 안 나왔어요</h2>
          <p className="tryon-reason">{error}</p>
          <div className="tryon-collage">
            {(outfit?.items ?? []).slice(0, 4).map(item => (
              <img key={item.id} src={item.imageUrl} alt="" />
            ))}
          </div>
          {outfit && (
            <button className="secondary-button" onClick={() => onGenerate(outfit)}>
              <RefreshCw aria-hidden="true" />다시 시도
            </button>
          )}
        </section>
      ) : (
        <section className="tryon-empty">
          <Sparkles aria-hidden="true" />
          <h2>오늘 코디를 입은 모습으로 볼까요?</h2>
          <p>광고를 끝까지 보거나 쿠팡을 연 뒤 만들기 시작해요. 선택 전에는 사진 처리를 시작하지 않아요.</p>
          {outfit && (
            <button className="primary-button" onClick={() => onGenerate(outfit)}>
              <Sparkles aria-hidden="true" />입은 모습 만들기
            </button>
          )}
        </section>
      )}
    </main>
  )
}

/** 사기 전에 입어봄 — M10-기획.md §2, M10-시안.html §3. 상태 분기와 정직 표기는 TryonScreen 과 같은 문법을 쓴다. */
function ShopTryonScreen({
  garments,
  result,
  photo,
  available,
  busy,
  error,
  partnersReady,
  onBack,
  onPick,
  onRemove,
  onGenerate,
  onRegisterPhoto,
  onBuy,
  onReset,
}: {
  garments: ShopGarment[]
  result: TryonImage | null
  photo: BodyPhoto | null
  available: boolean
  busy: boolean
  error: string
  partnersReady: boolean
  onBack: () => void
  onPick: (category: ClosetCategory) => void
  onRemove: (index: number) => void
  onGenerate: () => void
  onRegisterPhoto: () => void
  onBuy: () => void
  onReset: () => void
}) {
  const [category, setCategory] = useState<ClosetCategory | null>(null)

  return (
    <main className="app-screen tryon-screen">
      <ScreenHeader title="사기 전에 입어봄" onBack={onBack} />

      {!photo ? (
        <section className="tryon-empty shop-empty">
          <span className="shop-empty-kicker">처음 한 번만 준비</span>
          <UserRound aria-hidden="true" />
          <h2>아직 내 사진이 없어요</h2>
          <p>내 사진 한 장만 등록하면 다음부터는 상품 사진만 골라 바로 입어볼 수 있어요.</p>
          <button className="primary-button" onClick={onRegisterPhoto}>
            <Plus aria-hidden="true" />내 사진 등록하기
          </button>
          <small className="shop-empty-trust"><ShieldCheck aria-hidden="true" />사진은 기기 안에 저장해요</small>
        </section>
      ) : !available ? (
        <section className="tryon-empty">
          <Sparkles aria-hidden="true" />
          <h2>지금은 입어보기를 쉬고 있어요</h2>
          <p>잠시 후 다시 열어 주세요. 등록한 사진과 스타일북은 그대로 보관돼요.</p>
        </section>
      ) : busy ? (
        <section className="tryon-progress" aria-busy="true">
          <LoaderCircle className="spin" aria-hidden="true" />
          <h2>입은 모습을 그리는 중이에요</h2>
          <p>보통 1~2분 걸려요. 이 화면을 벗어나도 계속 만들고, 완성되면 스타일북에 저장해요.</p>
          <div className="tryon-bar"><i /></div>
        </section>
      ) : result ? (
        <>
          <figure className="tryon-figure">
            <img src={result.imageUrl} alt="사려는 옷을 입은 모습 미리보기" />
            <figcaption>
              <span className="tryon-time">
                {new Date(result.createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })} 생성
              </span>
              <span className="tryon-watermark">입핏 AI</span>
            </figcaption>
          </figure>
          <p className="tryon-note">
            <Info aria-hidden="true" />
            <span><b>실제와 다를 수 있어요.</b> 색·핏은 참고용이고, 실물·사이즈는 판매 페이지에서 확인하세요.</span>
          </p>
          {partnersReady ? (
            <>
              <button className="primary-button" onClick={onBuy}>
                <ShoppingBag aria-hidden="true" />쿠팡에서 이 옷 찾기
              </button>
              <p className="fine-print">{PARTNERS_DISCLOSURE}</p>
            </>
          ) : (
            <span className="soon-chip">구매 링크 준비 중</span>
          )}
          <button className="secondary-button" onClick={onReset}>
            <RefreshCw aria-hidden="true" />다른 상품으로 다시
          </button>
          <p className="photo-note">만든 이미지는 스타일북에 계속 저장돼요.</p>
        </>
      ) : (
        <section className="shop-pick">
          <h2>입어볼 옷을 추가해 주세요</h2>
          <p>옷 종류를 고른 다음, 쇼핑몰에서 저장한 상품 사진을 선택해 주세요.</p>

          <ClothingCategoryPicker value={category} onChange={setCategory} compact />

          {garments.length > 0 && (
            <div className="shop-garment-list">
              {garments.map((garment, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`상품 사진 ${index + 1} 빼기`}
                >
                  <img src={garment.dataUrl} alt="" />
                  <span>{garment.category} · 빼기</span>
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="tryon-reason"><AlertCircle aria-hidden="true" /> {error}</p>
          )}

          {garments.length < PRE_TRYON_MAX_GARMENTS && (
            <button className="secondary-button" disabled={!category} onClick={() => category && onPick(category)}>
              <Images aria-hidden="true" />{category ? `${category} 사진 선택` : '옷 종류를 먼저 선택해 주세요'}
            </button>
          )}
          {garments.length > 0 && (
            <button className="primary-button" onClick={onGenerate}>
              <Sparkles aria-hidden="true" />입은 모습 만들기
            </button>
          )}

          <p className="photo-note">선택한 상품 사진은 입어보기 결과를 만드는 데만 사용해요.</p>
        </section>
      )}
    </main>
  )
}

function CameraScreen({
  drafts,
  setDrafts,
  initialCategory,
  onClose,
  onReview,
  onAlbum,
  onSettings,
}: {
  drafts: ClosetDraft[]
  setDrafts: React.Dispatch<React.SetStateAction<ClosetDraft[]>>
  initialCategory: ClosetCategory
  onClose: () => void
  onReview: () => void
  onAlbum: (category: ClosetCategory) => void
  onSettings: () => void
}) {
  const [category, setCategory] = useState<ClosetCategory>(initialCategory)
  const [previewActive, setPreviewActive] = useState(false)
  const [cameraState, setCameraState] = useState<'starting' | 'ready' | 'denied' | 'failed'>('starting')
  const [cameraMessage, setCameraMessage] = useState('')
  const [capturing, setCapturing] = useState(false)
  const [tipsOpen, setTipsOpen] = useState(() => {
    try {
      return localStorage.getItem(CAMERA_TIPS_KEY) !== 'seen'
    } catch {
      return true
    }
  })

  useEffect(() => {
    let mounted = true
    document.documentElement.classList.add('camera-active')
    document.body.classList.add('camera-active')

    const start = async () => {
      try {
        const checked = await NativeCamera.checkPermissions()
        const permission = checked.camera === 'prompt'
          ? (await NativeCamera.requestPermissions({ permissions: ['camera'] })).camera
          : checked.camera

        if (permission !== 'granted') {
          if (mounted) setCameraState('denied')
          return
        }

        const started = await withCameraPreview(async () => {
          if (!mounted) return false
          await stopCameraPreview()
          await CameraPreview.start({
            parent: 'cameraPreview',
            className: 'camera-preview-feed',
            position: 'rear',
            toBack: true,
            disableAudio: true,
            width: Math.round(window.innerWidth),
            height: Math.round(window.innerHeight),
            paddingBottom: 0,
            rotateWhenOrientationChanged: true,
          })
          return true
        })

        if (started && mounted) {
          setPreviewActive(true)
          setCameraState('ready')
        }
      } catch (error) {
        if (mounted) {
          setCameraState(/denied|permission/i.test(errorMessage(error)) ? 'denied' : 'failed')
          setCameraMessage(Capacitor.isNativePlatform() ? '미리보기를 시작하지 못했어요. 시스템 카메라를 이용해 주세요.' : '')
        }
      }
    }

    void start()
    return () => {
      mounted = false
      document.documentElement.classList.remove('camera-active')
      document.body.classList.remove('camera-active')
      void withCameraPreview(stopCameraPreview)
    }
  }, [])

  const addPreparedDraft = async (source: string) => {
    const next = await draftFromSource(source, 'camera', category)
    setDrafts(current => [...current, next].slice(0, MAX_CAPTURE_COUNT))
  }

  const capturePreview = async () => {
    if (capturing || drafts.length >= MAX_CAPTURE_COUNT) return
    setCapturing(true)
    setCameraMessage('')
    try {
      const result = await CameraPreview.capture({ width: 1600, height: 1600, quality: 82 })
      const source = result.value.startsWith('data:')
        ? result.value
        : `data:image/jpeg;base64,${result.value}`
      await addPreparedDraft(source)
    } catch (error) {
      setCameraState('failed')
      setPreviewActive(false)
      setCameraMessage(errorMessage(error))
    } finally {
      setCapturing(false)
    }
  }

  const captureWithSystemCamera = async () => {
    if (capturing || drafts.length >= MAX_CAPTURE_COUNT) return
    setCapturing(true)
    setCameraMessage('')
    try {
      const result = await NativeCamera.takePhoto({
        quality: 82,
        targetWidth: 1600,
        targetHeight: 1600,
        correctOrientation: true,
        encodingType: EncodingType.JPEG,
        saveToGallery: false,
        cameraDirection: CameraDirection.Rear,
        editable: 'no',
        includeMetadata: false,
        webUseInput: true,
      })
      await addPreparedDraft(await mediaSource(result))
    } catch (error) {
      if (!isCancellation(error)) setCameraMessage('카메라를 열지 못했어요. 앨범에서 선택해 주세요.')
    } finally {
      setCapturing(false)
    }
  }

  return (
    <main className={`app-screen camera-screen ${previewActive ? 'preview-active' : ''}`}>
      <div id="cameraPreview" className="camera-preview-host" aria-hidden="true" />
      <div className="camera-overlay">
        <header className="camera-header">
          <button className="camera-icon-button" onClick={onClose} aria-label="촬영 닫기"><X aria-hidden="true" /></button>
          <h1>연속 촬영</h1>
          <button className="camera-icon-button tip" onClick={() => setTipsOpen(true)} aria-label="촬영 팁 보기">?</button>
        </header>

        <div className="category-scroll" aria-label="현재 옷 종류">
          {CAMERA_CATEGORIES.map(value => (
            <button
              key={value}
              className={category === value ? 'active' : ''}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {value}
            </button>
          ))}
        </div>

        {cameraState === 'ready' ? (
          <div className="camera-guide"><span>옷 전체가 선 안에 들어오게 해주세요</span></div>
        ) : (
          <section className="camera-fallback">
            {cameraState === 'starting'
              ? <LoaderCircle className="spin" aria-hidden="true" />
              : <CameraOff aria-hidden="true" />}
            <h2>{cameraState === 'starting' ? '카메라를 준비하고 있어요' : '카메라 미리보기를 열 수 없어요'}</h2>
            <p>
              {cameraState === 'denied'
                ? '카메라 권한을 허용하거나 앨범에서 사진을 골라 주세요.'
                : '이 기기에서는 시스템 카메라를 한 번씩 열어 이어서 등록할 수 있어요.'}
            </p>
            {cameraMessage && <small>{cameraMessage}</small>}
            <div>
              {cameraState === 'denied' && Capacitor.isNativePlatform() && (
                <button className="camera-secondary" onClick={onSettings}><Settings aria-hidden="true" />설정 열기</button>
              )}
              <button className="camera-secondary" onClick={() => void captureWithSystemCamera()}>
                <CameraIcon aria-hidden="true" />시스템 카메라
              </button>
              <button className="camera-secondary" onClick={() => onAlbum(category)}><Images aria-hidden="true" />앨범 선택</button>
            </div>
          </section>
        )}

        <footer className="camera-controls">
          <div className="capture-tray" aria-label={`촬영한 옷 ${drafts.length}벌`}>
            {drafts[0] ? <img src={drafts[0].previewUrl} alt="" /> : <Images aria-hidden="true" />}
            {drafts.length > 0 && <b>{drafts.length}</b>}
          </div>
          <button
            className="shutter-button"
            onClick={() => void (previewActive ? capturePreview() : captureWithSystemCamera())}
            disabled={capturing || drafts.length >= MAX_CAPTURE_COUNT || cameraState === 'starting'}
            aria-label={capturing ? '사진 처리 중' : '사진 촬영'}
          >
            <span />
          </button>
          <button className="camera-done" disabled={drafts.length === 0} onClick={onReview}>확인</button>
        </footer>
      </div>

      {tipsOpen && (
        <CameraTipSheet onClose={() => {
          setTipsOpen(false)
          try {
            localStorage.setItem(CAMERA_TIPS_KEY, 'seen')
          } catch {
            // 저장 못 해도 팁은 ? 로 다시 볼 수 있다.
          }
        }} />
      )}
    </main>
  )
}

function BatchReview({
  drafts,
  photosLimited,
  onChange,
  onBack,
  onReplace,
  onToggleTrim,
  onAddPhotos,
  onSave,
}: {
  drafts: ClosetDraft[]
  photosLimited: boolean
  onChange: React.Dispatch<React.SetStateAction<ClosetDraft[]>>
  onBack: () => void
  onReplace: (index: number) => void
  onToggleTrim: (index: number, useTrimmed: boolean) => void
  onAddPhotos: () => void
  onSave: () => void
}) {
  const [index, setIndex] = useState(0)
  const [validation, setValidation] = useState('')
  const draft = drafts[index]

  useEffect(() => {
    if (index >= drafts.length) setIndex(Math.max(0, drafts.length - 1))
  }, [drafts.length, index])

  const patchDraft = (patch: Partial<ClosetDraft>) => {
    onChange(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
    setValidation('')
  }

  const toggleSeason = (season: ClosetSeason) => {
    const seasons = draft.seasons.includes(season)
      ? draft.seasons.filter(value => value !== season)
      : [...draft.seasons, season]
    patchDraft({ seasons })
  }

  const goNext = () => {
    if (!isDraftComplete(draft)) {
      setValidation('종류·대표 색·계절을 모두 확인해 주세요.')
      return
    }
    if (index < drafts.length - 1) {
      setIndex(current => current + 1)
      setValidation('')
      return
    }
    const incomplete = drafts.findIndex(item => !isDraftComplete(item))
    if (incomplete >= 0) {
      setIndex(incomplete)
      setValidation('이 사진의 필수 태그를 확인해 주세요.')
      return
    }
    onSave()
  }

  const removeCurrent = () => {
    onChange(current => current.filter((_, itemIndex) => itemIndex !== index))
    setIndex(current => Math.max(0, current - 1))
  }

  return (
    <main className="app-screen review-screen">
      <ScreenHeader title="사진 확인" onBack={onBack} />
      {photosLimited && drafts.length < MAX_CAPTURE_COUNT && (
        <aside className="limited-banner">
          <Images aria-hidden="true" />
          <span>선택한 사진만 볼 수 있어요. 설정에서 모든 사진을 허용하면 앨범·즐겨찾기가 다 보여요.</span>
          <button onClick={onAddPhotos}>사진 더 선택</button>
        </aside>
      )}

      <header className="review-title">
        <h1>이 옷이 맞나요?</h1>
        <span>{index + 1} / {drafts.length}</span>
      </header>

      <section className="review-photo">
        <img src={draft.previewUrl} alt="등록할 옷 사진" />
        <div>
          <button onClick={() => onReplace(index)}><RefreshCw aria-hidden="true" />사진 바꾸기</button>
          {drafts.length > 1 && (
            <button onClick={removeCurrent} aria-label="이 사진 제외"><Trash2 aria-hidden="true" /></button>
          )}
        </div>
      </section>

      {(draft.trimmed || draft.originalBase64) && (
        <div className="trim-row">
          <p><Sparkles aria-hidden="true" />배경이 넓어 여백을 정리했어요.</p>
          <div>
            <button
              className={draft.trimmed ? '' : 'on'}
              aria-pressed={!draft.trimmed}
              onClick={() => onToggleTrim(index, false)}
            >
              원본
            </button>
            <button
              className={draft.trimmed ? 'on' : ''}
              aria-pressed={Boolean(draft.trimmed)}
              onClick={() => onToggleTrim(index, true)}
            >
              정리본
            </button>
          </div>
        </div>
      )}

      <TagField label="종류" hint="필수" invalid={Boolean(validation && !draft.category)} scroll>
        {CLOSET_CATEGORIES.map(value => (
          <button
            key={value}
            className={`tag-choice ${draft.category === value ? 'active' : ''}`}
            aria-pressed={draft.category === value}
            onClick={() => patchDraft({ category: value })}
          >
            {value}
          </button>
        ))}
      </TagField>

      <TagField label="대표 색" hint="필수" invalid={Boolean(validation && !draft.color)} scroll>
        {CLOSET_COLORS.map(value => (
          <button
            key={value}
            className={`tag-choice ${draft.color === value ? 'active' : ''}`}
            aria-pressed={draft.color === value}
            onClick={() => patchDraft({ color: value as ClosetColor })}
          >
            {value === '아이보리' && <span className="color-dot" aria-hidden="true" />}
            {value}
          </button>
        ))}
      </TagField>

      <TagField label="입기 좋은 계절" hint="복수 선택" invalid={Boolean(validation && draft.seasons.length === 0)}>
        {CLOSET_SEASONS.map(value => (
          <button
            key={value}
            className={`tag-choice ${draft.seasons.includes(value) ? 'active' : ''}`}
            aria-pressed={draft.seasons.includes(value)}
            onClick={() => toggleSeason(value)}
          >
            {value}
          </button>
        ))}
      </TagField>

      {(draft.category === '상의' || draft.category === '하의' || draft.category === '아우터') && (
        <TagField label="옷 자체 핏" hint="선택 · 추천 정밀도" invalid={false}>
          {CLOSET_FITS.map(value => (
            <button
              key={value}
              className={`tag-choice ${draft.fit === value ? 'active' : ''}`}
              aria-pressed={draft.fit === value}
              onClick={() => patchDraft({ fit: draft.fit === value ? '' : value })}
            >
              {CLOSET_FIT_LABEL[value]}
            </button>
          ))}
        </TagField>
      )}

      {validation && <p className="validation-message" role="alert"><AlertCircle aria-hidden="true" />{validation}</p>}

      <button className="primary-button review-next" onClick={goNext}>
        {index === drafts.length - 1 ? `${drafts.length}벌 옷장에 저장` : '다음 옷 확인'}
        <ChevronRight aria-hidden="true" />
      </button>
    </main>
  )
}

function ClosetScreen({
  closet,
  log,
  trashCount,
  onAdd,
  onOpenItem,
  onTrash,
  onNavigate,
}: {
  closet: ClosetItem[]
  log: OutfitEntry[]
  trashCount: number
  onAdd: () => void
  onOpenItem: (id: string) => void
  onTrash: () => void
  onNavigate: (route: TabRoute) => void
}) {
  const [query, setQuery] = useState<ClosetQuery>(EMPTY_CLOSET_QUERY)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searching, setSearching] = useState(false)

  const counts = useMemo(() => categoryCounts(closet), [closet])
  const wear = useMemo(() => wearCounts(log), [log])
  const visible = useMemo(() => applyClosetQuery(closet, query, wear), [closet, query, wear])
  const filterCount = activeFilterCount(query)

  const patch = (next: Partial<ClosetQuery>) => setQuery(current => ({ ...current, ...next }))

  if (searching) {
    return (
      <main className="app-screen closet-screen">
        <ScreenHeader title="옷장 검색" onBack={() => {
          setSearching(false)
          patch({ search: '' })
        }} />

        <label className="closet-search">
          <Search aria-hidden="true" />
          <input
            autoFocus
            value={query.search}
            aria-label="옷 검색"
            placeholder="색이나 종류로 찾기"
            onChange={event => patch({ search: event.target.value })}
          />
          {query.search && (
            <button onClick={() => patch({ search: '' })} aria-label="검색어 지우기"><X aria-hidden="true" /></button>
          )}
        </label>
        <p className="closet-search-hint">
          <Info aria-hidden="true" />옷 이름 검색은 아직 없어요. 색·종류·계절로 찾을 수 있어요.
        </p>

        {visible.length === 0 ? (
          <section className="closet-empty">
            <div><Search aria-hidden="true" /></div>
            <h2>조건에 맞는 옷이 없어요</h2>
            <p>검색어나 필터를 바꿔 보세요.</p>
            <button className="secondary-button" onClick={() => setQuery(EMPTY_CLOSET_QUERY)}>
              <RefreshCw aria-hidden="true" />조건 초기화
            </button>
            <button className="primary-button" onClick={onAdd}><Plus aria-hidden="true" />옷 등록하기</button>
          </section>
        ) : (
          <ClosetGrid items={visible} wear={wear} onOpenItem={onOpenItem} onAdd={onAdd} />
        )}
      </main>
    )
  }

  return (
    <main className="app-screen closet-screen">
      <header className="closet-header">
        <div><h1>내 옷장</h1><p>{closet.length}벌 · 이 기기에 저장됨</p></div>
        <button className="icon-button" onClick={() => setSearching(true)} aria-label="옷 검색"><Search aria-hidden="true" /></button>
        <button className="add-button" onClick={onAdd} aria-label="옷 추가"><Plus aria-hidden="true" /></button>
      </header>

      <div className="closet-categories" aria-label="옷 종류">
        <button
          className={query.category === '전체' ? 'active' : ''}
          aria-pressed={query.category === '전체'}
          onClick={() => patch({ category: '전체' })}
        >
          전체 {closet.length}
        </button>
        {CLOSET_CATEGORIES.map(category => (
          <button
            key={category}
            className={`${query.category === category ? 'active' : ''} ${counts[category] === 0 ? 'empty' : ''}`}
            aria-pressed={query.category === category}
            onClick={() => patch({ category })}
          >
            {category} {counts[category]}
          </button>
        ))}
      </div>

      <div className="closet-tools">
        <button className={filterCount > 0 ? 'active' : ''} onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal aria-hidden="true" />필터{filterCount > 0 ? ` ${filterCount}` : ''}
        </button>
        <button onClick={() => setSheetOpen(true)}>{CLOSET_SORT_LABEL[query.sort]} <ChevronDown aria-hidden="true" /></button>
        {trashCount > 0 && (
          <button onClick={onTrash}><Trash2 aria-hidden="true" />휴지통 {trashCount}</button>
        )}
      </div>

      {closet.length === 0 ? (
        <section className="closet-empty">
          <div><Shirt aria-hidden="true" /></div>
          <h2>아직 등록한 옷이 없어요</h2>
          <p>카메라나 앨범에서 한 벌부터 가져와 보세요.</p>
          <button className="primary-button" onClick={onAdd}><Plus aria-hidden="true" />첫 옷 등록</button>
        </section>
      ) : visible.length === 0 ? (
        <section className="closet-empty">
          <div><Search aria-hidden="true" /></div>
          <h2>조건에 맞는 옷이 없어요</h2>
          <p>필터를 바꾸거나 초기화해 보세요.</p>
          <button className="secondary-button" onClick={() => setQuery(EMPTY_CLOSET_QUERY)}>
            <RefreshCw aria-hidden="true" />조건 초기화
          </button>
          <button className="primary-button" onClick={onAdd}><Plus aria-hidden="true" />옷 등록하기</button>
        </section>
      ) : (
        <ClosetGrid items={visible} wear={wear} onOpenItem={onOpenItem} onAdd={onAdd} />
      )}

      {sheetOpen && (
        <ClosetFilterSheet
          query={query}
          resultCount={visible.length}
          onChange={patch}
          onReset={() => setQuery({ ...EMPTY_CLOSET_QUERY, category: query.category })}
          onClose={() => setSheetOpen(false)}
        />
      )}

      <BottomTabs active="closet" onNavigate={onNavigate} />
    </main>
  )
}

function ClosetGrid({
  items,
  wear,
  onOpenItem,
  onAdd,
}: {
  items: ClosetItem[]
  wear: Record<string, number>
  onOpenItem: (id: string) => void
  onAdd: () => void
}) {
  return (
    <section className="closet-grid" aria-label="저장된 옷">
      {items.map(item => (
        <button className="closet-card" key={item.id} onClick={() => onOpenItem(item.id)}>
          <img src={item.imageUrl} alt={`${item.color} ${item.category}`} />
          <div>
            <strong>{item.color} {item.category}</strong>
            <span>{item.seasons.join(', ')} · {wear[item.id] ? `${wear[item.id]}회 입음` : '아직 안 입음'}</span>
          </div>
        </button>
      ))}
      <button className="closet-add-card" onClick={onAdd}><Plus aria-hidden="true" />다른 옷 추가</button>
    </section>
  )
}

/** 색·계절·출처·정렬을 한 시트에 모은다 — M7-와이어프레임 화면 2 */
function ClosetFilterSheet({
  query,
  resultCount,
  onChange,
  onReset,
  onClose,
}: {
  query: ClosetQuery
  resultCount: number
  onChange: (next: Partial<ClosetQuery>) => void
  onReset: () => void
  onClose: () => void
}) {
  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="옷장 필터">
      <button className="sheet-dim" onClick={onClose} aria-label="필터 닫기" />
      <section className="filter-sheet">
        <span className="sheet-handle" aria-hidden="true" />

        <h2>색</h2>
        <div className="chip-row">
          {CLOSET_COLORS.map(color => (
            <button
              key={color}
              className={query.colors.includes(color) ? 'active' : ''}
              aria-pressed={query.colors.includes(color)}
              onClick={() => onChange({ colors: toggleValue(query.colors, color) })}
            >
              {color}
            </button>
          ))}
        </div>

        <h2>계절</h2>
        <div className="chip-row">
          {CLOSET_SEASONS.map(season => (
            <button
              key={season}
              className={query.seasons.includes(season) ? 'active' : ''}
              aria-pressed={query.seasons.includes(season)}
              onClick={() => onChange({ seasons: toggleValue(query.seasons, season) })}
            >
              {season}
            </button>
          ))}
        </div>

        <h2>등록 방법</h2>
        <div className="chip-row">
          {(['camera', 'album'] as ClosetSource[]).map(source => (
            <button
              key={source}
              className={query.sources.includes(source) ? 'active' : ''}
              aria-pressed={query.sources.includes(source)}
              onClick={() => onChange({ sources: toggleValue(query.sources, source) })}
            >
              {CLOSET_SOURCE_LABEL[source]}
            </button>
          ))}
        </div>

        <h2>정렬</h2>
        <div className="chip-row">
          {CLOSET_SORTS.map(sort => (
            <button
              key={sort}
              className={query.sort === sort ? 'active' : ''}
              aria-pressed={query.sort === sort}
              onClick={() => onChange({ sort })}
            >
              {CLOSET_SORT_LABEL[sort]}
            </button>
          ))}
        </div>

        <div className="sheet-actions">
          <button className="secondary-button" onClick={onReset}>초기화</button>
          <button className="primary-button" onClick={onClose}>{resultCount}벌 보기</button>
        </div>
      </section>
    </div>
  )
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="screen-header">
      <button className="icon-button" onClick={onBack} aria-label="뒤로"><ChevronLeft aria-hidden="true" /></button>
      <h1>{title}</h1>
    </header>
  )
}

function TagField({
  label,
  hint,
  invalid,
  scroll = false,
  children,
}: {
  label: string
  hint: string
  invalid: boolean
  scroll?: boolean
  children: React.ReactNode
}) {
  return (
    <fieldset className={`tag-field ${invalid ? 'invalid' : ''} ${scroll ? 'scroll' : ''}`}>
      <legend><span>{label}</span><small>{hint}</small></legend>
      <div>{children}</div>
    </fieldset>
  )
}

/** real에는 운세 탭이 없다 — M9-기획.md §3 */
const ALL_TABS: { route: TabRoute; label: string; Icon: typeof Sun }[] = [
  { route: 'home', label: '오늘', Icon: Sun },
  { route: 'closet', label: '옷장', Icon: LayoutGrid },
  { route: 'fortune', label: '운세', Icon: MoonStar },
  { route: 'stylebook', label: '스타일북', Icon: BookOpen },
  { route: 'my', label: '마이', Icon: UserRound },
]
const TABS = ALL_TABS.filter(tab => FEATURES.saju || tab.route !== 'fortune')

function BottomTabs({ active, onNavigate }: { active: TabRoute; onNavigate: (route: TabRoute) => void }) {
  return (
    <nav
      className="bottom-tabs"
      aria-label="주요 메뉴"
      style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}
    >
      {TABS.map(({ route, label, Icon }) => (
        <button
          key={route}
          className={active === route ? 'active' : ''}
          aria-current={active === route ? 'page' : undefined}
          onClick={() => onNavigate(route)}
        >
          <Icon aria-hidden="true" />{label}
        </button>
      ))}
    </nav>
  )
}
