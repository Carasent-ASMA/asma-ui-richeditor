import { defineConfig, esmExternalRequirePlugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import terser from '@rollup/plugin-terser'
import * as packageJson from './package.json'

const externalPackages = [...Object.keys(packageJson.peerDependencies), ...Object.keys(packageJson.devDependencies)]

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
        },
        rolldownOptions: {
            external: (id) => externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`)),
            plugins: [
                esmExternalRequirePlugin({
                    external: [
                        'react',
                        'react-dom',
                        'react/jsx-runtime',
                        'asma-ui-core',
                        '@emotion/react',
                        '@emotion/styled',
                        '@mui/material',
                        /^node:/,
                    ],
                }),
                terser(),
            ],
        },
    },
})
