/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const timeoutMinutes = Number(process.env['TB_TIMEOUT_MINUTES'] || '5');
const testTimeoutMs = timeoutMinutes * 60 * 1000;

// In CI, reduce thread parallelism to avoid resource contention.
// Each test thread spawns a CLI subprocess that makes API calls,
// so too many concurrent threads can cause timeouts and flaky failures.
const isCI = !!process.env['CI'];
const maxThreads = isCI ? 2 : 4;
const minThreads = isCI ? 1 : 2;

export default defineConfig({
  test: {
    testTimeout: testTimeoutMs,
    globalSetup: './globalSetup.ts',
    reporters: ['default'],
    include: ['**/*.test.ts'],
    exclude: [
      '**/terminal-bench/*.test.ts',
      '**/hook-integration/**',
      '**/turbospark-daemon-loadtest*',
      '**/node_modules/**',
    ],
    retry: 2,
    fileParallelism: true,
    poolOptions: {
      threads: {
        minThreads: minThreads,
        maxThreads: maxThreads,
      },
    },
  },
  resolve: {
    alias: {
      // Use built SDK bundle for e2e tests
      '@turbospark/sdk': resolve(
        __dirname,
        '../packages/sdk-typescript/dist/index.mjs',
      ),
    },
  },
});
