import defaultTheme from 'tailwindcss/defaultTheme'
import twConfigs from 'asma-core-ui/tw-configs/twConfigs.json'

const boxShadow = twConfigs['boxShadow'],
    animation = twConfigs['animation'],
    keyframes = twConfigs['keyframes'],
    colors = twConfigs['colors']

export default {
    content: ['index.html', './src/**/*.{js,jsx,ts,tsx}'],
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
