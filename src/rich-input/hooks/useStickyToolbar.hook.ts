import type { Editor } from '@tiptap/react'
import { type RefObject, useEffect } from 'react'

const TOLERANCE = 1

/**
 * The scroll container `position: sticky` measures against: the nearest ancestor whose overflow is neither
 * `visible` nor `clip`. `null` means the page. `<body>` and `<html>` count as the page too: the body's
 * overflow moves to the viewport, so its computed value says nothing about the body itself.
 */
const findScrollContainer = (element: HTMLElement): HTMLElement | null => {
    for (let node = element.parentElement; node; node = node.parentElement) {
        if (node === document.body || node === document.documentElement) return null
        const { overflowX, overflowY } = getComputedStyle(node)
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
 *   padding, and the CSS moves the control onto the edge itself. Without a padded container it is 0px and
 *   nothing changes.
 * - `data-rte-toolbar-stuck` is set while the open toolbar is held away from its own place at the end of the
 *   field, so only the stuck toolbar gets a separating shadow. At rest the field looks as before.
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

        let container: HTMLElement | null = null
        let frame = 0

        const updateStuck = () => {
            frame = 0
            const toolbar = toolbarOpen ? wrapper.querySelector<HTMLElement>(':scope > .toolbar') : null
            if (!toolbar) {
                wrapper.removeAttribute('data-rte-toolbar-stuck')
                return
            }
            // At rest the toolbar is the wrapper's last child, so its bottom meets the wrapper's padding edge.
            const style = getComputedStyle(wrapper)
            const end =
                wrapper.getBoundingClientRect().bottom -
                (parseFloat(style.borderBottomWidth) || 0) -
                (parseFloat(style.paddingBottom) || 0)
            wrapper.toggleAttribute('data-rte-toolbar-stuck', end - toolbar.getBoundingClientRect().bottom > TOLERANCE)
        }
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(updateStuck)
        }
        // The field growing while typing only moves the toolbar; the container resizing can change its padding.
        const resize = new ResizeObserver((entries) => {
            if (entries.some((entry) => entry.target !== wrapper)) update()
            else schedule()
        })
        const scrollTarget = () => container ?? window

        // Finds the container again on every resize: a breakpoint can change which ancestor scrolls.
        const update = () => {
            const next = findScrollContainer(wrapper)
            if (next !== container) {
                if (toolbarOpen) scrollTarget().removeEventListener('scroll', schedule)
                if (container) resize.unobserve(container)
                container = next
                if (container) resize.observe(container)
                if (toolbarOpen) scrollTarget().addEventListener('scroll', schedule, { passive: true })
            }
            const padding = container ? parseFloat(getComputedStyle(container).paddingBottom) || 0 : 0
            wrapper.style.setProperty('--rte-sticky-offset', `${padding}px`)
            schedule()
        }

        update()
        resize.observe(wrapper)
        window.addEventListener('resize', update)
        return () => {
            cancelAnimationFrame(frame)
            resize.disconnect()
            window.removeEventListener('resize', update)
            if (toolbarOpen) scrollTarget().removeEventListener('scroll', schedule)
            wrapper.style.removeProperty('--rte-sticky-offset')
            wrapper.removeAttribute('data-rte-toolbar-stuck')
        }
    }, [editor, wrapperRef, enabled, toolbarOpen])
}
