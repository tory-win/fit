import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  APP_ROOT,
  buildInstallLaunch,
  connectedIPhone,
  developmentTeam,
  run,
  tailscaleDnsName,
  waitForUrl,
} from './ios-device-utils.mjs'

const funnelPort = Number(process.env.OJJEOM_FUNNEL_PORT ?? 10000)
const publicPath = process.env.OJJEOM_PUBLIC_PATH ?? '/ojjeom'
const publicUrl = process.env.OJJEOM_PUBLIC_ORIGIN
  ?? `https://${tailscaleDnsName()}:${funnelPort}${publicPath}/`
const capConfigPath = join(APP_ROOT, 'ios/App/App/capacitor.config.json')
let originalConfig

try {
  const device = connectedIPhone()
  const team = developmentTeam()
  const name = device.deviceProperties?.name ?? 'iPhone'

  console.log(`[입핏] 웹 연결형 설치 대상: ${name}`)
  console.log(`[입핏] 원격 웹 주소: ${publicUrl}`)
  await waitForUrl(publicUrl)

  run('npm', ['run', 'build'])
  run('npx', ['cap', 'sync', 'ios'])
  originalConfig = readFileSync(capConfigPath, 'utf8')
  const linkedConfig = JSON.parse(originalConfig)
  linkedConfig.server = { ...(linkedConfig.server ?? {}), url: publicUrl }
  writeFileSync(capConfigPath, `${JSON.stringify(linkedConfig, null, '\t')}\n`)

  const result = buildInstallLaunch({ device, team, label: 'ojjeom-linked-build' })
  console.log(`[입핏] 웹 연결형 앱 설치·실행 완료: ${name}`)
  console.log('[입핏] 웹 소스를 저장하면 실행 중인 앱은 HMR로, 다음 실행 앱은 최신 페이지 로드로 반영됩니다.')
  console.log('[입핏] 네이티브 플러그인·Info.plist·Xcode 설정 변경은 이 명령을 다시 실행해야 합니다.')
  console.log(`[입핏] 빌드 산출물: ${result.appPath}`)
} catch (error) {
  console.error(`[입핏] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  if (originalConfig !== undefined) {
    writeFileSync(capConfigPath, originalConfig)
    console.log('[입핏] 생성된 Capacitor 설정은 일반 번들 모드로 복구했습니다.')
  }
}
