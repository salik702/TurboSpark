/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import { createDebugLogger } from '@turbospark/turbospark-core';

const debugLogger = createDebugLogger('DOCTOR');

export interface DoctorCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

export interface DoctorReport {
  timestamp: string;
  checks: DoctorCheckResult[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Check if an API key is configured in environment
 */
function checkApiKey(
  name: string,
  envKey: string,
): DoctorCheckResult {
  const value = process.env[envKey];
  if (value && value.length > 0) {
    const masked = value.substring(0, 4) + '...' + value.substring(value.length - 4);
    return {
      name: `${name} API Key`,
      status: 'pass',
      message: `Configured (${masked})`,
    };
  }
  return {
    name: `${name} API Key`,
    status: 'warn',
    message: `Not configured (set ${envKey} to enable)`,
  };
}

/**
 * Check network connectivity by attempting to reach a host
 */
async function checkNetworkConnectivity(): Promise<DoctorCheckResult> {
  const testUrl = 'https://api.github.com';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (response.ok || response.status === 403) {
      return {
        name: 'Network Connectivity',
        status: 'pass',
        message: 'Internet connection available',
      };
    }
    return {
      name: 'Network Connectivity',
      status: 'warn',
      message: `Unexpected response: ${response.status}`,
    };
  } catch (err) {
    clearTimeout(timeout);
    debugLogger.warn('Network check failed:', err);
    return {
      name: 'Network Connectivity',
      status: 'fail',
      message: 'No internet connection detected',
      details: (err as Error).message,
    };
  }
}

/**
 * Check if Ollama is available locally
 */
async function checkOllamaAvailability(): Promise<DoctorCheckResult> {
  const ollamaUrl = process.env['OLLAMA_BASE_URL'] || 'http://localhost:11434';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json() as { models?: Array<{ name: string }> };
      const modelCount = data.models?.length ?? 0;
      return {
        name: 'Ollama (Local)',
        status: 'pass',
        message: `Available at ${ollamaUrl} (${modelCount} models installed)`,
      };
    }
    return {
      name: 'Ollama (Local)',
      status: 'warn',
      message: `Ollama responded with status ${response.status}`,
    };
  } catch {
    clearTimeout(timeout);
    return {
      name: 'Ollama (Local)',
      status: 'warn',
      message: 'Not available (install from ollama.com for local models)',
    };
  }
}

/**
 * Check Node.js version
 */
function checkNodeVersion(): DoctorCheckResult {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0], 10);
  if (majorVersion >= 22) {
    return {
      name: 'Node.js Version',
      status: 'pass',
      message: `${version} (>= 22 required)`,
    };
  }
  return {
    name: 'Node.js Version',
    status: 'fail',
    message: `${version} (>= 22 required)`,
  };
}

/**
 * Run all doctor checks and return a report
 */
export async function runDoctorChecks(): Promise<DoctorReport> {
  const checks: DoctorCheckResult[] = [];

  // System checks
  checks.push(checkNodeVersion());
  checks.push(await checkNetworkConnectivity());

  // API Key checks
  checks.push(checkApiKey('OpenRouter', 'OPENROUTER_API_KEY'));
  checks.push(checkApiKey('Grok (xAI)', 'GROK_API_KEY'));
  checks.push(checkApiKey('OpenAI', 'OPENAI_API_KEY'));
  checks.push(checkApiKey('Anthropic', 'ANTHROPIC_API_KEY'));
  checks.push(checkApiKey('Gemini', 'GEMINI_API_KEY'));

  // Local provider checks
  checks.push(await checkOllamaAvailability());

  const summary = {
    passed: checks.filter((c) => c.status === 'pass').length,
    failed: checks.filter((c) => c.status === 'fail').length,
    warnings: checks.filter((c) => c.status === 'warn').length,
  };

  return {
    timestamp: new Date().toISOString(),
    checks,
    summary,
  };
}

/**
 * Format doctor report for terminal output
 */
export function formatDoctorReport(report: DoctorReport): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('╔══════════════════════════════════════════════════════════╗');
  lines.push('║              TURBO SPARK Doctor Report                  ║');
  lines.push('╚══════════════════════════════════════════════════════════╝');
  lines.push('');

  for (const check of report.checks) {
    const icon =
      check.status === 'pass'
        ? '[PASS]'
        : check.status === 'fail'
          ? '[FAIL]'
          : '[WARN]';
    lines.push(`  ${icon} ${check.name}`);
    lines.push(`         ${check.message}`);
    if (check.details) {
      lines.push(`         Details: ${check.details}`);
    }
  }

  lines.push('');
  lines.push('─────────────────────────────────────────────────────────────');
  lines.push(
    `  Summary: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings`,
  );
  lines.push('');

  if (report.summary.failed > 0) {
    lines.push('  Action required: Please fix the failed checks above.');
  } else if (report.summary.warnings > 0) {
    lines.push('  Tip: Configure API keys for full provider support.');
  } else {
    lines.push('  All checks passed! TURBO SPARK is ready to use.');
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Auto-fix safe issues found during doctor checks.
 *
 * Safe fixes (no user confirmation required):
 * - Create ~/.turbospark directory if missing
 * - Create ~/.turbospark/settings.json with defaults if missing
 * - Write a .env.example stub if no API keys are set at all
 */
async function runDoctorFix(report: DoctorReport): Promise<void> {
  const turbosparkDir = path.join(homedir(), '.turbospark');
  const settingsPath = path.join(turbosparkDir, 'settings.json');
  const fixes: string[] = [];

  // Fix 1: ensure ~/.turbospark exists
  if (!fs.existsSync(turbosparkDir)) {
    try {
      fs.mkdirSync(turbosparkDir, { recursive: true });
      fixes.push(`Created directory: ${turbosparkDir}`);
    } catch (err) {
      debugLogger.warn('Could not create .turbospark dir:', err);
    }
  }

  // Fix 2: ensure settings.json exists with minimal defaults
  if (!fs.existsSync(settingsPath)) {
    try {
      const defaults = {
        general: {
          enableAutoUpdate: true,
        },
      };
      fs.writeFileSync(settingsPath, JSON.stringify(defaults, null, 2) + '\n', 'utf8');
      fixes.push(`Created default settings: ${settingsPath}`);
    } catch (err) {
      debugLogger.warn('Could not create settings.json:', err);
    }
  }

  // Fix 3: create .env.example in cwd if no API keys are configured at all
  const apiKeyChecks = report.checks.filter(
    (c) => c.name.includes('API Key') && c.status !== 'pass',
  );
  if (apiKeyChecks.length === report.checks.filter((c) => c.name.includes('API Key')).length) {
    const envExamplePath = path.join(process.cwd(), '.env.example');
    if (!fs.existsSync(envExamplePath)) {
      try {
        const envExample = [
          '# TURBO SPARK — API Keys',
          '# Set one or more of these to enable AI providers',
          '',
          '# OpenRouter (openrouter.ai/keys)',
          'OPENROUTER_API_KEY=',
          '',
          '# Grok / xAI (console.x.ai)',
          'GROK_API_KEY=',
          '',
          '# OpenAI (platform.openai.com)',
          'OPENAI_API_KEY=',
          '',
          '# Anthropic (console.anthropic.com)',
          'ANTHROPIC_API_KEY=',
          '',
          '# Gemini (aistudio.google.com)',
          'GEMINI_API_KEY=',
          '',
          '# Ollama (local) — set to override default localhost:11434',
          '# OLLAMA_BASE_URL=http://localhost:11434',
          '',
        ].join('\n');
        fs.writeFileSync(envExamplePath, envExample, 'utf8');
        fixes.push(`Created .env.example in ${process.cwd()}`);
      } catch (err) {
        debugLogger.warn('Could not create .env.example:', err);
      }
    }
  }

  if (fixes.length === 0) {
    console.log('\n  No auto-fixable issues found.\n');
    return;
  }

  console.log('\n  Auto-fixes applied:');
  for (const fix of fixes) {
    console.log(`    ✓ ${fix}`);
  }
  console.log('');
  console.log(
    '  Note: API key issues must be fixed manually (set environment variables).',
  );
  console.log('');
}

interface DoctorArgs {
  fix?: boolean;
}

export const doctorCommand: CommandModule<object, DoctorArgs> = {
  command: 'doctor',
  describe: 'Run diagnostic checks to verify TURBO SPARK configuration',
  builder: (yargs) =>
    yargs
      .option('fix', {
        type: 'boolean',
        alias: 'f',
        default: false,
        describe: 'Auto-fix safe configuration issues',
      })
      .example('$0 doctor', 'Run all diagnostics')
      .example('$0 doctor --fix', 'Run diagnostics and auto-fix safe issues'),
  handler: async (argv) => {
    const report = await runDoctorChecks();
    console.log(formatDoctorReport(report));
    if (argv.fix) {
      await runDoctorFix(report);
    }
    if (report.summary.failed > 0 && !argv.fix) {
      process.exit(1);
    }
  },
};
