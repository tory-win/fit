import { describe, expect, it } from 'vitest'
import type { LocalNotificationsPlugin } from '@capacitor/local-notifications'
import {
  DEFAULT_EVENING_NOTIFICATION,
  DEFAULT_MORNING_NOTIFICATION,
  EVENING_NOTIFICATION_ID,
  EVENING_NOTIFICATION_KIND,
  MORNING_NOTIFICATION_ID,
  MORNING_NOTIFICATION_KIND,
  eveningNotificationDescriptor,
  listenForNotification,
  morningNotificationDescriptor,
  morningTimeLabel,
  morningTimeValue,
  parseMorningNotification,
  parseMorningTime,
  scheduleMorningNotification,
  updateMorningNotification,
} from './morningNotification'

describe('parseMorningNotification', () => {
  it('uses 07:00 and disabled when the record cannot be trusted', () => {
    expect(parseMorningNotification(null)).toEqual(DEFAULT_MORNING_NOTIFICATION)
    expect(parseMorningNotification('{broken')).toEqual(DEFAULT_MORNING_NOTIFICATION)
    expect(parseMorningNotification(JSON.stringify({ enabled: 'yes', hour: 29, minute: -1 })))
      .toEqual(DEFAULT_MORNING_NOTIFICATION)
  })

  it('round-trips a valid preference', () => {
    expect(parseMorningNotification(JSON.stringify({ enabled: true, hour: 8, minute: 30 })))
      .toEqual({ enabled: true, hour: 8, minute: 30 })
  })
})

describe('morning time', () => {
  it('parses the native time input and rejects impossible times', () => {
    expect(parseMorningTime('06:45')).toEqual({ hour: 6, minute: 45 })
    expect(parseMorningTime('6:45')).toBeNull()
    expect(parseMorningTime('24:00')).toBeNull()
    expect(parseMorningTime('07:60')).toBeNull()
  })

  it('uses stable input and Korean display labels', () => {
    expect(morningTimeValue({ enabled: false, hour: 7, minute: 5 })).toBe('07:05')
    expect(morningTimeLabel({ enabled: false, hour: 0, minute: 0 })).toBe('오전 12:00')
    expect(morningTimeLabel({ enabled: true, hour: 13, minute: 30 })).toBe('오후 1:30')
  })
})

describe('morning notification schedule', () => {
  it('is a quiet daily briefing that opens the Today tab', () => {
    const notification = morningNotificationDescriptor({ enabled: true, hour: 7, minute: 15 })
    expect(notification).toMatchObject({
      id: MORNING_NOTIFICATION_ID,
      schedule: {
        on: { hour: 7, minute: 15 },
        repeats: true,
      },
      interruptionLevel: 'active',
      extra: {
        kind: 'morning-briefing',
        route: 'home',
      },
    })
    expect(notification.sound).toBeUndefined()
  })

  it('cancels the old time before scheduling the new one', async () => {
    const calls: string[] = []
    const scheduler = {
      cancel: async options => {
        calls.push(`cancel:${options.notifications[0]?.id}`)
      },
      schedule: async options => {
        calls.push(`schedule:${options.notifications[0]?.id}`)
        return { notifications: [{ id: options.notifications[0]?.id ?? -1 }] }
      },
    } satisfies Pick<LocalNotificationsPlugin, 'cancel' | 'schedule'>

    await scheduleMorningNotification({ enabled: true, hour: 8, minute: 20 }, scheduler)
    expect(calls).toEqual([
      `cancel:${MORNING_NOTIFICATION_ID}`,
      `schedule:${MORNING_NOTIFICATION_ID}`,
    ])
  })

  it('restores the previous OS schedule when Preferences persistence fails', async () => {
    const calls: string[] = []
    const scheduler = {
      cancel: async options => {
        calls.push(`cancel:${options.notifications[0]?.id}`)
      },
      schedule: async options => {
        const notification = options.notifications[0]
        calls.push(`schedule:${notification.schedule?.on?.hour}:${notification.schedule?.on?.minute}`)
        return { notifications: [{ id: notification.id }] }
      },
    } satisfies Pick<LocalNotificationsPlugin, 'cancel' | 'schedule'>

    await expect(updateMorningNotification(
      { enabled: true, hour: 7, minute: 0 },
      { enabled: true, hour: 8, minute: 30 },
      scheduler,
      async () => {
        calls.push('persist:error')
        throw new Error('Preferences unavailable')
      },
    )).rejects.toThrow('Preferences unavailable')

    expect(calls).toEqual([
      `cancel:${MORNING_NOTIFICATION_ID}`,
      'schedule:8:30',
      'persist:error',
      `cancel:${MORNING_NOTIFICATION_ID}`,
      'schedule:7:0',
    ])
  })
})

describe('저녁 피드백 알림', () => {
  it('아침 알림과 다른 id·kind 로 예약한다', () => {
    const descriptor = eveningNotificationDescriptor({ enabled: true, hour: 21, minute: 30 })
    expect(descriptor.id).toBe(EVENING_NOTIFICATION_ID)
    expect(descriptor.id).not.toBe(MORNING_NOTIFICATION_ID)
    expect(descriptor.extra).toMatchObject({ kind: EVENING_NOTIFICATION_KIND, route: 'home' })
    expect(descriptor.schedule).toMatchObject({ on: { hour: 21, minute: 30 }, repeats: true })
  })

  it('저녁 알림은 조용한 등급으로 보낸다', () => {
    expect(eveningNotificationDescriptor(DEFAULT_EVENING_NOTIFICATION).interruptionLevel).toBe('passive')
    expect(DEFAULT_EVENING_NOTIFICATION).toEqual({ enabled: false, hour: 21, minute: 0 })
  })

  it('알림 탭 리스너는 등록한 종류만 통과시킨다', async () => {
    const opened: string[] = []
    let handler: ((event: unknown) => void) | undefined
    const client = {
      addListener: (_name: string, callback: (event: unknown) => void) => {
        handler = callback
        return Promise.resolve({ remove: () => Promise.resolve() })
      },
    } as unknown as Parameters<typeof listenForNotification>[2]

    await listenForNotification([EVENING_NOTIFICATION_KIND], kind => opened.push(kind), client)
    handler?.({ notification: { extra: { kind: MORNING_NOTIFICATION_KIND } } })
    handler?.({ notification: { extra: { kind: EVENING_NOTIFICATION_KIND } } })
    handler?.({ notification: { extra: {} } })

    expect(opened).toEqual([EVENING_NOTIFICATION_KIND])
  })
})
