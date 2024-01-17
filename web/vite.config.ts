import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react-swc';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [mdx(), react()],
  build: {
    target: browserslistToEsbuild(),
  },
});
