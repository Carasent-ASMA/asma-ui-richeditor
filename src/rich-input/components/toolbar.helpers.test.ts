import { describe, expect, it } from 'vitest'
import {
    FONT_SIZE_CARET_WIDTH,
    getCompactFontSizeBreakpoint,
    getOverflowMenuBreakpoint,
    getVisibleButtonCount,
    isCompactFontSize,
    TOOLBAR_WIDTH_SLACK,
} from './toolbar.helpers'

/**
 * T3, ASMA-8913 — a behaviour pin for the toolbar overflow maths.
 *
 * The ticket changes how the toolbar's buttons accept a press, not how many of them fit, but the
 * two are adjacent enough that a well-meant "make room for the bigger targets" edit is a plausible
 * mistake: the drawn boxes stay 40px and the visible count must not move with them. Every boundary
 * is pinned on both sides, because the comparison is strict (`width < breakpoint`) and an off-by-one
 * there silently hides a control in the overflow menu.
 */
interface Breakpoint {
    width: number
    buttons: number
}

const norwegian: Breakpoint[] = [
    { width: 0, buttons: 3 },
    { width: 333, buttons: 3 },
    { width: 334, buttons: 4 },
    { width: 379, buttons: 4 },
    { width: 380, buttons: 5 },
    { width: 423, buttons: 5 },
    { width: 424, buttons: 6 },
    { width: 468, buttons: 6 },
    { width: 469, buttons: 7 },
    { width: 513, buttons: 7 },
    { width: 514, buttons: 9 },
    { width: 1280, buttons: 9 },
]

const english: Breakpoint[] = [
    { width: 0, buttons: 3 },
    { width: 339, buttons: 3 },
    { width: 340, buttons: 4 },
    { width: 382, buttons: 4 },
    { width: 383, buttons: 5 },
    { width: 429, buttons: 5 },
    { width: 430, buttons: 6 },
    { width: 474, buttons: 6 },
    { width: 475, buttons: 7 },
    { width: 519, buttons: 7 },
    { width: 520, buttons: 9 },
    { width: 1280, buttons: 9 },
]

describe('getVisibleButtonCount', () => {
    it.each(norwegian)('shows $buttons buttons at $width px in Norwegian', ({ width, buttons }) => {
        expect(getVisibleButtonCount(width, true)).toBe(buttons)
    })

    it.each(english)('shows $buttons buttons at $width px in English', ({ width, buttons }) => {
        expect(getVisibleButtonCount(width, false)).toBe(buttons)
    })
})

describe('getOverflowMenuBreakpoint', () => {
    it('is the width at which the ninth button appears', () => {
        expect(getOverflowMenuBreakpoint(true)).toBe(514)
        expect(getOverflowMenuBreakpoint(false)).toBe(520)

        for (const isNorsk of [true, false]) {
            const breakpoint = getOverflowMenuBreakpoint(isNorsk)
            expect(getVisibleButtonCount(breakpoint - 1, isNorsk), 'just below the breakpoint').toBe(7)
            expect(getVisibleButtonCount(breakpoint, isNorsk), 'at the breakpoint').toBe(9)
        }
    })
})

/**
 * ASMA-8913 — where the caret stops taking part in the row's width, and the slack that keeps the
 * designed 4px gap before Close at every width. The slack shifts both the visible-button breakpoints
 * and this threshold by 11px from the caller's side; the cost is documented and pinned here.
 */
describe('compact font-size threshold', () => {
    it('is the overflow breakpoint plus the caret width', () => {
        expect(getCompactFontSizeBreakpoint(true)).toBe(534)
        expect(getCompactFontSizeBreakpoint(false)).toBe(540)
        expect(getOverflowMenuBreakpoint(true) + FONT_SIZE_CARET_WIDTH).toBe(534)
    })

    it('switches exactly one pixel below it, and only once measured', () => {
        for (const isNorsk of [true, false]) {
            const threshold = getCompactFontSizeBreakpoint(isNorsk)
            expect(isCompactFontSize(threshold - 1, isNorsk), 'just below the threshold').toBe(true)
            expect(isCompactFontSize(threshold, isNorsk), 'at the threshold').toBe(false)
            // Before the first ResizeObserver callback the width is 0; the wide layout is what the
            // first paint must assume, and the layout effect corrects it before paint anyway.
            expect(isCompactFontSize(0, isNorsk), 'unmeasured').toBe(false)
        }
    })

    it('reserves 13px of slack, which is what restores the 4px gap', () => {
        expect(TOOLBAR_WIDTH_SLACK).toBe(13)
        // The caller subtracts the slack before asking, so the real thresholds are 547/553 and the
        // first visible-button bucket moves 13px earlier (334 → 347 measured).
        expect(getCompactFontSizeBreakpoint(true) + TOOLBAR_WIDTH_SLACK).toBe(547)
        expect(getCompactFontSizeBreakpoint(false) + TOOLBAR_WIDTH_SLACK).toBe(553)
        expect(getVisibleButtonCount(334, true), 'nominal').toBe(4)
        expect(getVisibleButtonCount(334 - TOOLBAR_WIDTH_SLACK, true), 'slack-adjusted').toBe(3)
    })
})
