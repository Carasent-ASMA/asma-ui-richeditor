import type { MenuItemProps } from '@mui/material'
import { StyledMenuItem } from 'asma-core-ui'
import React from 'react'

export const CustomMenuItem = (props: MenuItemProps) => {
    return (
        <StyledMenuItem
            {...props}
            sx={{
                '&.MuiMenuItem-root': {
                    color: 'var(--colors-delta-700)',
                    fontSize: '14px',
                    lineHeight: '20px',
                },
            }}
        >
            {props.children}
        </StyledMenuItem>
    )
}
