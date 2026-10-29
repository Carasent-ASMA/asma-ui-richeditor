import { useEffect, useState, type RefObject } from 'react'

/**
 * Whether the element's content overflows it, so a capped reply header or chip list can become a
 * keyboard-reachable scroll region only while it actually scrolls (axe `scrollable-region-focusable`).
 * Watches the element, its children (content growing inside a capped box does not resize the box) and
 * added or removed children.
 */
export const useIsScrollable = (ref: RefObject<HTMLElement | null>, enabled: boolean): boolean => {
    const [scrollable, setScrollable] = useState(false)

    useEffect(() => {
        const element = ref.current
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
    }, [ref, enabled])

    return scrollable
}
