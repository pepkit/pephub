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

const parseSchemaObject = (schema: object | string): Record<string, unknown> => {
  let parsed: unknown = schema;
  if (typeof schema === 'string') {
    // Try JSON first, fall back to YAML.
    try {
      parsed = JSON.parse(schema);
    } catch {
      parsed = yaml.load(schema);
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Schema must parse to an object.');
  }
  return parsed as Record<string, unknown>;
};

// Session-level cache of fetched import URLs so live validation doesn't
// re-fetch the same base schema on every keystroke.
const importCache = new Map<string, Promise<Record<string, unknown>>>();

// When the page is served over https, upgrade http:// import URLs to
// https:// so the browser doesn't block them as mixed content. Many
// registry schemas (e.g. pepatac) still declare imports as
// http://schema.databio.org/..., which fails with "Failed to fetch" on
// the deployed https site but works on a local http preview.
const upgradeImportUrl = (url: string): string => {
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    url.startsWith('http://')
  ) {
    return 'https://' + url.slice('http://'.length);
  }
  return url;
};

const fetchImportedSchema = (rawUrl: string): Promise<Record<string, unknown>> => {
  const url = upgradeImportUrl(rawUrl);
  const cached = importCache.get(url);
  if (cached) return cached;
  const promise = (async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch imported schema ${url}: HTTP ${res.status}`);
    }
    const parsed = yaml.load(await res.text());
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`Imported schema ${url} did not parse to an object.`);
    }
    return parsed as Record<string, unknown>;
  })();
  importCache.set(url, promise);
  promise.catch(() => importCache.delete(url));
  return promise;
};

// Flatten a schema and its eido `imports` chain into standalone schemas,
// imports first — the same order peprs validates in natively. The WASM
// build can't fetch URLs itself, so imports are dereferenced here and the
// `imports` key is stripped before each schema is handed to the validator.
export const resolveSchemaChain = async (
  schema: Record<string, unknown>,
  seen: Set<string> = new Set(),
): Promise<Record<string, unknown>[]> => {
  const chain: Record<string, unknown>[] = [];
  const imports = Array.isArray(schema.imports) ? schema.imports : [];
  for (const imp of imports) {
    if (typeof imp !== 'string') {
      throw new Error(`Schema import entries must be strings, got: ${JSON.stringify(imp)}`);
    }
    if (!/^https?:\/\//.test(imp)) {
      throw new Error(
        `Schema import "${imp}" is not a URL — relative imports are not supported in browser validation.`,
      );
    }
    if (seen.has(imp)) continue;
    seen.add(imp);
    const imported = await fetchImportedSchema(imp);
    chain.push(...(await resolveSchemaChain(imported, seen)));
  }
  const self = { ...schema };
  delete self.imports;
  chain.push(self);
  return chain;
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
  let schemaChain: Record<string, unknown>[];

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
    schemaChain = await resolveSchemaChain(parseSchemaObject(schema));
  } catch (e) {
    return {
      state: 'error',
      message: `Could not load schema: ${
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

  const rawErrors: PepValidationErrorItem[] = [];
  try {
    for (const s of schemaChain) {
      const result = mod.validate(proj, JSON.stringify(s)) as {
        valid: boolean;
        errors?: PepValidationErrorItem[];
      };
      if (!result.valid) {
        rawErrors.push(...(result.errors ?? []));
      }
    }
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

  if (rawErrors.length === 0) {
    return { state: 'valid' };
  }

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
