import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import packageJson from './package.json'

/**
 * Test configuration for asma-ui-richeditor.
 *
 * Deliberately standalone rather than `mergeConfig(viteConfig, …)`: `vite.config.ts` exists to build
 * the library and does three things a test run must not do — it pins `process.env.NODE_ENV` to
 * `'production'` (React's production build ignores the `act` environment these tests render in),
 * and it runs `vite-plugin-dts` and terser. Only the parts a test run needs are repeated here; the
 * production `define` is overridden with the test environment React expects.
 */
export default defineConfig({
    define: {
        'process.env.NODE_ENV': JSON.stringify('test'),
    },
    plugins: [
        react({
            jsxRuntime: 'automatic',
        }),
    ],
    resolve: {
        tsconfigPaths: true,
        // One React. The renderer and every component must share a dispatcher; a second copy that
        // arrives through the dep optimizer surfaces as "Cannot read properties of null (reading
        // 'useState')" in whichever component loaded late (asma-ui-core hit this in ASMA-8139).
        dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
        // Pre-declared, not discovered lazily: a React-using dependency found only on a later scan
        // triggers a second optimize pass with a fresh `?v=` hash and a second React.
        include: [
            'react',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'react-dom',
            'react-dom/client',
            'asma-ui-core',
            ...Object.keys(packageJson.dependencies ?? {}),
        ],
    },
    test: {
        projects: [
            {
                extends: true,
                test: {
                    name: 'unit',
                    environment: 'node',
                    include: ['src/**/*.test.ts'],
                    // The contrast/target suite is real-browser only; it matches the include above
                    // and runs in the `interaction` project below.
                    exclude: ['src/**/*.interaction.test.ts', 'src/**/*.interaction.test.tsx'],
                },
            },
            {
                extends: true,
                test: {
                    name: 'interaction',
                    include: ['src/**/*.interaction.test.tsx'],
                    setupFiles: [resolve('src', 'test-utils', 'interaction.setup.ts')],
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright({}),
                        // The VRT viewport (1280x720), so both suites judge the same layout. The
                        // 390px mobile case is opt-in per test, via `page.viewport(390, 700)`.
                        viewport: { width: 1280, height: 720 },
                        // A failing assertion here is about computed colour or hit-testing, which a
                        // PNG cannot show; artefacts would also land next to the tests.
                        screenshotFailures: false,
                        instances: [
                            {
                                browser: 'chromium',
                            },
                        ],
                    },
                },
            },
        ],
    },
})
