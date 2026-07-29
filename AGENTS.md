# Repository Guidelines for AI Agents

These instructions apply to the entire repository.

## Project overview

`ngx-devkit-builders` is a Yarn-managed TypeScript package containing Angular Architect builders. The supported builders are `copy-environment`, `robots`, `sort-imports`, and `version`.

The repository requires Node.js 24 or 25 for development. Use Yarn for dependency management and project scripts; do not replace `yarn.lock` with an npm lockfile.

## Repository layout

- `src/<builder>/index.ts` contains a builder implementation.
- `src/<builder>/schema.json` defines and defaults its public options.
- `src/<builder>/README.md` documents its behavior and Angular configuration.
- `builders.json` registers the public builder names and their implementation and schema paths.
- `scripts/prepare-dist.ts` adjusts package metadata and builder paths in `dist/`.
- `dist/` is generated output and should not be edited directly.

## Implementation conventions

- Export builders with `createBuilder()` from `@angular-devkit/architect`.
- Define a typed options interface extending `JsonObject`.
- Return an object with a `success` boolean on every completion path.
- Use `BuilderContext` facilities for workspace metadata and user-facing logging.
- Resolve workspace paths with Angular DevKit path utilities or Node's `path` helpers so behavior remains cross-platform.
- Follow the existing logger style: `🚧` for start messages, `✔️` for success, and `❌` for errors.
- Preserve existing formatting: two-space indentation, single quotes in TypeScript, semicolons, and trailing commas.
- Keep implementation, schema defaults, builder registration, and documentation synchronized whenever a public option or builder changes.
- Update the root `README.md` when a change affects the package's public interface.

When adding a builder, create its `index.ts`, `schema.json`, and `README.md`, register it in `builders.json`, and update the module list in `scripts/prepare-dist.ts`.

## Validation

Run the checks relevant to the files changed:

```bash
yarn lint
yarn build
```

There is currently no automated test script. `yarn build` compiles `src/` and invokes the `postbuild` lifecycle to assemble and prepare `dist/`.

Do not run release, version-bump, publish, or push scripts unless the user explicitly requests them.
