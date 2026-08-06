import { describe, expect, it } from 'vitest'

import { ipfitReleaseContract } from './releaseContract'

describe('ipfit release contract', () => {
  it('publishes an exact normalized Git commit for deployment verification', () => {
    const commit = 'A'.repeat(40)
    expect(ipfitReleaseContract(` ${commit} `)).toEqual({
      service: 'ipfit-web',
      releaseCommit: 'a'.repeat(40),
    })
  })

  it('does not misrepresent a missing or malformed commit as deployed source', () => {
    expect(ipfitReleaseContract(undefined).releaseCommit).toBe('development')
    expect(ipfitReleaseContract('abc123').releaseCommit).toBe('development')
  })
})
