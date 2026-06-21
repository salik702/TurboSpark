/**
 * @license
 * Copyright 2026 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Types
export type {
  BaseUrlOption,
  ModelSpec,
  ProviderId,
  ProviderConfig,
  ProviderInstallPlan,
  ProviderInstallState,
  ProviderModelConfig,
  ProviderModelProvidersPatch,
  ProviderSettingsAdapter,
  ProviderSetupInputs,
} from './types.js';

// Provider config utilities
export {
  buildInstallPlan,
  buildProviderTemplate,
  computeModelListVersion,
  getDefaultBaseUrlForProtocol,
  getDefaultModelIds,
  providerMatchesCredentials,
  PROVIDER_METADATA_NS,
  resolveBaseUrl,
  resolveMetadataKey,
  resolveOwnsModel,
  shouldShowStep,
} from './provider-config.js';

// Provider registry
export {
  ALL_PROVIDERS,
  ALIBABA_PROVIDERS,
  alibabaStandardProvider,
  codingPlanProvider,
  CUSTOM_API_KEY_ENV_PREFIX,
  customProvider,
  deepseekProvider,
  findProviderByCredentials,
  findProviderById,
  generateCustomEnvKey,
  getAllProviderBaseUrls,
  grokProvider,
  idealabProvider,
  LOCAL_PROVIDERS,
  minimaxProvider,
  modelscopeProvider,
  ollamaProvider,
  openRouterProvider,
  THIRD_PARTY_PROVIDERS,
  tokenPlanProvider,
  zaiProvider,
} from './all-providers.js';

// Preset constants
export {
  CODING_PLAN_CHINA_BASE_URL,
  CODING_PLAN_ENV_KEY,
  CODING_PLAN_GLOBAL_BASE_URL,
} from './presets/alibaba-coding-plan.js';
export {
  TOKEN_PLAN_BASE_URL,
  TOKEN_PLAN_ENV_KEY,
} from './presets/alibaba-token-plan.js';
export {
  OPENROUTER_BASE_URL,
  OPENROUTER_ENV_KEY,
} from './presets/openrouter.js';
export {
  OLLAMA_BASE_URL,
  OLLAMA_ENV_KEY,
} from './presets/ollama.js';
export {
  GROK_BASE_URL,
  GROK_ENV_KEY,
} from './presets/grok.js';

// Install logic
export {
  applyProviderInstallPlan,
  ProviderInstallError,
  type ApplyProviderInstallPlanOptions,
  type ApplyProviderInstallPlanResult,
} from './install.js';
