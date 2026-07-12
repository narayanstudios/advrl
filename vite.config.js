import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build output goes to dist/.
//
// - Standalone testing (this app deployed on its own, files served at the
//   domain root, e.g. a throwaway Vercel project just for this repo): use
//   base: '/'.
// - Merged into the main site under /public/react/ (see MIDDLEWARE_CHANGES.md):
//   switch this back to base: '/react/' before building for that deployment.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
  },
});
