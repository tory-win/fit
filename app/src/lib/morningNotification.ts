import type { PermissionState, PluginListenerHandle } from '@capacitor/core'
import {
  LocalNotifications,
  type LocalNotificationSchema,
  type LocalNotificationsPlugin,
} from '@capacitor/local-notifications'
import { Preferences } from '@capacitor/preferences'
import { FEATURES } from './appEnv'

export const MORNING_NOTIFICATION_KEY = 'ojjeom.notification.v1'
export const MORNING_NOTIFICATION_ID = 7001
export const MORNING_NOTIFICATION_KIND = 'morning-briefing'

export interface MorningNotificationSettings {
  enabled: boolean
  hour: number
  minute: number
}

export const DEFAULT_MORNING_NOTIFICATION: MorningNotificationSettings = {
  enabled: false,
  hour: 7,
  minute: 0,
}

type NotificationScheduler = Pick<LocalNotificationsPlugin, 'cancel' | 'schedule'>
type NotificationPermissionClient = Pick<LocalNotificationsPlugin, 'checkPermissions' | 'requestPermissions'>
type NotificationActionClient = Pick<LocalNotificationsPlugin, 'addListener'>
type NotificationPersist = (settings: MorningNotificationSettings) => Promise<void>

function validInteger(value: unknown, min: number, max: number, fallback: number): number {
  return Number.isInteger(value) && Number(value) >= min && Number(value) <= max
    ? Number(value)
    : fallback
}

export function parseMorningNotification(raw: string | null): MorningNotificationSettings {
  if (!raw) return { ...DEFAULT_MORNING_NOTIFICATION }

  try {
    const parsed = JSON.parse(raw) as Partial<MorningNotificationSettings>
    return {
      enabled: parsed.enabled === true,
      hour: validInteger(parsed.hour, 0, 23, DEFAULT_MORNING_NOTIFICATION.hour),
      minute: validInteger(parsed.minute, 0, 59, DEFAULT_MORNING_NOTIFICATION.minute),
    }
  } catch {
    return { ...DEFAULT_MORNING_NOTIFICATION }
  }
}

export function parseMorningTime(value: string): Pick<MorningNotificationSettings, 'hour' | 'minute'> | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null
  return { hour, minute }
}

export function morningTimeValue(settings: MorningNotificationSettings): string {
  return `${String(settings.hour).padStart(2, '0')}:${String(settings.minute).padStart(2, '0')}`
}

export function morningTimeLabel(settings: MorningNotificationSettings): string {
  const period = settings.hour < 12 ? '오전' : '오후'
  const hour = settings.hour % 12 || 12
  return `${period} ${hour}:${String(settings.minute).padStart(2, '0')}`
}

export function morningNotificationDescriptor(
  settings: MorningNotificationSettings,
): LocalNotificationSchema {
  return {
    id: MORNING_NOTIFICATION_ID,
    title: '오늘의 입핏이 도착했어요',
    body: FEATURES.saju
      ? '날씨와 운세에 맞춘 오늘 코디를 확인해 보세요.'
      : '날씨에 맞춘 오늘 코디를 확인해 보세요.',
    schedule: {
      on: { hour: settings.hour, minute: settings.minute },
      repeats: true,
      allowWhileIdle: true,
    },
    threadIdentifier: MORNING_NOTIFICATION_KIND,
    interruptionLevel: 'active',
    extra: {
      kind: MORNING_NOTIFICATION_KIND,
      route: 'home',
    },
  }
}

export async function loadMorningNotification(): Promise<MorningNotificationSettings> {
  const { value } = await Preferences.get({ key: MORNING_NOTIFICATION_KEY })
  return parseMorningNotification(value)
}

export async function saveMorningNotification(settings: MorningNotificationSettings): Promise<void> {
  await Preferences.set({
    key: MORNING_NOTIFICATION_KEY,
    value: JSON.stringify(settings),
  })
}

export async function removeMorningNotificationSettings(): Promise<void> {
  await Preferences.remove({ key: MORNING_NOTIFICATION_KEY })
}

export async function checkMorningNotificationPermission(
  client: NotificationPermissionClient = LocalNotifications,
): Promise<PermissionState> {
  return (await client.checkPermissions()).display
}

export async function requestMorningNotificationPermission(
  client: NotificationPermissionClient = LocalNotifications,
): Promise<PermissionState> {
  return (await client.requestPermissions()).display
}

export async function cancelMorningNotification(
  scheduler: NotificationScheduler = LocalNotifications,
): Promise<void> {
  await scheduler.cancel({ notifications: [{ id: MORNING_NOTIFICATION_ID }] })
}

export async function scheduleMorningNotification(
  settings: MorningNotificationSettings,
  scheduler: NotificationScheduler = LocalNotifications,
): Promise<void> {
  await cancelMorningNotification(scheduler)
  await scheduler.schedule({ notifications: [morningNotificationDescriptor(settings)] })
}

async function applyMorningNotification(
  settings: MorningNotificationSettings,
  scheduler: NotificationScheduler,
): Promise<void> {
  if (settings.enabled) {
    await scheduleMorningNotification(settings, scheduler)
    return
  }
  await cancelMorningNotification(scheduler)
}

/**
 * Keeps the OS pending request and Preferences record aligned.
 * If persistence fails after changing the OS request, restore the previous OS state.
 */
export async function updateMorningNotification(
  previous: MorningNotificationSettings,
  next: MorningNotificationSettings,
  scheduler: NotificationScheduler = LocalNotifications,
  persist: NotificationPersist = saveMorningNotification,
): Promise<void> {
  await applyMorningNotification(next, scheduler)

  try {
    await persist(next)
  } catch (error) {
    await applyMorningNotification(previous, scheduler)
    throw error
  }
}

export async function listenForMorningNotification(
  onOpen: () => void,
  client: NotificationActionClient = LocalNotifications,
): Promise<PluginListenerHandle> {
  return client.addListener('localNotificationActionPerformed', event => {
    if (event.notification.extra?.kind === MORNING_NOTIFICATION_KIND) onOpen()
  })
}

/* ── 저녁 피드백 알림 ── 기획서 R-6. 확정한 코디의 만족도를 그날 안에 남기게 한다. */

export const EVENING_NOTIFICATION_KEY = 'ojjeom.notification.evening.v1'
export const EVENING_NOTIFICATION_ID = 7002
export const EVENING_NOTIFICATION_KIND = 'evening-feedback'

export const DEFAULT_EVENING_NOTIFICATION: MorningNotificationSettings = {
  enabled: false,
  hour: 21,
  minute: 0,
}

export function eveningNotificationDescriptor(
  settings: MorningNotificationSettings,
): LocalNotificationSchema {
  return {
    id: EVENING_NOTIFICATION_ID,
    title: '오늘 코디는 어땠어요?',
    body: '한 번만 남겨주면 내일 추천이 더 맞아져요.',
    schedule: {
      on: { hour: settings.hour, minute: settings.minute },
      repeats: true,
      allowWhileIdle: true,
    },
    threadIdentifier: EVENING_NOTIFICATION_KIND,
    interruptionLevel: 'passive',
    extra: {
      kind: EVENING_NOTIFICATION_KIND,
      route: 'home',
    },
  }
}

export async function loadEveningNotification(): Promise<MorningNotificationSettings> {
  const { value } = await Preferences.get({ key: EVENING_NOTIFICATION_KEY })
  const parsed = parseMorningNotification(value)
  return value ? parsed : { ...DEFAULT_EVENING_NOTIFICATION }
}

export async function saveEveningNotification(settings: MorningNotificationSettings): Promise<void> {
  await Preferences.set({ key: EVENING_NOTIFICATION_KEY, value: JSON.stringify(settings) })
}

export async function removeEveningNotificationSettings(): Promise<void> {
  await Preferences.remove({ key: EVENING_NOTIFICATION_KEY })
}

export async function cancelEveningNotification(
  scheduler: NotificationScheduler = LocalNotifications,
): Promise<void> {
  await scheduler.cancel({ notifications: [{ id: EVENING_NOTIFICATION_ID }] })
}

export async function scheduleEveningNotification(
  settings: MorningNotificationSettings,
  scheduler: NotificationScheduler = LocalNotifications,
): Promise<void> {
  await cancelEveningNotification(scheduler)
  await scheduler.schedule({ notifications: [eveningNotificationDescriptor(settings)] })
}

async function applyEveningNotification(
  settings: MorningNotificationSettings,
  scheduler: NotificationScheduler,
): Promise<void> {
  if (settings.enabled) {
    await scheduleEveningNotification(settings, scheduler)
    return
  }
  await cancelEveningNotification(scheduler)
}

/** 아침 알림과 같은 규칙 — 저장이 실패하면 OS 예약을 되돌린다. */
export async function updateEveningNotification(
  previous: MorningNotificationSettings,
  next: MorningNotificationSettings,
  scheduler: NotificationScheduler = LocalNotifications,
  persist: NotificationPersist = saveEveningNotification,
): Promise<void> {
  await applyEveningNotification(next, scheduler)

  try {
    await persist(next)
  } catch (error) {
    await applyEveningNotification(previous, scheduler)
    throw error
  }
}

export async function listenForNotification(
  kinds: readonly string[],
  onOpen: (kind: string) => void,
  client: NotificationActionClient = LocalNotifications,
): Promise<PluginListenerHandle> {
  return client.addListener('localNotificationActionPerformed', event => {
    const kind = event.notification.extra?.kind
    if (typeof kind === 'string' && kinds.includes(kind)) onOpen(kind)
  })
}
