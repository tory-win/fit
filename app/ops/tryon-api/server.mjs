// 트라이온 생성 API — vite.config.ts 의 tryonDevEndpoint 를 독립 서비스로 추출한 것 (M10-기획.md §3).
// 계약은 동일하다: GET /__tryon/health, POST /__tryon { person, garments[] } → { image, elapsedMs, model }.
// 입력 이미지는 메모리에서만 다루고 디스크에 쓰지 않는다.
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const PORT = Number(process.env.TRYON_PORT ?? 8319)
const PROXY = process.env.TRYON_PROXY ?? 'http://127.0.0.1:8318'
const MODEL = process.env.TRYON_MODEL ?? 'gpt-image-2'
const QUALITY = process.env.TRYON_QUALITY ?? 'medium'
export const MAX_REQUEST_BYTES = 22 * 1024 * 1024
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const PROMPT = '첫 번째 사진 속 인물이 나머지 사진의 옷을 그대로 입고 있는 모습으로 바꿔라.'
  + ' 얼굴·머리·표정·포즈·체형·배경·조명은 원본 그대로 유지하고,'
  + ' 옷의 색·패턴·기장·단추·핏만 정확히 재현하라.'

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
  }
}

function apiKey() {
  if (process.env.TRYON_API_KEY) return process.env.TRYON_API_KEY

  // 컨테이너에서는 키 파일을 read-only 마운트하거나 TRYON_API_KEY 로 직접 주입한다.
  const file = process.env.TRYON_API_KEY_FILE ?? join(homedir(), '.cli-proxy-api', 'merged-config.yaml')
  const config = readFileSync(file, 'utf8')
  const block = /api-keys:\s*\n((?:\s*-\s*\S+\n)+)/.exec(config)
  const key = block ? /-\s*(\S+)/.exec(block[1])?.[1] : undefined
  if (!key) throw new Error('API 키를 찾지 못했어요. TRYON_API_KEY 를 설정하세요.')
  return key
}

export function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let totalBytes = 0
    let settled = false

    request.on('data', chunk => {
      if (settled) return

      totalBytes += chunk.length
      if (totalBytes > MAX_REQUEST_BYTES) {
        settled = true
        request.resume()
        reject(new HttpError(413, '요청 본문이 너무 커요.'))
        return
      }

      chunks.push(chunk)
    })

    request.on('error', error => {
      if (settled) return
      settled = true
      reject(error)
    })

    request.on('end', () => {
      if (settled) return

      try {
        settled = true
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new HttpError(400, 'JSON 본문이 올바르지 않아요.'))
      }
    })
  })
}

export function decodeBase64Jpeg(fieldName, value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new HttpError(400, `${fieldName} 이미지는 base64 JPEG 문자열이어야 해요.`)
  }

  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    throw new HttpError(400, `${fieldName} 이미지는 엄격한 base64 JPEG 이어야 해요.`)
  }

  const bytes = Buffer.from(value, 'base64')
  if (bytes.length === 0 || bytes.toString('base64') !== value) {
    throw new HttpError(400, `${fieldName} 이미지는 엄격한 base64 JPEG 이어야 해요.`)
  }

  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new HttpError(413, `${fieldName} 이미지가 너무 커요.`)
  }

  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) {
    throw new HttpError(400, `${fieldName} 이미지는 JPEG만 허용해요.`)
  }

  return bytes
}

export function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new HttpError(400, 'JSON 본문이 올바르지 않아요.')
  }

  if (!Array.isArray(payload.garments) || payload.garments.length < 1 || payload.garments.length > 2) {
    throw new HttpError(400, '옷 사진은 1~2장만 허용해요.')
  }

  return {
    person: decodeBase64Jpeg('person', payload.person),
    garments: payload.garments.map((image, index) => decodeBase64Jpeg(`garments[${index}]`, image)),
  }
}

export function createTryonServer({ upstreamFetch = fetch } = {}) {
  return createServer((request, response) => {
  const url = (request.url ?? '').split('?')[0]

  // Capacitor 앱(capacitor://localhost)에서 직접 부르므로 CORS 를 연다.
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  const send = (status, body) => {
    response.statusCode = status
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(body))
  }

  if (request.method === 'OPTIONS') {
    response.statusCode = 204
    response.end()
    return
  }

  if (url === '/__tryon/health') {
    try {
      apiKey()
      send(200, { ok: true, model: MODEL })
    } catch (error) {
      send(200, { ok: false, reason: error.message })
    }
    return
  }

  if (url !== '/__tryon') return send(404, { error: 'not found' })
  if (request.method !== 'POST') return send(405, { error: 'POST 만 지원해요.' })

  void (async () => {
    const started = Date.now()
    try {
      const payload = await readJson(request)
      const images = validatePayload(payload)

      const form = new FormData()
      form.append('model', MODEL)
      form.append('prompt', PROMPT)
      form.append('quality', QUALITY)
      form.append('size', '1024x1536')
      for (const [index, bytes] of [images.person, ...images.garments].entries()) {
        form.append('image[]', new Blob([bytes], { type: 'image/jpeg' }), `image-${index}.jpg`)
      }

      const upstream = await upstreamFetch(`${PROXY}/v1/images/edits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey()}` },
        body: form,
        signal: AbortSignal.timeout(300_000),
      })

      if (!upstream.ok) {
        const detail = await upstream.text()
        console.log(`[ipfit-tryon] upstream ${upstream.status}: ${detail.slice(0, 200)}`)
        return send(502, { error: `생성 서버 오류 (${upstream.status})` })
      }

      const result = await upstream.json()
      const image = result.data?.[0]?.b64_json
      if (!image) return send(502, { error: '생성 결과가 비어 있어요.' })

      const elapsedMs = Date.now() - started
      console.log(`[ipfit-tryon] ${MODEL} ok ${Math.round(elapsedMs / 1000)}s`)
      send(200, { image, elapsedMs, model: MODEL })
    } catch (error) {
      if (error instanceof HttpError) {
        return send(error.statusCode, { error: error.message })
      }

      console.log(`[ipfit-tryon] failed: ${error.message}`)
      send(502, { error: '생성에 실패했어요. 잠시 뒤 다시 시도해 주세요.' })
    }
  })()
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createTryonServer().listen(PORT, () => {
    console.log(`[ipfit-tryon] listening on :${PORT} → ${PROXY} (${MODEL})`)
  })
}
