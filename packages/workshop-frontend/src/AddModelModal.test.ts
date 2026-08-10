import { describe, expect, it } from 'vitest'
import { buildOptions } from './AddModelModal'

describe('buildOptions', () => {
  it('offers direct custom providers alongside deployment Gateway models', () => {
    const options = buildOptions(true)

    expect(options.map(option => option.value)).toEqual([
      'other-cloudflare',
      'other-anthropic',
      'other-openai',
      'other-google',
      'other-ollama',
    ])
  })
})
