import type { Role } from '../../core/types'
import referenceData from './championReference.json'

interface ChampionReference {
  roles: Record<string, string[]>
  yordles: string[]
  offMetaReference: string[]
}

const reference = referenceData as ChampionReference
const validRoles = new Set<Role>(['top', 'jungle', 'mid', 'adc', 'support'])
const yordles = new Set(reference.yordles)
const offMeta = new Set(reference.offMetaReference)

/** Lane reference used when a connected, role-aware provider is not configured. */
export function referenceRolesFor(id: string): Role[] | undefined {
  const roles = reference.roles[id]?.filter((role): role is Role => validRoles.has(role as Role))
  return roles?.length ? roles : undefined
}

export const isYordle = (id: string) => yordles.has(id)
export const isOffMetaReference = (id: string) => offMeta.has(id)
