import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import type { ReactElement } from 'react'

/**
 * Minimal mount/unmount harness for the `interaction` project, modelled on asma-ui-core's
 * `src/test-utils/renderInteraction.tsx` (ASMA-8139). Hand-rolled rather than a new
 * `@testing-library/react` dependency: these tests need a live document, real hit-testing and real
 * computed styles, not queries and matchers.
 *
 * `document.body` and not a detached node: `elementFromPoint`, layout and computed styles all
 * resolve against the live document.
 */

interface MountResult {
    container: HTMLElement
    unmount: () => void
}

const mounted = new Set<{ root: Root; container: HTMLElement }>()

/**
 * React 18 only honours `act()` while `IS_REACT_ACT_ENVIRONMENT` is set, but leaving it on for the
 * whole test makes React warn about every browser-dispatched event. Scope it to the render calls
 * that genuinely need a synchronous flush.
 */
const actEnvironment = <T,>(body: () => T): T => {
    const global = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    const previous = global.IS_REACT_ACT_ENVIRONMENT
    global.IS_REACT_ACT_ENVIRONMENT = true
    try {
        return body()
    } finally {
        global.IS_REACT_ACT_ENVIRONMENT = previous
    }
}

export const mount = (ui: ReactElement): MountResult => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const entry = { root, container }
    mounted.add(entry)

    actEnvironment(() =>
        act(() => {
            root.render(ui)
        }),
    )

    return {
        container,
        unmount: () => {
            actEnvironment(() =>
                act(() => {
                    root.unmount()
                }),
            )
            container.remove()
            mounted.delete(entry)
        },
    }
}

/** Unmounts everything `mount` created. Call from `afterEach`. */
export const cleanup = (): void => {
    for (const entry of mounted) {
        actEnvironment(() =>
            act(() => {
                entry.root.unmount()
            }),
        )
        entry.container.remove()
    }
    mounted.clear()
    // Portalled overlays (tooltips, popovers, dialogs) attach outside the container; a leaked open
    // surface would cover the next test's fixture.
    document.querySelectorAll('dialog[open]').forEach((node) => (node as HTMLDialogElement).close())
}
