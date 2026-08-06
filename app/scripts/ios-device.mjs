import {
  buildInstallLaunch,
  connectedIPhone,
  developmentTeam,
  run,
} from './ios-device-utils.mjs'

try {
  const device = connectedIPhone()
  const team = developmentTeam()
  const name = device.deviceProperties?.name ?? 'iPhone'
  // OJJEOM_ENV=real 이면 사주 없는 출시(real) 번들을 만든다 — M9-기획.md §2
  const env = process.env.OJJEOM_ENV === 'real' ? 'real' : 'stage'
  console.log(`[입핏] 일반 번들 설치 대상: ${name} (${env} 환경)`)

  run('npm', ['run', env === 'real' ? 'build:real' : 'build'])
  run('npx', ['cap', 'sync', 'ios'])
  const result = buildInstallLaunch({ device, team, label: 'ojjeom-device-build' })

  console.log(`[입핏] 설치·실행 완료: ${name}`)
  console.log(`[입핏] 빌드 산출물: ${result.appPath}`)
  console.log('[입핏] 이 앱은 dist를 포함하므로 개발 서버 없이 실행됩니다.')
} catch (error) {
  console.error(`[입핏] ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
