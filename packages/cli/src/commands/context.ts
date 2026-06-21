/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import {
  scanProjectContext,
  formatProjectContext,
} from '../utils/projectContextScanner.js';

export const contextCommand: CommandModule = {
  command: 'context',
  describe: 'Show detected project context (language, framework, package manager, git status)',
  handler: () => {
    const projectDir = process.cwd();
    const context = scanProjectContext(projectDir);
    console.log(formatProjectContext(context));
  },
};
