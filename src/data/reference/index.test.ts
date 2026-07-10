import { describe, expect, it } from 'vitest'
import referenceData from './championReference.json'
import { isYordle, referenceRolesFor } from './index'

describe('champion reference', () => {
  it('keeps a lane mapping for every champion in the validated 16.13 roster', () => {
    const entries = Object.entries(referenceData.roles)

    expect(entries).toHaveLength(173)
    expect(entries.every(([id, roles]) => Boolean(id) && roles.length > 0)).toBe(true)
  })

  it('resolves canonical Data Dragon IDs and yordles', () => {
    expect(referenceRolesFor('KSante')).toEqual(['top'])
    expect(referenceRolesFor('TwistedFate')).toEqual(['mid'])
    expect(referenceRolesFor('Fiddlesticks')).toEqual(['jungle', 'support'])
    expect(isYordle('Yuumi')).toBe(true)
    expect(isYordle('Aatrox')).toBe(false)
  })
})
