import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const linkedOrigin = process.env.OJJEOM_PUBLIC_ORIGIN
const linkedUrl = linkedOrigin ? new URL(linkedOrigin) : null
const linkedBase = linkedUrl
  ? `${linkedUrl.pathname.replace(/\/+$/, '')}/`
  : '/'

function restoreFunnelMount(base: string): Plugin {
  const mount = base.replace(/\/$/, '')
  const rewrite = (url = '/') => (
    url === mount || url.startsWith(`${mount}/`)
      ? url
      : `${mount}${url.startsWith('/') ? '' : '/'}${url}`
  )

  return {
    name: 'ojjeom-restore-funnel-mount',
    configureServer(server) {
      server.ws.on('connection', (_socket, request) => {
        const agent = request.headers['user-agent'] ?? 'unknown client'
        console.log(`[ojjeom-linked] HMR client connected: ${agent}`)
      })
      server.middlewares.use((request, _response, next) => {
        request.url = rewrite(request.url)
        next()
      })
      server.httpServer?.prependListener('upgrade', request => {
        request.url = rewrite(request.url)
      })
    },
  }
}

/**
 * AI 착장 미리보기 생성 — M6-기획.md §6.1.
 *
 * 개발 서버에만 존재한다. 프로덕션 번들(`dist`)에는 이 경로가 없어서 앱이 자동으로
 * "준비 중" 상태가 된다. 입력 이미지는 메모리에서만 다루고 디스크에 쓰지 않는다.
 */
function tryonDevEndpoint(base: string): Plugin {
  const route = `${base.replace(/\/+$/, '')}/__tryon`
  const proxy = process.env.OJJEOM_TRYON_PROXY ?? 'http://127.0.0.1:8318'
  const model = process.env.OJJEOM_TRYON_MODEL ?? 'gpt-image-2'
  const prompt = '첫 번째 사진 속 인물이 나머지 사진의 옷을 그대로 입고 있는 모습으로 바꿔라.'
    + ' 얼굴·머리·표정·포즈·체형·배경·조명은 원본 그대로 유지하고,'
    + ' 옷의 색·패턴·기장·단추·핏만 정확히 재현하라.'

  const apiKey = (): string => {
    const override = process.env.OJJEOM_TRYON_API_KEY
    if (override) return override

    const config = readFileSync(join(homedir(), '.cli-proxy-api', 'merged-config.yaml'), 'utf8')
    const block = /api-keys:\s*\n((?:\s*-\s*\S+\n)+)/.exec(config)
    const key = block ? /-\s*(\S+)/.exec(block[1])?.[1] : undefined
    if (!key) throw new Error('로컬 프록시 API 키를 찾지 못했어요.')
    return key
  }

  const readJson = (request: import('node:http').IncomingMessage): Promise<unknown> => (
    new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      request.on('data', chunk => chunks.push(chunk as Buffer))
      request.on('error', reject)
      request.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
        } catch (error) {
          reject(error)
        }
      })
    })
  )

  return {
    name: 'ojjeom-tryon-dev-endpoint',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = (request.url ?? '').split('?')[0]
        if (url !== route && url !== `${route}/health`) return next()

        const send = (status: number, body: unknown) => {
          response.statusCode = status
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify(body))
        }

        if (url === `${route}/health`) {
          try {
            apiKey()
            send(200, { ok: true, model })
          } catch (error) {
            send(200, { ok: false, reason: (error as Error).message })
          }
          return
        }

        if (request.method !== 'POST') return send(405, { error: 'POST 만 지원해요.' })

        void (async () => {
          const started = Date.now()
          try {
            const payload = await readJson(request) as { person?: string; garments?: string[] }
            if (!payload.person || !Array.isArray(payload.garments) || payload.garments.length === 0) {
              return send(400, { error: '인물 사진과 옷 사진이 모두 필요해요.' })
            }

            const form = new FormData()
            form.append('model', model)
            form.append('prompt', prompt)
            form.append('quality', process.env.OJJEOM_TRYON_QUALITY ?? 'medium')
            form.append('size', '1024x1536')
            for (const [index, image] of [payload.person, ...payload.garments].entries()) {
              const bytes = Buffer.from(image, 'base64')
              form.append('image[]', new Blob([bytes], { type: 'image/jpeg' }), `image-${index}.jpg`)
            }

            const upstream = await fetch(`${proxy}/v1/images/edits`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey()}` },
              body: form,
              signal: AbortSignal.timeout(300_000),
            })

            if (!upstream.ok) {
              const detail = await upstream.text()
              console.log(`[ojjeom-tryon] upstream ${upstream.status}: ${detail.slice(0, 200)}`)
              return send(502, { error: `생성 서버 오류 (${upstream.status})` })
            }

            const result = await upstream.json() as { data?: { b64_json?: string }[] }
            const image = result.data?.[0]?.b64_json
            if (!image) return send(502, { error: '생성 결과가 비어 있어요.' })

            const elapsedMs = Date.now() - started
            console.log(`[ojjeom-tryon] ${model} ok ${Math.round(elapsedMs / 1000)}s`)
            send(200, { image, elapsedMs, model })
          } catch (error) {
            console.log(`[ojjeom-tryon] failed: ${(error as Error).message}`)
            send(502, { error: '생성에 실패했어요. 잠시 뒤 다시 시도해 주세요.' })
          }
        })()
      })
    },
  }
}

/**
 * 실기기 추적 수집 — M8/M9. 개발 서버에만 있다.
 *
 * 앱이 보낸 화면 이동·행동·오류를 `artifacts/traces/<날짜>.jsonl` 에 이어 쓴다.
 * 사용자가 겪은 일을 다음 에이전트가 그대로 읽고 바로 고칠 수 있게 하기 위한 경로다.
 */
function traceCollector(base: string): Plugin {
  const route = `${base.replace(/\/+$/, '')}/__trace`
  const dir = join(process.cwd(), '..', 'artifacts', 'traces')

  return {
    name: 'ojjeom-trace-collector',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = (request.url ?? '').split('?')[0]
        if (url !== route) return next()

        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end('{"error":"POST only"}')
          return
        }

        const chunks: Buffer[] = []
        request.on('data', chunk => chunks.push(chunk as Buffer))
        request.on('end', () => {
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
              platform?: string
              events?: unknown[]
            }
            const events = Array.isArray(payload.events) ? payload.events : []
            if (events.length > 0) {
              mkdirSync(dir, { recursive: true })
              const day = new Date().toISOString().slice(0, 10)
              const lines = events
                .map(event => JSON.stringify({ platform: payload.platform ?? 'unknown', ...(event as object) }))
                .join('\n')
              appendFileSync(join(dir, `${day}.jsonl`), `${lines}\n`)

              const errors = events.filter(event => (event as { kind?: string }).kind === 'error')
              for (const error of errors) {
                const record = error as { scope?: string; name?: string }
                console.log(`[옷점-trace] 오류 · ${record.scope ?? '?'} · ${record.name ?? '?'}`)
              }
            }
            response.statusCode = 204
            response.end()
          } catch {
            response.statusCode = 400
            response.end('{"error":"bad payload"}')
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: linkedBase,
  build: {
    rollupOptions: {
      output: {
        // 사주 엔진과 아이콘 세트를 분리해 첫 청크를 줄인다 — M7 G-15
        manualChunks: (id: string) => {
          if (id.includes('lunar-javascript')) return 'saju'
          if (id.includes('lucide-react')) return 'icons'
          return undefined
        },
      },
    },
  },
  plugins: [
    ...(linkedUrl ? [restoreFunnelMount(linkedBase)] : []),
    tryonDevEndpoint(linkedBase),
    traceCollector(linkedBase),
    react(),
  ],
  server: linkedUrl
    ? {
        allowedHosts: [linkedUrl.hostname],
        ws: {
          protocol: linkedUrl.protocol === 'https:' ? 'wss' : 'ws',
          host: linkedUrl.hostname,
          clientPort: Number(linkedUrl.port || (linkedUrl.protocol === 'https:' ? 443 : 80)),
          path: '/',
        },
      }
    : undefined,
})
