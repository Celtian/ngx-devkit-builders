import { copyFileSync, writeFileSync } from 'fs-extra';
import { join } from 'path';
import buildersJson from '../builders.json';
import packageJson from '../package.json';

const rootPath = join(__dirname, '..');
const distPath = join(rootPath, 'dist');
const modules = ['robots', 'version', 'copy-environment', 'sort-imports'];

// Assemble builders.json and copy schemas to the dist folder
const builders: Record<string, any> = buildersJson;

for (const module of modules) {
  builders.builders[module].implementation = `./${module}`;
  builders.builders[module].schema = `./${module}/schema.json`;
  copyFileSync(join(rootPath, 'src', module, 'schema.json'), join(distPath, module, 'schema.json'));
}

writeFileSync(join(distPath, 'builders.json'), JSON.stringify(builders, null, 2));
console.log('File builders.json modified:', builders);

// Assemble package.json and copy package files to the dist folder
const pkg: Record<string, any> = packageJson;

pkg.scripts = {};
pkg.devDependencies = {};
pkg.engines.node = '^22.22.3 || ^24.15.0 || >=26.0.0';
pkg.peerDependencies = {
  '@angular/core': '>=22',
  '@angular/cli': '>=22',
};

writeFileSync(join(distPath, 'package.json'), JSON.stringify(pkg, null, 2));
copyFileSync(join(rootPath, 'README.md'), join(distPath, 'README.md'));
copyFileSync(join(rootPath, 'LICENSE'), join(distPath, 'LICENSE'));
console.log('File package.json modified:', pkg);
