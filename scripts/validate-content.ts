import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, parse } from 'path';
import { MetadataJson, WikiContent } from '../types';
import chalk from 'chalk';

interface ValidationResult {
  path: string;
  errors: string[];
  type?: string;
}

const results: ValidationResult[] = [];

function formatPath(path: string): string {
  return relative('.', path).replace(/\\/g, '/');
}

function isCategoryDir(dirName: string): boolean {
  return /^\[.*\]$/.test(dirName);
}

function validateMarkdownFile(filePath: string): string[] {
  const errors: string[] = [];

  if (!existsSync(filePath)) {
    errors.push(`Markdown file not found: ${filePath}`);
    return errors;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    if (content.trim().length === 0) {
      errors.push('Markdown file is empty');
    }
  } catch (error) {
    errors.push('Could not read markdown file');
  }

  return errors;
}

function validateMetadataJson(filePath: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const result: ValidationResult = {
      path: formatPath(filePath),
      errors: [],
    };

    try {
      const json = JSON.parse(content) as MetadataJson;
      result.type = json.content?.type;

      const missingFields = [];
      for (const field of ['type', 'name', 'slug']) {
        if (!json.content || !json.content[field as keyof WikiContent]) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        result.errors.push(
          `Missing required fields: ${missingFields.join(', ')}`,
        );
      }

      if (
        json.content &&
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(json.content.slug)
      ) {
        result.errors.push(
          'Invalid slug format. Only lowercase letters, numbers, and hyphens are allowed',
        );
      }

      const dirPath = parse(filePath).dir;
      const dirName = parse(dirPath).base;
      const parentDirName = parse(parse(dirPath).dir).base;

      if (isCategoryDir(dirName)) {
        if (json.content?.type !== 'category') {
          result.errors.push(
            'Files directly under [category] directory must be category type',
          );
        }
      }

      if (isCategoryDir(parentDirName) && dirName !== parentDirName) {
        if (json.content?.type !== 'page') {
          result.errors.push(
            'Files under category directory must be page type',
          );
        }

        const categorySlug = parentDirName.slice(1, -1);
        if (
          json.content?.type === 'page' &&
          (!('categorySlug' in json.content) ||
            json.content.categorySlug !== categorySlug)
        ) {
          result.errors.push(
            `Page must have correct categorySlug: ${categorySlug}`,
          );
        }
      }

      if (json.content?.type === 'page') {
        const contentPath = join(dirPath, 'content.md');
        const markdownErrors = validateMarkdownFile(contentPath);
        result.errors.push(...markdownErrors);
      }
    } catch (e) {
      result.errors.push('Invalid JSON format');
    }

    if (result.errors.length > 0) {
      results.push(result);
    }
  } catch (error) {
    results.push({
      path: formatPath(filePath),
      errors: ['File not found or could not be read'],
    });
  }
}

const excludedDirectories = [
  'dist',
  'node_modules',
  'scripts',
  'types.ts',
  '.git',
  '.github',
];

function validateDirectory(dir: string): void {
  const items = readdirSync(dir);

  for (const item of items) {
    if (excludedDirectories.includes(item)) {
      continue;
    }

    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      const metadataPath = join(fullPath, 'metadata.json');
      validateMetadataJson(metadataPath);
      validateDirectory(fullPath);
    } else if (item === 'metadata.json') {
      validateMetadataJson(fullPath);
    }
  }
}

function printResults(): void {
  if (results.length === 0) {
    console.log(chalk.green.bold('\n✨ All metadata.json files are valid\n'));
    return;
  }

  console.log(chalk.red.bold('\n❌ Wiki content validation errors found:\n'));

  const tree: { [key: string]: ValidationResult } = {};
  results.forEach((result) => {
    tree[result.path] = result;
  });

  Object.keys(tree)
    .sort()
    .forEach((path) => {
      const result = tree[path];
      console.log(chalk.yellow('📁 ') + chalk.yellow.bold(path));
      if (result.type) {
        console.log(chalk.gray(`   Type: ${result.type}`));
      }
      result.errors.forEach((error) => {
        console.log(chalk.red(`   ⚠️  ${error}`));
      });
      console.log('');
    });

  console.log(chalk.red.bold(`Total ${results.length} errors found.\n`));
  process.exit(1);
}

try {
  validateDirectory('docs');
  printResults();
} catch (error) {
  console.error(chalk.red.bold('\n❌ Unexpected error occurred:'));
  console.error(chalk.red((error as Error).message));
  process.exit(1);
}
