/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import {
  loadProjectMemory,
  saveProjectMemory,
  clearProjectMemory,
  formatMemorySummary,
} from '../utils/projectMemory.js';

/**
 * Persistent project memory commands.
 *
 * turbospark remember "<info>"  — store a note in project memory
 * turbospark memory list        — show all stored notes
 * turbospark memory clear       — remove all stored notes
 */

export const rememberCommand: CommandModule = {
  command: 'remember <info..>',
  describe: 'Store a note in persistent project memory',
  builder: (yargs) =>
    yargs.positional('info', {
      type: 'string',
      array: true,
      describe: 'The information to remember',
    }),
  handler: (argv) => {
    const projectDir = process.cwd();
    const note = (argv['info'] as string[]).join(' ');
    const memory = loadProjectMemory(projectDir);

    if (!memory.userPreferences.customSettings) {
      memory.userPreferences.customSettings = {};
    }

    // Store notes under a sequential key inside customSettings
    const existingNotes: string[] = memory.userPreferences.customSettings['notes']
      ? (JSON.parse(memory.userPreferences.customSettings['notes']) as string[])
      : [];

    existingNotes.push(note);
    memory.userPreferences.customSettings['notes'] = JSON.stringify(existingNotes);

    saveProjectMemory(projectDir, memory);
    console.log(`\n  ✓ Remembered: "${note}"\n`);
  },
};

const memoryListHandler = () => {
  const projectDir = process.cwd();
  const memory = loadProjectMemory(projectDir);
  const notesRaw = memory.userPreferences.customSettings?.['notes'];
  const notes: string[] = notesRaw
    ? (JSON.parse(notesRaw) as string[])
    : [];

  if (notes.length === 0) {
    console.log('\n  No notes stored. Use: turbospark remember "<info>"\n');
    return;
  }

  console.log('');
  console.log('  Stored Project Notes:');
  console.log('  ─────────────────────');
  notes.forEach((note, i) => {
    console.log(`  [${i + 1}] ${note}`);
  });
  console.log(formatMemorySummary(projectDir));
};

const memoryClearHandler = () => {
  const projectDir = process.cwd();
  clearProjectMemory(projectDir);
  console.log('\n  ✓ Project memory cleared.\n');
};

export const memoryCommand: CommandModule = {
  command: 'memory <action>',
  describe: 'Manage persistent project memory',
  builder: (yargs) =>
    yargs
      .positional('action', {
        choices: ['list', 'clear'] as const,
        describe: 'list: show stored notes | clear: remove all notes',
      })
      .example('$0 memory list', 'Show all stored notes')
      .example('$0 memory clear', 'Remove all stored notes'),
  handler: (argv) => {
    const action = argv['action'] as string;
    if (action === 'list') {
      memoryListHandler();
    } else if (action === 'clear') {
      memoryClearHandler();
    }
  },
};
