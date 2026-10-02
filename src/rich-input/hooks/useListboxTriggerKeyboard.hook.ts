import { useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'

interface UseListboxTriggerKeyboardOptions {
    /** Whether the popup listbox is currently open. */
    isOpen: boolean
    /** Number of options in the listbox. */
    itemCount: number
    /** Active index to start from when the listbox opens (e.g. the selected option). */
    getInitialActiveIndex: () => number
    /** Open the listbox anchored to the given trigger element. */
    onOpen: (element: HTMLElement) => void
    /** Close the listbox. */
    onClose: () => void
    /** Activate the option at `index`; `close` says whether the listbox should close afterwards. */
    onSelect: (index: number, options: { close: boolean }) => void
    /**
     * When opening with ArrowUp/Down, also move the active option by the arrow direction (default `true`).
     * Set `false` for action menus that should always open on the first option regardless of arrow key.
     */
    moveActiveIndexOnOpen?: boolean
}

/**
 * Keyboard contract for a button that opens a single-select listbox popup (WAI-ARIA combobox + listbox):
 * ArrowUp/Down open+move, Home/End jump, Enter selects & closes, Space selects & keeps open (refocusing
 * the trigger), Escape/Tab close. Tracks the roving `activeIndex` exposed via `aria-activedescendant`, and
 * `keyboardActive` so the active-option highlight only shows during keyboard use.
 *
 * Shared by the rich-text toolbar's font-size select and overflow ("more") menu so both behave identically.
 */
export const useListboxTriggerKeyboard = ({
    isOpen,
    itemCount,
    getInitialActiveIndex,
    onOpen,
    onClose,
    onSelect,
    moveActiveIndexOnOpen = true,
}: UseListboxTriggerKeyboardOptions) => {
    const [activeIndex, setActiveIndex] = useState(0)
    const [keyboardActive, setKeyboardActive] = useState(false)

    const clamp = (index: number) => Math.min(Math.max(index, 0), Math.max(itemCount - 1, 0))

    /** Open from a pointer click: no active-option highlight, start on the initial option. */
    const openFromPointer = (element: HTMLElement) => {
        setKeyboardActive(false)
        setActiveIndex(clamp(getInitialActiveIndex()))
        onOpen(element)
    }

    const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
        const trigger = event.currentTarget

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            const direction = event.key === 'ArrowDown' ? 1 : -1

            if (!isOpen) {
                setKeyboardActive(true)
                setActiveIndex(clamp(getInitialActiveIndex() + (moveActiveIndexOnOpen ? direction : 0)))
                onOpen(trigger)
                return
            }

            setKeyboardActive(true)
            setActiveIndex((index) => clamp(index + direction))
            return
        }

        if (!isOpen) return

        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault()
            setKeyboardActive(true)
            setActiveIndex(event.key === 'Home' ? 0 : clamp(itemCount - 1))
        } else if (event.key === ' ') {
            event.preventDefault()
            onSelect(activeIndex, { close: false })
            requestAnimationFrame(() => trigger.focus())
        } else if (event.key === 'Enter') {
            event.preventDefault()
            onSelect(activeIndex, { close: true })
        } else if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
        } else if (event.key === 'Tab') {
            onClose()
        }
    }

    return { activeIndex, keyboardActive, openFromPointer, handleKeyDown }
}
