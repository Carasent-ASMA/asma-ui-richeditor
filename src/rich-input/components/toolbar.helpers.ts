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
 * ASMA-8913 round 2: the row exact-fits at every overflow breakpoint, so `space-between` leaves 0px
 * before Close and the control before it loses the right edge of its 44px target. Reserving slack in
 * the width the breakpoints see moves the control one bucket earlier and restores the designed 4px
 * gap. Measured on the 300-620px sweep (1px steps, both locales, fresh mount and resize): 11px left
 * four failing widths (345 no, plus 351, 394 and 395 en), 12px left one (395 en, 3.80px), and 13px
 * passes 0/321 four times over. 13px is the measured minimum. The cost is that the toolbar collapses
 * 13px sooner than the nominal breakpoints — at 390 both locales show one formatting button moving
 * into the overflow menu.
 */
export const TOOLBAR_WIDTH_SLACK = 13

/**
 * Below the overflow breakpoint plus the caret's width, the caret is rendered out of flow so it adds
 * no width. The width passed here is the slack-adjusted toolbar width (see TOOLBAR_WIDTH_SLACK).
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
