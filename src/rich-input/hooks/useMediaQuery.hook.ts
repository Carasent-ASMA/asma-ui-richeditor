import { useCallback, useSyncExternalStore } from 'react'

const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

/**
 * Subscribes to a CSS media query. Pass a query from `mediaQueries` in asma-types so the breakpoint
 * stays in one place. `fallback` is the value without `matchMedia` (jsdom, server rendering).
 */
export const useMediaQuery = (query: string, fallback = false): boolean => {
    const subscribe = useCallback(
        (onChange: () => void) => {
            if (!hasMatchMedia()) return () => undefined
            const mql = window.matchMedia(query)
            mql.addEventListener('change', onChange)
            return () => mql.removeEventListener('change', onChange)
        },
        [query],
    )
    const getSnapshot = () => (hasMatchMedia() ? window.matchMedia(query).matches : fallback)

    return useSyncExternalStore(subscribe, getSnapshot, () => fallback)
}
