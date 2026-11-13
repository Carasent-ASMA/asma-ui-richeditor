/**
 * Setup for the `interaction` vitest project.
 *
 * The stylesheet is the subject of the suite, not decoration: every assertion is about a computed
 * colour or a rendered box, and without ui-core's shipped CSS, Tailwind and the toolbar/tiptap rules
 * the elements would report user-agent defaults and the tests would be measuring nothing.
 *
 * `data-theme` is what `.storybook/preview.ts` sets through `withThemeByDataAttribute`; the tests
 * switch it per theme, so pin the default here to keep an ordering-independent baseline.
 */
import '../styles/index.scss'

document.documentElement.setAttribute('data-theme', 'default')
