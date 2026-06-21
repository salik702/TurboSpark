/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Storage, SessionService } from '@turbospark/turbospark-core';
import { loadSettings } from '../../config/settings.js';

export function initSessionService(): SessionService {
  const settings = loadSettings();
  Storage.setRuntimeBaseDir(
    settings.merged.advanced?.runtimeOutputDir,
    process.cwd(),
  );
  return new SessionService(process.cwd());
}
