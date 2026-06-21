import { describe, it, expect, afterEach } from 'vitest';
import * as path from 'node:path';
import * as os from 'node:os';
import { getGlobalTurbosparkDir, resolvePath } from './paths.js';

describe('channels/base paths – getGlobalTurbosparkDir', () => {
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
    expect(getGlobalTurbosparkDir()).toBe(path.join(os.homedir(), '.turbospark'));
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
    expect(getGlobalTurbosparkDir()).toBe(path.join(os.homedir(), 'custom-qwen'));
  });

  it('expands Windows-style tilde (~\\x) in TURBOSPARK_HOME', () => {
    process.env['TURBOSPARK_HOME'] = '~\\custom-qwen';
    expect(getGlobalTurbosparkDir()).toBe(path.join(os.homedir(), 'custom-qwen'));
  });

  it('treats bare tilde (~) as home directory', () => {
    process.env['TURBOSPARK_HOME'] = '~';
    expect(getGlobalTurbosparkDir()).toBe(os.homedir());
  });
});

describe('channels/base paths – resolvePath', () => {
  it('returns absolute paths unchanged', () => {
    const abs = path.resolve('/tmp/x');
    expect(resolvePath(abs)).toBe(abs);
  });

  it('expands bare tilde (~) to home directory', () => {
    expect(resolvePath('~')).toBe(os.homedir());
  });

  it('expands POSIX-style tilde (~/x)', () => {
    expect(resolvePath('~/xomo')).toBe(path.join(os.homedir(), 'xomo'));
  });

  it('expands Windows-style tilde (~\\x)', () => {
    expect(resolvePath('~\\xomo')).toBe(path.join(os.homedir(), 'xomo'));
  });

  it('resolves relative paths against process.cwd', () => {
    expect(resolvePath('relative/dir')).toBe(path.resolve('relative/dir'));
  });
});
