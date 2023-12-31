import { createBuilder } from '@angular-devkit/architect';
import { JsonObject, getSystemPath, normalize } from '@angular-devkit/core';
import { writeFileSync } from 'fs';

export interface RobotsBuilderOptions extends JsonObject {
  allow: boolean;
  sitemap: string;
  verbose: boolean;
}

const createRobots = (options: Pick<RobotsBuilderOptions, 'allow' | 'sitemap'>) => {
  const lines = ['User-agent: *'];
  if (options.allow) {
    lines.push('Allow: /');
    if (options.sitemap) {
      lines.push(`Sitemap: ${options.sitemap}`);
    }
  } else {
    lines.push('Disallow: /');
  }
  return lines.join('\n\n');
};

export default createBuilder(async ({ allow, sitemap, verbose }: RobotsBuilderOptions, ctx) => {
  ctx.logger.info('🚧 Creating robots file…');

  const rootPath = getSystemPath(normalize(ctx.workspaceRoot));

  if (ctx.target.configuration) {
    ctx.logger.info(`Selected configuration "${ctx.target.configuration}"`);
  }

  const projectMetadata = await ctx.getProjectMetadata(ctx.target.project);

  const targetFile = `${rootPath}/${projectMetadata.sourceRoot}/robots.txt`;

  if (verbose === true) ctx.logger.info(`Target file is here "${targetFile}"`);

  writeFileSync(
    targetFile,
    createRobots({
      allow,
      sitemap,
    }),
    { encoding: 'utf-8' },
  );

  ctx.logger.info(`✔️  Robots file successfully created in ${targetFile}`);

  return {
    success: true,
  };
});
