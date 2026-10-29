import { useEffect, useState } from 'react'

/**
 * Whether an element's content overflows it, so a capped reply header or chip list can become a
 * keyboard-reachable scroll region only while it actually scrolls (axe `scrollable-region-focusable`).
 * Returns a ref callback for the element, so a replaced element is picked up. Watches the element, its
 * children (content growing inside a capped box does not resize the box) and added or removed children.
 */
export const useIsScrollable = (enabled: boolean): [(element: HTMLElement | null) => void, boolean] => {
    const [element, setElement] = useState<HTMLElement | null>(null)
    const [scrollable, setScrollable] = useState(false)

    useEffect(() => {
        if (!enabled || !element) {
            setScrollable(false)
            return
        }

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
        return () => {
            resize.disconnect()
            mutation.disconnect()
        }
    }, [element, enabled])

    return [setElement, scrollable]
}
