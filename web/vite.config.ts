import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react-swc';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    mdx({
      rehypePlugins: [rehypeSlug, rehypeHighlight],
    }),
    react(),
  ],
  build: {
    target: browserslistToEsbuild(),
  },
  server: {
    fs: {
      // Allow serving files from the sibling peprs-wasm package (linked
      // via `file:../../peprs/peprs-wasm/pkg`). Vite's default fs.allow
      // is rooted at the project, so the symlinked wasm blob is blocked
      // without this.
      allow: ['..', '../../peprs'],
    },
  },
});
