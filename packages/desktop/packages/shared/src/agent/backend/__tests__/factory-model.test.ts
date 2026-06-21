import { describe, expect, it } from 'bun:test'
import {
  createConfigFromConnection,
  resolveModelForProvider,
} from '../factory'
import type { LlmConnection } from '../../../config/storage'

function makeConnection(overrides: Partial<LlmConnection> = {}): LlmConnection {
  return {
    slug: 'turbospark',
    name: 'TURBO SPARK',
    providerType: 'turbospark',
    authType: 'none',
    createdAt: 1,
    ...overrides,
  }
}

describe('backend model resolution', () => {
  it('lets provider-managed Qwen sessions resolve without a fallback model', () => {
    expect(resolveModelForProvider('turbospark', undefined, makeConnection())).toBe('')
  })

  it('keeps explicit managed model values', () => {
    expect(resolveModelForProvider('turbospark', 'mimo-v2.5-pro', makeConnection())).toBe('mimo-v2.5-pro')
  })

  it('does not inject DEFAULT_MODEL into connection configs', () => {
    const config = createConfigFromConnection(makeConnection(), {
      workspace: {
        id: 'ws',
        name: 'Workspace',
        slug: 'workspace',
        rootPath: '/tmp/ws',
        createdAt: 1,
      },
    })

    expect(config.model).toBeUndefined()
  })
})
