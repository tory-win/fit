import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  APP_ROOT,
  buildInstallLaunch,
  connectedIPhone,
  developmentTeam,
  liveHost,
  run,
  startVite,
  waitForVite,
} from './ios-device-utils.mjs'

const port = Number(process.env.IOS_LIVE_PORT ?? 5173)
const capConfigPath = join(APP_ROOT, 'ios/App/App/capacitor.config.json')
let vite
let originalConfig
let cleaned = false

const cleanup = () => {
  if (cleaned) return
  cleaned = true
  if (originalConfig !== undefined) writeFileSync(capConfigPath, originalConfig)
  if (vite && !vite.killed) vite.kill('SIGTERM')
  console.log('\n[입핏] 라이브 URL을 제거하고 일반 번들 설정으로 복구했습니다.')
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    cleanup()
    process.exit(0)
  })
}

try {
  const device = connectedIPhone()
  const team = developmentTeam()
  const host = liveHost()
  const name = device.deviceProperties?.name ?? 'iPhone'

  console.log(`[입핏] 라이브 개발 대상: ${name}`)
  console.log(`[입핏] 개발 서버: http://${host}:${port}`)
  run('npx', ['cap', 'sync', 'ios'])

  originalConfig = readFileSync(capConfigPath, 'utf8')
  const liveConfig = JSON.parse(originalConfig)
  liveConfig.server = { ...(liveConfig.server ?? {}), url: `http://${host}:${port}` }
  writeFileSync(capConfigPath, `${JSON.stringify(liveConfig, null, '\t')}\n`)

  vite = startVite(port)
  vite.once('exit', code => {
    if (!cleaned) {
      cleanup()
      if (code && code !== 0) process.exitCode = code
    }
  })
  await waitForVite(port)
  const result = buildInstallLaunch({ device, team, label: 'ojjeom-live-build' })

  console.log(`[입핏] 라이브 앱 설치·실행 완료: ${name}`)
  console.log(`[입핏] 소스 저장 시 재설치 없이 Vite HMR로 반영됩니다.`)
  console.log('[입핏] 네이티브 플러그인·Info.plist·Xcode 설정 변경은 이 명령을 다시 실행해야 합니다.')
  console.log(`[입핏] 빌드 산출물: ${result.appPath}`)
  console.log('[입핏] 종료: Ctrl+C')

  await new Promise(() => {})
} catch (error) {
  cleanup()
  console.error(`[입핏] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
