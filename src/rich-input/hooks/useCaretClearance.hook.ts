import { useEffect, type RefObject } from 'react'
import type { Editor } from '@tiptap/react'

/** Clear of the capped field's 24px edge fade. */
const CAPPED_CLEARANCE = 32
const GAP = 8
/** ProseMirror's own scrollMargin. */
const DEFAULT_MARGIN = 5

/**
 * ProseMirror scrolls the caret only 5px clear of an edge. That puts the line being typed under the edge
 * fade of a capped field, and under the sticky toolbar of an uncapped one, so widen the margin while
 * `maxFieldHeight` is in use and restore the previous props when it is not.
 */
export const useCaretClearance = (
    editor: Editor | null,
    fieldCap: 'capped' | 'none' | undefined,
    toolbarOpen: boolean,
    wrapperRef: RefObject<HTMLDivElement | null>,
) => {
    // A passive effect on purpose: it runs after EditorContent has mounted the editor view and the toolbar.
    useEffect(() => {
        if (!editor || editor.isDestroyed || !fieldCap) return

        let top = DEFAULT_MARGIN
        let bottom = DEFAULT_MARGIN
        if (fieldCap === 'capped') {
            top = CAPPED_CLEARANCE
            bottom = CAPPED_CLEARANCE
        } else if (toolbarOpen) {
            const toolbar = wrapperRef.current?.querySelector<HTMLElement>(':scope > .toolbar')
            bottom = (toolbar?.offsetHeight ?? 48) + GAP
        } else {
            return
        }

        const { scrollMargin, scrollThreshold } = editor.view.props
        const margin = { top, bottom, left: DEFAULT_MARGIN, right: DEFAULT_MARGIN }
        editor.view.setProps({ scrollMargin: margin, scrollThreshold: margin })
        return () => {
            if (!editor.isDestroyed) editor.view.setProps({ scrollMargin, scrollThreshold })
        }
    }, [editor, fieldCap, toolbarOpen, wrapperRef])
}
