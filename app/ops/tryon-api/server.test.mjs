import { request as httpRequest } from 'node:http'
import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_IMAGE_BYTES,
  MAX_REQUEST_BYTES,
  createTryonServer,
  readJson,
  validatePayload,
} from './server.mjs'

const VALID_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64')
const servers = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))))
  delete process.env.TRYON_API_KEY
})

async function postJson(server, body) {
  if (!server.listening) {
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    servers.push(server)
  }

  const address = server.address()
  const payload = typeof body === 'string' ? body : JSON.stringify(body)
  return new Promise((resolve, reject) => {
    const outgoing = httpRequest({
      hostname: '127.0.0.1',
      port: address.port,
      path: '/__tryon',
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) },
    }, incoming => {
      const chunks = []
      incoming.on('data', chunk => chunks.push(chunk))
      incoming.on('error', reject)
      incoming.on('end', () => resolve({
        status: incoming.statusCode,
        body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
      }))
    })
    outgoing.on('error', reject)
    outgoing.end(payload)
  })
}

describe('tryon-api input boundaries', () => {
  it('accepts one person and one JPEG garment before calling upstream once', async () => {
    process.env.TRYON_API_KEY = 'test-only-key'
    const upstreamFetch = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ data: [{ b64_json: 'generated-image' }] }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ))
    const response = await postJson(createTryonServer({ upstreamFetch }), {
      person: VALID_JPEG,
      garments: [VALID_JPEG],
    })

    expect(response).toMatchObject({ status: 200, body: { image: 'generated-image' } })
    expect(upstreamFetch).toHaveBeenCalledTimes(1)
  })

  it('rejects malformed JSON without calling the paid upstream', async () => {
    const upstreamFetch = vi.fn()
    const response = await postJson(createTryonServer({ upstreamFetch }), '{')

    expect(response).toMatchObject({ status: 400 })
    expect(upstreamFetch).not.toHaveBeenCalled()
  })

  it('rejects non-JPEG base64 and more than two garments before upstream', async () => {
    const upstreamFetch = vi.fn()
    const server = createTryonServer({ upstreamFetch })

    expect(await postJson(server, { person: 'AAAA', garments: ['AAAA'] })).toMatchObject({ status: 400 })
    expect(await postJson(server, { person: VALID_JPEG, garments: [VALID_JPEG, VALID_JPEG, VALID_JPEG] })).toMatchObject({ status: 400 })
    expect(upstreamFetch).not.toHaveBeenCalled()
  })

  it('rejects an individual decoded image over 5 MiB with 413', () => {
    const oversized = Buffer.alloc(MAX_IMAGE_BYTES + 1).toString('base64')

    expect(() => validatePayload({ person: oversized, garments: [VALID_JPEG] })).toThrow(expect.objectContaining({ statusCode: 413 }))
  })

  it('stops streaming request collection after 22 MiB with 413', async () => {
    const request = Readable.from([
      Buffer.alloc(MAX_REQUEST_BYTES),
      Buffer.from('x'),
    ])

    await expect(readJson(request)).rejects.toMatchObject({ statusCode: 413 })
  })
})
