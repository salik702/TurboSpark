/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TurboModeConfig {
  enabled: boolean;
  maxTokens: number;
  temperature: number;
  compactOutput: boolean;
  systemPromptSuffix: string;
}

const DEFAULT_TURBO_CONFIG: TurboModeConfig = {
  enabled: false,
  maxTokens: 2048,
  temperature: 0.3,
  compactOutput: true,
  systemPromptSuffix:
    'Be concise. Use fewer tokens. Avoid verbose explanations unless explicitly asked.',
};

let currentTurboConfig: TurboModeConfig = { ...DEFAULT_TURBO_CONFIG };

/**
 * Enable turbo mode with optional custom configuration
 */
export function enableTurboMode(config?: Partial<TurboModeConfig>): void {
  currentTurboConfig = {
    ...DEFAULT_TURBO_CONFIG,
    ...config,
    enabled: true,
  };
}

/**
 * Disable turbo mode
 */
export function disableTurboMode(): void {
  currentTurboConfig = { ...DEFAULT_TURBO_CONFIG };
}

/**
 * Check if turbo mode is enabled
 */
export function isTurboModeEnabled(): boolean {
  return currentTurboConfig.enabled;
}

/**
 * Get current turbo mode configuration
 */
export function getTurboConfig(): TurboModeConfig {
  return { ...currentTurboConfig };
}

/**
 * Get turbo mode generation parameters for API calls
 */
export function getTurboGenerationParams(): {
  max_tokens: number;
  temperature: number;
} {
  return {
    max_tokens: currentTurboConfig.maxTokens,
    temperature: currentTurboConfig.temperature,
  };
}

/**
 * Get system prompt suffix for turbo mode
 */
export function getTurboSystemPromptSuffix(): string {
  return currentTurboConfig.enabled ? currentTurboConfig.systemPromptSuffix : '';
}

/**
 * Format turbo mode status for display
 */
export function formatTurboStatus(): string {
  if (!currentTurboConfig.enabled) {
    return 'Turbo Mode: OFF';
  }
  return [
    'Turbo Mode: ON',
    `  Max Tokens: ${currentTurboConfig.maxTokens}`,
    `  Temperature: ${currentTurboConfig.temperature}`,
    `  Compact Output: ${currentTurboConfig.compactOutput ? 'Yes' : 'No'}`,
  ].join('\n');
}
