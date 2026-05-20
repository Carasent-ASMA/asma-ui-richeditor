import type { Preview } from '@storybook/react-vite'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import '../src/styles/index.scss'

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            expanded: true,
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
    decorators: [
        withThemeByDataAttribute({
            themes: {
                default: 'default',
                fretex: 'fretex',
                greenish: 'greenish',
            },
            defaultTheme: 'greenish',
            attributeName: 'data-theme',
        }),
    ],
}

export default preview
