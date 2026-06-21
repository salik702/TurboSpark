/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MessageProps {
  id: string;
  content: string;
  sender: 'user' | 'system' | 'assistant';
  timestamp?: Date;
  className?: string;
}
