import { spawn, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
} from 'node:fs'
import { homedir, networkInterfaces, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const APP_ROOT = fileURLToPath(new URL('..', import.meta.url))
export const APP_ID = 'app.ipfit.mobile'
const XCODE_PROJECT = 'ios/App/App.xcodeproj'
const XCODE_SCHEME = 'App'

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: APP_ROOT,
    env: process.env,
    stdio: 'inherit',
    ...options,
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} 실패 (exit ${result.status ?? 'unknown'})`)
  }
}

function capture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: APP_ROOT,
    env: process.env,
    encoding: 'utf8',
    ...options,
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} 실행 실패`)
  }
  return result.stdout
}

export function tailscaleDnsName() {
  const payload = JSON.parse(capture('tailscale', ['status', '--json']))
  const dnsName = payload?.Self?.DNSName?.replace(/\.$/, '')
  if (!dnsName) throw new Error('Tailscale DNS 이름을 찾지 못했어요.')
  return dnsName
}

export async function waitForUrl(url, timeoutMs = 20_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_500) })
      if (response.ok) return
    } catch {
      // The linked server or Funnel is still starting.
    }
    await new Promise(resolvePromise => setTimeout(resolvePromise, 500))
  }
  throw new Error(`${url}이 ${timeoutMs / 1000}초 안에 응답하지 않았어요.`)
}

export function connectedIPhone() {
  const outputPath = join(mkdtempSync(join(tmpdir(), 'ojjeom-devices-')), 'devices.json')
  run('xcrun', ['devicectl', 'list', 'devices', '--json-output', outputPath], {
    stdio: ['ignore', 'ignore', 'inherit'],
  })
  const payload = JSON.parse(readFileSync(outputPath, 'utf8'))
  const all = payload?.result?.devices ?? []
  const available = all.filter(device => (
    device?.hardwareProperties?.platform === 'iOS'
    && device?.hardwareProperties?.reality === 'physical'
    && device?.connectionProperties?.tunnelState === 'connected'
  ))
  const requested = process.env.IOS_DEVICE_ID
  if (requested) {
    const matched = available.find(device => (
      device.identifier === requested || device.hardwareProperties?.udid === requested
    ))
    if (!matched) throw new Error(`IOS_DEVICE_ID=${requested}인 연결 iPhone을 찾지 못했어요.`)
    return matched
  }
  if (available.length === 0) {
    throw new Error('연결되고 신뢰된 iPhone이 없어요. 잠금 해제·개발자 모드·케이블/같은 네트워크를 확인해 주세요.')
  }
  if (available.length > 1) {
    const choices = available
      .map(device => `${device.deviceProperties?.name}: ${device.identifier}`)
      .join('\n')
    throw new Error(`iPhone이 여러 대예요. IOS_DEVICE_ID를 지정해 주세요.\n${choices}`)
  }
  return available[0]
}

export function developmentTeam() {
  const requested = process.env.IOS_DEVELOPMENT_TEAM
  if (requested) return requested

  const preferences = resolve(homedir(), 'Library/Preferences/com.apple.dt.Xcode.plist')
  if (!existsSync(preferences)) {
    throw new Error('Xcode 로그인 정보를 찾지 못했어요. IOS_DEVELOPMENT_TEAM을 지정해 주세요.')
  }
  const teamsJson = JSON.parse(capture('plutil', [
    '-extract',
    'IDEProvisioningTeamByIdentifier',
    'json',
    '-o',
    '-',
    preferences,
  ]))
  const groups = Object.values(teamsJson)
  const teams = groups.flatMap(value => Array.isArray(value) ? value : [])
  const selected = teams.find(team => team?.isFreeProvisioningTeam) ?? teams[0]
  if (!selected?.teamID) {
    throw new Error('Xcode 개발 팀을 찾지 못했어요. IOS_DEVELOPMENT_TEAM을 지정해 주세요.')
  }
  return selected.teamID
}

export function liveHost() {
  if (process.env.IOS_LIVE_HOST) return process.env.IOS_LIVE_HOST
  const interfaces = networkInterfaces()
  const preferred = ['en0', 'en1']
  const entries = [
    ...preferred.flatMap(name => (interfaces[name] ?? []).map(details => ({ name, ...details }))),
    ...Object.entries(interfaces).flatMap(([name, details]) => (
      preferred.includes(name) ? [] : (details ?? []).map(entry => ({ name, ...entry }))
    )),
  ]
  const address = entries.find(entry => (
    entry.family === 'IPv4'
    && !entry.internal
    && !entry.name.startsWith('utun')
    && !entry.address.startsWith('169.254.')
  ))
  if (!address) {
    throw new Error('iPhone이 접근할 Mac IPv4 주소를 찾지 못했어요. IOS_LIVE_HOST를 지정해 주세요.')
  }
  return address.address
}

export function buildInstallLaunch({ device, team, label }) {
  const udid = device.hardwareProperties?.udid
  const coreDeviceId = device.identifier
  if (!udid || !coreDeviceId) throw new Error('iPhone 식별자를 읽지 못했어요.')

  const derivedData = mkdtempSync(join(tmpdir(), `${label}-`))
  run('xcodebuild', [
    '-project', XCODE_PROJECT,
    '-scheme', XCODE_SCHEME,
    '-configuration', 'Debug',
    '-destination', `id=${udid}`,
    '-derivedDataPath', derivedData,
    '-allowProvisioningUpdates',
    '-allowProvisioningDeviceRegistration',
    `DEVELOPMENT_TEAM=${team}`,
    'build',
  ])
  const appPath = join(derivedData, 'Build/Products/Debug-iphoneos/App.app')
  if (!existsSync(appPath)) throw new Error(`빌드 앱을 찾지 못했어요: ${appPath}`)
  run('xcrun', ['devicectl', 'device', 'install', 'app', '--device', coreDeviceId, appPath])
  run('xcrun', ['devicectl', 'device', 'process', 'launch', '--device', coreDeviceId, APP_ID])

  return { appPath, derivedData }
}

export function startVite(port) {
  return spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0', '--port', String(port), '--strictPort'], {
    cwd: APP_ROOT,
    env: process.env,
    stdio: 'inherit',
  })
}

export async function waitForVite(port, timeoutMs = 20_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(800) })
      if (response.ok) return
    } catch {
      // Vite is still starting.
    }
    await new Promise(resolvePromise => setTimeout(resolvePromise, 250))
  }
  throw new Error(`Vite가 ${timeoutMs / 1000}초 안에 시작되지 않았어요.`)
}
