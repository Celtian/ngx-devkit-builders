# ngx-devkit-builders AI Agent Instructions

## Project Overview

This is an Angular Architect builder library that provides custom build-time tools for Angular applications. The package exports 4 builders: `version`, `robots`, `copy-environment`, and `sort-imports`. Each builder integrates into Angular's CLI build system via [angular.json](angular.json) configuration.

## Architecture & Structure

### Builder Pattern

- All builders follow the same pattern: export a default function created with `createBuilder()` from `@angular-devkit/architect`
- Each builder has three files: `index.ts` (implementation), `schema.json` (JSON Schema for options), and `README.md` (documentation)
- Builders receive options (typed as `JsonObject` interface) and a `BuilderContext` with logger, workspace info, and project metadata
- See [src/version/index.ts](src/version/index.ts#L23) for a synchronous builder example, [src/copy-environment/index.ts](src/copy-environment/index.ts#L27) for async

### Build & Distribution

- Source in `src/`, compiled to `dist/` via TypeScript (`bun run build`)
- Post-build: [scripts/prepare-dist.ts](scripts/prepare-dist.ts) modifies `dist/builders.json` to fix paths and `dist/package.json` to remove dev dependencies
- The `builders.json` at root maps builder names to their `dist/` implementations
- Use `bun run build:watch` for development with auto-rebuild

### Key Patterns

- **Schema-driven options**: Each builder validates options via JSON Schema (see [src/version/schema.json](src/version/schema.json))
- **Workspace integration**: Use `ctx.workspaceRoot` for root path, `getSystemPath(normalize(...))` for cross-platform paths
- **Logging**: Use `ctx.logger.info/error()` with emoji prefixes (🚧 for start, ✔️ for success, ❌ for error)
- **Verbose mode**: Most builders have a `verbose` boolean option for extended logging

## Development Workflows

### Building

```bash
bun run build          # Clean build: rimraf dist && tsc && postbuild
bun run build:watch    # Watch mode with auto-postbuild
bun run postbuild      # Copy JSON schemas, READMEs, and run prepare-dist script
```

### Publishing

```bash
bun run publish:npmjs  # Build and publish to npm
bun run release:patch  # Bump patch version, update CHANGELOG, commit, and push tag
bun run release:minor  # Minor version bump
bun run release:beta   # Prerelease version
```

### Code Quality

- Husky + lint-staged configured for pre-commit hooks
- Quick Commitlint enforces conventional commits
- Prettier for formatting, ESLint for linting (TypeScript 5.x)

## Builder Implementation Guidelines

### Creating a New Builder

1. Create folder in `src/` with `index.ts`, `schema.json`, and `README.md`
2. Export default `createBuilder()` with typed options interface extending `JsonObject`
3. Add entry to [builders.json](builders.json) with description, implementation path, and schema path
4. Use `ctx.logger.info()` with emoji prefixes for user-facing messages
5. Return `{ success: boolean }` object

### Common Patterns

- **File operations**: Use `fs` (sync) or `fs-extra` (async like in [copy-environment](src/copy-environment/index.ts))
- **TypeScript AST**: Use `typescript` package directly (see [sort-imports](src/sort-imports/index.ts#L1-L10) for AST-based import sorting)
- **Angular schematics utilities**: Use `@schematics/angular/utility/ast-utils` for Angular-specific AST operations (e.g., `getDecoratorMetadata()`)
- **Project metadata**: Access via `await ctx.getProjectMetadata(ctx.target.project)` to get project type, source root, etc.

## Critical Dependencies

- `@angular-devkit/architect` and `@angular-devkit/core`: Core builder APIs
- `@schematics/angular`: Angular-specific utilities for AST manipulation
- `fs-extra`: Promise-based file operations
- Node 24-25 required (see [package.json](package.json) engines field)

## Project-Specific Conventions

- **Bun-only**: Package manager is Bun 1.3.14 (declared via `packageManager` and `engines.bun`)
- **Builder paths in dist**: Post-build script rewrites paths from `./dist/version` to `./version` for distribution
- **Error handling**: Always catch errors, log with ❌ emoji, and return `{ success: false }`
- **Configuration-aware**: Builders should respect `ctx.target.configuration` when applicable (see copy-environment)
- **Version compatibility**: Keep Angular peer dependency range broad (current target: Angular 21+)
