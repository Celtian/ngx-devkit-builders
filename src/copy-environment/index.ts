import { createBuilder } from '@angular-devkit/architect';
import { JsonObject, getSystemPath, normalize } from '@angular-devkit/core';
import { copy } from 'fs-extra';

export interface CopyEnvironmentBuilderOptions extends JsonObject {
  source: string;
  target: string;
  overwrite: boolean;
  verbose: boolean;
}

export default createBuilder(async ({ verbose, source, target, overwrite }: CopyEnvironmentBuilderOptions, ctx) => {
  ctx.logger.info('🚧 Copying environment…');

  const builderTarget = ctx.target;
  if (!builderTarget) {
    ctx.logger.error('❌ Builder target is required');
    return {
      success: false,
    };
  }

  const projectMetadata = await ctx.getProjectMetadata(builderTarget.project);

  if (projectMetadata.projectType !== 'application') {
    ctx.logger.error('❌ Project must be type of application');
    return {
      success: false,
    };
  }

  if (builderTarget.configuration) {
    ctx.logger.info(`Selected configuration "${builderTarget.configuration}"`);
  }

  const rootPath = getSystemPath(normalize(ctx.workspaceRoot));

  const environmentsFolder = `${rootPath}/${projectMetadata.sourceRoot}/environments`;

  if (verbose) ctx.logger.info(`Target folder is here "${environmentsFolder}"`);

  const sourceFile = `${environmentsFolder}/${source}`;
  const targetFile = `${environmentsFolder}/${target}`;

  try {
    await copy(sourceFile, targetFile, { overwrite });
    if (overwrite) {
      ctx.logger.info(`✔️  Environment replaced in "${targetFile}"`);
    } else {
      ctx.logger.info(`✔️  Environment replaced in "${targetFile}" if not exists`);
    }
    return {
      success: true,
    };
  } catch {
    ctx.logger.error(`❌ Failed to replace file "${targetFile}"`);
    return {
      success: false,
    };
  }
});
