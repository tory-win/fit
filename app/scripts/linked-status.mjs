import { spawnSync } from 'node:child_process'
import { tailscaleDnsName } from './ios-device-utils.mjs'

const localPort = Number(process.env.OJJEOM_LINKED_PORT ?? 15174)
const funnelPort = Number(process.env.OJJEOM_FUNNEL_PORT ?? 10000)
const publicPath = process.env.OJJEOM_PUBLIC_PATH ?? '/ojjeom'
const publicUrl = process.env.OJJEOM_PUBLIC_ORIGIN
  ?? `https://${tailscaleDnsName()}:${funnelPort}${publicPath}/`

async function check(url, attempts = 10) {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3_000) })
      if (response.ok || attempt === attempts - 1) {
        return `${response.status} ${response.statusText}`
      }
    } catch (error) {
      lastError = error
    }
    await new Promise(resolvePromise => setTimeout(resolvePromise, 500))
  }
  return `실패: ${lastError instanceof Error ? lastError.message : String(lastError)}`
}

const launchd = spawnSync(
  'launchctl',
  ['print', `gui/${process.getuid()}/com.tory.ojjeom-web-linked`],
  { encoding: 'utf8' },
)

const [localStatus, publicStatus] = await Promise.all([
  check(`http://127.0.0.1:${localPort}${publicPath}/`),
  check(publicUrl),
])

console.log(`[입핏] launchd: ${launchd.status === 0 ? 'loaded' : 'not loaded'}`)
console.log(`[입핏] local: ${localStatus}`)
console.log(`[입핏] public: ${publicStatus}`)
console.log(`[입핏] URL: ${publicUrl}`)
