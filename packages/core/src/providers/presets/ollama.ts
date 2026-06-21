/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from '../../core/contentGenerator.js';
import type { ProviderConfig } from '../types.js';

export const OLLAMA_BASE_URL = 'http://localhost:11434';
export const OLLAMA_ENV_KEY = 'OLLAMA_BASE_URL';

export const ollamaProvider: ProviderConfig = {
  id: 'ollama',
  label: 'Ollama (Local)',
  description:
    'Connect to a local Ollama installation (get one from ollama.com)',
  protocol: AuthType.USE_OPENAI,
  baseUrl: OLLAMA_BASE_URL,
  envKey: OLLAMA_ENV_KEY,
  models: [
    { id: 'llama3.1', contextWindowSize: 128000 },
    { id: 'llama3', contextWindowSize: 8192 },
    { id: 'mistral', contextWindowSize: 32768 },
    { id: 'codellama', contextWindowSize: 16384 },
    { id: 'deepseek-coder', contextWindowSize: 16384 },
    { id: 'phi3', contextWindowSize: 128000 },
    { id: 'gemma2', contextWindowSize: 8192 },
    { id: 'qwen2.5-coder', contextWindowSize: 32768 },
  ],
  modelsEditable: true,
  modelNamePrefix: 'Ollama',
  ownsModel: (model) => {
    if (model.envKey !== OLLAMA_ENV_KEY) return false;
    try {
      const host = new URL(model.baseUrl ?? '').hostname;
      return host === 'localhost' || host === '127.0.0.1';
    } catch {
      return false;
    }
  },
  documentationUrl: 'https://github.com/ollama/ollama',
  uiGroup: 'local',
};
