/**
 * Minimal `react-dom` declarations for the interaction harness.
 *
 * `react-dom@18.2.0` ships no types and this package does not depend on `@types/react-dom` — nothing
 * in the library imports react-dom (it is a peer of the consuming app), so adding a devDependency
 * for one test helper would widen the install for every consumer. Declare exactly the two calls the
 * harness makes instead.
 */
declare module 'react-dom/client' {
    import type { ReactNode } from 'react'

    export interface Root {
        render(children: ReactNode): void
        unmount(): void
    }

    export function createRoot(container: Element | DocumentFragment): Root
}

declare module 'react-dom/test-utils' {
    /**
     * Flushes the work a render schedules and the updates it causes. React 18.2 exports it here;
     * `React.act` only exists from 18.3, and this package pins 18.2.
     */
    export function act(callback: () => void | Promise<void>): Promise<void>
}
