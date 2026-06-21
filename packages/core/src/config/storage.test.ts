/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import { Storage } from './storage.js';

const mockRealpathSync = vi.hoisted(() => vi.fn());

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const mocked = {
    ...actual,
    realpathSync: mockRealpathSync,
  };
  return {
    ...mocked,
    default: mocked,
  };
});

const actualFs = await vi.importActual<typeof import('node:fs')>('node:fs');

function createEnoent(pathToResolve: string): NodeJS.ErrnoException {
  const error = new Error(
    `ENOENT: no such file or directory, realpath '${pathToResolve}'`,
  ) as NodeJS.ErrnoException;
  error.code = 'ENOENT';
  return error;
}

function mockRealpath(
  resolutions: Map<string, string>,
  missingPaths = new Set<string>(),
): void {
  mockRealpathSync.mockImplementation((pathToResolve) => {
    const resolvedPath = pathToResolve.toString();
    if (missingPaths.has(resolvedPath)) {
      throw createEnoent(resolvedPath);
    }
    return resolutions.get(resolvedPath) ?? resolvedPath;
  });
}

describe('Storage – getGlobalSettingsPath', () => {
  it('returns path to ~/.turbospark/settings.json', () => {
    const expected = path.join(os.homedir(), '.turbospark', 'settings.json');
    expect(Storage.getGlobalSettingsPath()).toBe(expected);
  });
});

describe('Storage – additional helpers', () => {
  const projectRoot = '/tmp/project';
  const storage = new Storage(projectRoot);

  it('getWorkspaceSettingsPath returns project/.turbospark/settings.json', () => {
    const expected = path.join(projectRoot, '.turbospark', 'settings.json');
    expect(storage.getWorkspaceSettingsPath()).toBe(expected);
  });

  it('getUserCommandsDir returns ~/.turbospark/commands', () => {
    const expected = path.join(os.homedir(), '.turbospark', 'commands');
    expect(Storage.getUserCommandsDir()).toBe(expected);
  });

  it('getProjectCommandsDir returns project/.turbospark/commands', () => {
    const expected = path.join(projectRoot, '.turbospark', 'commands');
    expect(storage.getProjectCommandsDir()).toBe(expected);
  });

  it('getMcpOAuthTokensPath returns ~/.turbospark/mcp-oauth-tokens.json', () => {
    const expected = path.join(os.homedir(), '.turbospark', 'mcp-oauth-tokens.json');
    expect(Storage.getMcpOAuthTokensPath()).toBe(expected);
  });
});

describe('Storage – getRuntimeBaseDir / setRuntimeBaseDir', () => {
  const originalEnv = process.env['TURBOSPARK_RUNTIME_DIR'];

  beforeEach(() => {
    // Reset state before each test
    Storage.setRuntimeBaseDir(null);
    delete process.env['TURBOSPARK_RUNTIME_DIR'];
  });

  afterEach(() => {
    // Restore original env
    Storage.setRuntimeBaseDir(null);
    if (originalEnv !== undefined) {
      process.env['TURBOSPARK_RUNTIME_DIR'] = originalEnv;
    } else {
      delete process.env['TURBOSPARK_RUNTIME_DIR'];
    }
  });

  it('defaults to getGlobalTurbosparkDir() when nothing is configured', () => {
    expect(Storage.getRuntimeBaseDir()).toBe(Storage.getGlobalTurbosparkDir());
  });

  it('uses setRuntimeBaseDir value when set with absolute path', () => {
    const runtimeDir = path.resolve('custom', 'runtime');
    Storage.setRuntimeBaseDir(runtimeDir);
    expect(Storage.getRuntimeBaseDir()).toBe(runtimeDir);
  });

  it('env var TURBOSPARK_RUNTIME_DIR takes priority over setRuntimeBaseDir', () => {
    const settingsDir = path.resolve('from-settings');
    const envDir = path.resolve('from-env');
    Storage.setRuntimeBaseDir(settingsDir);
    process.env['TURBOSPARK_RUNTIME_DIR'] = envDir;
    expect(Storage.getRuntimeBaseDir()).toBe(envDir);
  });

  it('expands tilde (~) in setRuntimeBaseDir', () => {
    Storage.setRuntimeBaseDir('~/custom-runtime');
    const expected = path.join(os.homedir(), 'custom-runtime');
    expect(Storage.getRuntimeBaseDir()).toBe(expected);
  });

  it('expands Windows-style tilde paths in setRuntimeBaseDir', () => {
    Storage.setRuntimeBaseDir('~\\custom-runtime');
    const expected = path.join(os.homedir(), 'custom-runtime');
    expect(Storage.getRuntimeBaseDir()).toBe(expected);
  });

  it('expands tilde (~) in TURBOSPARK_RUNTIME_DIR env var', () => {
    process.env['TURBOSPARK_RUNTIME_DIR'] = '~/env-runtime';
    const expected = path.join(os.homedir(), 'env-runtime');
    expect(Storage.getRuntimeBaseDir()).toBe(expected);
  });

  it('resolves relative paths in setRuntimeBaseDir using process.cwd by default', () => {
    Storage.setRuntimeBaseDir('relative/path');
    const expected = path.resolve('relative/path');
    expect(Storage.getRuntimeBaseDir()).toBe(expected);
  });

  it('resolves relative paths in setRuntimeBaseDir using explicit cwd', () => {
    const cwd = path.resolve('workspace', 'projectA');
    Storage.setRuntimeBaseDir('.turbospark', cwd);
    expect(Storage.getRuntimeBaseDir()).toBe(path.join(cwd, '.turbospark'));
  });

  it('ignores cwd when path is absolute', () => {
    const absolutePath = path.resolve('absolute', 'path');
    const cwd = path.resolve('workspace', 'projectA');
    Storage.setRuntimeBaseDir(absolutePath, cwd);
    expect(Storage.getRuntimeBaseDir()).toBe(absolutePath);
  });

  it('ignores cwd when path starts with tilde', () => {
    Storage.setRuntimeBaseDir(
      '~/runtime',
      path.resolve('workspace', 'projectA'),
    );
    const expected = path.join(os.homedir(), 'runtime');
    expect(Storage.getRuntimeBaseDir()).toBe(expected);
  });

  it('resolves relative paths in TURBOSPARK_RUNTIME_DIR env var', () => {
    process.env['TURBOSPARK_RUNTIME_DIR'] = 'relative/env-path';
    const expected = path.resolve('relative/env-path');
    expect(Storage.getRuntimeBaseDir()).toBe(expected);
  });

  it('resets to default when setRuntimeBaseDir is called with null', () => {
    const customDir = path.resolve('custom');
    Storage.setRuntimeBaseDir(customDir);
    expect(Storage.getRuntimeBaseDir()).toBe(customDir);

    Storage.setRuntimeBaseDir(null);
    expect(Storage.getRuntimeBaseDir()).toBe(Storage.getGlobalTurbosparkDir());
  });

  it('resets to default when setRuntimeBaseDir is called with undefined', () => {
    Storage.setRuntimeBaseDir(path.resolve('custom'));
    Storage.setRuntimeBaseDir(undefined);
    expect(Storage.getRuntimeBaseDir()).toBe(Storage.getGlobalTurbosparkDir());
  });

  it('resets to default when setRuntimeBaseDir is called with empty string', () => {
    Storage.setRuntimeBaseDir(path.resolve('custom'));
    Storage.setRuntimeBaseDir('');
    expect(Storage.getRuntimeBaseDir()).toBe(Storage.getGlobalTurbosparkDir());
  });

  it('handles bare tilde (~) as home directory', () => {
    Storage.setRuntimeBaseDir('~');
    expect(Storage.getRuntimeBaseDir()).toBe(os.homedir());
  });
});

describe('Storage – getPlansDir', () => {
  const projectRoot = path.resolve('workspace', 'project');

  beforeEach(() => {
    mockRealpathSync.mockImplementation((pathToResolve) =>
      actualFs.realpathSync(pathToResolve),
    );
  });

  afterEach(() => {
    mockRealpathSync.mockReset();
  });

  it('defaults to ~/.turbospark/plans when plansDirectory is not configured', () => {
    expect(Storage.getPlansDir(projectRoot)).toBe(
      path.join(Storage.getGlobalTurbosparkDir(), 'plans'),
    );
  });

  it('resolves relative plansDirectory values against the project root', () => {
    expect(Storage.getPlansDir(projectRoot, './project-plans')).toBe(
      path.join(projectRoot, 'project-plans'),
    );
  });

  it('expands tilde in configured plansDirectory values', () => {
    const projectInHome = path.join(os.homedir(), 'workspace', 'project');
    expect(
      Storage.getPlansDir(projectInHome, '~/workspace/project/plans'),
    ).toBe(path.join(projectInHome, 'plans'));
  });

  it('allows absolute plansDirectory values inside the project root', () => {
    const plansDir = path.join(projectRoot, 'nested', 'plans');
    expect(Storage.getPlansDir(projectRoot, plansDir)).toBe(plansDir);
  });

  it('rejects relative plansDirectory values that escape the project root', () => {
    expect(() => Storage.getPlansDir(projectRoot, '../plans')).toThrow(
      'plansDirectory must resolve within the project root',
    );
  });

  it('rejects absolute plansDirectory values outside the project root', () => {
    const outsideProject = path.join(path.dirname(projectRoot), 'plans');
    expect(() => Storage.getPlansDir(projectRoot, outsideProject)).toThrow(
      'plansDirectory must resolve within the project root',
    );
  });

  it('requires projectRoot when plansDirectory is configured', () => {
    expect(() => Storage.getPlansDir(undefined, './plans')).toThrow(
      'projectRoot is required when plansDirectory is configured',
    );
    expect(() => Storage.getPlansDir(null, './plans')).toThrow(
      'projectRoot is required when plansDirectory is configured',
    );
  });

  it('rejects Windows-style absolute path outside the project root', () => {
    // Simulate project root on C: drive and plansDirectory on D: drive
    const projectOnC = path.resolve('C:', 'work', 'project');
    const plansOnD = path.resolve('D:', 'plans');
    expect(() => Storage.getPlansDir(projectOnC, plansOnD)).toThrow(
      'plansDirectory must resolve within the project root',
    );
  });

  it('rejects path with mixed separators that escapes project root', () => {
    // On Windows, path.resolve normalizes backslashes as path separators.
    // On POSIX, backslashes are literal characters, so this traversal
    // is inherently Windows-specific and should be guarded.
    if (process.platform !== 'win32') {
      return;
    }
    const tricky = '..\\..\\plans'; // backslashes with traversal
    expect(() => Storage.getPlansDir(projectRoot, tricky)).toThrow(
      'plansDirectory must resolve within the project root',
    );
  });

  it('rejects symlink pointing outside the project root', () => {
    const project = path.resolve('tmp', 'project');
    const outside = path.resolve('tmp', 'outside');
    const symlink = path.join(project, 'escape-link');
    mockRealpath(
      new Map([
        [project, project],
        [symlink, outside],
      ]),
    );

    expect(() => Storage.getPlansDir(project, './escape-link')).toThrow(
      'plansDirectory must resolve within the project root',
    );
  });

  it('allows legitimate symlink that stays within project root', () => {
    const project = path.resolve('tmp', 'project');
    const target = path.join(project, 'plans-target');
    const symlink = path.join(project, 'plans-link');
    mockRealpath(
      new Map([
        [project, project],
        [symlink, target],
      ]),
    );

    const result = Storage.getPlansDir(project, './plans-link');
    // The configured symlink path is accepted as long as it stays inside
    // the project root.
    expect(result).toBe(symlink);
  });

  it('rejects missing nested path under symlink that escapes project root', () => {
    const project = path.resolve('tmp', 'project');
    const outside = path.resolve('tmp', 'outside');
    const dataSymlink = path.join(project, 'data');
    const missingSubdir = path.join(dataSymlink, 'subdir');
    const missingPlans = path.join(missingSubdir, 'plans');
    mockRealpath(
      new Map([
        [project, project],
        [dataSymlink, outside],
      ]),
      new Set([missingPlans, missingSubdir]),
    );

    expect(() => Storage.getPlansDir(project, './data/subdir/plans')).toThrow(
      'plansDirectory must resolve within the project root',
    );
  });

  it('uses configured plansDirectory when building plan file paths', () => {
    expect(Storage.getPlanFilePath('session-123', projectRoot, './plans')).toBe(
      path.join(projectRoot, 'plans', 'session-123.md'),
    );
  });

  it('sanitizes session IDs when building plan file paths', () => {
    expect(
      Storage.getPlanFilePath('../../../escape', projectRoot, './plans'),
    ).toBe(path.join(projectRoot, 'plans', 'escape.md'));
  });
});

describe('Storage – runtime path methods use getRuntimeBaseDir', () => {
  const originalEnv = process.env['TURBOSPARK_RUNTIME_DIR'];

  beforeEach(() => {
    Storage.setRuntimeBaseDir(null);
    delete process.env['TURBOSPARK_RUNTIME_DIR'];
  });

  afterEach(() => {
    Storage.setRuntimeBaseDir(null);
    if (originalEnv !== undefined) {
      process.env['TURBOSPARK_RUNTIME_DIR'] = originalEnv;
    } else {
      delete process.env['TURBOSPARK_RUNTIME_DIR'];
    }
  });

  it('getGlobalTempDir uses custom runtime base dir', () => {
    const customDir = path.resolve('custom');
    Storage.setRuntimeBaseDir(customDir);
    expect(Storage.getGlobalTempDir()).toBe(path.join(customDir, 'tmp'));
  });

  it('getGlobalDebugDir uses custom runtime base dir', () => {
    const customDir = path.resolve('custom');
    Storage.setRuntimeBaseDir(customDir);
    expect(Storage.getGlobalDebugDir()).toBe(path.join(customDir, 'debug'));
  });

  it('getDebugLogPath uses custom runtime base dir', () => {
    const customDir = path.resolve('custom');
    Storage.setRuntimeBaseDir(customDir);
    expect(Storage.getDebugLogPath('session-123')).toBe(
      path.join(customDir, 'debug', 'session-123.txt'),
    );
  });

  it('getGlobalIdeDir is anchored to the global TURBOSPARK dir, not runtime base dir', () => {
    const customDir = path.resolve('custom');
    Storage.setRuntimeBaseDir(customDir);
    // IDE lock files are discovery anchors shared with the VS Code companion,
    // which can only see env vars (not settings-based runtimeOutputDir), so
    // getGlobalIdeDir must follow getGlobalTurbosparkDir to keep both sides aligned.
    expect(Storage.getGlobalIdeDir()).toBe(
      path.join(Storage.getGlobalTurbosparkDir(), 'ide'),
    );
  });

  it('getProjectDir uses custom runtime base dir', () => {
    const customDir = path.resolve('custom');
    Storage.setRuntimeBaseDir(customDir);
    const storage = new Storage('/tmp/project');
    expect(storage.getProjectDir()).toContain(path.join(customDir, 'projects'));
  });

  it('getProjectTempDir uses custom runtime base dir', () => {
    const customDir = path.resolve('custom');
    Storage.setRuntimeBaseDir(customDir);
    const storage = new Storage('/tmp/project');
    expect(storage.getProjectTempDir()).toContain(path.join(customDir, 'tmp'));
  });

  it('getProjectTempCheckpointsDir uses custom runtime base dir', () => {
    const customDir = path.resolve('custom');
    Storage.setRuntimeBaseDir(customDir);
    const storage = new Storage('/tmp/project');
    expect(storage.getProjectTempCheckpointsDir()).toContain(
      path.join(customDir, 'tmp'),
    );
    expect(storage.getProjectTempCheckpointsDir()).toMatch(/checkpoints$/);
  });

  it('getHistoryFilePath uses custom runtime base dir', () => {
    const customDir = path.resolve('custom');
    Storage.setRuntimeBaseDir(customDir);
    const storage = new Storage('/tmp/project');
    expect(storage.getHistoryFilePath()).toContain(path.join(customDir, 'tmp'));
    expect(storage.getHistoryFilePath()).toMatch(/shell_history$/);
  });
});

describe('Storage – config paths remain at ~/.turbospark regardless of runtime dir', () => {
  const originalEnv = process.env['TURBOSPARK_RUNTIME_DIR'];
  const globalQwenDir = Storage.getGlobalTurbosparkDir();

  beforeEach(() => {
    Storage.setRuntimeBaseDir(path.resolve('custom-runtime'));
    process.env['TURBOSPARK_RUNTIME_DIR'] = path.resolve('env-runtime');
  });

  afterEach(() => {
    Storage.setRuntimeBaseDir(null);
    if (originalEnv !== undefined) {
      process.env['TURBOSPARK_RUNTIME_DIR'] = originalEnv;
    } else {
      delete process.env['TURBOSPARK_RUNTIME_DIR'];
    }
  });

  it('getGlobalSettingsPath still uses ~/.turbospark', () => {
    expect(Storage.getGlobalSettingsPath()).toBe(
      path.join(globalQwenDir, 'settings.json'),
    );
  });

  it('getInstallationIdPath still uses ~/.turbospark', () => {
    expect(Storage.getInstallationIdPath()).toBe(
      path.join(globalQwenDir, 'installation_id'),
    );
  });

  it('getGoogleAccountsPath still uses ~/.turbospark', () => {
    expect(Storage.getGoogleAccountsPath()).toBe(
      path.join(globalQwenDir, 'google_accounts.json'),
    );
  });

  it('getMcpOAuthTokensPath still uses ~/.turbospark', () => {
    expect(Storage.getMcpOAuthTokensPath()).toBe(
      path.join(globalQwenDir, 'mcp-oauth-tokens.json'),
    );
  });

  it('getOAuthCredsPath still uses ~/.turbospark', () => {
    expect(Storage.getOAuthCredsPath()).toBe(
      path.join(globalQwenDir, 'oauth_creds.json'),
    );
  });

  it('getUserCommandsDir still uses ~/.turbospark', () => {
    expect(Storage.getUserCommandsDir()).toBe(
      path.join(globalQwenDir, 'commands'),
    );
  });

  it('getGlobalMemoryFilePath still uses ~/.turbospark', () => {
    expect(Storage.getGlobalMemoryFilePath()).toBe(
      path.join(globalQwenDir, 'memory.md'),
    );
  });

  it('getGlobalBinDir still uses ~/.turbospark', () => {
    expect(Storage.getGlobalBinDir()).toBe(path.join(globalQwenDir, 'bin'));
  });

  it('getUserSkillsDirs still includes ~/.turbospark/skills', () => {
    const storage = new Storage('/tmp/project');
    const skillsDirs = storage.getUserSkillsDirs();
    expect(
      skillsDirs.some((dir) => dir === path.join(globalQwenDir, 'skills')),
    ).toBe(true);
  });
});

describe('Storage – TURBOSPARK_HOME env var', () => {
  const originalEnv = process.env['TURBOSPARK_HOME'];

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env['TURBOSPARK_HOME'] = originalEnv;
    } else {
      delete process.env['TURBOSPARK_HOME'];
    }
  });

  it('defaults to ~/.turbospark when TURBOSPARK_HOME is not set', () => {
    delete process.env['TURBOSPARK_HOME'];
    const expected = path.join(os.homedir(), '.turbospark');
    expect(Storage.getGlobalTurbosparkDir()).toBe(expected);
  });

  it('uses TURBOSPARK_HOME when set to absolute path', () => {
    const configDir = path.resolve('/tmp/custom-qwen');
    process.env['TURBOSPARK_HOME'] = configDir;
    expect(Storage.getGlobalTurbosparkDir()).toBe(configDir);
  });

  it('resolves relative TURBOSPARK_HOME to absolute path', () => {
    process.env['TURBOSPARK_HOME'] = 'relative/config';
    const expected = path.resolve('relative/config');
    expect(Storage.getGlobalTurbosparkDir()).toBe(expected);
  });

  it('config paths follow TURBOSPARK_HOME', () => {
    const configDir = path.resolve('/tmp/custom-qwen');
    process.env['TURBOSPARK_HOME'] = configDir;
    expect(Storage.getGlobalSettingsPath()).toBe(
      path.join(configDir, 'settings.json'),
    );
    expect(Storage.getInstallationIdPath()).toBe(
      path.join(configDir, 'installation_id'),
    );
    expect(Storage.getUserCommandsDir()).toBe(path.join(configDir, 'commands'));
    expect(Storage.getMcpOAuthTokensPath()).toBe(
      path.join(configDir, 'mcp-oauth-tokens.json'),
    );
    expect(Storage.getOAuthCredsPath()).toBe(
      path.join(configDir, 'oauth_creds.json'),
    );
    expect(Storage.getGlobalBinDir()).toBe(path.join(configDir, 'bin'));
    expect(Storage.getGlobalMemoryFilePath()).toBe(
      path.join(configDir, 'memory.md'),
    );
  });

  it('project-level paths are NOT affected by TURBOSPARK_HOME', () => {
    const configDir = path.resolve('/tmp/custom-qwen');
    const projectDir = path.resolve('/tmp/project');
    process.env['TURBOSPARK_HOME'] = configDir;
    const storage = new Storage(projectDir);
    expect(storage.getWorkspaceSettingsPath()).toBe(
      path.join(projectDir, '.turbospark', 'settings.json'),
    );
    expect(storage.getProjectCommandsDir()).toBe(
      path.join(projectDir, '.turbospark', 'commands'),
    );
  });

  it('expands tilde (~) in TURBOSPARK_HOME', () => {
    process.env['TURBOSPARK_HOME'] = '~/custom-qwen';
    const expected = path.join(os.homedir(), 'custom-qwen');
    expect(Storage.getGlobalTurbosparkDir()).toBe(expected);
  });

  it('expands Windows-style tilde in TURBOSPARK_HOME', () => {
    process.env['TURBOSPARK_HOME'] = '~\\custom-qwen';
    const expected = path.join(os.homedir(), 'custom-qwen');
    expect(Storage.getGlobalTurbosparkDir()).toBe(expected);
  });

  it('handles bare tilde (~) as home directory in TURBOSPARK_HOME', () => {
    process.env['TURBOSPARK_HOME'] = '~';
    expect(Storage.getGlobalTurbosparkDir()).toBe(os.homedir());
  });

  it('TURBOSPARK_HOME and TURBOSPARK_RUNTIME_DIR are independent', () => {
    const configDir = path.resolve('/tmp/config');
    const runtimeDir = path.resolve('/tmp/runtime');
    process.env['TURBOSPARK_HOME'] = configDir;
    process.env['TURBOSPARK_RUNTIME_DIR'] = runtimeDir;
    expect(Storage.getGlobalTurbosparkDir()).toBe(configDir);
    expect(Storage.getRuntimeBaseDir()).toBe(runtimeDir);
    expect(Storage.getGlobalSettingsPath()).toBe(
      path.join(configDir, 'settings.json'),
    );
    expect(Storage.getGlobalTempDir()).toBe(path.join(runtimeDir, 'tmp'));
    expect(Storage.getGlobalDebugDir()).toBe(path.join(runtimeDir, 'debug'));
    delete process.env['TURBOSPARK_RUNTIME_DIR'];
  });
});

describe('Storage – runtime base dir async context isolation', () => {
  const originalEnv = process.env['TURBOSPARK_RUNTIME_DIR'];

  beforeEach(() => {
    Storage.setRuntimeBaseDir(null);
    delete process.env['TURBOSPARK_RUNTIME_DIR'];
  });

  afterEach(() => {
    Storage.setRuntimeBaseDir(null);
    if (originalEnv !== undefined) {
      process.env['TURBOSPARK_RUNTIME_DIR'] = originalEnv;
    } else {
      delete process.env['TURBOSPARK_RUNTIME_DIR'];
    }
  });

  it('uses contextual runtime dir inside runWithRuntimeBaseDir', async () => {
    Storage.setRuntimeBaseDir(path.resolve('global-runtime'));
    const cwd = path.resolve('workspace', 'project-a');

    await Storage.runWithRuntimeBaseDir('.turbospark', cwd, async () => {
      expect(Storage.getRuntimeBaseDir()).toBe(path.join(cwd, '.turbospark'));
    });
  });

  it('keeps concurrent contexts isolated', async () => {
    const cwdA = path.resolve('workspace', 'a');
    const cwdB = path.resolve('workspace', 'b');

    const runA = Storage.runWithRuntimeBaseDir('.turbospark-a', cwdA, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return Storage.getRuntimeBaseDir();
    });

    const runB = Storage.runWithRuntimeBaseDir('.turbospark-b', cwdB, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return Storage.getRuntimeBaseDir();
    });

    const [a, b] = await Promise.all([runA, runB]);
    expect(a).toBe(path.join(cwdA, '.turbospark-a'));
    expect(b).toBe(path.join(cwdB, '.turbospark-b'));
  });
});
