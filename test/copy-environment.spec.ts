import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import copyEnvironmentBuilder from '../src/copy-environment';
import { createTestWorkspace, loadBuilderSchema, removeTestWorkspace, runBuilder } from './testing-architect';

const target = {
  project: 'app',
  target: 'copy-environment',
};

describe('copy-environment builder', () => {
  let environmentsFolder: string;
  let schema: Awaited<ReturnType<typeof loadBuilderSchema>>;
  let workspaceRoot: string;

  beforeAll(async () => {
    schema = await loadBuilderSchema('copy-environment');
  });

  beforeEach(async () => {
    workspaceRoot = await createTestWorkspace();
    environmentsFolder = join(workspaceRoot, 'src', 'environments');
    await mkdir(environmentsFolder, { recursive: true });
  });

  afterEach(async () => {
    await removeTestWorkspace(workspaceRoot);
  });

  it('copies an environment file', async () => {
    await writeFile(join(environmentsFolder, 'environment.development.ts'), 'export const production = false;\n');

    const result = await runBuilder('copy-environment', copyEnvironmentBuilder, schema, workspaceRoot, {
      options: {
        source: 'environment.development.ts',
        target: 'environment.ts',
      },
      projectMetadata: {
        projectType: 'application',
        sourceRoot: 'src',
      },
      target,
    });

    expect(result.success).toBe(true);
    await expect(readFile(join(environmentsFolder, 'environment.ts'), 'utf-8')).resolves.toBe(
      'export const production = false;\n',
    );
  });

  it('preserves an existing target when overwrite is false', async () => {
    await writeFile(join(environmentsFolder, 'environment.development.ts'), 'development');
    await writeFile(join(environmentsFolder, 'environment.ts'), 'existing');

    const result = await runBuilder('copy-environment', copyEnvironmentBuilder, schema, workspaceRoot, {
      options: {
        source: 'environment.development.ts',
        target: 'environment.ts',
      },
      projectMetadata: {
        projectType: 'application',
        sourceRoot: 'src',
      },
      target,
    });

    expect(result.success).toBe(true);
    await expect(readFile(join(environmentsFolder, 'environment.ts'), 'utf-8')).resolves.toBe('existing');
  });

  it('replaces an existing target when overwrite is true', async () => {
    await writeFile(join(environmentsFolder, 'environment.production.ts'), 'production');
    await writeFile(join(environmentsFolder, 'environment.ts'), 'existing');

    const result = await runBuilder('copy-environment', copyEnvironmentBuilder, schema, workspaceRoot, {
      options: {
        source: 'environment.production.ts',
        target: 'environment.ts',
        overwrite: true,
      },
      projectMetadata: {
        projectType: 'application',
        sourceRoot: 'src',
      },
      target,
    });

    expect(result.success).toBe(true);
    await expect(readFile(join(environmentsFolder, 'environment.ts'), 'utf-8')).resolves.toBe('production');
  });

  it('fails when the source file is missing', async () => {
    const result = await runBuilder('copy-environment', copyEnvironmentBuilder, schema, workspaceRoot, {
      options: {
        source: 'missing.ts',
        target: 'environment.ts',
      },
      projectMetadata: {
        projectType: 'application',
        sourceRoot: 'src',
      },
      target,
    });

    expect(result.success).toBe(false);
  });

  it('fails when no target is provided', async () => {
    const result = await runBuilder('copy-environment', copyEnvironmentBuilder, schema, workspaceRoot, {
      options: {
        source: 'environment.development.ts',
        target: 'environment.ts',
      },
    });

    expect(result.success).toBe(false);
  });

  it('fails for a library project', async () => {
    const result = await runBuilder('copy-environment', copyEnvironmentBuilder, schema, workspaceRoot, {
      options: {
        source: 'environment.development.ts',
        target: 'environment.ts',
      },
      projectMetadata: {
        projectType: 'library',
        sourceRoot: 'src',
      },
      target,
    });

    expect(result.success).toBe(false);
  });
});
