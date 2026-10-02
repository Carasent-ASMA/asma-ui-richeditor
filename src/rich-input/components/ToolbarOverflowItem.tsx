import { StyledTooltip } from 'asma-ui-core'
import type { ReactNode } from 'react'

/** One entry of the toolbar's overflow ("more") menu. */
export const ToolbarOverflowItem = ({
    title,
    id,
    selected,
    disabled,
    active,
    onSelect,
    children,
}: {
    title: string
    id: string
    selected?: boolean
    disabled?: boolean
    active?: boolean
    onSelect: () => void
    children: ReactNode
}) => (
    <StyledTooltip title={title} placement='top' arrow>
        <li
            id={id}
            role='option'
            aria-label={title}
            aria-selected={selected}
            aria-disabled={disabled ? true : undefined}
            onMouseDown={(event) => event.preventDefault()}
            onClick={disabled ? undefined : onSelect}
            className={[
                'relative flex min-h-10 items-center justify-center px-4 py-2 text-base outline-none',
                disabled ? 'cursor-not-allowed text-delta-300' : 'cursor-pointer text-delta-700 hover:bg-delta-50',
                selected ? 'bg-gama-50' : '',
            ].join(' ')}
        >
            {active && (
                <span
                    aria-hidden='true'
                    className='pointer-events-none absolute inset-y-0 left-0 border-l-[3px] border-l-solid border-gama-500'
                />
            )}
            {children}
        </li>
    </StyledTooltip>
)
