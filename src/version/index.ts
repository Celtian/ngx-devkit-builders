import { createBuilder } from '@angular-devkit/architect';
import { getSystemPath, JsonObject, normalize } from '@angular-devkit/core';
import { readFileSync, writeFileSync } from 'fs';

export type VersionField = 'version' | 'date' | 'author' | 'git';
export type VersionLint = 'eslint' | 'tslint';

export interface VersionBuilderOptions extends JsonObject {
  outputFile: string;
  fields: VersionField[];
  lint: VersionLint;
  variable: string;
}

export default createBuilder(({ outputFile, fields, lint, variable }: VersionBuilderOptions, ctx) => {
  ctx.logger.info('🚧 Creating version information file…');
  let targetFile = '';
  try {
    const rootPath = getSystemPath(normalize(ctx.workspaceRoot));
    const encoding: BufferEncoding = 'utf-8';
    const fileToPatch = `${rootPath}/${outputFile}`;
    targetFile = fileToPatch;
    const packageJsonContent = readFileSync(`${rootPath}/package.json`, encoding);
    let head = readFileSync(`${rootPath}/.git/HEAD`, encoding).toString().trim();
    if (head.split(':').length > 1) {
      head = head.split(':')[1].trim();
    }
    const commit = head ? readFileSync(`${rootPath}/.git/${head}`, encoding).toString().trim() : undefined;
    const branch = head?.split('/')?.pop();
    const packageJson = JSON.parse(packageJsonContent);
    const git = branch || commit ? { branch, commit } : undefined;

    const json = JSON.stringify(
      {
        version: fields.includes('version') ? packageJson.version : undefined,
        date: fields.includes('date') ? new Date().toISOString() : undefined,
        author: fields.includes('author') ? packageJson.author : undefined,
        git: fields.includes('git') ? git : undefined
      },
      null,
      2
    );

    const rawFormat = outputFile?.split('.')?.pop();
    const format = ['json', 'ts'].includes(rawFormat) ? rawFormat : 'json';

    if (format === 'ts') {
      writeFileSync(
        fileToPatch,
        `// IMPORTANT: THIS FILE IS AUTO GENERATED!
/* ${lint === 'tslint' ? 'tslint:disable' : 'eslint-disable'} */
export const ${variable} = ${json};
/* ${lint === 'tslint' ? 'tslint:enable' : 'eslint-enable'} */
`,
        { encoding: 'utf-8' }
      );
    } else {
      writeFileSync(fileToPatch, json, { encoding });
    }
  } catch (error) {
    ctx.logger.info('❌ Creating version information file failed');
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
