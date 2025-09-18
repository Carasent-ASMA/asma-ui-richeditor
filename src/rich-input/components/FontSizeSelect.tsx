import { Icon } from '@iconify/react'
import { StyledButton, StyledPopover, StyledTooltip, type TextFieldProps } from 'asma-core-ui'
import React, { useLayoutEffect, useState } from 'react'

import '../styles/toolbar.css'
import type { Editor } from '@tiptap/core'
import { useToggleMenuVisibility } from '../hooks/useToggleMenuVisibility.hook'
import { CustomMenuItem } from './CustomMenuItem'
import { useTranslations } from './useTranslations'
import type { ILocale } from '../interfaces/types'

const fontSizeMap: { [key: string]: string } = {
    small: '10px',
    normal: '16px',
    large: '24px',
    huge: '32px',
}

export const FontSizeSelect = (props: TextFieldProps & { editor: Editor; isNorsk: boolean; locale?: ILocale }) => {
    const { editor, isNorsk, locale } = props
    const [selectedSize, setSelectedSize] = useState<string>('normal')

    const handleFontSizeChange = (size: string) => {
        editor.chain().focus().setMark('textStyle', { fontSize: fontSizeMap[size] }).run()
        setSelectedSize(size)
    }

    const { anchorEl, open, handleClose, handleOpen } = useToggleMenuVisibility()

    useLayoutEffect(() => {
        const { from, to } = editor.state.selection
        editor.state.doc.nodesBetween(from - 1, to, (node) => {
            if (node.marks) {
                const textStyleMark = node.marks.find((mark) => mark.type.name === 'textStyle')
                const fontSize = textStyleMark?.attrs['fontSize']
                const currentFontSize =
                    Object.keys(fontSizeMap).find((key) => fontSizeMap[key] === fontSize) || 'normal'
                setSelectedSize(currentFontSize)
            }
        })
    }, [editor.state.selection, editor.state.doc])

    const t = useTranslations(locale)

    return (
        <>
            <StyledTooltip title={t.font_size} placement='top' arrow>
                <span>
                    <StyledButton
                        size='small'
                        dataTest='richeditor-more-menu-button'
                        variant='textGray'
                        onMouseDown={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleOpen(e)
                        }}
                        className='font-normal capitalize'
                        onMouseUp={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                        }}
                        endIcon={<Icon icon='tabler:caret-up-down-filled' fontSize={20} />}
                    >
                        {selectedSize}
                    </StyledButton>
                </span>
            </StyledTooltip>
            <StyledPopover
                disablePortal
                disableEnforceFocus
                disableAutoFocus
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                onMouseDown={(e) => {
                    e.preventDefault()
                    handleClose()
                }}
                anchorOrigin={{
                    horizontal: 'center',
                    vertical: 'bottom',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <CustomMenuItem
                    value='small'
                    selected={selectedSize === 'small'}
                    onMouseDown={(e) => {
                        e.preventDefault()
                        handleFontSizeChange('small')
                    }}
                >
                    {isNorsk ? 'Liten' : 'Small'}
                </CustomMenuItem>
                <CustomMenuItem
                    value='normal'
                    selected={selectedSize === 'normal'}
                    onMouseDown={(e) => {
                        e.preventDefault()
                        handleFontSizeChange('normal')
                    }}
                >
                    Normal
                </CustomMenuItem>
                <CustomMenuItem
                    value='large'
                    selected={selectedSize === 'large'}
                    onMouseDown={(e) => {
                        e.preventDefault()
                        handleFontSizeChange('large')
                    }}
                >
                    {isNorsk ? 'Stor' : 'Large'}
                </CustomMenuItem>
                <CustomMenuItem
                    value='huge'
                    selected={selectedSize === 'huge'}
                    onMouseDown={(e) => {
                        e.preventDefault()
                        handleFontSizeChange('huge')
                    }}
                >
                    {isNorsk ? 'Enorm' : 'Huge'}
                </CustomMenuItem>
            </StyledPopover>
        </>
    )
}
