import { describe, expect, it } from 'vitest'
import { getOverflowMenuBreakpoint, getVisibleButtonCount } from './toolbar.helpers'

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
