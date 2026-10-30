import type { Editor } from '@tiptap/react'
import { type RefObject, useEffect } from 'react'

const TOLERANCE = 1

/**
 * The scroll container `position: sticky` measures against: the nearest ancestor whose overflow is neither
 * `visible` nor `clip`. `null` means the page. `<body>` and `<html>` count as the page too: the body's
 * overflow moves to the viewport, so its computed value says nothing about the body itself. `contents` and
 * inline boxes are skipped, since they cannot scroll whatever their computed overflow says.
 */
const findScrollContainer = (element: HTMLElement): HTMLElement | null => {
    for (let node = element.parentElement; node; node = node.parentElement) {
        if (node === document.body || node === document.documentElement) return null
        const { display, overflowX, overflowY } = getComputedStyle(node)
        if (display === 'contents' || display === 'inline') continue
        if (![overflowX, overflowY].every((value) => value === 'visible' || value === 'clip')) return node
    }
    return null
}

/**
 * Keeps the sticky toolbar of an uncapped field (`maxFieldHeight='none'`), or with it closed the format
 * button, flush with the bottom edge of its scroll container, and marks the field while the toolbar is stuck.
 *
 * - Sticky stops at the scroll container's padding edge, so a padded container (dialog bodies, pages) left a
 *   strip of the field's text visible below the stuck control. `--rte-sticky-offset` carries that bottom
 *   padding, and the CSS moves the control onto the edge itself. Without padding the variable is not set and
 *   nothing changes.
 * - `data-rte-toolbar-stuck` is set while the open toolbar is held above its own place in the flow (right
 *   below the element before it), so only the stuck toolbar gets a separating shadow. At rest the field looks
 *   as before, also when a stretched wrapper leaves room below the toolbar.
 *
 * Both go straight onto the wrapper, so scrolling never renders the field. Uncapped fields only: everything
 * else never runs this.
 */
export const useStickyToolbar = (
    editor: Editor | null,
    wrapperRef: RefObject<HTMLDivElement | null>,
    enabled: boolean,
    toolbarOpen: boolean,
) => {
    // A passive effect on purpose: it runs after EditorContent has mounted the editor view and the toolbar.
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!editor || editor.isDestroyed || !enabled || !wrapper) return

        // `undefined` until the first lookup, so a field on the page (`null`) still gets its listener.
        let container: HTMLElement | null | undefined
        let scrollTarget: HTMLElement | Window | null = null
        let frame = 0

        const updateStuck = () => {
            frame = 0
            const toolbar = toolbarOpen ? wrapper.querySelector<HTMLElement>(':scope > .toolbar') : null
            const before = toolbar?.previousElementSibling
            const stuck =
                !!toolbar &&
                !!before &&
                before.getBoundingClientRect().bottom - toolbar.getBoundingClientRect().top > TOLERANCE
            wrapper.toggleAttribute('data-rte-toolbar-stuck', stuck)
        }
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(updateStuck)
        }
        // The field growing while typing only moves the toolbar; the container resizing can change its padding.
        const resize = new ResizeObserver((entries) => {
            if (entries.some((entry) => entry.target !== wrapper)) update()
            else schedule()
        })

        // Finds the container again on every resize: a breakpoint can change which ancestor scrolls.
        const update = () => {
            const next = findScrollContainer(wrapper)
            if (next !== container) {
                if (container) resize.unobserve(container)
                container = next
                if (container) resize.observe(container)
                scrollTarget?.removeEventListener('scroll', schedule)
                scrollTarget = toolbarOpen ? (container ?? window) : null
                scrollTarget?.addEventListener('scroll', schedule, { passive: true })
            }
            const padding = container ? parseFloat(getComputedStyle(container).paddingBottom) || 0 : 0
            if (padding) wrapper.style.setProperty('--rte-sticky-offset', `${padding}px`)
            else wrapper.style.removeProperty('--rte-sticky-offset')
            schedule()
        }

        update()
        resize.observe(wrapper)
        window.addEventListener('resize', update)
        return () => {
            cancelAnimationFrame(frame)
            resize.disconnect()
            window.removeEventListener('resize', update)
            scrollTarget?.removeEventListener('scroll', schedule)
            wrapper.style.removeProperty('--rte-sticky-offset')
            wrapper.removeAttribute('data-rte-toolbar-stuck')
        }
    }, [editor, wrapperRef, enabled, toolbarOpen])
}
