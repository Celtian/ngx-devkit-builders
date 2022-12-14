import { createBuilder } from '@angular-devkit/architect';
import { getSystemPath, normalize } from '@angular-devkit/core';
import { readFileSync, writeFileSync } from 'fs';

export default createBuilder((options, ctx) => {
  ctx.logger.info('Creating version');
  try {
    const fileToPatch = `${getSystemPath(normalize(ctx.workspaceRoot))}/src/assets/build.json`;
    const packageJsonContent = readFileSync(`${getSystemPath(normalize(ctx.workspaceRoot))}/package.json`, 'utf-8');

    writeFileSync(fileToPatch, JSON.stringify({
      version: JSON.parse(packageJsonContent).version,
      date: new Date().toISOString()
    }))

  } catch (error) {
    return {
      success: false
    }
  }

  return {
    success: true
  }
})
