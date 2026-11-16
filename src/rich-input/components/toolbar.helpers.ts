/**
 * The toolbar collapses its buttons into an overflow menu as it narrows. Norwegian labels are
 * slightly shorter than the English ones, so each breakpoint has its own per-locale width.
 */
const BUTTON_WIDTH_BREAKPOINTS: Array<{ no: number; en: number; buttons: number }> = [
    { no: 334, en: 340, buttons: 3 },
    { no: 380, en: 383, buttons: 4 },
    { no: 424, en: 430, buttons: 5 },
    { no: 469, en: 475, buttons: 6 },
    { no: 514, en: 520, buttons: 7 },
    { no: Infinity, en: Infinity, buttons: 9 },
]

/** Below this width the overflow ("more") menu is shown at all. */
export const getOverflowMenuBreakpoint = (isNorsk: boolean): number => (isNorsk ? 514 : 520)

/**
 * ASMA-8913: the font-size control's caret. The breakpoint list above was measured for an 86.5px
 * control; the 20px Iconify caret makes it 106.5px, which is what clipped Close at 390px.
 */
export const FONT_SIZE_CARET_WIDTH = 20

/**
 * Below the overflow breakpoint plus the caret's width, the caret is rendered out of flow so it adds
 * no width. That covers the nine-button range just above the breakpoint too: at 534px (no) the
 * 106.5px control just fits the row, and one pixel narrower it no longer does — which is why compact
 * starts exactly there.
 */
export const getCompactFontSizeBreakpoint = (isNorsk: boolean): number =>
    getOverflowMenuBreakpoint(isNorsk) + FONT_SIZE_CARET_WIDTH

export const isCompactFontSize = (toolbarWidth: number, isNorsk: boolean): boolean =>
    toolbarWidth > 0 && toolbarWidth < getCompactFontSizeBreakpoint(isNorsk)

/** How many of the nine toolbar buttons fit at the given width. */
export const getVisibleButtonCount = (width: number, isNorsk: boolean): number => {
    const breakpoint = BUTTON_WIDTH_BREAKPOINTS.find(
        (candidate) => width < (isNorsk ? candidate.no : candidate.en),
    )

    // The final bucket is Infinity, so a match is always found.
    return breakpoint?.buttons ?? 9
}
