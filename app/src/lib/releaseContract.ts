const GIT_COMMIT = /^[0-9a-f]{40}$/

export interface IpfitReleaseContract {
  service: 'ipfit-web'
  releaseState: 'verified' | 'development' | 'blocked'
  releaseCommit: string
}

export function ipfitReleaseContract(value: string | undefined): IpfitReleaseContract {
  const candidate = value?.trim().toLowerCase() ?? ''

  if (candidate.length === 0) {
    return {
      service: 'ipfit-web',
      releaseState: 'development',
      releaseCommit: 'development',
    }
  }

  if (!GIT_COMMIT.test(candidate)) {
    return {
      service: 'ipfit-web',
      releaseState: 'blocked',
      releaseCommit: 'invalid',
    }
  }

  return {
    service: 'ipfit-web',
    releaseState: 'verified',
    releaseCommit: candidate,
  }
}
