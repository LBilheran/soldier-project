import { defineConfig } from 'vite';

export default defineConfig({
  root: "src/",
  publicDir: "../public/",
  base: '/soldier-projet/',
  clearScreen: false,
    optimizeDeps: {
        esbuildOptions: {
            supported: {
                'top-level-await': true
            }
        }
    },
    esbuild: {
        supported: {
            'top-level-await': true
        }
    },
  server:
    {
      open: true
    },
  build:
    {
        outDir: "../dist",
        emptyOutDir: true,
        sourcemap: true,
        chunkSizeWarningLimit: 1024
    }
});
