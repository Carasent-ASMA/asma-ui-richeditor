import { StyledMenuItem, StyledTooltip } from 'asma-ui-core'
import type { ReactNode } from 'react'

/** One entry of the toolbar's overflow ("more") menu. */
export const ToolbarOverflowItem = ({
    title,
    selected,
    disabled,
    onSelect,
    children,
}: {
    title: string
    selected?: boolean
    disabled?: boolean
    onSelect: () => void
    children: ReactNode
}) => (
    <StyledTooltip title={title} placement='top' arrow>
        <span>
            <StyledMenuItem
                className='flex items-center justify-center'
                disabled={disabled}
                selected={selected}
                onMouseDown={(e) => {
                    e.preventDefault()
                    onSelect()
                }}
            >
                {children}
            </StyledMenuItem>
        </span>
    </StyledTooltip>
)
