import * as path from 'node:path';
import * as os from 'node:os';

/**
 * Expands tilde and resolves relative paths to absolute.
 * Mirrors Storage.resolvePath() in packages/core.
 */
export function resolvePath(dir: string): string {
  let resolved = dir;
  if (
    resolved === '~' ||
    resolved.startsWith('~/') ||
    resolved.startsWith('~\\')
  ) {
    const relativeSegments =
      resolved === '~'
        ? []
        : resolved
            .slice(2)
            .split(/[/\\]+/)
            .filter(Boolean);
    resolved = path.join(os.homedir(), ...relativeSegments);
  }
  if (!path.isAbsolute(resolved)) {
    resolved = path.resolve(resolved);
  }
  return resolved;
}

/**
 * Returns the global Qwen home directory (config, credentials, etc.).
 *
 * Priority: TURBOSPARK_HOME env var > ~/.turbospark
 *
 * This mirrors packages/core Storage.getGlobalTurbosparkDir() without importing
 * from core to avoid cross-package dependencies.
 */
export function getGlobalTurbosparkDir(): string {
  const envDir = process.env['TURBOSPARK_HOME'];
  if (envDir) {
    return resolvePath(envDir);
  }
  const homeDir = os.homedir();
  return homeDir
    ? path.join(homeDir, '.turbospark')
    : path.join(os.tmpdir(), '.turbospark');
}
