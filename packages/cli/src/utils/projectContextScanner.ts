/**
 * @license
 * Copyright 2025 TURBO SPARK Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ProjectContext {
  language: string | null;
  framework: string | null;
  packageManager: string | null;
  isGitRepository: boolean;
  gitBranch: string | null;
  projectName: string | null;
  summary: string;
}

interface FileDetection {
  files: string[];
  language: string;
  framework?: string;
}

const LANGUAGE_DETECTIONS: FileDetection[] = [
  { files: ['package.json', 'tsconfig.json'], language: 'TypeScript/JavaScript', framework: undefined },
  { files: ['Cargo.toml'], language: 'Rust' },
  { files: ['go.mod'], language: 'Go' },
  { files: ['pyproject.toml', 'setup.py', 'requirements.txt'], language: 'Python' },
  { files: ['pom.xml', 'build.gradle', 'build.gradle.kts'], language: 'Java/Kotlin' },
  { files: ['Gemfile'], language: 'Ruby' },
  { files: ['composer.json'], language: 'PHP' },
  { files: ['*.csproj', '*.sln'], language: 'C#/.NET' },
  { files: ['CMakeLists.txt'], language: 'C/C++' },
  { files: ['mix.exs'], language: 'Elixir' },
  { files: ['pubspec.yaml'], language: 'Dart/Flutter' },
];

const FRAMEWORK_DETECTIONS: Array<{ files: string[]; framework: string }> = [
  { files: ['next.config.js', 'next.config.mjs', 'next.config.ts'], framework: 'Next.js' },
  { files: ['nuxt.config.ts', 'nuxt.config.js'], framework: 'Nuxt' },
  { files: ['astro.config.mjs'], framework: 'Astro' },
  { files: ['svelte.config.js'], framework: 'SvelteKit' },
  { files: ['remix.config.js', 'vite.config.ts'], framework: 'Remix/Vite' },
  { files: ['angular.json'], framework: 'Angular' },
  { files: ['vue.config.js'], framework: 'Vue.js' },
  { files: ['Dockerfile', 'docker-compose.yml'], framework: 'Docker' },
  { files: ['.github/workflows'], framework: 'GitHub Actions' },
];

const PACKAGE_MANAGERS: Array<{ files: string[]; manager: string }> = [
  { files: ['pnpm-lock.yaml'], manager: 'pnpm' },
  { files: ['yarn.lock'], manager: 'yarn' },
  { files: ['package-lock.json'], manager: 'npm' },
  { files: ['bun.lockb'], manager: 'bun' },
  { files: ['poetry.lock'], manager: 'poetry' },
  { files: ['Pipfile.lock'], manager: 'pipenv' },
  { files: ['Cargo.lock'], manager: 'cargo' },
  { files: ['go.sum'], manager: 'go modules' },
];

/**
 * Check if a file or directory exists
 */
function exists(dir: string, name: string): boolean {
  try {
    fs.accessSync(path.join(dir, name));
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect programming language based on project files
 */
function detectLanguage(projectDir: string): string | null {
  for (const detection of LANGUAGE_DETECTIONS) {
    for (const file of detection.files) {
      if (exists(projectDir, file)) {
        return detection.language;
      }
    }
  }
  return null;
}

/**
 * Detect framework based on project files
 */
function detectFramework(projectDir: string): string | null {
  for (const detection of FRAMEWORK_DETECTIONS) {
    for (const file of detection.files) {
      if (exists(projectDir, file)) {
        return detection.framework;
      }
    }
  }
  return null;
}

/**
 * Detect package manager based on lock files
 */
function detectPackageManager(projectDir: string): string | null {
  for (const pm of PACKAGE_MANAGERS) {
    for (const file of pm.files) {
      if (exists(projectDir, file)) {
        return pm.manager;
      }
    }
  }
  return null;
}

/**
 * Check if directory is a Git repository
 */
function isGitRepository(projectDir: string): boolean {
  return exists(projectDir, '.git');
}

/**
 * Get current Git branch name
 */
function getGitBranch(projectDir: string): string | null {
  const headPath = path.join(projectDir, '.git', 'HEAD');
  try {
    const headContent = fs.readFileSync(headPath, 'utf8').trim();
    if (headContent.startsWith('ref: refs/heads/')) {
      return headContent.replace('ref: refs/heads/', '');
    }
    return headContent.substring(0, 7); // detached HEAD commit hash
  } catch {
    return null;
  }
}

/**
 * Get project name from package.json or directory name
 */
function getProjectName(projectDir: string): string | null {
  const packageJsonPath = path.join(projectDir, 'package.json');
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content) as { name?: string };
    if (pkg.name) {
      return pkg.name;
    }
  } catch {
    // Fall back to directory name
  }
  return path.basename(projectDir);
}

/**
 * Scan a project directory and return context information
 */
export function scanProjectContext(projectDir: string): ProjectContext {
  const language = detectLanguage(projectDir);
  const framework = detectFramework(projectDir);
  const packageManager = detectPackageManager(projectDir);
  const isGit = isGitRepository(projectDir);
  const gitBranch = isGit ? getGitBranch(projectDir) : null;
  const projectName = getProjectName(projectDir);

  const contextParts: string[] = [];
  if (projectName) contextParts.push(`Project: ${projectName}`);
  if (language) contextParts.push(`Language: ${language}`);
  if (framework) contextParts.push(`Framework: ${framework}`);
  if (packageManager) contextParts.push(`Package Manager: ${packageManager}`);
  if (isGit) {
    contextParts.push(`Git: ${gitBranch ? `branch ${gitBranch}` : 'yes'}`);
  }

  return {
    language,
    framework,
    packageManager,
    isGitRepository: isGit,
    gitBranch,
    projectName,
    summary: contextParts.join(' | '),
  };
}

/**
 * Format project context for display
 */
export function formatProjectContext(context: ProjectContext): string {
  const lines: string[] = [];
  lines.push('');
  lines.push('  Project Context Detected:');
  lines.push('  ────────────────────────');
  if (context.projectName) lines.push(`  Project:         ${context.projectName}`);
  if (context.language) lines.push(`  Language:        ${context.language}`);
  if (context.framework) lines.push(`  Framework:       ${context.framework}`);
  if (context.packageManager) lines.push(`  Package Manager: ${context.packageManager}`);
  lines.push(`  Git Repository:  ${context.isGitRepository ? 'Yes' : 'No'}`);
  if (context.gitBranch) lines.push(`  Git Branch:      ${context.gitBranch}`);
  lines.push('');
  return lines.join('\n');
}
