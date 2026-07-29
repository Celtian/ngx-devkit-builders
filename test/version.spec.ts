import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import versionBuilder from '../src/version';
import { createTestWorkspace, loadBuilderSchema, removeTestWorkspace, runBuilder } from './testing-architect';

describe('version builder', () => {
  let schema: Awaited<ReturnType<typeof loadBuilderSchema>>;
  let workspaceRoot: string;

  beforeAll(async () => {
    schema = await loadBuilderSchema('version');
  });

  beforeEach(async () => {
    workspaceRoot = await createTestWorkspace();
    await writeFile(
      join(workspaceRoot, 'package.json'),
      JSON.stringify({
        version: '1.2.3',
        author: {
          name: 'Test Author',
        },
      }),
    );
  });

  afterEach(async () => {
    await removeTestWorkspace(workspaceRoot);
  });

  it('creates deterministic JSON with selected package fields', async () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-07-29T10:30:00.000Z');

    const result = await runBuilder('version', versionBuilder, schema, workspaceRoot, {
      options: {
        outputFile: 'version.json',
        fields: ['version', 'date', 'author'],
      },
    });

    expect(result.success).toBe(true);
    await expect(readFile(join(workspaceRoot, 'version.json'), 'utf-8')).resolves.toBe(
      JSON.stringify(
        {
          version: '1.2.3',
          date: '2026-07-29T10:30:00.000Z',
          author: {
            name: 'Test Author',
          },
        },
        null,
        2,
      ),
    );
  });

  it('creates TypeScript output with Git branch metadata', async () => {
    const commit = '0123456789abcdef0123456789abcdef01234567';
    await mkdir(join(workspaceRoot, '.git', 'refs', 'heads'), { recursive: true });
    await writeFile(join(workspaceRoot, '.git', 'HEAD'), 'ref: refs/heads/main\n');
    await writeFile(join(workspaceRoot, '.git', 'refs', 'heads', 'main'), `${commit}\n`);

    const result = await runBuilder('version', versionBuilder, schema, workspaceRoot, {
      options: {
        outputFile: 'version.ts',
        fields: ['git'],
        lint: 'tslint',
        variable: 'BUILD',
      },
    });

    expect(result.success).toBe(true);
    const output = await readFile(join(workspaceRoot, 'version.ts'), 'utf-8');
    expect(output).toContain('/* tslint:disable */');
    expect(output).toContain('export const BUILD = {');
    expect(output).toContain('"branch": "main"');
    expect(output).toContain(`"commit": "${commit}"`);
    expect(output).toContain('/* tslint:enable */');
  });

  it('fails when the referenced Git branch is missing', async () => {
    await mkdir(join(workspaceRoot, '.git'), { recursive: true });
    await writeFile(join(workspaceRoot, '.git', 'HEAD'), 'ref: refs/heads/missing\n');

    const result = await runBuilder('version', versionBuilder, schema, workspaceRoot, {
      options: {
        outputFile: 'version.json',
        fields: ['git'],
      },
    });

    expect(result.success).toBe(false);
  });

  it('fails when package.json cannot be read', async () => {
    await writeFile(join(workspaceRoot, 'package.json'), '{ invalid json');

    const result = await runBuilder('version', versionBuilder, schema, workspaceRoot, {
      options: {
        outputFile: 'version.json',
        fields: ['version'],
      },
    });

    expect(result.success).toBe(false);
  });
});
