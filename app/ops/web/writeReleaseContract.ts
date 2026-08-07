import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { ipfitReleaseContract } from '../../src/lib/releaseContract.ts'

export function productionReleaseContract(value: string | undefined): string {
  const releaseCommit = value?.trim()
  if (!releaseCommit || !/^[0-9a-f]{40}$/.test(releaseCommit)) throw new Error('IPFIT_RELEASE_COMMIT_INVALID')
  const contract = ipfitReleaseContract(releaseCommit)
  if (contract.releaseState === 'blocked') throw new Error('IPFIT_RELEASE_COMMIT_INVALID')
  return `${JSON.stringify(contract)}\n`
}

export function writeProductionReleaseContract(target: string, value: string | undefined): void {
  if (!target) throw new Error('IPFIT_RELEASE_TARGET_REQUIRED')
  writeFileSync(target, productionReleaseContract(value), { encoding: 'utf8', mode: 0o644 })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeProductionReleaseContract(process.argv[2] ?? '', process.argv[3])
}
