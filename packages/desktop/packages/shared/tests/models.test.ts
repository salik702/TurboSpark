/**
 * Tests for model utilities in config/models.ts
 */
import { describe, it, expect } from 'bun:test';
import {
  DEFAULT_MODEL,
  AI_MODELS,
  getModelShortName,
  getModelDisplayName,
  getModelContextWindow,
  getModelProvider,
  isDefaultProviderModel,
} from '../src/config/models.ts';

describe('model registry', () => {
  it('uses coder-model as the fallback model', () => {
    expect(DEFAULT_MODEL).toBe('coder-model');
    expect(AI_MODELS.map(model => model.id)).toContain('coder-model');
  });

  it('detects turbospark provider model IDs', () => {
    expect(isDefaultProviderModel('coder-model')).toBe(true);
    expect(isDefaultProviderModel('gpt-4o')).toBe(false);
  });

  it('resolves provider metadata for registered models', () => {
    expect(getModelProvider('coder-model')).toBe('turbospark');
    expect(getModelProvider('gpt-4o')).toBeUndefined();
  });

  it('formats model names', () => {
    expect(getModelShortName('coder-model')).toBe('Coder');
    expect(getModelDisplayName('coder-model')).toBe('Coder Model');
    expect(getModelContextWindow('coder-model')).toBe(1_000_000);
  });
});
