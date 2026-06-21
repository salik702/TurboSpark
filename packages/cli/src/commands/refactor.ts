/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { scanProjectContext } from '../utils/projectContextScanner.js';

// Remove unused interface
// interface RefactorArgs { ... }

/**
 * Known refactor goal patterns and what to check/transform.
 */
const REFACTOR_GOALS: Array<{
  keywords: string[];
  title: string;
  checks: string[];
  constraints: string[];
}> = [
  {
    keywords: ['extract', 'function', 'method', 'helper'],
    title: 'Extract Functions',
    checks: [
      'Identify repeated code blocks (≥3 lines, ≥2 occurrences)',
      'Find functions longer than 40 lines',
      'Detect magic numbers / inline strings',
    ],
    constraints: [
      'Preserve all existing behavior and return types',
      'Keep function signatures backward-compatible',
      'Add JSDoc/docstring to extracted functions',
    ],
  },
  {
    keywords: ['dedup', 'duplicate', 'dry', 'remove duplication'],
    title: 'Remove Duplication',
    checks: [
      'Find identical or near-identical code blocks',
      'Detect copy-pasted logic across files',
      'Identify similar utility functions',
    ],
    constraints: [
      'Consolidate into shared utility module',
      'Update all call sites to use the new shared function',
      'Do not change behavior — only structure',
    ],
  },
  {
    keywords: ['type', 'typescript', 'types', 'interface', 'any'],
    title: 'Improve TypeScript Types',
    checks: [
      'Find all `any` usages',
      'Find missing return types on exported functions',
      'Find implicit any from untyped parameters',
      'Find non-null assertions (!) that could be safer',
    ],
    constraints: [
      'Never widen types — only narrow or specify',
      'Preserve runtime behavior exactly',
      'Use `unknown` instead of `any` where appropriate',
    ],
  },
  {
    keywords: ['async', 'promise', 'callback', 'await'],
    title: 'Modernize Async Patterns',
    checks: [
      'Find callback-style async code',
      'Find raw `.then().catch()` chains',
      'Find missing error handling in async functions',
    ],
    constraints: [
      'Convert to async/await',
      'Preserve error propagation behavior',
      'Do not change the calling interface',
    ],
  },
  {
    keywords: ['split', 'module', 'file', 'large', 'size'],
    title: 'Split Large Files',
    checks: [
      'Find files longer than 300 lines',
      'Identify logical groupings within files',
      'Find tightly coupled modules that can be separated',
    ],
    constraints: [
      'Update all imports across the codebase',
      'Keep the original file as a re-export barrel if needed',
      'Do not change any exported API surface',
    ],
  },
];

/**
 * Match a user goal string to refactor strategies.
 */
function matchGoalToStrategies(goal: string): typeof REFACTOR_GOALS {
  const lower = goal.toLowerCase();
  const matched = REFACTOR_GOALS.filter((g) =>
    g.keywords.some((k) => lower.includes(k)),
  );
  return matched.length > 0 ? matched : REFACTOR_GOALS; // return all if no match
}

/**
 * Collect TypeScript/JavaScript source files for analysis.
 */
function collectSourceFiles(
  dir: string,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx'],
  ignore: string[] = ['node_modules', 'dist', '.git', 'build', 'coverage'],
): string[] {
  const results: string[] = [];

  function walk(current: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (ignore.includes(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(full);
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Analyze a set of files for basic refactor signals.
 */
function analyzeFiles(files: string[]): {
  longFiles: Array<{ file: string; lines: number }>;
  anyCount: number;
  totalFiles: number;
} {
  let anyCount = 0;
  const longFiles: Array<{ file: string; lines: number }> = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').length;
      if (lines > 200) {
        longFiles.push({ file, lines });
      }
      // Count `: any` and `as any` patterns
      const anyMatches = (content.match(/:\s*any\b|as\s+any\b/g) ?? []).length;
      anyCount += anyMatches;
    } catch {
      // skip unreadable files
    }
  }

  return {
    longFiles: longFiles.sort((a, b) => b.lines - a.lines).slice(0, 5),
    anyCount,
    totalFiles: files.length,
  };
}

/**
 * Build refactor prompt for AI.
 */
function buildRefactorPrompt(
  goal: string,
  target: string | undefined,
  strategies: typeof REFACTOR_GOALS,
  context: ReturnType<typeof scanProjectContext>,
  analysis: ReturnType<typeof analyzeFiles>,
): string {
  const lines: string[] = [
    `# Refactor Goal: ${goal}`,
    '',
    '## Project Context',
    `- **Project**: ${context.projectName ?? 'unknown'}`,
    `- **Language**: ${context.language ?? 'unknown'}`,
    `- **Framework**: ${context.framework ?? 'none'}`,
    ...(target ? [`- **Target**: \`${target}\``] : []),
    '',
    '## Static Analysis Signals',
    `- Files analyzed: ${analysis.totalFiles}`,
    `- Long files (>200 lines): ${analysis.longFiles.length}`,
  ];

  if (analysis.longFiles.length > 0) {
    for (const { file, lines: lineCount } of analysis.longFiles) {
      lines.push(`  - \`${file}\` (${lineCount} lines)`);
    }
  }

  if (analysis.anyCount > 0) {
    lines.push(`- TypeScript \`any\` usages: ${analysis.anyCount}`);
  }

  lines.push('', '## Strategies to Apply');
  strategies.forEach((strategy, i) => {
    lines.push(`### ${i + 1}. ${strategy.title}`);
    lines.push('**Checks:**');
    strategy.checks.forEach((c) => lines.push(`- ${c}`));
    lines.push('**Constraints:**');
    strategy.constraints.forEach((c) => lines.push(`- ${c}`));
    lines.push('');
  });

  lines.push(
    '## Instructions',
    '1. Read the target files carefully before making changes',
    '2. Apply refactors incrementally — one concern at a time',
    '3. **Preserve all behavior** — tests must still pass',
    '4. For each changed file, show the full diff or new content',
    '5. List all changed files at the end with a one-line summary of what changed',
  );

  return lines.join('\n');
}

export const refactorCommand: CommandModule = {
  command: 'refactor <goal..>',
  describe: 'Analyze and refactor code while preserving behavior',
  builder: (yargs) =>
    yargs
      .positional('goal', {
        type: 'string',
        array: true,
        describe: 'Refactor goal (e.g. "remove duplication", "improve TypeScript types")',
      })
      .option('target', {
        type: 'string',
        alias: 't',
        describe: 'Specific file or directory to refactor',
      })
      .option('dry', {
        type: 'boolean',
        alias: 'd',
        default: false,
        describe: 'Show analysis only, do not generate prompt',
      })
      .example('$0 refactor "remove duplication"', 'Find and remove duplicate code')
      .example('$0 refactor "improve TypeScript types" --target src/api', 'Fix types in src/api')
      .example('$0 refactor "extract functions" --dry', 'Analyze only'),
  handler: (argv) => {
    const goal = (argv['goal'] as string[]).join(' ');
    const projectDir = process.cwd();
    const targetArg = argv['target'] as string | undefined;
    const targetDir = targetArg ? path.resolve(projectDir, targetArg) : projectDir;

    const context = scanProjectContext(projectDir);
    const strategies = matchGoalToStrategies(goal);

    // Collect and analyze source files
    const extensions =
      context.language?.includes('Python')
        ? ['.py']
        : context.language?.includes('Ruby')
          ? ['.rb']
          : context.language?.includes('Go')
            ? ['.go']
            : ['.ts', '.tsx', '.js', '.jsx'];

    const files = collectSourceFiles(targetDir, extensions);
    const analysis = analyzeFiles(files);

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           TURBO SPARK Smart Refactor Engine              ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  Goal:       ${goal}`);
    console.log(`  Target:     ${targetArg ?? '(project root)'}`);
    console.log(`  Files:      ${analysis.totalFiles} source files`);
    console.log(`  Strategy:   ${strategies.map((s) => s.title).join(', ')}`);
    console.log('');
    console.log('  Static Analysis:');
    console.log(
      `    Long files (>200 lines): ${analysis.longFiles.length > 0 ? analysis.longFiles.length : 'none'}`,
    );
    if (analysis.longFiles.length > 0) {
      analysis.longFiles.forEach(({ file, lines }) => {
        const rel = path.relative(projectDir, file);
        console.log(`      → ${rel} (${lines} lines)`);
      });
    }
    if (analysis.anyCount > 0) {
      console.log(`    TypeScript \`any\` usages: ${analysis.anyCount}`);
    }
    console.log('');

    if (argv['dry']) {
      console.log('  [dry run] Analysis complete. Run without --dry to get the AI prompt.');
      console.log('');
      return;
    }

    const prompt = buildRefactorPrompt(
      goal,
      targetArg,
      strategies,
      context,
      analysis,
    );

    console.log('  ─────────────────────────────────────────────────────────');
    console.log('  AI Refactor Prompt:');
    console.log('  ─────────────────────────────────────────────────────────');
    console.log('');
    console.log(prompt.split('\n').map((l) => '  ' + l).join('\n'));
    console.log('');
    console.log('  Tip: Run directly with:');
    console.log(`  turbospark -p "Refactor: ${goal}"`);
    console.log('');
  },
};
