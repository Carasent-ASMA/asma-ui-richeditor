/**
 * Setup for the `interaction` vitest project.
 *
 * The stylesheet is the subject of the suite, not decoration: every assertion is about a computed
 * colour or a rendered box, and without ui-core's shipped CSS, Tailwind and the toolbar/tiptap rules
 * the elements would report user-agent defaults and the tests would be measuring nothing.
 *
 * `data-theme` is what `.storybook/preview.ts` sets through `withThemeByDataAttribute`; the tests
 * switch it per theme, so pin the default here to keep an ordering-independent baseline.
 *
 * ASMA-8913: the toolbar's Iconify icons are registered from their real payloads instead of being
 * fetched from the Iconify API. Iconify paints an icon only after its async lookup resolves, so
 * without this the font-size control's width is 86.5px for the first ~600ms and 106.5px after — a
 * layout that depends on network timing, which is precisely the bug the caret fix measures. Only the
 * caret is layout-affecting (the other icon buttons are pinned at 40px by min/max-width); the rest
 * are registered so the toolbar, and any screenshot of it, is complete and reproducible offline.
 */
import { addIcon } from '@iconify/react'
import '../styles/index.scss'

addIcon('tabler:caret-up-down-filled', {
    width: 24,
    height: 24,
    body: '<path fill=\'currentColor\' d=\'M11.293 3.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 .073.082l.006.008l.016.022l.042.059l.009.015l.007.01l.014.027l.024.044l.007.017l.01.02l.012.032l.015.034l.007.025l.008.02l.005.026l.012.037l.004.028l.006.025l.003.026l.006.033l.002.03l.003.028v.026L19 10l-.002.033v.026l-.003.026l-.002.032l-.005.029l-.004.03l-.006.024l-.004.03l-.012.035l-.005.027l-.008.019l-.007.026l-.015.033l-.012.034l-.01.018l-.007.018l-.024.043l-.014.028l-.007.009l-.009.016l-.042.058l-.012.019l-.004.003l-.006.01a1 1 0 0 1-.155.154l-.009.006l-.022.016l-.058.042l-.016.009l-.009.007l-.028.014l-.043.024l-.018.007l-.018.01l-.034.012l-.033.015l-.024.006l-.021.009l-.027.005l-.036.012l-.029.004l-.024.006l-.028.003l-.031.006l-.032.002l-.026.003h-.026L18 11H6c-.89 0-1.337-1.077-.707-1.707zM18 13l.033.002h.026l.026.003l.032.002l.031.006l.028.003l.024.006l.03.004l.035.012l.027.005l.019.008l.026.007l.033.015l.034.012l.018.01l.018.007l.043.024l.028.014l.009.007l.016.009l.051.037l.026.017l.003.004l.01.006a1 1 0 0 1 .154.155l.006.009l.015.02l.043.06l.009.016l.007.009l.014.028l.024.043l.005.013l.012.023l.012.034l.015.033l.007.026l.008.02l.005.026l.012.036l.004.029l.006.024l.003.028l.006.031l.002.032l.003.026v.026L19 14l-.002.033v.026l-.003.026l-.002.032l-.006.031l-.003.028l-.006.024l-.004.03l-.012.035l-.005.027l-.008.019l-.007.026l-.015.033l-.012.034l-.01.018l-.007.018l-.024.043l-.014.028l-.007.009l-.009.016l-.042.058l-.012.019l-.004.003l-.006.01l-.073.081l-6 6a1 1 0 0 1-1.414 0l-6-6C4.663 14.077 5.109 13 6 13z\'/>',
})

addIcon('mdi:emoticon-outline', {
    width: 24,
    height: 24,
    body: '<path fill=\'currentColor\' d=\'M12 17.5c2.33 0 4.3-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5M8.5 11A1.5 1.5 0 0 0 10 9.5A1.5 1.5 0 0 0 8.5 8A1.5 1.5 0 0 0 7 9.5A1.5 1.5 0 0 0 8.5 11m7 0A1.5 1.5 0 0 0 17 9.5A1.5 1.5 0 0 0 15.5 8A1.5 1.5 0 0 0 14 9.5a1.5 1.5 0 0 0 1.5 1.5M12 20a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8m0-18C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2\'/>',
})

addIcon('mdi:format-list-bulleted', {
    width: 24,
    height: 24,
    body: '<path fill=\'currentColor\' d=\'M7 5h14v2H7zm0 8v-2h14v2zM4 4.5A1.5 1.5 0 0 1 5.5 6A1.5 1.5 0 0 1 4 7.5A1.5 1.5 0 0 1 2.5 6A1.5 1.5 0 0 1 4 4.5m0 6A1.5 1.5 0 0 1 5.5 12A1.5 1.5 0 0 1 4 13.5A1.5 1.5 0 0 1 2.5 12A1.5 1.5 0 0 1 4 10.5M7 19v-2h14v2zm-3-2.5A1.5 1.5 0 0 1 5.5 18A1.5 1.5 0 0 1 4 19.5A1.5 1.5 0 0 1 2.5 18A1.5 1.5 0 0 1 4 16.5\'/>',
})

addIcon('mdi:format-list-numbered', {
    width: 24,
    height: 24,
    body: '<path fill=\'currentColor\' d=\'M7 13v-2h14v2zm0 6v-2h14v2zM7 7V5h14v2zM3 8V5H2V4h2v4zm-1 9v-1h3v4H2v-1h2v-.5H3v-1h1V17zm2.25-7a.75.75 0 0 1 .75.75c0 .2-.08.39-.21.52L3.12 13H5v1H2v-.92L4 11H2v-1z\'/>',
})

addIcon('ooui:bold-b', {
    width: 20,
    height: 20,
    body: '<path fill=\'currentColor\' d=\'M11.257 1.007A5 5 0 0 1 16 6l-.007.257a4.97 4.97 0 0 1-1.119 2.9A5.49 5.49 0 0 1 17 13.5l-.007.283a5.5 5.5 0 0 1-5.21 5.21L11.5 19H3V1h8zM6 16h5.5a2.5 2.5 0 0 0 0-5H6zm0-8h5a2 2 0 1 0 0-4H6z\'/>',
})

addIcon('material-symbols:format-italic', {
    width: 24,
    height: 24,
    body: '<path fill=\'currentColor\' d=\'M5 19v-2.5h4l3-9H8V5h10v2.5h-3.5l-3 9H15V19z\'/>',
})

document.documentElement.setAttribute('data-theme', 'default')
