import defaultTheme from 'tailwindcss/defaultTheme'
import twConfigs from 'asma-ui-core/tw-configs/twConfigs.json'

const boxShadow = twConfigs['boxShadow'],
    animation = twConfigs['animation'],
    keyframes = twConfigs['keyframes'],
    colors = twConfigs['colors']

export default {
    content: [
        'index.html',
        './src/**/*.{js,jsx,ts,tsx}',
        // ASMA-8913: tests and test utilities contain prose and fixture strings whose words are valid
        // Tailwind candidates — the comment "cannot be fixed" emitted a `.fixed` utility and
        // "collapse" a `.collapse`, replacing the design system's `!important` copies in the shipped
        // stylesheet. They contribute no markup, so keep them out of the scan.
        '!./src/**/*.test.{ts,tsx}',
        '!./src/test-utils/**',
    ],
    theme: {
        fontFamily: {
            roboto: ['Roboto'],
        },
        extend: {
            screens: {
                ...defaultTheme.screens,
            },
            boxShadow,
            animation,
            keyframes,
            colors,
        },
    },
    plugins: [require('tailwind-scrollbar')],
}
