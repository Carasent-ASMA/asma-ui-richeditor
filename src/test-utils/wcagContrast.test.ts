import { describe, expect, it } from 'vitest'
import { contrastRatio, hexToRgba, WHITE } from './wcagContrast'

/**
 * Unit vectors for the contrast helper, taken from ASMA-8913's design measurement on white:
 * `#7a899e` is delta-500 (3.56:1, fails 1.4.3) and `#626e7e` is delta-600 (5.18:1, passes).
 * If these two stop landing on the right side of 4.5:1, the interaction suite's contrast
 * assertions are reporting the helper's opinion rather than the rendered colour.
 */
describe('wcagContrast', () => {
    it('measures the ticket’s two grey ramps where WCAG puts them', () => {
        const failing = contrastRatio(hexToRgba('#7a899e'), WHITE)
        const passing = contrastRatio(hexToRgba('#626e7e'), WHITE)

        expect(failing).toBeCloseTo(3.56, 2)
        expect(passing).toBeCloseTo(5.18, 2)
        expect(failing).toBeLessThan(4.5)
        expect(passing).toBeGreaterThanOrEqual(4.5)
    })

    it('is symmetric and bounded', () => {
        expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1)
        expect(contrastRatio(hexToRgba('#000000'), WHITE)).toBeCloseTo(21)
        expect(contrastRatio(hexToRgba('#626e7e'), WHITE)).toBeCloseTo(contrastRatio(WHITE, hexToRgba('#626e7e')))
    })
})
