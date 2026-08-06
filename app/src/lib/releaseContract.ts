const GIT_COMMIT = /^[0-9a-f]{40}$/

export interface IpfitReleaseContract {
  service: 'ipfit-web'
  releaseCommit: string
}

export function ipfitReleaseContract(value: string | undefined): IpfitReleaseContract {
  const candidate = value?.trim().toLowerCase() ?? ''
  return {
    service: 'ipfit-web',
    releaseCommit: GIT_COMMIT.test(candidate) ? candidate : 'development',
  }
}
