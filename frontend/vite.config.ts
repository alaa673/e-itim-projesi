import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Real-mode builds: drop image files nothing references. Demo-only modules (e.g. the demo portraits)
 * are tree-shaken from the code, but Rollup has already emitted their images by then.
 */
function pruneUnreferencedImages(): Plugin {
  return {
    name: 'pusula:prune-unreferenced-images',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = Object.values(bundle);
      const sources = files.map((file) => (file.type === 'chunk' ? file.code : typeof file.source === 'string' ? file.source : '')).join('\n');
      for (const file of files) {
        if (file.type !== 'asset' || !/\.(webp|png|jpe?g|gif|svg|avif)$/i.test(file.fileName)) continue;
        const name = file.fileName.split('/').pop() ?? file.fileName;
        if (!sources.includes(name)) delete bundle[file.fileName];
      }
    },
  };
}

// `vite build --mode demo` produces one self-contained HTML file (dist-demo/index.html)
// that can be shared as a clickable prototype. Every other mode is a normal SPA build.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiTarget = env.VITE_DEV_API_TARGET;
  return {
    plugins: [react(), ...(mode === 'demo' ? [viteSingleFile()] : []), ...(env.VITE_API_MODE === 'real' ? [pruneUnreferencedImages()] : [])],
    // `npm run dev:api`: forward /api to the local backend (cookies stay on the dev origin).
    server: apiTarget
      ? {
          proxy: {
            '/api': { target: apiTarget, changeOrigin: true, cookieDomainRewrite: { '*': '' } },
          },
        }
      : undefined,
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build:
      mode === 'demo'
        ? { outDir: 'dist-demo', emptyOutDir: true }
        : {
            rollupOptions: {
              output: {
                // Long-lived vendor chunks: app updates do not invalidate the framework or the translations.
                manualChunks(id: string) {
                  if (id.includes('/src/i18n/locales/')) return 'locales';
                  if (!id.includes('node_modules')) return undefined;
                  if (/[\\/](react|react-dom|react-router|react-router-dom|@remix-run|scheduler)[\\/]/.test(id)) return 'react';
                  if (/[\\/](i18next|react-i18next)[\\/]/.test(id)) return 'i18n';
                  if (/[\\/](zod|react-hook-form|@hookform)[\\/]/.test(id)) return 'forms';
                  return undefined;
                },
              },
            },
          },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      css: false,
    },
  };
});
