// 게이트 — 2026-07-26 사용자 결정으로 정책을 바꿨다.
//
//  · 코디(옷) 열람: 광고·쿠팡 1회 = 열람권 1장. 열람권을 쓰면 그날 코디가 열린다.
//    같은 날 다시 볼 때는 차감하지 않는다(한 번 연 것을 또 사게 하지 않는다).
//  · 운세 상세: 시간제 2시간 (`lib/pass.ts`).
//
// 이전 정책은 광고 1회 = 24시간 무제한이었다.

import { Preferences } from '@capacitor/preferences'

export const GATE_KEY = 'ojjeom.gate.v1'
/** 신규 사용자가 첫날 한 번은 그냥 볼 수 있게 준다. */
export const WELCOME_CREDITS = 1

export interface GateState {
  date: string
  /** 오늘 코디가 열려 있는가 */
  outfitUnlocked: boolean
  /** 남은 열람권 */
  credits: number
  /** 환영 열람권을 이미 준 날 */
  welcomedOn?: string
}

export function emptyGate(today: string): GateState {
  return { date: today, outfitUnlocked: false, credits: 0 }
}

export function parseGate(value: string | null, today: string): GateState {
  if (!value) return emptyGate(today)

  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return emptyGate(today)

    const gate = parsed as Partial<GateState>
    const credits = Number.isFinite(gate.credits) ? Math.max(0, Math.floor(Number(gate.credits))) : 0

    // 날짜가 바뀌면 열림 상태는 사라진다. 열람권은 남는다 — 이미 광고를 본 대가라서.
    if (gate.date !== today) {
      return {
        date: today,
        outfitUnlocked: false,
        credits,
        ...(typeof gate.welcomedOn === 'string' ? { welcomedOn: gate.welcomedOn } : {}),
      }
    }

    return {
      date: today,
      outfitUnlocked: gate.outfitUnlocked === true,
      credits,
      ...(typeof gate.welcomedOn === 'string' ? { welcomedOn: gate.welcomedOn } : {}),
    }
  } catch {
    return emptyGate(today)
  }
}

/** 첫 실행에 열람권 1장을 준다. 하루에 한 번만. */
export function withWelcome(gate: GateState, today: string): GateState {
  if (gate.welcomedOn) return gate
  return { ...gate, credits: gate.credits + WELCOME_CREDITS, welcomedOn: today }
}

export function addCredits(gate: GateState, count = 1): GateState {
  return { ...gate, credits: gate.credits + Math.max(0, count) }
}

/** 열람권을 써서 오늘 코디를 연다. 이미 열려 있으면 그대로 둔다(중복 차감 금지). */
export function openOutfit(gate: GateState): { gate: GateState; opened: boolean } {
  if (gate.outfitUnlocked) return { gate, opened: true }
  if (gate.credits <= 0) return { gate, opened: false }
  return { gate: { ...gate, credits: gate.credits - 1, outfitUnlocked: true }, opened: true }
}

export async function loadGate(today: string): Promise<GateState> {
  const { value } = await Preferences.get({ key: GATE_KEY })
  return parseGate(value, today)
}

export async function saveGate(gate: GateState): Promise<void> {
  await Preferences.set({ key: GATE_KEY, value: JSON.stringify(gate) })
}

export async function removeGate(): Promise<void> {
  await Preferences.remove({ key: GATE_KEY })
}
