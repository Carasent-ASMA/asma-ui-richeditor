/**
 * WCAG 2.x relative luminance and contrast ratio, computed from the sRGB values a browser reports
 * in `getComputedStyle`. Kept dependency-free and separate from the tests so its own unit vectors
 * (`wcagContrast.test.ts`) can fail first when the maths is wrong — a wrong helper makes every
 * contrast assertion meaningless, in whichever direction it is wrong.
 *
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */

export interface Rgba {
    r: number
    g: number
    b: number
    a: number
}

export const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 }

const RGB_CHANNELS = /rgba?\(([^)]+)\)/

/** `rgb(98, 110, 126)` / `rgba(0, 0, 0, 0)` as numbers, or null for anything else (`color(...)`, `transparent`, ''). */
export const parseColor = (cssColor: string): Rgba | null => {
    const channels = RGB_CHANNELS.exec(cssColor)?.[1]
    if (!channels) return null

    const [r, g, b, a] = channels.split(',').map((channel) => Number.parseFloat(channel))
    if (r === undefined || g === undefined || b === undefined) return null

    return { r, g, b, a: a ?? 1 }
}

export const hexToRgba = (hex: string): Rgba => {
    const value = hex.replace('#', '')
    const full = value.length === 3 ? [...value].map((digit) => `${digit}${digit}`).join('') : value
    return {
        r: Number.parseInt(full.slice(0, 2), 16),
        g: Number.parseInt(full.slice(2, 4), 16),
        b: Number.parseInt(full.slice(4, 6), 16),
        a: 1,
    }
}

/** The sRGB → linear-light transfer function; 0.03928 is the threshold WCAG 2.x names. */
const linearize = (channel: number): number => {
    const scaled = channel / 255
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

export const relativeLuminance = ({ r, g, b }: Rgba): number =>
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)

/** Ratio between 1 (same colour) and 21 (black on white). Argument order does not matter. */
export const contrastRatio = (one: Rgba, other: Rgba): number => {
    const first = relativeLuminance(one)
    const second = relativeLuminance(other)
    const lighter = Math.max(first, second)
    const darker = Math.min(first, second)
    return (lighter + 0.05) / (darker + 0.05)
}
