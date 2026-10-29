import { defineConfig, esmExternalRequirePlugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import terser from '@rollup/plugin-terser'

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
    plugins: [
        react({
            jsxRuntime: 'automatic',
        }),
        dts({
            insertTypesEntry: true,
            exclude: ['node_modules/**/*', 'src/stories/**', 'src/**/*.stories.tsx', 'src/components/**/makeData.ts'],
        }),
    ],
    resolve: {
        tsconfigPaths: true,
    },
    build: {
        lib: {
            entry: resolve('src', 'index.ts'),
            name: 'asma-ui-richeditor',
            formats: ['es'],
            fileName: (format) => `asma-ui-richeditor.${format}.js`,
            cssFileName: 'style',
        },
        rolldownOptions: {
            // asma-types is bundled in (it is no kernel lib) but declares no `sideEffects`, so its compiled
            // enums would ride along with the breakpoints RichInput uses. Every other module keeps the default.
            treeshake: {
                moduleSideEffects: (id) => (/[\\/]node_modules[\\/].*asma-types[\\/]/.test(id) ? false : undefined),
            },
            plugins: [
                esmExternalRequirePlugin({
                    external: [
                        'react',
                        'react-dom',
                        'react/jsx-runtime',
                        'asma-ui-core',
                        '@emotion/react',
                        '@emotion/styled',
                        /^node:/,
                    ],
                }),
                terser(),
            ],
        },
    },
})
