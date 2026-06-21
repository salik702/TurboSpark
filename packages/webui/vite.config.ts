/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

/**
 * Vite configuration for @turbospark/webui library
 *
 * Build outputs:
 * - Main entry:    dist/index.js, dist/index.cjs, dist/index.d.ts
 * - Advanced entry: dist/advanced.js, dist/advanced.cjs, dist/advanced.d.ts
 * - CSS: dist/styles.css
 */
export default defineConfig(({ command }) => ({
  resolve:
    command === 'serve'
      ? {
          alias: {
            '@turbospark/sdk/daemon': resolve(
              __dirname,
              '../sdk-typescript/src/daemon/index.ts',
            ),
            '@turbospark/sdk': resolve(
              __dirname,
              '../sdk-typescript/src/index.ts',
            ),
          },
        }
      : undefined,
  plugins: [
    react(),
    dts({
      include: ['src'],
      outDir: 'dist',
      rollupTypes: true,
      insertTypesEntry: true,
      aliasesExclude: [/^@turbospark\//],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'daemon-react-sdk': resolve(__dirname, 'src/daemon-react-sdk.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        '@turbospark/sdk',
        '@turbospark/sdk/daemon',
        'react',
        'react-dom',
        'react/jsx-runtime',
      ],
      output: {
        globals: {
          '@turbospark/sdk': 'QwenCodeSdk',
          '@turbospark/sdk/daemon': 'QwenCodeSdkDaemon',
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
        },
        assetFileNames: 'styles.[ext]',
      },
    },
    sourcemap: true,
    minify: false,
    cssCodeSplit: false,
  },
}));
