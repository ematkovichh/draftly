import { describe, expect, it } from 'vitest'
import { damageTypeFrom } from './derive'

const ability = (description: string) => ({ description })

describe('damage profile classification', () => {
  it('classifies physical assassins from ability text instead of Riot info ratings', () => {
    expect(damageTypeFrom('Qiyana', ['Fighter', 'Assassin'], [
      ability('Deals physical damage.'),
      ability('Deals bonus magic damage.'),
      ability('Deals physical damage.'),
      ability('Deals physical damage.'),
    ])).toBe('AD')
  })

  it('keeps known magic and hybrid profiles explicit', () => {
    expect(damageTypeFrom('Akali', ['Assassin'], [ability('Deals physical damage.')])).toBe('AP')
    expect(damageTypeFrom('Kaisa', ['Marksman'], [ability('Deals physical damage.')])).toBe('Mixed')
    expect(damageTypeFrom('Ornn', ['Tank'], [ability('Deals physical damage.'), ability('Deals magic damage.')])).toBe('Mixed')
  })

  it('uses ability wording for ordinary magic champions', () => {
    expect(damageTypeFrom('TestMage', ['Mage'], [ability('Deals magic damage.')])).toBe('AP')
  })
})
