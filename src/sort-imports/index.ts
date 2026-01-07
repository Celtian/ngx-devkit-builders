import { BuilderContext, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { getDecoratorMetadata } from '@schematics/angular/utility/ast-utils';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import * as ts from 'typescript';

export interface SortImportsBuilderOptions extends JsonObject {
  dryRun: boolean;
  verbose: boolean;
  includeDirectives: boolean;
}

interface ComponentImportsInfo {
  componentName: string;
  filePath: string;
  importsArray: string[];
  hasChanges: boolean;
  sortedImports: string[];
}

const walkDirectory = (dir: string, files: string[] = []): string[] => {
  const items = readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory()) {
      walkDirectory(fullPath, files);
    } else if (
      item.isFile() &&
      item.name.endsWith('.ts') &&
      !item.name.endsWith('.spec.ts') &&
      !item.name.endsWith('.d.ts')
    ) {
      files.push(fullPath);
    }
  }

  return files;
};

const isAngularComponentOrDirective = (filePath: string, includeDirectives: boolean): boolean => {
  try {
    const content = readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

    const componentDecorators = getDecoratorMetadata(sourceFile, 'Component', '@angular/core');
    if (componentDecorators.length > 0) {
      return true;
    }

    if (includeDirectives) {
      const directiveDecorators = getDecoratorMetadata(sourceFile, 'Directive', '@angular/core');
      return directiveDecorators.length > 0;
    }

    return false;
  } catch {
    return false;
  }
};

const analyzeComponentImports = (sourceFile: ts.SourceFile): string[] => {
  const componentImports: string[] = [];

  const visitNode = (node: ts.Node) => {
    if (ts.isDecorator(node) && ts.isCallExpression(node.expression)) {
      const callExpr = node.expression;

      // Check if this is a @Component decorator
      if (ts.isIdentifier(callExpr.expression) && callExpr.expression.text === 'Component') {
        if (callExpr.arguments.length > 0) {
          const arg = callExpr.arguments[0];

          if (ts.isObjectLiteralExpression(arg)) {
            // Look for the imports property
            for (const property of arg.properties) {
              if (
                ts.isPropertyAssignment(property) &&
                ts.isIdentifier(property.name) &&
                property.name.text === 'imports'
              ) {
                if (ts.isArrayLiteralExpression(property.initializer)) {
                  // Extract import names from the array
                  for (const element of property.initializer.elements) {
                    if (ts.isIdentifier(element)) {
                      componentImports.push(element.text);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visitNode);
  };

  visitNode(sourceFile);
  return componentImports;
};

const sortComponentImports = (imports: string[]): string[] => {
  // Sort imports alphabetically
  return [...imports].sort();
};

const processFile = (filePath: string, options: SortImportsBuilderOptions): ComponentImportsInfo => {
  const content = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  const componentName = basename(filePath, '.ts');
  const importsArray = analyzeComponentImports(sourceFile);
  const sortedImports = sortComponentImports(importsArray);

  // Check if imports need to be reordered
  const hasChanges = JSON.stringify(importsArray) !== JSON.stringify(sortedImports);

  if (hasChanges && !options.dryRun) {
    // Find and replace the imports array in the component decorator
    const updatedContent = updateComponentImports(content, sortedImports);
    writeFileSync(filePath, updatedContent, 'utf8');
  }

  return {
    filePath,
    componentName,
    importsArray,
    sortedImports,
    hasChanges,
  };
};

const updateComponentImports = (content: string, sortedImports: string[]): string => {
  const sourceFile = ts.createSourceFile('temp.ts', content, ts.ScriptTarget.Latest, true);

  let updatedContent = content;

  const visitNode = (node: ts.Node) => {
    if (ts.isDecorator(node) && ts.isCallExpression(node.expression)) {
      const callExpr = node.expression;

      if (ts.isIdentifier(callExpr.expression) && callExpr.expression.text === 'Component') {
        if (callExpr.arguments.length > 0) {
          const arg = callExpr.arguments[0];

          if (ts.isObjectLiteralExpression(arg)) {
            for (const property of arg.properties) {
              if (
                ts.isPropertyAssignment(property) &&
                ts.isIdentifier(property.name) &&
                property.name.text === 'imports'
              ) {
                if (ts.isArrayLiteralExpression(property.initializer)) {
                  // Replace the array content
                  const start = property.initializer.getStart(sourceFile);
                  const end = property.initializer.getEnd();

                  const newImportsArray = `[${sortedImports.join(', ')}]`;
                  updatedContent = content.substring(0, start) + newImportsArray + content.substring(end);
                }
              }
            }
          }
        }
      }
    }

    ts.forEachChild(node, visitNode);
  };

  visitNode(sourceFile);
  return updatedContent;
};

const outputResults = (
  analyses: ComponentImportsInfo[],
  options: SortImportsBuilderOptions,
  context: BuilderContext,
): void => {
  const changedFiles = analyses.filter((a) => a.hasChanges);
  const unchangedFiles = analyses.filter((a) => !a.hasChanges);

  context.logger.info('\n📋 COMPONENT IMPORTS SORTING ANALYSIS');
  context.logger.info('━'.repeat(80));

  if (options.dryRun) {
    context.logger.info('🔍 DRY RUN MODE - No files were modified');
  }

  context.logger.info(`📊 Summary: ${analyses.length} files analyzed`);
  context.logger.info(`✅ ${unchangedFiles.length} files already have sorted imports`);
  context.logger.info(`🔄 ${changedFiles.length} files ${options.dryRun ? 'would be' : 'were'} updated`);

  if (options.verbose && changedFiles.length > 0) {
    context.logger.info(`📝 Files ${options.dryRun ? 'that would be' : 'that were'} updated:`);
    context.logger.info('─'.repeat(80));
    context.logger.info('Component Name'.padEnd(35) + 'Sorted Imports');
    context.logger.info('─'.repeat(80));

    changedFiles.forEach((analysis) => {
      const componentName =
        analysis.componentName.length > 32 ? analysis.componentName.substring(0, 29) + '...' : analysis.componentName;
      const sortedImports = `[${analysis.sortedImports.join(', ')}]`;

      context.logger.info(componentName.padEnd(35) + sortedImports);
    });
    context.logger.info('─'.repeat(80));
  }

  if (options.verbose && unchangedFiles.length > 0) {
    context.logger.info('✨ Files with already sorted imports:');
    context.logger.info('─'.repeat(80));
    context.logger.info('Component Name'.padEnd(35) + 'Current Imports');
    context.logger.info('─'.repeat(80));

    unchangedFiles.forEach((analysis) => {
      const componentName =
        analysis.componentName.length > 32 ? analysis.componentName.substring(0, 29) + '...' : analysis.componentName;

      if (analysis.importsArray.length > 0) {
        const imports = `[${analysis.importsArray.join(', ')}]`;
        context.logger.info(componentName.padEnd(35) + imports);
      } else {
        const noImportsText = 'No imports array found';
        context.logger.info(componentName.padEnd(35) + noImportsText);
      }
    });
    context.logger.info('─'.repeat(80));
  }

  context.logger.info('━'.repeat(80));
};

export default createBuilder(async (options: SortImportsBuilderOptions, context: BuilderContext) => {
  try {
    const projectRoot = context.target?.project
      ? join(context.workspaceRoot, 'projects', context.target.project)
      : context.workspaceRoot;

    const srcDir = join(projectRoot, 'src');

    if (!statSync(srcDir).isDirectory()) {
      context.logger.error(`Source directory not found: ${srcDir}`);
      return { success: false };
    }

    // Find all TypeScript files recursively
    const allTsFiles = walkDirectory(srcDir);

    // Filter to only component and directive files
    const targetFiles = allTsFiles.filter((file) => isAngularComponentOrDirective(file, options.includeDirectives));

    if (targetFiles.length === 0) {
      context.logger.info('No Angular components or directives found.');
      return { success: true };
    }

    // Process each file
    const analyses: ComponentImportsInfo[] = [];

    for (const filePath of targetFiles) {
      try {
        const analysis = processFile(filePath, options);
        analyses.push(analysis);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.logger.warn(`Failed to process ${filePath}: ${errorMessage}`);
      }
    }

    // Output results
    outputResults(analyses, options, context);

    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    context.logger.error('Error sorting imports: ' + errorMessage);
    return { success: false };
  }
});
