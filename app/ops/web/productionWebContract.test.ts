import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { productionReleaseContract } from './writeReleaseContract.ts'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('production web container contract', () => {
  it('writes the same fail-closed release identity used by the app', () => {
    expect(JSON.parse(productionReleaseContract('a'.repeat(40)))).toEqual({
      service: 'ipfit-web',
      releaseState: 'verified',
      releaseCommit: 'a'.repeat(40),
    })
    expect(() => productionReleaseContract('development')).toThrow('IPFIT_RELEASE_COMMIT_INVALID')
    expect(() => productionReleaseContract(undefined)).toThrow('IPFIT_RELEASE_COMMIT_INVALID')
    expect(() => productionReleaseContract('not-a-commit')).toThrow('IPFIT_RELEASE_COMMIT_INVALID')
  })

  it('serves a built image and explicitly blocks Vite source routes', () => {
    const compose = read('../docker-compose.yml')
    const web = compose.slice(compose.indexOf('  web:'), compose.indexOf('\nsecrets:'))
    const nginx = read('./nginx.conf')

    expect(web).toContain('dockerfile: ops/web/Dockerfile')
    expect(web).not.toContain('npm run dev')
    expect(web).not.toContain(':/app')
    expect(nginx).toContain('root /usr/share/nginx/html/ojjeom;')
    expect(nginx).toContain('rewrite ^/ojjeom/(.*)$ /$1 last;')
    expect(nginx).toContain('^/(?:@vite|@react-refresh|src/)')
    expect(nginx).toContain('set $tryon_origin http://tryon-api:8319;')
    expect(nginx).toContain('proxy_pass $tryon_origin/__tryon;')
  })
})
