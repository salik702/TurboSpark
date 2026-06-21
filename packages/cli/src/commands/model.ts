/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { selectAutoProvider, formatAutoProviderResult } from '../utils/smartAutoProvider.js';

interface ModelArgs {
  provider?: string;
  list?: boolean;
}

// Provider names are handled as string literals in argv
// Args are accessed via argv['key'] casting

const PROVIDER_CONFIGS: Record<
  string,
  { envKey: string; baseUrl: string; defaultModel: string; label: string }
> = {
  openrouter: {
    envKey: 'OPENROUTER_API_KEY',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-oss-120b:free',
    label: 'OpenRouter',
  },
  grok: {
    envKey: 'GROK_API_KEY',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-3',
    label: 'Grok (xAI)',
  },
  ollama: {
    envKey: 'OLLAMA_BASE_URL',
    baseUrl: 'http://localhost:11434',
    defaultModel: 'llama3.1',
    label: 'Ollama (Local)',
  },
  openai: {
    envKey: 'OPENAI_API_KEY',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    label: 'OpenAI',
  },
  anthropic: {
    envKey: 'ANTHROPIC_API_KEY',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-20250514',
    label: 'Anthropic',
  },
  deepseek: {
    envKey: 'DEEPSEEK_API_KEY',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    label: 'DeepSeek',
  },
};

/**
 * Get the turbospark user settings file path.
 */
function getSettingsPath(): string {
  return path.join(homedir(), '.turbospark', 'settings.json');
}

/**
 * Read current settings (or return empty object if missing).
 */
function readSettings(): Record<string, unknown> {
  const settingsPath = getSettingsPath();
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as Record<string, unknown>;
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Write settings back to disk.
 */
function writeSettings(settings: Record<string, unknown>): void {
  const settingsPath = getSettingsPath();
  const dir = path.dirname(settingsPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}

/**
 * Get the currently active provider from settings.
 */
function getCurrentProvider(): string | null {
  const settings = readSettings();
  const envKey = (settings as { selectedModelProvider?: string }).selectedModelProvider;
  return envKey ?? null;
}

/**
 * Set the active provider in settings.
 */
function setActiveProvider(provider: string, baseUrl: string, model: string): void {
  const settings = readSettings();
  const updated = {
    ...settings,
    selectedModelProvider: provider,
    // These are stored as hints — actual model selection goes through /auth
    _turbospark_model_hint: model,
    _turbospark_baseurl_hint: baseUrl,
  };
  writeSettings(updated);
}

/**
 * Check which providers are currently configured (have API keys or are available).
 */
async function getProviderStatuses(): Promise<
  Array<{ id: string; label: string; status: 'available' | 'missing'; note: string }>
> {
  const results = [];

  for (const [id, cfg] of Object.entries(PROVIDER_CONFIGS)) {
    if (id === 'ollama') {
      // Check if Ollama is actually running
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      let available = false;
      let modelCount = 0;
      try {
        const res = await fetch(
          `${process.env['OLLAMA_BASE_URL'] ?? cfg.baseUrl}/api/tags`,
          { signal: controller.signal },
        );
        clearTimeout(timeout);
        if (res.ok) {
          const data = (await res.json()) as { models?: unknown[] };
          available = true;
          modelCount = data.models?.length ?? 0;
        }
      } catch {
        clearTimeout(timeout);
      }
      results.push({
        id,
        label: cfg.label,
        status: available ? ('available' as const) : ('missing' as const),
        note: available ? `running (${modelCount} models)` : 'not running — install from ollama.com',
      });
    } else {
      const key = process.env[cfg.envKey];
      results.push({
        id,
        label: cfg.label,
        status: key ? ('available' as const) : ('missing' as const),
        note: key ? `key set (${cfg.envKey})` : `set ${cfg.envKey} to enable`,
      });
    }
  }

  return results;
}

export const modelCommand: CommandModule<object, ModelArgs> = {
  command: 'model [provider]',
  describe: 'Switch AI provider/model (openrouter | grok | ollama | openai | anthropic | auto)',
  builder: (yargs) =>
    yargs
      .positional('provider', {
        type: 'string',
        choices: ['openrouter', 'grok', 'ollama', 'openai', 'anthropic', 'deepseek', 'auto'],
        describe: 'Provider to switch to (omit to show current)',
      })
      .option('list', {
        type: 'boolean',
        alias: 'l',
        describe: 'List all providers and their status',
      })
      .example('$0 model openrouter', 'Switch to OpenRouter')
      .example('$0 model ollama', 'Switch to local Ollama')
      .example('$0 model auto', 'Auto-select best available provider')
      .example('$0 model --list', 'Show all provider statuses'),
  handler: async (argv) => {
    console.log('');

    // --list: show all provider statuses
    if (argv.list) {
      console.log('  TURBO SPARK — Provider Status');
      console.log('  ─────────────────────────────────────────────────────────');
      const statuses = await getProviderStatuses();
      const current = getCurrentProvider();
      for (const s of statuses) {
        const active = s.id === current ? ' ← active' : '';
        const icon = s.status === 'available' ? '[✓]' : '[ ]';
        console.log(`  ${icon} ${s.label.padEnd(18)} ${s.note}${active}`);
      }
      console.log('');
      console.log('  Use: turbospark model <provider> to switch');
      console.log('');
      return;
    }

    // No provider argument — show current
    if (!argv.provider) {
      const current = getCurrentProvider();
      if (current) {
        const cfg = PROVIDER_CONFIGS[current];
        console.log(`  Active provider: ${cfg?.label ?? current}`);
        if (cfg) {
          console.log(`  Default model:   ${cfg.defaultModel}`);
          console.log(`  Base URL:        ${cfg.baseUrl}`);
        }
      } else {
        console.log('  No provider explicitly selected (using defaults from /auth settings).');
        console.log('  Run: turbospark model auto  to auto-select');
      }
      console.log('');
      return;
    }

    // auto: run smart auto-detection
    if (argv.provider === 'auto') {
      console.log('  Detecting best available provider...');
      const result = await selectAutoProvider();
      console.log(formatAutoProviderResult(result));
      if (result) {
        setActiveProvider(result.provider, result.baseUrl ?? '', result.model ?? '');
        console.log(`  ✓ Provider hint saved: ${result.provider}`);
        console.log('  Note: Use /auth in the interactive session to apply credentials.');
      }
      console.log('');
      return;
    }

    // Specific provider
    const providerKey = argv.provider as string;
    const cfg = PROVIDER_CONFIGS[providerKey];

    if (!cfg) {
      console.error(`  Error: Unknown provider "${providerKey}"`);
      console.error(`  Valid options: ${Object.keys(PROVIDER_CONFIGS).join(', ')}, auto`);
      console.log('');
      process.exit(1);
    }

    // Check availability
    if (providerKey !== 'ollama') {
      const key = process.env[cfg.envKey];
      if (!key) {
        console.log(`  ⚠  ${cfg.label} API key not set.`);
        console.log(`  Set ${cfg.envKey} in your environment to use this provider.`);
        console.log('');
        console.log('  Provider hint saved anyway — set the env var before starting turbospark.');
        console.log('');
      }
    }

    setActiveProvider(providerKey, cfg.baseUrl, cfg.defaultModel);

    console.log(`  ✓ Switched to: ${cfg.label}`);
    console.log(`  Default model: ${cfg.defaultModel}`);
    console.log(`  Base URL:      ${cfg.baseUrl}`);
    console.log('');
    console.log('  Note: Use /auth in the interactive session to apply and authenticate.');
    console.log('');
  },
};
