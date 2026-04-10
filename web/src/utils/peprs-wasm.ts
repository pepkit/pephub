// Singleton lazy loader for the @databio/peprs WASM bindings.
//
// The wasm blob is ~18MB, so we only load it on first use and then
// memoize the init promise for the rest of the session.

type PeprsModule = typeof import('@databio/peprs');

let modPromise: Promise<PeprsModule> | null = null;

export const loadPeprsWasm = (): Promise<PeprsModule> => {
  if (!modPromise) {
    modPromise = (async () => {
      const mod = await import('@databio/peprs');
      // The default export (__wbg_init) resolves the .wasm URL relative
      // to the package's own JS file via its built-in import.meta.url.
      // Calling with no arguments lets Vite handle the URL correctly in
      // both dev and production builds.
      await mod.default();
      return mod;
    })().catch((err) => {
      // reset so a later retry can try again
      modPromise = null;
      throw err;
    });
  }
  return modPromise;
};
