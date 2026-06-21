/**
 * Centralized model registry.
 *
 * TURBO SPARK reports the live model list through ACP at session startup. The
 * static registry below provides a stable fallback for first-run UI, tests, and
 * utility calls before ACP metadata is available.
 */

export type ModelProvider = 'turbospark';

export interface ModelDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  descriptionKey?: string;
  provider: ModelProvider;
  contextWindow?: number;
  supportsThinking?: boolean;
}

export const DEFAULT_MODEL = 'coder-model';

export const MODEL_REGISTRY: ModelDefinition[] = [
  {
    id: DEFAULT_MODEL,
    name: 'Coder Model',
    shortName: 'Coder',
    description: 'Default TURBO SPARK model',
    provider: 'turbospark',
    contextWindow: 1_000_000,
  },
];

export function getModelsByProvider(provider: ModelProvider): ModelDefinition[] {
  return MODEL_REGISTRY.filter((model) => model.provider === provider);
}

export const AI_MODELS = getModelsByProvider('turbospark');

/** Compatibility export for older imports. */
export const MODELS = AI_MODELS;

/** @deprecated Use AI_MODELS instead */
export const QWEN_MODELS = AI_MODELS;

export function getDefaultSummarizationModel(): string {
  return DEFAULT_MODEL;
}

export function getModelById(modelId: string): ModelDefinition | undefined {
  return MODEL_REGISTRY.find((model) => model.id === modelId);
}

function humanizeModelId(modelId: string): string {
  const id = modelId.includes('/') ? modelId.split('/').pop() || modelId : modelId;
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getModelDisplayName(modelId: string): string {
  return getModelById(modelId)?.name ?? humanizeModelId(modelId);
}

export function getModelShortName(modelId: string): string {
  return getModelById(modelId)?.shortName ?? humanizeModelId(modelId);
}

export function getModelContextWindow(modelId: string): number | undefined {
  return getModelById(modelId)?.contextWindow;
}

export function isOpusModel(_modelId: string): boolean {
  return false;
}

export function isDefaultProviderModel(modelId: string): boolean {
  return getModelById(modelId)?.provider === 'turbospark';
}

/** @deprecated Use isDefaultProviderModel instead */
export function isQwenModel(modelId: string): boolean {
  return isDefaultProviderModel(modelId);
}

export function getModelProvider(modelId: string): ModelProvider | undefined {
  return getModelById(modelId)?.provider ?? (isDefaultProviderModel(modelId) ? 'turbospark' : undefined);
}
