import type { RichInputMaxHeight, RichInputResponsiveMaxHeight } from '../interfaces/types'

const NONE = 'none'

const warned = new Set<string>()
const warnOnce = (message: string) => {
    if (warned.has(message)) return
    warned.add(message)
    console.warn(message)
}

/** jsdom and old browsers have no CSS.supports; accept the value there rather than reject it. */
const isValidCss = (css: string): boolean =>
    typeof CSS === 'undefined' || typeof CSS.supports !== 'function' || CSS.supports('max-height', css)

/**
 * `maxScrollableHeight` → the value written to `--max-scrollable-height` (text area only).
 * Keeps the exact legacy output, `100px` for omitted / 0 / NaN; only `Infinity` changes, from the
 * invalid `Infinitypx` (which computed to `none`) to an explicit `none`.
 */
export function resolveTextMaxHeight(value?: number): string {
    return value === Infinity ? NONE : `${value || 100}px`
}

/**
 * `maxFieldHeight` → the whole-field cap for the current breakpoint: a CSS length, `'none'`, or
 * `undefined` when the prop is unset or invalid (the field then behaves as before). In a responsive
 * object a missing `tablet` inherits `mobile`, and a missing `mobile` means no cap on mobile.
 */
export function resolveFieldMaxHeight(
    value: RichInputMaxHeight | RichInputResponsiveMaxHeight | undefined,
    isTablet: boolean,
): string | undefined {
    const picked =
        typeof value === 'object' && value !== null
            ? (isTablet ? value.tablet ?? value.mobile : value.mobile) ?? NONE
            : value

    if (typeof picked === 'number') {
        if (picked === Infinity) return NONE
        return Number.isFinite(picked) && picked > 0 ? `${picked}px` : undefined
    }
    if (typeof picked !== 'string') return undefined

    const css = picked.trim()
    if (css === '') return undefined
    if (css.toLowerCase() === NONE) return NONE
    // Like the number 0, a plain zero or negative length ('0px', '-10px') switches the cap off rather than
    // hiding the field. Expressions such as calc() and var() are the caller's responsibility.
    const isNotPositive = /^[-+]?[\d.]/.test(css) && !(parseFloat(css) > 0)
    // Validated the way it is used: as an operand of min() next to the viewport height.
    if (isNotPositive || !isValidCss(`min(${css}, 100vh)`)) {
        warnOnce(
            `RichInput: ignoring invalid maxFieldHeight "${picked}". Use a pixel number, 'none' or a CSS length such as 'min(400px, 40dvh)'.`,
        )
        return undefined
    }
    return css
}
