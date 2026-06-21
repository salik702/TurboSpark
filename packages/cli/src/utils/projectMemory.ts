/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createDebugLogger } from '@turbospark/turbospark-core';

const debugLogger = createDebugLogger('PROJECT_MEMORY');

export interface ProjectMemory {
  userPreferences: UserPreferences;
  previousPrompts: PromptHistory[];
  frequentlyUsedModels: ModelUsage[];
  lastUpdated: string;
}

export interface UserPreferences {
  preferredProvider?: string;
  preferredModel?: string;
  turboModeDefault?: boolean;
  defaultWorkingDirectory?: string;
  customSettings?: Record<string, string>;
}

export interface PromptHistory {
  prompt: string;
  timestamp: string;
  projectContext?: string;
  usageCount: number;
}

export interface ModelUsage {
  modelId: string;
  provider: string;
  usageCount: number;
  lastUsed: string;
}

const MEMORY_FILE_NAME = '.turbospark-memory.json';
const MAX_PROMPT_HISTORY = 50;
const MAX_MODEL_HISTORY = 20;

let memoryCache: Map<string, ProjectMemory> = new Map();

/**
 * Get memory file path for a project directory
 */
function getMemoryFilePath(projectDir: string): string {
  return path.join(projectDir, MEMORY_FILE_NAME);
}



/**
 * Load project memory from disk
 */
export function loadProjectMemory(projectDir: string): ProjectMemory {
  const cacheKey = projectDir;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  const defaultMemory: ProjectMemory = {
    userPreferences: {},
    previousPrompts: [],
    frequentlyUsedModels: [],
    lastUpdated: new Date().toISOString(),
  };

  try {
    const memoryPath = getMemoryFilePath(projectDir);
    if (fs.existsSync(memoryPath)) {
      const content = fs.readFileSync(memoryPath, 'utf8');
      const memory = JSON.parse(content) as ProjectMemory;
      memoryCache.set(cacheKey, memory);
      return memory;
    }
  } catch (err) {
    debugLogger.warn('Failed to load project memory:', err);
  }

  memoryCache.set(cacheKey, defaultMemory);
  return defaultMemory;
}

/**
 * Save project memory to disk
 */
export function saveProjectMemory(
  projectDir: string,
  memory: ProjectMemory,
): void {
  memory.lastUpdated = new Date().toISOString();
  const cacheKey = projectDir;
  memoryCache.set(cacheKey, memory);

  try {
    const memoryPath = getMemoryFilePath(projectDir);
    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2), 'utf8');
    debugLogger.info(`Saved project memory to ${memoryPath}`);
  } catch (err) {
    debugLogger.warn('Failed to save project memory:', err);
  }
}

/**
 * Add a prompt to history
 */
export function addPromptToHistory(
  projectDir: string,
  prompt: string,
  projectContext?: string,
): void {
  const memory = loadProjectMemory(projectDir);

  // Check if prompt already exists
  const existingIndex = memory.previousPrompts.findIndex(
    (p) => p.prompt === prompt,
  );

  if (existingIndex >= 0) {
    // Update usage count and timestamp
    memory.previousPrompts[existingIndex]!.usageCount++;
    memory.previousPrompts[existingIndex]!.timestamp = new Date().toISOString();
  } else {
    // Add new prompt
    memory.previousPrompts.unshift({
      prompt,
      timestamp: new Date().toISOString(),
      projectContext,
      usageCount: 1,
    });

    // Trim to max size
    if (memory.previousPrompts.length > MAX_PROMPT_HISTORY) {
      memory.previousPrompts = memory.previousPrompts.slice(0, MAX_PROMPT_HISTORY);
    }
  }

  saveProjectMemory(projectDir, memory);
}

/**
 * Record model usage
 */
export function recordModelUsage(
  projectDir: string,
  modelId: string,
  provider: string,
): void {
  const memory = loadProjectMemory(projectDir);

  const existingIndex = memory.frequentlyUsedModels.findIndex(
    (m) => m.modelId === modelId && m.provider === provider,
  );

  if (existingIndex >= 0) {
    memory.frequentlyUsedModels[existingIndex]!.usageCount++;
    memory.frequentlyUsedModels[existingIndex]!.lastUsed =
      new Date().toISOString();
  } else {
    memory.frequentlyUsedModels.unshift({
      modelId,
      provider,
      usageCount: 1,
      lastUsed: new Date().toISOString(),
    });

    if (memory.frequentlyUsedModels.length > MAX_MODEL_HISTORY) {
      memory.frequentlyUsedModels = memory.frequentlyUsedModels.slice(
        0,
        MAX_MODEL_HISTORY,
      );
    }
  }

  // Sort by usage count (descending)
  memory.frequentlyUsedModels.sort((a, b) => b.usageCount - a.usageCount);

  saveProjectMemory(projectDir, memory);
}

/**
 * Update user preferences
 */
export function updateUserPreferences(
  projectDir: string,
  preferences: Partial<UserPreferences>,
): void {
  const memory = loadProjectMemory(projectDir);
  memory.userPreferences = {
    ...memory.userPreferences,
    ...preferences,
  };
  saveProjectMemory(projectDir, memory);
}

/**
 * Get most frequently used model
 */
export function getMostUsedModel(projectDir: string): ModelUsage | null {
  const memory = loadProjectMemory(projectDir);
  return memory.frequentlyUsedModels[0] ?? null;
}

/**
 * Get recent prompts
 */
export function getRecentPrompts(projectDir: string, limit = 10): PromptHistory[] {
  const memory = loadProjectMemory(projectDir);
  return memory.previousPrompts.slice(0, limit);
}

/**
 * Clear project memory
 */
export function clearProjectMemory(projectDir: string): void {
  const cacheKey = projectDir;
  memoryCache.delete(cacheKey);

  try {
    const memoryPath = getMemoryFilePath(projectDir);
    if (fs.existsSync(memoryPath)) {
      fs.unlinkSync(memoryPath);
      debugLogger.info(`Cleared project memory at ${memoryPath}`);
    }
  } catch (err) {
    debugLogger.warn('Failed to clear project memory:', err);
  }
}

/**
 * Clear all memory caches
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
}

/**
 * Format memory summary for display
 */
export function formatMemorySummary(projectDir: string): string {
  const memory = loadProjectMemory(projectDir);
  const lines: string[] = [];

  lines.push('');
  lines.push('  TURBO SPARK Project Memory');
  lines.push('  ──────────────────────────');
  lines.push(`  Prompts Stored:    ${memory.previousPrompts.length}`);
  lines.push(`  Models Tracked:    ${memory.frequentlyUsedModels.length}`);
  lines.push(`  Last Updated:      ${memory.lastUpdated}`);

  if (memory.userPreferences.preferredProvider) {
    lines.push(`  Preferred Provider: ${memory.userPreferences.preferredProvider}`);
  }
  if (memory.userPreferences.preferredModel) {
    lines.push(`  Preferred Model:   ${memory.userPreferences.preferredModel}`);
  }

  const topModel = getMostUsedModel(projectDir);
  if (topModel) {
    lines.push(`  Most Used Model:   ${topModel.modelId} (${topModel.usageCount} uses)`);
  }

  lines.push('');
  return lines.join('\n');
}
