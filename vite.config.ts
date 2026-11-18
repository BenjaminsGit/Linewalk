import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds to one self-contained dist/index.html so the demo runs anywhere:
// GitHub Pages, a sandboxed preview, or opened straight from disk.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  test: { environment: 'node', globals: true },
});
