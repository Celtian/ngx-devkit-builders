import { writeFileSync } from 'fs-extra';
import { join } from 'path';
import buildersJson from '../dist/builders.json';
import packageJson from '../dist/package.json';

// Modify builders.json in dist folder
const builders: Record<string, any> = buildersJson;

builders.builders.version.implementation = './version';
builders.builders.version.schema = './version/schema.json';

writeFileSync(join(__dirname, '..', 'dist', 'builders.json'), JSON.stringify(builders, null, 2));
console.log('File builders.json modified:', builders);

// Modify package.json in dist folder
const pkg: Record<string, any> = packageJson;

pkg.scripts = {};
pkg.devDependencies = {};

writeFileSync(join(__dirname, '..', 'dist', 'package.json'), JSON.stringify(pkg, null, 2));
console.log('File package.json modified:', pkg);
