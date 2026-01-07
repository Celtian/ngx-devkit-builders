import { createBuilder } from '@angular-devkit/architect';
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

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

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

const outputResults = (analyses: ComponentImportsInfo[], options: SortImportsBuilderOptions): void => {
  const changedFiles = analyses.filter((a) => a.hasChanges);
  const unchangedFiles = analyses.filter((a) => !a.hasChanges);

  console.log('\n📋 COMPONENT IMPORTS SORTING ANALYSIS');
  console.log('━'.repeat(80));

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No files were modified');
    console.log('');
  }

  console.log(`📊 Summary: ${analyses.length} files analyzed`);
  console.log(`✅ ${unchangedFiles.length} files already have sorted imports`);
  console.log(`🔄 ${changedFiles.length} files ${options.dryRun ? 'would be' : 'were'} updated`);

  if (options.verbose && changedFiles.length > 0) {
    console.log('');
    console.log(`📝 Files ${options.dryRun ? 'that would be' : 'that were'} updated:`);
    console.log('─'.repeat(80));
    console.log('Component Name'.padEnd(35) + 'Sorted Imports');
    console.log('─'.repeat(80));

    changedFiles.forEach((analysis) => {
      const componentName =
        analysis.componentName.length > 32 ? analysis.componentName.substring(0, 29) + '...' : analysis.componentName;
      const sortedImports = `[${analysis.sortedImports.join(', ')}]`;

      // Use cyan color for sorted imports to match the existing imports color
      console.log(componentName.padEnd(35) + colors.cyan + sortedImports + colors.reset);
    });
    console.log('─'.repeat(80));
  }

  if (options.verbose && unchangedFiles.length > 0) {
    console.log('');
    console.log('✨ Files with already sorted imports:');
    console.log('─'.repeat(80));
    console.log('Component Name'.padEnd(35) + 'Current Imports');
    console.log('─'.repeat(80));

    unchangedFiles.forEach((analysis) => {
      const componentName =
        analysis.componentName.length > 32 ? analysis.componentName.substring(0, 29) + '...' : analysis.componentName;

      if (analysis.importsArray.length > 0) {
        const imports = `[${analysis.importsArray.join(', ')}]`;
        // Use cyan color for components with existing sorted imports
        console.log(componentName.padEnd(35) + colors.cyan + imports + colors.reset);
      } else {
        // Use gray/dim color for components without imports
        const noImportsText = 'No imports array found';
        console.log(componentName.padEnd(35) + colors.gray + colors.dim + noImportsText + colors.reset);
      }
    });
    console.log('─'.repeat(80));
  }

  console.log('━'.repeat(80));
};

export default createBuilder((options: SortImportsBuilderOptions, context) => {
  return new Promise<{ success: boolean }>((resolve) => {
    try {
      const projectRoot = context.target?.project
        ? join(context.workspaceRoot, 'projects', context.target.project)
        : context.workspaceRoot;

      const srcDir = join(projectRoot, 'src');

      if (!statSync(srcDir).isDirectory()) {
        context.logger.error(`Source directory not found: ${srcDir}`);
        resolve({ success: false });
        return;
      }

      // Find all TypeScript files recursively
      const allTsFiles = walkDirectory(srcDir);

      // Filter to only component and directive files
      const targetFiles = allTsFiles.filter((file) => isAngularComponentOrDirective(file, options.includeDirectives));

      if (targetFiles.length === 0) {
        console.log('No Angular components or directives found.');
        resolve({ success: true });
        return;
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
      outputResults(analyses, options);

      resolve({ success: true });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      context.logger.error('Error sorting imports: ' + errorMessage);
      resolve({ success: false });
    }
  });
});
