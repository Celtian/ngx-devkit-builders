import { writeFileSync } from 'fs-extra';
import { join } from 'path';
import buildersJson from '../dist/builders.json';
import packageJson from '../dist/package.json';

// Modify builders.json in dist folder
const builders: Record<string, any> = buildersJson;

for (const module of ['robots', 'version', 'copy-environment']) {
  builders.builders[module].implementation = `./${module}`;
  builders.builders[module].schema = `./${module}/schema.json`;
}

writeFileSync(join(__dirname, '..', 'dist', 'builders.json'), JSON.stringify(builders, null, 2));
console.log('File builders.json modified:', builders);

// Modify package.json in dist folder
const pkg: Record<string, any> = packageJson;

pkg.scripts = {};
pkg.devDependencies = {};
pkg.engines.node = '>=20';
pkg.peerDependencies = {
  '@angular/core': '>=21',
  '@angular/cli': '>=21',
};

writeFileSync(join(__dirname, '..', 'dist', 'package.json'), JSON.stringify(pkg, null, 2));
console.log('File package.json modified:', pkg);
