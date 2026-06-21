/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
import { scanProjectContext } from '../utils/projectContextScanner.js';

// Args are accessed via argv['key'] casting

/**
 * Determine which implementation areas are relevant based on project context
 * and the feature name.
 */
function inferFeatureAreas(
  feature: string,
  context: ReturnType<typeof scanProjectContext>,
): string[] {
  const areas: string[] = [];
  const f = feature.toLowerCase();

  const isFullstack =
    context.framework &&
    ['next.js', 'nuxt', 'sveltekit', 'astro', 'remix/vite'].some((fw) =>
      context.framework!.toLowerCase().includes(fw.toLowerCase()),
    );

  const hasBackend =
    context.language?.includes('Python') ||
    context.language?.includes('Java') ||
    context.language?.includes('Go') ||
    context.language?.includes('Rust') ||
    (context.language?.includes('TypeScript') && !isFullstack);

  // Feature keyword → area mappings
  if (f.includes('auth') || f.includes('login') || f.includes('signup')) {
    areas.push('Authentication & Session Management');
    if (context.language?.includes('TypeScript') || isFullstack) {
      areas.push('JWT / OAuth token handling');
      areas.push('Protected route middleware');
    }
    areas.push('User model & DB schema');
    areas.push('Password hashing (bcrypt/argon2)');
  }

  if (f.includes('api') || f.includes('endpoint') || f.includes('route')) {
    areas.push('API route handler');
    areas.push('Request validation (Zod/Yup/Joi)');
    areas.push('Error handling middleware');
    if (hasBackend) areas.push('Service layer / business logic');
  }

  if (f.includes('database') || f.includes('db') || f.includes('model') || f.includes('schema')) {
    areas.push('Database schema / migration');
    areas.push('ORM model definition');
    areas.push('CRUD service methods');
    areas.push('Query optimization indexes');
  }

  if (f.includes('ui') || f.includes('component') || f.includes('page') || f.includes('form')) {
    areas.push('React/Vue/Svelte component');
    areas.push('Form validation & state');
    areas.push('Accessibility (ARIA, keyboard nav)');
    areas.push('Responsive styling');
  }

  if (f.includes('notification') || f.includes('email') || f.includes('push')) {
    areas.push('Notification service abstraction');
    areas.push('Email template');
    areas.push('Event triggers');
  }

  if (f.includes('search') || f.includes('filter') || f.includes('paginate')) {
    areas.push('Search query builder');
    areas.push('Pagination logic');
    areas.push('Filter/sort parameters');
    if (hasBackend) areas.push('Full-text search index');
  }

  if (f.includes('upload') || f.includes('file') || f.includes('storage')) {
    areas.push('File upload handler');
    areas.push('Storage provider abstraction (S3/local)');
    areas.push('File type validation');
  }

  // Generic fallback if no keywords matched
  if (areas.length === 0) {
    areas.push('Core feature logic');
    if (isFullstack || context.language?.includes('TypeScript')) {
      areas.push('API endpoint');
      areas.push('UI component');
    }
    areas.push('Integration with existing architecture');
  }

  return areas;
}

/**
 * Build a structured AI prompt for feature generation.
 */
function buildFeaturePrompt(
  feature: string,
  areas: string[],
  context: ReturnType<typeof scanProjectContext>,
): string {
  const lines: string[] = [
    `# Feature Request: ${feature}`,
    '',
    '## Project Context',
    `- **Project**: ${context.projectName ?? 'unknown'}`,
    `- **Language**: ${context.language ?? 'unknown'}`,
    `- **Framework**: ${context.framework ?? 'none detected'}`,
    `- **Package Manager**: ${context.packageManager ?? 'unknown'}`,
    `- **Git Branch**: ${context.gitBranch ?? 'unknown'}`,
    '',
    '## Implementation Areas Required',
  ];

  areas.forEach((area, i) => {
    lines.push(`${i + 1}. ${area}`);
  });

  lines.push(
    '',
    '## Instructions',
    `Generate a complete implementation for "${feature}" that:`,
    '- Integrates with the existing project architecture (read existing files first)',
    '- Follows the project\'s established patterns and conventions',
    '- Includes all required files: routes, services, models, components',
    '- Adds proper error handling and input validation',
    '- Is production-ready, not a scaffold or placeholder',
    '- If DB schema changes are needed, provide the migration',
    '',
    '## Output Format',
    'For each file: show the full path, then the complete file content.',
    'End with a summary of what was created and how to test it.',
  );

  return lines.join('\n');
}

export const addCommand: CommandModule = {
  command: 'add <feature..>',
  describe: 'Generate a complete feature implementation for your project',
  builder: (yargs) =>
    yargs
      .positional('feature', {
        type: 'string',
        array: true,
        describe: 'Feature to build (e.g. "authentication system")',
      })
      .example('$0 add "authentication system"', 'Add auth with login/signup')
      .example('$0 add "user profile page"', 'Add a profile UI component')
      .example('$0 add "REST API for products"', 'Add a full CRUD API'),
  handler: (argv) => {
    const feature = (argv['feature'] as string[]).join(' ');
    const projectDir = process.cwd();
    const context = scanProjectContext(projectDir);
    const areas = inferFeatureAreas(feature, context);

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║            TURBO SPARK Feature Builder                   ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  Feature:    ${feature}`);
    console.log(`  Project:    ${context.projectName ?? projectDir}`);
    console.log(`  Stack:      ${context.language ?? 'unknown'} / ${context.framework ?? 'no framework'}`);
    console.log('');
    console.log('  Implementation areas detected:');
    areas.forEach((area, i) => console.log(`    ${i + 1}. ${area}`));
    console.log('');

    const prompt = buildFeaturePrompt(feature, areas, context);

    console.log('  ─────────────────────────────────────────────────────────');
    console.log('  AI Prompt (use with turbospark -p or paste in chat):');
    console.log('  ─────────────────────────────────────────────────────────');
    console.log('');
    console.log(prompt.split('\n').map((l) => '  ' + l).join('\n'));
    console.log('');
    console.log('  Tip: Run directly with:');
    console.log(`  turbospark -p "Add feature: ${feature}"`);
    console.log('');
  },
};
