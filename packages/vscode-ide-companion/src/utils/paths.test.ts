/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import {
  getGlobalTurbosparkDir,
  getRuntimeBaseDir,
  resetEnvBootstrapForTesting,
} from './paths.js';

/**
 * Each test gets a clean temp homedir (no `.env` files), so the lazy
 * `bootstrapHomeEnvOverrides()` becomes a no-op unless the test explicitly
 * writes `.env` content into the mocked home. ESM bans spying on `os.homedir`,
 * so we redirect via the underlying `HOME` / `USERPROFILE` env vars.
 */
function withCleanHome() {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'qwen-paths-test-'));
  const realHome = fs.realpathSync(tempHome);
  const originalHomeEnv = process.env['HOME'];
  const originalUserProfile = process.env['USERPROFILE'];
  process.env['HOME'] = realHome;
  process.env['USERPROFILE'] = realHome;
  return {
    tempHome: realHome,
    cleanup: () => {
      if (originalHomeEnv !== undefined) {
        process.env['HOME'] = originalHomeEnv;
      } else {
        delete process.env['HOME'];
      }
      if (originalUserProfile !== undefined) {
        process.env['USERPROFILE'] = originalUserProfile;
      } else {
        delete process.env['USERPROFILE'];
      }
      fs.rmSync(realHome, { recursive: true, force: true });
    },
  };
}

describe('vscode-ide-companion paths – getGlobalTurbosparkDir', () => {
  const originalEnv = process.env['TURBOSPARK_HOME'];
  let home: ReturnType<typeof withCleanHome>;

  beforeEach(() => {
    resetEnvBootstrapForTesting();
    home = withCleanHome();
  });

  afterEach(() => {
    home.cleanup();
    if (originalEnv !== undefined) {
      process.env['TURBOSPARK_HOME'] = originalEnv;
    } else {
      delete process.env['TURBOSPARK_HOME'];
    }
  });

  it('defaults to ~/.turbospark when TURBOSPARK_HOME is not set', () => {
    delete process.env['TURBOSPARK_HOME'];
    expect(getGlobalTurbosparkDir()).toBe(path.join(home.tempHome, '.turbospark'));
  });

  it('uses TURBOSPARK_HOME when set to absolute path', () => {
    const configDir = path.resolve('/tmp/custom-qwen');
    process.env['TURBOSPARK_HOME'] = configDir;
    expect(getGlobalTurbosparkDir()).toBe(configDir);
  });

  it('resolves relative TURBOSPARK_HOME against process.cwd', () => {
    process.env['TURBOSPARK_HOME'] = 'relative/config';
    expect(getGlobalTurbosparkDir()).toBe(path.resolve('relative/config'));
  });

  it('expands tilde (~/x) in TURBOSPARK_HOME', () => {
    process.env['TURBOSPARK_HOME'] = '~/custom-qwen';
    expect(getGlobalTurbosparkDir()).toBe(path.join(home.tempHome, 'custom-qwen'));
  });

  it('expands Windows-style tilde (~\\x) in TURBOSPARK_HOME', () => {
    process.env['TURBOSPARK_HOME'] = '~\\custom-qwen';
    expect(getGlobalTurbosparkDir()).toBe(path.join(home.tempHome, 'custom-qwen'));
  });

  it('treats bare tilde (~) as home directory', () => {
    process.env['TURBOSPARK_HOME'] = '~';
    expect(getGlobalTurbosparkDir()).toBe(home.tempHome);
  });
});

describe('vscode-ide-companion paths – getRuntimeBaseDir', () => {
  const originalHome = process.env['TURBOSPARK_HOME'];
  const originalRuntime = process.env['TURBOSPARK_RUNTIME_DIR'];
  let home: ReturnType<typeof withCleanHome>;

  beforeEach(() => {
    resetEnvBootstrapForTesting();
    home = withCleanHome();
  });

  afterEach(() => {
    home.cleanup();
    if (originalHome !== undefined) {
      process.env['TURBOSPARK_HOME'] = originalHome;
    } else {
      delete process.env['TURBOSPARK_HOME'];
    }
    if (originalRuntime !== undefined) {
      process.env['TURBOSPARK_RUNTIME_DIR'] = originalRuntime;
    } else {
      delete process.env['TURBOSPARK_RUNTIME_DIR'];
    }
  });

  it('falls back to getGlobalTurbosparkDir() when neither env var is set', () => {
    delete process.env['TURBOSPARK_HOME'];
    delete process.env['TURBOSPARK_RUNTIME_DIR'];
    expect(getRuntimeBaseDir()).toBe(getGlobalTurbosparkDir());
  });

  it('uses TURBOSPARK_RUNTIME_DIR when set to absolute path', () => {
    delete process.env['TURBOSPARK_HOME'];
    const runtimeDir = path.resolve('/tmp/custom-runtime');
    process.env['TURBOSPARK_RUNTIME_DIR'] = runtimeDir;
    expect(getRuntimeBaseDir()).toBe(runtimeDir);
  });

  it('resolves relative TURBOSPARK_RUNTIME_DIR against process.cwd', () => {
    delete process.env['TURBOSPARK_HOME'];
    process.env['TURBOSPARK_RUNTIME_DIR'] = 'relative/runtime';
    expect(getRuntimeBaseDir()).toBe(path.resolve('relative/runtime'));
  });

  it('expands tilde (~/x) in TURBOSPARK_RUNTIME_DIR', () => {
    delete process.env['TURBOSPARK_HOME'];
    process.env['TURBOSPARK_RUNTIME_DIR'] = '~/custom-runtime';
    expect(getRuntimeBaseDir()).toBe(
      path.join(home.tempHome, 'custom-runtime'),
    );
  });

  it('falls back to TURBOSPARK_HOME when TURBOSPARK_RUNTIME_DIR is unset', () => {
    delete process.env['TURBOSPARK_RUNTIME_DIR'];
    const configDir = path.resolve('/tmp/custom-qwen');
    process.env['TURBOSPARK_HOME'] = configDir;
    expect(getRuntimeBaseDir()).toBe(configDir);
  });

  it('TURBOSPARK_RUNTIME_DIR takes priority over TURBOSPARK_HOME', () => {
    const configDir = path.resolve('/tmp/custom-qwen');
    const runtimeDir = path.resolve('/tmp/custom-runtime');
    process.env['TURBOSPARK_HOME'] = configDir;
    process.env['TURBOSPARK_RUNTIME_DIR'] = runtimeDir;
    expect(getRuntimeBaseDir()).toBe(runtimeDir);
  });
});

describe('vscode-ide-companion paths – .env bootstrap', () => {
  const originalHome = process.env['TURBOSPARK_HOME'];
  const originalRuntime = process.env['TURBOSPARK_RUNTIME_DIR'];
  let home: ReturnType<typeof withCleanHome>;

  beforeEach(() => {
    resetEnvBootstrapForTesting();
    home = withCleanHome();
    delete process.env['TURBOSPARK_HOME'];
    delete process.env['TURBOSPARK_RUNTIME_DIR'];
  });

  afterEach(() => {
    home.cleanup();
    if (originalHome !== undefined) {
      process.env['TURBOSPARK_HOME'] = originalHome;
    } else {
      delete process.env['TURBOSPARK_HOME'];
    }
    if (originalRuntime !== undefined) {
      process.env['TURBOSPARK_RUNTIME_DIR'] = originalRuntime;
    } else {
      delete process.env['TURBOSPARK_RUNTIME_DIR'];
    }
  });

  it('reads TURBOSPARK_HOME from <homedir>/.turbospark/.env', () => {
    const configDir = path.resolve('/tmp/from-qwen-dotenv');
    fs.mkdirSync(path.join(home.tempHome, '.turbospark'), { recursive: true });
    fs.writeFileSync(
      path.join(home.tempHome, '.turbospark', '.env'),
      `TURBOSPARK_HOME=${configDir}\n`,
    );
    expect(getGlobalTurbosparkDir()).toBe(configDir);
    expect(process.env['TURBOSPARK_HOME']).toBe(configDir);
  });

  it('reads TURBOSPARK_HOME from <homedir>/.env when ~/.turbospark/.env is absent', () => {
    const configDir = path.resolve('/tmp/from-home-dotenv');
    fs.writeFileSync(
      path.join(home.tempHome, '.env'),
      `TURBOSPARK_HOME=${configDir}\n`,
    );
    expect(getGlobalTurbosparkDir()).toBe(configDir);
    expect(process.env['TURBOSPARK_HOME']).toBe(configDir);
  });

  it('process env wins over .env file', () => {
    const envDir = path.resolve('/tmp/from-process-env');
    const dotenvDir = path.resolve('/tmp/from-dotenv');
    process.env['TURBOSPARK_HOME'] = envDir;
    fs.mkdirSync(path.join(home.tempHome, '.turbospark'), { recursive: true });
    fs.writeFileSync(
      path.join(home.tempHome, '.turbospark', '.env'),
      `TURBOSPARK_HOME=${dotenvDir}\n`,
    );
    expect(getGlobalTurbosparkDir()).toBe(envDir);
  });

  it('reads TURBOSPARK_RUNTIME_DIR from <TURBOSPARK_HOME>/.env when TURBOSPARK_HOME is preset', () => {
    const configDir = path.join(home.tempHome, 'custom-qwen');
    const runtimeDir = path.resolve('/tmp/from-runtime-dotenv');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, '.env'),
      `TURBOSPARK_RUNTIME_DIR=${runtimeDir}\n`,
    );
    process.env['TURBOSPARK_HOME'] = configDir;
    expect(getRuntimeBaseDir()).toBe(runtimeDir);
  });

  it('does not read <homedir>/.env when TURBOSPARK_HOME is preset', () => {
    const configDir = path.resolve('/tmp/preset-qwen-home');
    process.env['TURBOSPARK_HOME'] = configDir;
    fs.writeFileSync(
      path.join(home.tempHome, '.env'),
      `TURBOSPARK_RUNTIME_DIR=/tmp/should-be-ignored\n`,
    );
    expect(getRuntimeBaseDir()).toBe(configDir);
    expect(process.env['TURBOSPARK_RUNTIME_DIR']).toBeUndefined();
  });

  it('reads TURBOSPARK_RUNTIME_DIR from <new TURBOSPARK_HOME>/.env after discovery via ~/.turbospark/.env', () => {
    const configDir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'qwen-bootstrap-cfg-')),
    );
    const runtimeDir = path.resolve('/tmp/from-discovered-runtime');
    fs.mkdirSync(path.join(home.tempHome, '.turbospark'), { recursive: true });
    fs.writeFileSync(
      path.join(home.tempHome, '.turbospark', '.env'),
      `TURBOSPARK_HOME=${configDir}\n`,
    );
    fs.writeFileSync(
      path.join(configDir, '.env'),
      `TURBOSPARK_RUNTIME_DIR=${runtimeDir}\n`,
    );
    try {
      expect(getRuntimeBaseDir()).toBe(runtimeDir);
      expect(process.env['TURBOSPARK_HOME']).toBe(configDir);
      expect(process.env['TURBOSPARK_RUNTIME_DIR']).toBe(runtimeDir);
    } finally {
      fs.rmSync(configDir, { recursive: true, force: true });
    }
  });
});
