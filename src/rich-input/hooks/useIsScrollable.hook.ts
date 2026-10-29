import { useCallback, useRef, useState } from 'react'

/**
 * Whether an element's content overflows it, so a capped reply header or chip list can become a
 * keyboard-reachable scroll region only while it actually scrolls (axe `scrollable-region-focusable`).
 * Returns a ref callback: React calls it with each new element, with null when it goes, and again when
 * `enabled` changes, so a replaced element is always observed. Watches the element, its children (content
 * growing inside a capped box does not resize the box) and added or removed children. While disabled it
 * sets no state, so callers without a cap never render again because of it.
 */
export const useIsScrollable = (enabled: boolean): [(element: HTMLElement | null) => void, boolean] => {
    const [scrollable, setScrollable] = useState(false)
    const disconnect = useRef<(() => void) | null>(null)

    const ref = useCallback(
        (element: HTMLElement | null) => {
            if (disconnect.current) {
                disconnect.current()
                disconnect.current = null
                setScrollable(false)
            }
            if (!enabled || !element) return

            const update = () => setScrollable(element.scrollHeight - element.clientHeight > 1)
            const resize = new ResizeObserver(update)
            const observeAll = () => {
                resize.disconnect()
                resize.observe(element)
                for (const child of Array.from(element.children)) resize.observe(child)
            }
            const mutation = new MutationObserver(() => {
                observeAll()
                update()
            })

            observeAll()
            update()
            mutation.observe(element, { childList: true })
            disconnect.current = () => {
                resize.disconnect()
                mutation.disconnect()
            }
        },
        [enabled],
    )

    return [ref, scrollable]
}
