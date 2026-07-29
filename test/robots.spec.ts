import { mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import robotsBuilder from '../src/robots';
import { createTestWorkspace, loadBuilderSchema, removeTestWorkspace, runBuilder } from './testing-architect';

const target = {
  project: 'app',
  target: 'robots',
};

describe('robots builder', () => {
  let schema: Awaited<ReturnType<typeof loadBuilderSchema>>;
  let workspaceRoot: string;

  beforeAll(async () => {
    schema = await loadBuilderSchema('robots');
  });

  beforeEach(async () => {
    workspaceRoot = await createTestWorkspace();
    await mkdir(join(workspaceRoot, 'src'), { recursive: true });
  });

  afterEach(async () => {
    await removeTestWorkspace(workspaceRoot);
  });

  it('creates a disallow file from the schema defaults', async () => {
    const result = await runBuilder('robots', robotsBuilder, schema, workspaceRoot, {
      projectMetadata: {
        projectType: 'application',
        sourceRoot: 'src',
      },
      target,
    });

    expect(result.success).toBe(true);
    await expect(readFile(join(workspaceRoot, 'src', 'robots.txt'), 'utf-8')).resolves.toBe(
      'User-agent: *\n\nDisallow: /',
    );
  });

  it('creates an allow file with a sitemap', async () => {
    const result = await runBuilder('robots', robotsBuilder, schema, workspaceRoot, {
      options: {
        allow: true,
        sitemap: 'https://example.com/sitemap.xml',
      },
      projectMetadata: {
        projectType: 'application',
        sourceRoot: 'src',
      },
      target,
    });

    expect(result.success).toBe(true);
    await expect(readFile(join(workspaceRoot, 'src', 'robots.txt'), 'utf-8')).resolves.toBe(
      'User-agent: *\n\nAllow: /\n\nSitemap: https://example.com/sitemap.xml',
    );
  });

  it('fails when no target is provided', async () => {
    const result = await runBuilder('robots', robotsBuilder, schema, workspaceRoot);

    expect(result.success).toBe(false);
  });

  it('fails for a library project', async () => {
    const result = await runBuilder('robots', robotsBuilder, schema, workspaceRoot, {
      projectMetadata: {
        projectType: 'library',
        sourceRoot: 'src',
      },
      target,
    });

    expect(result.success).toBe(false);
  });
});
