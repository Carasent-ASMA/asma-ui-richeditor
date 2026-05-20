import type { StorybookConfig } from '@storybook/react-vite'
import remarkGfm from 'remark-gfm'

const env = {
    STORYBOOK_PROXY_SECRET: process.env.STORYBOOK_PROXY_SECRET ?? '',
    STORYBOOK_PROXY_ENDPOINT: process.env.STORYBOOK_PROXY_ENDPOINT ?? '',
}

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        '@storybook/addon-a11y',
        '@storybook/addon-links',
        '@storybook/addon-themes',
        {
            name: '@storybook/addon-docs',
            options: {
                mdxPluginOptions: {
                    mdxCompileOptions: {
                        remarkPlugins: [remarkGfm],
                    },
                },
            },
        },
    ],
    framework: {
        name: '@storybook/react-vite',
        options: {
            builder: {
                viteConfigPath: './vite.config.ts',
            },
        },
    },
    docs: {
        autodocs: 'tag',
    },
    core: {},
    typescript: {
        check: true,
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
            shouldExtractLiteralValuesFromEnum: true,
            shouldRemoveUndefinedFromOptional: true,
            savePropValueAsString: true,
            propFilter: (prop) =>
                prop.parent
                    ? /@material-ui/.test(prop.parent.fileName) || !/node_modules/.test(prop.parent.fileName)
                    : true,
            compilerOptions: {
                allowSyntheticDefaultImports: false,
            },
        },
    },
    env,
}
export default config
