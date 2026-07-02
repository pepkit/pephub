import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'usehooks-ts';

import {
  PepValidationOutcome,
  ValidatePepInput,
  validatePep,
} from '../utils/validate-pep';
import { loadPeprsWasm } from '../utils/peprs-wasm';

type HookInput = {
  configYaml: string | undefined;
  samples: Record<string, unknown>[] | undefined;
  subsamples?: Record<string, unknown>[][];
  schema: object | string | undefined;
  enabled?: boolean;
  debounceMs?: number;
};

type HookResult = {
  isValidating: boolean;
  isReady: boolean;
  result: PepValidationOutcome | undefined;
};

// Debounced, cancellable client-side PEP validation.
export const useClientSidePepValidation = (input: HookInput): HookResult => {
  const { enabled = true, debounceMs = 400 } = input;

  const [isReady, setIsReady] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<PepValidationOutcome | undefined>();

  // Trigger lazy WASM load on first enabled render.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadPeprsWasm()
      .then(() => {
        if (!cancelled) setIsReady(true);
      })
      .catch(() => {
        if (!cancelled) setIsReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Debounce the inputs. We serialize to a string so a referential
  // change in the arrays doesn't retrigger validation on every keystroke.
  const payload = enabled
    ? JSON.stringify({
        c: input.configYaml,
        s: input.samples,
        u: input.subsamples,
        sc: input.schema,
      })
    : '';
  const debouncedPayload = useDebounce(payload, debounceMs);

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setResult(undefined);
      return;
    }
    if (
      !input.schema ||
      input.configYaml === undefined ||
      input.samples === undefined
    ) {
      return;
    }

    const id = ++requestIdRef.current;
    setIsValidating(true);

    const run: ValidatePepInput = {
      configYaml: input.configYaml,
      samples: input.samples,
      subsamples: input.subsamples,
      schema: input.schema,
    };

    validatePep(run)
      .then((outcome) => {
        if (id !== requestIdRef.current) return;
        setResult(outcome);
      })
      .catch((e) => {
        if (id !== requestIdRef.current) return;
        setResult({
          state: 'error',
          message: e instanceof Error ? e.message : String(e),
        });
      })
      .finally(() => {
        if (id !== requestIdRef.current) return;
        setIsValidating(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPayload, enabled]);

  return { isValidating, isReady, result };
};
