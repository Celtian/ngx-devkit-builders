import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import sortImportsBuilder from '../src/sort-imports';
import { createTestWorkspace, loadBuilderSchema, removeTestWorkspace, runBuilder } from './testing-architect';

const componentSource = `import { Component } from '@angular/core';

@Component({
  selector: 'app-example',
  imports: [ZetaComponent, AlphaComponent],
  template: ''
})
export class ExampleComponent {}
`;

const directiveSource = `import { Directive } from '@angular/core';

@Directive({
  selector: '[appExample]',
  imports: [ZetaDirective, AlphaDirective]
})
export class ExampleDirective {}
`;

describe('sort-imports builder', () => {
  let schema: Awaited<ReturnType<typeof loadBuilderSchema>>;
  let sourceRoot: string;
  let workspaceRoot: string;

  beforeAll(async () => {
    schema = await loadBuilderSchema('sort-imports');
  });

  beforeEach(async () => {
    workspaceRoot = await createTestWorkspace();
    sourceRoot = join(workspaceRoot, 'src');
    await mkdir(sourceRoot, { recursive: true });
  });

  afterEach(async () => {
    await removeTestWorkspace(workspaceRoot);
  });

  it('sorts component imports using the schema defaults', async () => {
    const componentFile = join(sourceRoot, 'example.component.ts');
    await writeFile(componentFile, componentSource);

    const result = await runBuilder('sort-imports', sortImportsBuilder, schema, workspaceRoot);

    expect(result.success).toBe(true);
    await expect(readFile(componentFile, 'utf-8')).resolves.toContain('imports: [AlphaComponent, ZetaComponent]');
  });

  it('reports changes without writing in dry-run mode', async () => {
    const componentFile = join(sourceRoot, 'example.component.ts');
    await writeFile(componentFile, componentSource);

    const result = await runBuilder('sort-imports', sortImportsBuilder, schema, workspaceRoot, {
      options: {
        dryRun: true,
      },
    });

    expect(result.success).toBe(true);
    await expect(readFile(componentFile, 'utf-8')).resolves.toBe(componentSource);
  });

  it('discovers directives when directive processing is enabled', async () => {
    const directiveFile = join(sourceRoot, 'example.directive.ts');
    const logs: string[] = [];
    await writeFile(directiveFile, directiveSource);

    const result = await runBuilder('sort-imports', sortImportsBuilder, schema, workspaceRoot, {
      logs,
      options: {
        verbose: true,
      },
    });

    expect(result.success).toBe(true);
    expect(logs.join('\n')).toContain('📊 Summary: 1 files analyzed');
    await expect(readFile(directiveFile, 'utf-8')).resolves.toBe(directiveSource);
  });

  it('leaves directives unchanged when directive processing is disabled', async () => {
    const directiveFile = join(sourceRoot, 'example.directive.ts');
    const logs: string[] = [];
    await writeFile(directiveFile, directiveSource);

    const result = await runBuilder('sort-imports', sortImportsBuilder, schema, workspaceRoot, {
      logs,
      options: {
        includeDirectives: false,
      },
    });

    expect(result.success).toBe(true);
    expect(logs).toContain('No Angular components or directives found.');
    await expect(readFile(directiveFile, 'utf-8')).resolves.toBe(directiveSource);
  });

  it('ignores spec and declaration files', async () => {
    const specFile = join(sourceRoot, 'example.spec.ts');
    const declarationFile = join(sourceRoot, 'example.d.ts');
    await writeFile(specFile, componentSource);
    await writeFile(declarationFile, componentSource);

    const result = await runBuilder('sort-imports', sortImportsBuilder, schema, workspaceRoot);

    expect(result.success).toBe(true);
    await expect(readFile(specFile, 'utf-8')).resolves.toBe(componentSource);
    await expect(readFile(declarationFile, 'utf-8')).resolves.toBe(componentSource);
  });

  it('fails when the source directory is missing', async () => {
    await removeTestWorkspace(workspaceRoot);
    workspaceRoot = await createTestWorkspace();

    const result = await runBuilder('sort-imports', sortImportsBuilder, schema, workspaceRoot);

    expect(result.success).toBe(false);
  });
});
