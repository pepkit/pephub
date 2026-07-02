// Helpers for the Validator page: turn user input (uploaded files or a
// registry path) into the shape that validate-pep needs.
import yaml from 'js-yaml';

import { getProjectConfig, getSampleTable, getSubsampleTable } from '../api/project';
import { fetchSchemaJson, parseSchemaRegistryPath } from '../hooks/queries/useSchemaJson';

export type PreparedPep = {
  configYaml: string;
  samples: Record<string, unknown>[];
  subsamples?: Record<string, unknown>[][];
};

// Minimal CSV parser — handles comma delimiter, double-quoted strings with
// embedded commas, escaped quotes (""), CRLF/LF line endings. Good enough
// for PEP sample tables; does not handle exotic quoting.
export const parseCsv = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = r[idx] ?? '';
    });
    return obj;
  });
};

const readFileText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });

// Build a PreparedPep from a list of uploaded files. Accepts either:
//   - a single .json / .yaml file that already encodes a full
//     `{config, samples[, subsamples]}` project, or
//   - a .yaml config paired with a .csv sample table.
export const preparePepFromFiles = async (files: FileList): Promise<PreparedPep> => {
  if (!files || files.length === 0) {
    throw new Error('No PEP files uploaded.');
  }

  const entries = await Promise.all(
    Array.from(files).map(async (f) => ({ file: f, text: await readFileText(f) })),
  );

  // Single file case: full JSON/YAML project.
  if (entries.length === 1) {
    const { file, text } = entries[0];
    const name = file.name.toLowerCase();
    let parsed: unknown;
    if (name.endsWith('.json')) {
      parsed = JSON.parse(text);
    } else if (name.endsWith('.yaml') || name.endsWith('.yml')) {
      parsed = yaml.load(text);
    } else {
      throw new Error(
        'Single-file uploads must be .json or .yaml encoding a full PEP project.',
      );
    }
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Uploaded file did not parse to a PEP project object.');
    }
    const obj = parsed as Record<string, unknown>;
    // Accept either a pre-shaped {config, samples} or a raw config document
    // — we can't validate a config without samples, so require the former.
    if (!('config' in obj) || !('samples' in obj)) {
      throw new Error(
        'Uploaded project must include both "config" and "samples". Upload a config + CSV instead.',
      );
    }
    const config = obj.config as Record<string, unknown>;
    return {
      configYaml: yaml.dump(config),
      samples: obj.samples as Record<string, unknown>[],
      subsamples: obj.subsamples as Record<string, unknown>[][] | undefined,
    };
  }

  // Multi-file case: find config yaml + sample csv.
  const configEntry = entries.find((e) =>
    /\.ya?ml$/i.test(e.file.name),
  );
  const sampleEntry = entries.find((e) => /\.csv$/i.test(e.file.name));
  if (!configEntry || !sampleEntry) {
    throw new Error(
      'Multi-file uploads must include a .yaml config and a .csv sample table.',
    );
  }
  return {
    configYaml: configEntry.text,
    samples: parseCsv(sampleEntry.text),
  };
};

// Pull a PEP out of the server by registry path. Note: this still reads
// from the server (necessary — the raw PEP lives there), but the
// validation itself runs in the browser.
export const preparePepFromRegistry = async (
  registryPath: string,
): Promise<PreparedPep> => {
  // registry path: "namespace/name" or "namespace/name:tag"
  const [nsAndName, tagPart] = registryPath.split(':');
  const [namespace, name] = nsAndName.split('/');
  const tag = tagPart || 'default';
  if (!namespace || !name) {
    throw new Error(`Invalid registry path: ${registryPath}`);
  }

  const [configResp, samplesResp, subsamplesResp] = await Promise.all([
    getProjectConfig(namespace, name, tag).catch(() => null),
    getSampleTable(namespace, name, tag).catch(() => null),
    getSubsampleTable(namespace, name, tag).catch(() => null),
  ]);

  const configYaml =
    (configResp as unknown as { config?: string } | null)?.config ?? '';
  const samples = ((samplesResp as unknown as { items?: Record<string, unknown>[] } | null)?.items ?? []);
  const subsamplesItems =
    (subsamplesResp as unknown as { items?: Record<string, unknown>[] } | null)?.items;
  const subsamples =
    subsamplesItems && subsamplesItems.length > 0 ? [subsamplesItems] : undefined;

  return { configYaml, samples, subsamples };
};

export const prepareSchema = async (opts: {
  registryPath?: string | null;
  file?: File | null;
  pasted?: string | null;
}): Promise<object | string> => {
  if (opts.registryPath) {
    const parsed = parseSchemaRegistryPath(opts.registryPath);
    if (!parsed) throw new Error(`Invalid schema registry path: ${opts.registryPath}`);
    return fetchSchemaJson(parsed.namespace, parsed.name, parsed.version);
  }
  if (opts.file) {
    const text = await readFileText(opts.file);
    return text;
  }
  if (opts.pasted) {
    return opts.pasted;
  }
  throw new Error('No schema provided.');
};
