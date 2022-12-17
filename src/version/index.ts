import { createBuilder } from '@angular-devkit/architect';
import { getSystemPath, JsonObject, normalize } from '@angular-devkit/core';
import { existsSync, readFileSync, writeFileSync } from 'fs';

export type VersionField = 'version' | 'date' | 'author' | 'git';
export type VersionLint = 'eslint' | 'tslint';

export interface VersionBuilderOptions extends JsonObject {
  outputFile: string;
  fields: VersionField[];
  lint: VersionLint;
  variable: string;
  verbose: boolean;
}

export interface VersionBuilderOutput {
  version?: string;
  date?: string;
  author?: any;
  git?: any;
}

export default createBuilder(({ outputFile, fields, lint, variable, verbose }: VersionBuilderOptions, ctx) => {
  ctx.logger.info('🚧 Creating version information file…');
  let targetFile = '';
  const generalError = '❌ Creating version information file failed';

  try {
    const result: VersionBuilderOutput = {};

    const rootPath = getSystemPath(normalize(ctx.workspaceRoot));
    const encoding: BufferEncoding = 'utf-8';
    if (verbose === true) ctx.logger.info(`Encoding for read/write is ${encoding}`);
    const fileToPatch = `${rootPath}/${outputFile}`;
    if (verbose === true) ctx.logger.info(`Output file is ${fileToPatch}`);
    targetFile = fileToPatch;
    const packageJson = JSON.parse(readFileSync(`${rootPath}/package.json`, encoding));

    if (fields.includes('version')) {
      result.version = packageJson.version;
    }

    if (fields.includes('date')) {
      result.date = new Date().toISOString();
    }

    if (fields.includes('author')) {
      result.author = packageJson.author;
    }

    if (fields.includes('git')) {
      const headFile = `${rootPath}/.git/HEAD`;
      if (verbose === true) ctx.logger.info(`Head is ${headFile}`);
      if (!existsSync(headFile)) {
        ctx.logger.info(generalError);
        ctx.logger.error(`${headFile} was not found`);
        return {
          success: false
        };
      }
      let head = readFileSync(headFile, encoding).toString().trim();
      if (head.split(':').length > 1) {
        head = head.split(':')[1].trim();
      }
      if (verbose === true) ctx.logger.info(`Head is ${head}`);
      const refFile = `${rootPath}/.git/${head}`;
      if (verbose === true) ctx.logger.info(`Last commit is located here ${refFile}`);
      if (!existsSync(refFile)) {
        ctx.logger.info(generalError);
        ctx.logger.error(`${refFile} was not found`);
        return {
          success: false
        };
      }
      const commit = head ? readFileSync(refFile, encoding).toString().trim() : undefined;
      if (verbose === true) ctx.logger.info(`Commit is ${commit}`);
      const branch = head?.split('/')?.pop();
      if (verbose === true) ctx.logger.info(`Branch is ${branch}`);
      const git = branch || commit ? { branch, commit } : undefined;
      result.git = git;
    }

    const json = JSON.stringify(result, null, 2);

    const rawFormat = outputFile?.split('.')?.pop();
    const format = ['json', 'ts'].includes(rawFormat) ? rawFormat : 'json';
    if (verbose === true) ctx.logger.info(`Output format is: ${format}`);
    if (format === 'ts') {
      writeFileSync(
        fileToPatch,
        `// IMPORTANT: THIS FILE IS AUTO GENERATED!
/* ${lint === 'tslint' ? 'tslint:disable' : 'eslint-disable'} */
export const ${variable} = ${json};
/* ${lint === 'tslint' ? 'tslint:enable' : 'eslint-enable'} */
`,
        { encoding }
      );
    } else {
      writeFileSync(fileToPatch, json, { encoding });
    }
  } catch (error) {
    ctx.logger.info(generalError);
    ctx.logger.error(JSON.stringify(error, null, 2));
    return {
      success: false
    };
  }
  ctx.logger.info(`✔️  Version information file successfully created in ${targetFile}`);
  return {
    success: true
  };
});
