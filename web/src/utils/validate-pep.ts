import yaml from 'js-yaml';

import { loadPeprsWasm } from './peprs-wasm';

export type PepValidationErrorItem = {
  path?: string;
  message: string;
  sample_name?: string;
};

export type PepValidationErrorType =
  | 'Project'
  | 'Samples'
  | 'Project and Samples'
  | 'Schema';

export type PepValidationOutcome =
  | { state: 'valid' }
  | {
      state: 'invalid';
      errorType: PepValidationErrorType;
      errors: string[];
      rawErrors: PepValidationErrorItem[];
    }
  | { state: 'error'; message: string };

export type ValidatePepInput = {
  // raw yaml string for the project config
  configYaml: string;
  // rows of already-parsed samples (list of dicts)
  samples: Record<string, unknown>[];
  // optional list of subsample tables (list of lists of dicts)
  subsamples?: Record<string, unknown>[][];
  // schema as either a parsed object or a yaml/json string
  schema: object | string;
};

const normalizeSchema = (schema: object | string): string => {
  if (typeof schema === 'string') {
    // Try JSON first, fall back to YAML.
    try {
      const parsed = JSON.parse(schema);
      return JSON.stringify(parsed);
    } catch {
      const parsed = yaml.load(schema);
      return JSON.stringify(parsed);
    }
  }
  return JSON.stringify(schema);
};

const parseConfig = (configYaml: string): Record<string, unknown> => {
  if (!configYaml || configYaml.trim() === '') {
    return {};
  }
  const parsed = yaml.load(configYaml);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  throw new Error('Project config must parse to a YAML mapping.');
};

export const validatePep = async (
  input: ValidatePepInput,
): Promise<PepValidationOutcome> => {
  const { configYaml, samples, subsamples, schema } = input;

  let projectJson: string;
  let schemaJson: string;

  try {
    const config = parseConfig(configYaml);
    const projectObj: Record<string, unknown> = {
      config,
      samples,
    };
    if (subsamples && subsamples.length > 0) {
      projectObj.subsamples = subsamples;
    }
    projectJson = JSON.stringify(projectObj);
  } catch (e) {
    return {
      state: 'error',
      message: e instanceof Error ? e.message : String(e),
    };
  }

  try {
    schemaJson = normalizeSchema(schema);
  } catch (e) {
    return {
      state: 'error',
      message: `Schema is invalid: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }

  let mod: Awaited<ReturnType<typeof loadPeprsWasm>>;
  try {
    mod = await loadPeprsWasm();
  } catch (e) {
    return {
      state: 'error',
      message: `Failed to load WASM validator: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }

  let proj: InstanceType<typeof mod.WasmProject> | null = null;
  try {
    proj = new mod.WasmProject(projectJson);
  } catch (e) {
    return {
      state: 'error',
      message: `Could not build PEP project: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  }

  let result: { valid: boolean; errors?: PepValidationErrorItem[] } | null =
    null;
  try {
    result = mod.validate(proj, schemaJson) as {
      valid: boolean;
      errors?: PepValidationErrorItem[];
    };
  } catch (e) {
    return {
      state: 'error',
      message: `Validation failed to run: ${
        e instanceof Error ? e.message : String(e)
      }`,
    };
  } finally {
    proj?.free();
  }

  if (!result) {
    return { state: 'error', message: 'Validator returned no result.' };
  }

  if (result.valid) {
    return { state: 'valid' };
  }

  const rawErrors = result.errors ?? [];
  let hasProject = false;
  let hasSamples = false;
  const messages: string[] = [];

  // Group sample errors by message so we don't repeat the same line
  // hundreds of times for large projects.
  const sampleErrorGroups = new Map<string, string[]>();
  for (const err of rawErrors) {
    if (err.sample_name) {
      hasSamples = true;
      const existing = sampleErrorGroups.get(err.message);
      if (existing) {
        existing.push(err.sample_name);
      } else {
        sampleErrorGroups.set(err.message, [err.sample_name]);
      }
    } else {
      hasProject = true;
      messages.push(err.message);
    }
  }

  const MAX_SAMPLE_NAMES = 20;
  for (const [msg, names] of sampleErrorGroups) {
    if (names.length === 1) {
      messages.push(`${msg} (sample: ${names[0]})`);
    } else if (names.length <= MAX_SAMPLE_NAMES) {
      messages.push(`${msg} (samples: ${names.join(', ')})`);
    } else {
      const shown = names.slice(0, MAX_SAMPLE_NAMES).join(', ');
      messages.push(`${msg} (samples: ${shown}, and ${names.length - MAX_SAMPLE_NAMES} more)`);
    }
  }

  let errorType: PepValidationErrorType;
  if (hasProject && hasSamples) errorType = 'Project and Samples';
  else if (hasSamples) errorType = 'Samples';
  else errorType = 'Project';

  return {
    state: 'invalid',
    errorType,
    errors: messages,
    rawErrors,
  };
};
