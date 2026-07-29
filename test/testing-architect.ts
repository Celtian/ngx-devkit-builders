import { Architect, Builder, BuilderOutput, Target } from '@angular-devkit/architect';
import { TestingArchitectHost } from '@angular-devkit/architect/testing';
import { json, logging } from '@angular-devkit/core';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

class ProjectMetadataArchitectHost extends TestingArchitectHost {
  constructor(
    workspaceRoot: string,
    private readonly projectMetadata: json.JsonObject | null,
  ) {
    super(workspaceRoot, workspaceRoot);
  }

  override async getProjectMetadata(): Promise<json.JsonObject | null> {
    return this.projectMetadata;
  }
}

interface RunBuilderOptions {
  logs?: string[];
  options?: json.JsonObject;
  projectMetadata?: json.JsonObject | null;
  target?: Target;
}

export const createTestWorkspace = (): Promise<string> => mkdtemp(join(tmpdir(), 'ngx-devkit-builders-'));

export const removeTestWorkspace = (workspaceRoot: string): Promise<void> =>
  rm(workspaceRoot, { recursive: true, force: true });

export const loadBuilderSchema = async (builderName: string): Promise<json.schema.JsonSchema> =>
  JSON.parse(await readFile(join(process.cwd(), 'src', builderName, 'schema.json'), 'utf-8'));

export const runBuilder = async (
  builderName: string,
  builder: Builder,
  schema: json.schema.JsonSchema,
  workspaceRoot: string,
  { logs, options = {}, projectMetadata = null, target }: RunBuilderOptions = {},
): Promise<BuilderOutput> => {
  const architectHost = new ProjectMetadataArchitectHost(workspaceRoot, projectMetadata);
  const registeredBuilderName = `test:${builderName}`;
  architectHost.addBuilder(registeredBuilderName, builder, undefined, schema);

  const schemaRegistry = new json.schema.CoreSchemaRegistry();
  schemaRegistry.addPostTransform(json.schema.transforms.addUndefinedDefaults);
  const architect = new Architect(architectHost, schemaRegistry);
  const logger = logs ? new logging.Logger(`test:${builderName}`) : undefined;
  const logSubscription = logger?.subscribe((entry) => logs?.push(entry.message));
  const scheduleOptions = logger ? { logger } : undefined;
  const run = target
    ? await (async () => {
        architectHost.addTarget(target, registeredBuilderName, options);
        return architect.scheduleTarget(target, {}, scheduleOptions);
      })()
    : await architect.scheduleBuilder(registeredBuilderName, options, scheduleOptions);

  try {
    return await run.result;
  } finally {
    await run.stop();
    logSubscription?.unsubscribe();
  }
};
