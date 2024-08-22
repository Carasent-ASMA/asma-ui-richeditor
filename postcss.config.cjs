/* eslint-disable no-undef */
module.exports = (context) => ({
    plugins: {
        'postcss-import': {},
        'tailwindcss/nesting': {},
        tailwindcss: {},
        autoprefixer: context.env === 'production' ? {} : false,
    },
})
