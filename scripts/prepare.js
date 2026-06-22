/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Prepare hook for npm lifecycle.
 *
 * Local development: installs git hooks (husky) and builds + bundles the CLI
 * so `npm install` leaves the repo in a runnable state.
 *
 * CI / Docker (CI=true): skips build and bundle — the workflow already runs
 * those steps explicitly. Running them here would waste 2-5 minutes and create
 * redundant failure points. husky is still invoked (it auto-detects CI and
 * skips hook installation), but wrapped in try/catch so a missing .git
 * directory never breaks `npm ci`.
 */

import { execSync } from 'node:child_process';

const isCI = !!process.env.CI;

if (!isCI) {
  // Local development: full setup
  execSync('husky', { stdio: 'inherit' });
  execSync('npm run build', { stdio: 'inherit' });
  execSync('npm run bundle', { stdio: 'inherit' });
} else {
  // CI: only set up git hooks (husky auto-skips in CI environments)
  try {
    execSync('husky', { stdio: 'inherit' });
  } catch {
    // .git may not be fully available in CI/Docker; safe to skip
  }
}
