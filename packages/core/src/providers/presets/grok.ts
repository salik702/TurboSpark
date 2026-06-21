/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '../../core/contentGenerator.js';
import type { ProviderConfig } from '../types.js';

export const GROK_ENV_KEY = 'GROK_API_KEY';
export const GROK_BASE_URL = 'https://api.x.ai/v1';

export const grokProvider: ProviderConfig = {
  id: 'grok',
  label: 'Grok (xAI)',
  description:
    'Connect with a Grok API key (get one from console.x.ai)',
  protocol: AuthType.USE_OPENAI,
  baseUrl: GROK_BASE_URL,
  envKey: GROK_ENV_KEY,
  models: [
    { id: 'grok-3', contextWindowSize: 131072 },
    { id: 'grok-3-mini', contextWindowSize: 131072, enableThinking: true },
    { id: 'grok-2', contextWindowSize: 131072 },
    { id: 'grok-2-vision', contextWindowSize: 32768 },
  ],
  modelsEditable: true,
  modelNamePrefix: 'Grok',
  ownsModel: (model) => {
    if (model.envKey !== GROK_ENV_KEY) return false;
    try {
      const host = new URL(model.baseUrl ?? '').hostname;
      return host === 'api.x.ai' || host.endsWith('.x.ai');
    } catch {
      return false;
    }
  },
  documentationUrl: 'https://docs.x.ai/docs',
  uiGroup: 'third-party',
};
