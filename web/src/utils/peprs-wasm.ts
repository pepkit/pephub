// Singleton lazy loader for the @pepkit/peprs WASM bindings.
//
// The wasm blob is ~18MB, so we only load it on first use and then
// memoize the init promise for the rest of the session.

type PeprsModule = typeof import('@pepkit/peprs');

let modPromise: Promise<PeprsModule> | null = null;

export const loadPeprsWasm = (): Promise<PeprsModule> => {
  if (!modPromise) {
    modPromise = (async () => {
      const mod = await import('@pepkit/peprs');
      // Vite will emit the .wasm as an asset and rewrite this URL.
      const wasmUrl = new URL(
        '@pepkit/peprs/peprs_wasm_bg.wasm',
        import.meta.url,
      );
      await mod.default(wasmUrl);
      return mod;
    })().catch((err) => {
      // reset so a later retry can try again
      modPromise = null;
      throw err;
    });
  }
  return modPromise;
};
