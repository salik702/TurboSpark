/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { scanProjectContext } from '../utils/projectContextScanner.js';

// Unused local interface removed — args are accessed via argv['key'] casting

/**
 * Resolve a target (file or module name) to an absolute path.
 */
function resolveTarget(
  target: string,
  projectDir: string,
): { resolved: string; type: 'file' | 'directory' | 'module' } | null {
  // Try as a direct path first
  const abs = path.isAbsolute(target)
    ? target
    : path.resolve(projectDir, target);

  if (fs.existsSync(abs)) {
    const stat = fs.statSync(abs);
    return { resolved: abs, type: stat.isDirectory() ? 'directory' : 'file' };
  }

  // Try adding common extensions
  for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs']) {
    const withExt = abs + ext;
    if (fs.existsSync(withExt)) {
      return { resolved: withExt, type: 'file' };
    }
    // Also try index files in a directory with that name
    const indexFile = path.join(abs, `index${ext}`);
    if (fs.existsSync(indexFile)) {
      return { resolved: indexFile, type: 'file' };
    }
  }

  // Not found on disk — treat as a module/concept name
  return { resolved: target, type: 'module' };
}

/**
 * Extract imports from a TypeScript/JavaScript file.
 */
function extractImports(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports: string[] = [];

    // ES module imports
    const importPattern = /^import\s+.+\s+from\s+['"]([^'"]+)['"]/gm;
    let match: RegExpExecArray | null;
    while ((match = importPattern.exec(content)) !== null) {
      imports.push(match[1]!);
    }

    // require() calls
    const requirePattern = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requirePattern.exec(content)) !== null) {
      imports.push(match[1]!);
    }

    return [...new Set(imports)];
  } catch {
    return [];
  }
}

/**
 * Find files that import the given target.
 */
function findUsages(
  targetPath: string,
  projectDir: string,
): string[] {
  const targetRel = path.relative(projectDir, targetPath);
  // Strip extension and leading ./
  const targetBase = targetRel.replace(/\.[jt]sx?$/, '').replace(/^\.\//, '');

  const usages: string[] = [];

  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const ignore = ['node_modules', 'dist', '.git', 'build', 'coverage', '.turbo'];
      if (ignore.includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.[jt]sx?$/.test(entry.name) && full !== targetPath) {
        const imports = extractImports(full);
        const refersToTarget = imports.some((imp) => {
          // Handle relative and path-alias imports
          const normalized = imp.replace(/^@\//, 'src/').replace(/^\.\//, '');
          return normalized.endsWith(targetBase) || imp.includes(targetBase);
        });
        if (refersToTarget) {
          usages.push(path.relative(projectDir, full));
        }
      }
    }
  }

  walk(projectDir);
  return usages.slice(0, 10); // cap at 10 for display
}

/**
 * Read file content, returning first N lines if large.
 */
function readFileSummary(filePath: string, maxLines = 80): string {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    if (lines.length <= maxLines) return content;
    return lines.slice(0, maxLines).join('\n') + `\n\n... (${lines.length - maxLines} more lines)`;
  } catch {
    return '';
  }
}

/**
 * Build AI prompt for deep explanation.
 */
function buildExplainPrompt(
  target: string,
  targetType: 'file' | 'directory' | 'module',
  content: string,
  imports: string[],
  usages: string[],
  context: ReturnType<typeof scanProjectContext>,
  includeWhy: boolean,
  includeDeps: boolean,
): string {
  const lines: string[] = [
    `# Explain: ${target}`,
    '',
    '## Project Context',
    `- **Project**: ${context.projectName ?? 'unknown'}`,
    `- **Language**: ${context.language ?? 'unknown'}`,
    `- **Framework**: ${context.framework ?? 'none'}`,
    '',
  ];

  if (targetType === 'file' && content) {
    lines.push('## File Contents');
    lines.push('```');
    lines.push(content.substring(0, 3000));
    if (content.length > 3000) lines.push('\n... (file truncated)');
    lines.push('```');
    lines.push('');
  }

  if (includeDeps && imports.length > 0) {
    lines.push('## Dependencies (imports)');
    imports.forEach((imp) => lines.push(`- \`${imp}\``));
    lines.push('');
  }

  if (usages.length > 0) {
    lines.push('## Used By');
    usages.forEach((u) => lines.push(`- \`${u}\``));
    lines.push('');
  }

  lines.push('## What to Explain');
  lines.push(`Explain \`${path.basename(target)}\` in the context of this project:`);
  lines.push('');
  lines.push('1. **What it does** — describe the behavior and purpose');
  lines.push('2. **How it works** — explain key logic, patterns, and data flow');

  if (includeWhy) {
    lines.push('3. **Why it exists** — explain the design decision and what problem it solves');
    lines.push('4. **How it fits** — describe its role in the overall architecture');
    lines.push('5. **Dependencies and consumers** — explain the usage flow');
  } else {
    lines.push('3. **How it fits** — describe its role in the overall architecture');
    lines.push('4. **Key interactions** — what calls this and what it calls');
  }

  lines.push('');
  lines.push('Write for a developer who is new to this codebase but experienced in the language.');

  return lines.join('\n');
}

export const explainCommand: CommandModule = {
  command: 'explain <target..>',
  describe: 'Explain a file, module, or concept in the context of the full project',
  builder: (yargs) =>
    yargs
      .positional('target', {
        type: 'string',
        array: true,
        describe: 'File, directory, or module to explain',
      })
      .option('why', {
        type: 'boolean',
        alias: 'w',
        default: false,
        describe: 'Include explanation of WHY the code exists (design decisions)',
      })
      .option('deps', {
        type: 'boolean',
        alias: 'd',
        default: true,
        describe: 'Show dependency analysis',
      })
      .example('$0 explain src/auth.ts', 'Explain the auth module')
      .example('$0 explain src/api --why', 'Explain the API folder with design context')
      .example('$0 explain UserService', 'Explain a named module'),
  handler: (argv) => {
    const target = (argv['target'] as string[]).join(' ');
    const projectDir = process.cwd();
    const context = scanProjectContext(projectDir);

    const resolved = resolveTarget(target, projectDir);

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║            TURBO SPARK Explain Mode                      ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  Target:  ${target}`);
    console.log(`  Project: ${context.projectName ?? projectDir}`);

    let content = '';
    let imports: string[] = [];
    let usages: string[] = [];

    if (resolved?.type === 'file') {
      const relPath = path.relative(projectDir, resolved.resolved);
      console.log(`  File:    ${relPath}`);

      content = readFileSummary(resolved.resolved);
      imports = extractImports(resolved.resolved);
      usages = findUsages(resolved.resolved, projectDir);

      const lineCount = content.split('\n').length;
      console.log(`  Lines:   ${lineCount}`);
      console.log(`  Imports: ${imports.length}`);
      console.log(`  Used by: ${usages.length} file(s) in project`);

      if (usages.length > 0 && argv['deps']) {
        console.log('');
        console.log('  Consumers:');
        usages.slice(0, 5).forEach((u) => console.log(`    → ${u}`));
      }
    } else if (resolved?.type === 'directory') {
      console.log(`  Type:    directory`);
    } else {
      console.log(`  Type:    module/concept (not found on disk)`);
    }

    console.log('');

    const prompt = buildExplainPrompt(
      target,
      resolved?.type ?? 'module',
      content,
      imports,
      usages,
      context,
      (argv['why'] as boolean | undefined) ?? false,
      (argv['deps'] as boolean | undefined) ?? true,
    );

    console.log('  ─────────────────────────────────────────────────────────');
    console.log('  AI Explanation Prompt:');
    console.log('  ─────────────────────────────────────────────────────────');
    console.log('');
    console.log(prompt.split('\n').map((l) => '  ' + l).join('\n'));
    console.log('');
    console.log('  Tip: Run directly with:');
    console.log(`  turbospark -p "Explain ${target} in detail"`);
    console.log('');
  },
};
