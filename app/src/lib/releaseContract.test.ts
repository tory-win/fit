import { describe, expect, it } from 'vitest'

import { ipfitReleaseContract } from './releaseContract'

describe('ipfit release contract', () => {
  it('publishes an exact normalized Git commit for deployment verification', () => {
    const commit = 'A'.repeat(40)
    expect(ipfitReleaseContract(` ${commit} `)).toEqual({
      service: 'ipfit-web',
      releaseState: 'verified',
      releaseCommit: 'a'.repeat(40),
    })
  })

  it('marks empty release metadata as development', () => {
    expect(ipfitReleaseContract(undefined)).toEqual({
      service: 'ipfit-web',
      releaseState: 'development',
      releaseCommit: 'development',
    })
  })

  it('fails closed for malformed release metadata', () => {
    expect(ipfitReleaseContract('abc123')).toEqual({
      service: 'ipfit-web',
      releaseState: 'blocked',
      releaseCommit: 'invalid',
    })
  })
})
