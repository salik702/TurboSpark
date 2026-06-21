/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { scanProjectContext } from '../utils/projectContextScanner.js';

interface DebugArgs {
  file?: string;
  error?: string;
}

/**
 * Common stack trace / error patterns to scan for.
 */
const ERROR_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /TypeError:/g, label: 'TypeError' },
  { pattern: /ReferenceError:/g, label: 'ReferenceError' },
  { pattern: /SyntaxError:/g, label: 'SyntaxError' },
  { pattern: /Error:/g, label: 'Error' },
  { pattern: /at\s+\S+\s+\((.+):(\d+):\d+\)/g, label: 'Stack frame' },
  { pattern: /File\s+"(.+)",\s+line\s+(\d+)/g, label: 'Python traceback' },
  { pattern: /Exception in thread/g, label: 'Java exception' },
  { pattern: /panic:/g, label: 'Rust/Go panic' },
  { pattern: /FATAL/g, label: 'Fatal error' },
];

interface StackFrame {
  file: string;
  line: number;
}

/**
 * Extract file references from a stack trace or error output.
 */
function extractStackFrames(text: string): StackFrame[] {
  const frames: StackFrame[] = [];

  // Node.js / JavaScript stack frames: "at X (path/file.ts:12:5)"
  const jsPattern = /at\s+\S+\s+\((.+):(\d+):\d+\)/g;
  let match: RegExpExecArray | null;
  while ((match = jsPattern.exec(text)) !== null) {
    frames.push({ file: match[1]!, line: parseInt(match[2]!, 10) });
  }

  // Python tracebacks: File "path/file.py", line 42
  const pyPattern = /File\s+"(.+)",\s+line\s+(\d+)/g;
  while ((match = pyPattern.exec(text)) !== null) {
    frames.push({ file: match[1]!, line: parseInt(match[2]!, 10) });
  }

  return frames;
}

/**
 * Read a file excerpt around a line number.
 */
function readFileExcerpt(
  filePath: string,
  targetLine: number,
  contextLines = 5,
): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const start = Math.max(0, targetLine - contextLines - 1);
    const end = Math.min(lines.length - 1, targetLine + contextLines - 1);
    return lines
      .slice(start, end + 1)
      .map((l, i) => {
        const lineNum = start + i + 1;
        const marker = lineNum === targetLine ? '>>>' : '   ';
        return `${marker} ${String(lineNum).padStart(4)} | ${l}`;
      })
      .join('\n');
  } catch {
    return null;
  }
}

/**
 * Detect error type from text.
 */
function detectErrorType(text: string): string {
  for (const { pattern, label } of ERROR_PATTERNS) {
    if (pattern.test(text)) {
      pattern.lastIndex = 0; // reset stateful regex
      return label;
    }
    pattern.lastIndex = 0;
  }
  return 'Unknown Error';
}

/**
 * Read stdin if data is piped.
 */
async function readPipedStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return null;
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data.trim() || null));
    process.stdin.on('error', () => resolve(null));
  });
}

/**
 * Generate a reproduction prompt that could be sent to the AI model.
 */
function buildAiDebugPrompt(
  errorText: string,
  frames: StackFrame[],
  context: ReturnType<typeof scanProjectContext>,
  excerpts: Array<{ frame: StackFrame; excerpt: string }>,
): string {
  const lines: string[] = [
    `Project: ${context.projectName ?? 'unknown'} | ${context.language ?? 'unknown'} | ${context.framework ?? 'no framework'}`,
    '',
    '## Error',
    '```',
    errorText.substring(0, 2000),
    '```',
    '',
  ];

  if (excerpts.length > 0) {
    lines.push('## Relevant Code');
    for (const { frame, excerpt } of excerpts) {
      lines.push(`### ${frame.file}:${frame.line}`);
      lines.push('```');
      lines.push(excerpt);
      lines.push('```');
      lines.push('');
    }
  }

  lines.push(
    '## Task',
    'Identify the root cause, explain it clearly, and provide:',
    '1. A minimal reproduction case',
    '2. The fix with code changes',
    '3. How to verify the fix',
  );

  return lines.join('\n');
}

export const debugCommand: CommandModule<object, DebugArgs> = {
  command: 'debug',
  describe: 'Analyze errors/logs and identify root cause with reproduction steps',
  builder: (yargs) =>
    yargs
      .option('file', {
        type: 'string',
        alias: 'f',
        describe: 'Log or error file to analyze',
      })
      .option('error', {
        type: 'string',
        alias: 'e',
        describe: 'Error message or stack trace string',
      })
      .example('$0 debug --file error.log', 'Analyze a log file')
      .example('$0 debug --error "TypeError: Cannot read..."', 'Analyze an error string')
      .example('cat error.log | $0 debug', 'Pipe error output'),
  handler: async (argv) => {
    let errorText = argv.error ?? '';

    // Try to read from file
    if (argv.file) {
      const filePath = path.resolve(process.cwd(), argv.file);
      if (!fs.existsSync(filePath)) {
        console.error(`\n  Error: File not found: ${filePath}\n`);
        process.exit(1);
      }
      errorText = fs.readFileSync(filePath, 'utf8');
    }

    // Try to read from stdin if no other source
    if (!errorText) {
      const piped = await readPipedStdin();
      if (piped) errorText = piped;
    }

    if (!errorText) {
      console.log(
        '\n  Usage:\n' +
          '    turbospark debug --file <error.log>\n' +
          '    turbospark debug --error "<stack trace>"\n' +
          '    cat error.log | turbospark debug\n',
      );
      process.exit(0);
    }

    const projectDir = process.cwd();
    const context = scanProjectContext(projectDir);
    const errorType = detectErrorType(errorText);
    const frames = extractStackFrames(errorText);

    // Filter frames to those that reference project files (skip node_modules)
    const projectFrames = frames.filter((f) => {
      const abs = path.isAbsolute(f.file) ? f.file : path.resolve(projectDir, f.file);
      return !abs.includes('node_modules') && !abs.includes('dist/') && fs.existsSync(abs);
    });

    // Read excerpts for the top 3 project frames
    const excerpts: Array<{ frame: StackFrame; excerpt: string }> = [];
    for (const frame of projectFrames.slice(0, 3)) {
      const abs = path.isAbsolute(frame.file)
        ? frame.file
        : path.resolve(projectDir, frame.file);
      const excerpt = readFileExcerpt(abs, frame.line);
      if (excerpt) excerpts.push({ frame, excerpt });
    }

    // Print the analysis report
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║              TURBO SPARK Debug Analysis                  ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  Error Type:    ${errorType}`);
    console.log(
      `  Project:       ${context.projectName ?? projectDir} (${context.language ?? 'unknown'})`,
    );
    console.log(`  Stack Frames:  ${frames.length} found, ${projectFrames.length} in project`);
    console.log('');

    if (projectFrames.length > 0) {
      console.log('  Likely Source Files:');
      for (const frame of projectFrames.slice(0, 3)) {
        console.log(`    → ${frame.file}:${frame.line}`);
      }
      console.log('');
    }

    if (excerpts.length > 0) {
      console.log('  Code at Error Location(s):');
      console.log('  ──────────────────────────');
      for (const { frame, excerpt } of excerpts) {
        console.log(`\n  [${frame.file}:${frame.line}]`);
        console.log(excerpt.split('\n').map((l) => '  ' + l).join('\n'));
      }
      console.log('');
    }

    // Build the prompt for AI analysis
    const aiPrompt = buildAiDebugPrompt(errorText, projectFrames, context, excerpts);

    console.log('  ─────────────────────────────────────────────────────────');
    console.log('  AI Analysis Prompt (paste into turbospark chat or use -p):');
    console.log('  ─────────────────────────────────────────────────────────');
    console.log('');
    // Print first 1000 chars of the prompt as a preview
    const preview = aiPrompt.length > 1000 ? aiPrompt.substring(0, 1000) + '\n  ...[truncated]' : aiPrompt;
    console.log(preview.split('\n').map((l) => '  ' + l).join('\n'));
    console.log('');
    console.log('  Tip: Run the above as a turbospark prompt to get a full fix:');
    console.log(`  turbospark -p "${errorType} error — analyze and fix"`);
    console.log('');
  },
};
