/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createDebugLogger } from '@turbospark/turbospark-core';

const debugLogger = createDebugLogger('AUTO_PROVIDER');

export interface AutoProviderResult {
  provider: string;
  reason: string;
  model?: string;
  baseUrl?: string;
}

interface ProviderCheck {
  name: string;
  check: () => Promise<AutoProviderResult | null>;
}

/**
 * Check if Ollama is available locally
 */
async function checkOllama(): Promise<AutoProviderResult | null> {
  const ollamaUrl =
    process.env['OLLAMA_BASE_URL'] || 'http://localhost:11434';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = (await response.json()) as {
        models?: Array<{ name: string }>;
      };
      const models = data.models ?? [];
      if (models.length > 0) {
        const firstModel = models[0]!.name;
        debugLogger.info(
          `Ollama available with ${models.length} models, selecting ${firstModel}`,
        );
        return {
          provider: 'ollama',
          reason: `Local Ollama installation found with ${models.length} model(s)`,
          model: firstModel,
          baseUrl: ollamaUrl,
        };
      }
    }
  } catch {
    clearTimeout(timeout);
    debugLogger.debug('Ollama not available');
  }

  return null;
}

/**
 * Check if OpenRouter API key is available
 */
async function checkOpenRouter(): Promise<AutoProviderResult | null> {
  const apiKey = process.env['OPENROUTER_API_KEY'];
  if (apiKey && apiKey.length > 0) {
    debugLogger.info('OpenRouter API key found');
    return {
      provider: 'openrouter',
      reason: 'OPENROUTER_API_KEY environment variable is set',
      model: 'openai/gpt-oss-120b:free',
      baseUrl: 'https://openrouter.ai/api/v1',
    };
  }
  return null;
}

/**
 * Check if Grok API key is available
 */
async function checkGrok(): Promise<AutoProviderResult | null> {
  const apiKey = process.env['GROK_API_KEY'];
  if (apiKey && apiKey.length > 0) {
    debugLogger.info('Grok API key found');
    return {
      provider: 'grok',
      reason: 'GROK_API_KEY environment variable is set',
      model: 'grok-3',
      baseUrl: 'https://api.x.ai/v1',
    };
  }
  return null;
}

/**
 * Check if OpenAI API key is available
 */
async function checkOpenAI(): Promise<AutoProviderResult | null> {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (apiKey && apiKey.length > 0) {
    debugLogger.info('OpenAI API key found');
    return {
      provider: 'openai',
      reason: 'OPENAI_API_KEY environment variable is set',
      model: 'gpt-4o',
      baseUrl: 'https://api.openai.com/v1',
    };
  }
  return null;
}

/**
 * Check if Anthropic API key is available
 */
async function checkAnthropic(): Promise<AutoProviderResult | null> {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (apiKey && apiKey.length > 0) {
    debugLogger.info('Anthropic API key found');
    return {
      provider: 'anthropic',
      reason: 'ANTHROPIC_API_KEY environment variable is set',
      model: 'claude-sonnet-4-20250514',
      baseUrl: 'https://api.anthropic.com/v1',
    };
  }
  return null;
}

/**
 * Automatically select the best available provider
 *
 * Priority order:
 * 1. Ollama (local, free, no network)
 * 2. OpenRouter (many models, competitive pricing)
 * 3. Grok (xAI models)
 * 4. OpenAI (standard)
 * 5. Anthropic (standard)
 */
export async function selectAutoProvider(): Promise<AutoProviderResult | null> {
  const checks: ProviderCheck[] = [
    { name: 'Ollama', check: checkOllama },
    { name: 'OpenRouter', check: checkOpenRouter },
    { name: 'Grok', check: checkGrok },
    { name: 'OpenAI', check: checkOpenAI },
    { name: 'Anthropic', check: checkAnthropic },
  ];

  for (const { name, check } of checks) {
    try {
      const result = await check();
      if (result) {
        debugLogger.info(`Auto-selected provider: ${name}`);
        return result;
      }
    } catch (err) {
      debugLogger.warn(`Error checking ${name}:`, err);
    }
  }

  debugLogger.warn('No provider could be automatically selected');
  return null;
}

/**
 * Format auto provider result for display
 */
export function formatAutoProviderResult(
  result: AutoProviderResult | null,
): string {
  if (!result) {
    return [
      '',
      '  Smart Auto Provider: No provider found',
      '  Please configure a provider with /auth or set an API key:',
      '    - OPENROUTER_API_KEY',
      '    - GROK_API_KEY',
      '    - OPENAI_API_KEY',
      '    - ANTHROPIC_API_KEY',
      '    - Or install Ollama for local models',
      '',
    ].join('\n');
  }

  return [
    '',
    '  Smart Auto Provider Selected:',
    `  ───────────────────────────`,
    `  Provider:  ${result.provider}`,
    `  Model:     ${result.model ?? 'default'}`,
    `  Reason:    ${result.reason}`,
    `  Base URL:  ${result.baseUrl ?? 'default'}`,
    '',
  ].join('\n');
}
