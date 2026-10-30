import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'

export interface OverflowCueState {
    overflowing: boolean
    canScrollUp: boolean
    canScrollDown: boolean
}

const OFF: OverflowCueState = { overflowing: false, canScrollUp: false, canScrollDown: false }
const TOLERANCE = 1

/**
 * Tracks whether the capped field's scroller has hidden content, and on which side, so the field can
 * show a visible scrollbar and an edge fade only while content is actually capped.
 * `editor.view.dom` is `.tiptap`; EditorContent mounts it directly inside its `.core-ui-rte` div,
 * which is the scroller in the capped mode.
 */
export const useOverflowCue = (editor: Editor | null, enabled: boolean): OverflowCueState => {
    const [state, setState] = useState<OverflowCueState>(OFF)

    // A passive effect on purpose: it runs after EditorContent has mounted the editor view.
    useEffect(() => {
        if (!editor || !enabled) {
            setState(OFF)
            return
        }
        const content = editor.view.dom as HTMLElement
        const scroller = content.parentElement
        if (!scroller) return

        const update = () => {
            const { scrollTop, scrollHeight, clientHeight } = scroller
            const overflowing = scrollHeight - clientHeight > TOLERANCE
            const canScrollUp = overflowing && scrollTop > TOLERANCE
            const canScrollDown = overflowing && scrollTop + clientHeight < scrollHeight - TOLERANCE
            setState((prev) =>
                prev.overflowing === overflowing &&
                prev.canScrollUp === canScrollUp &&
                prev.canScrollDown === canScrollDown
                    ? prev
                    : { overflowing, canScrollUp, canScrollDown },
            )
        }

        update()
        scroller.addEventListener('scroll', update, { passive: true })
        // The scroller keeps its size once capped, so observe the content as well: it grows freely.
        const observer = new ResizeObserver(update)
        observer.observe(scroller)
        observer.observe(content)

        return () => {
            scroller.removeEventListener('scroll', update)
            observer.disconnect()
        }
    }, [editor, enabled])

    return state
}
