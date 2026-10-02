import { Icon } from '@iconify/react'
import { StyledButton, StyledPopover, StyledTooltip, type TextFieldProps } from 'asma-ui-core'
import React, { useLayoutEffect, useState } from 'react'

import '../styles/toolbar.css'
import type { Editor } from '@tiptap/core'
import { useToggleMenuVisibility } from '../hooks/useToggleMenuVisibility.hook'
import { useListboxTriggerKeyboard } from '../hooks/useListboxTriggerKeyboard.hook'
import { useTranslations } from './useTranslations'
import type { ILocale } from '../interfaces/types'

const fontSizeMap: { [key: string]: string } = {
    small: '10px',
    normal: '16px',
    large: '24px',
    huge: '32px',
}

const fontSizes = ['small', 'normal', 'large', 'huge'] as const

export const FontSizeSelect = (props: TextFieldProps & { editor: Editor; locale?: ILocale }) => {
    const { editor, locale } = props
    const [selectedSize, setSelectedSize] = useState<string>('normal')
    const t = useTranslations(locale)
    const menuId = 'richinput-font-size-menu'

    const handleFontSizeChange = (size: string) => {
        editor.chain().focus().setMark('textStyle', { fontSize: fontSizeMap[size] }).run()
        setSelectedSize(size)
    }

    const { anchorEl, open, handleClose, openFromElement } = useToggleMenuVisibility()

    const selectedIndex = Math.max(fontSizes.indexOf(selectedSize as (typeof fontSizes)[number]), 0)

    const { activeIndex, keyboardActive, openFromPointer, handleKeyDown } = useListboxTriggerKeyboard({
        isOpen: open,
        itemCount: fontSizes.length,
        getInitialActiveIndex: () => selectedIndex,
        onOpen: openFromElement,
        onClose: handleClose,
        onSelect: (index, { close }) => {
            handleFontSizeChange(fontSizes[index] ?? 'normal')
            if (close) handleClose()
        },
    })

    const activeOptionId = `${menuId}-${fontSizes[activeIndex] ?? 'normal'}`

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

    return (
        <>
            <StyledTooltip title={t.font_size} placement='top' arrow>
                <span>
                    <StyledButton
                        size='large'
                        dataTest='richeditor-font-size-select'
                        variant='textGray'
                        role='combobox'
                        aria-label={t.font_size}
                        aria-haspopup='listbox'
                        aria-expanded={open}
                        aria-controls={open ? menuId : undefined}
                        aria-activedescendant={open ? activeOptionId : undefined}
                        onMouseDown={(event) => {
                            event.stopPropagation()
                            event.preventDefault()
                            openFromPointer(event.currentTarget)
                        }}
                        onClick={(event) => {
                            if (event.detail !== 0) return
                            event.stopPropagation()
                            event.preventDefault()
                            openFromPointer(event.currentTarget)
                        }}
                        onKeyDown={handleKeyDown}
                        className='font-normal capitalize'
                        onMouseUp={(event) => {
                            event.stopPropagation()
                            event.preventDefault()
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
                anchorOrigin={{
                    horizontal: 'center',
                    vertical: 'bottom',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <ul id={menuId} role='listbox' aria-label={t.font_size} className='m-0 list-none p-0'>
                    {fontSizes.map((size, index) => {
                        const selected = selectedSize === size
                        const active = keyboardActive && activeIndex === index

                        return (
                            <li
                                key={size}
                                id={`${menuId}-${size}`}
                                role='option'
                                aria-selected={selected}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    handleFontSizeChange(size)
                                    handleClose()
                                }}
                                className={[
                                    'relative flex min-h-10 cursor-pointer items-center px-4 py-2 text-sm leading-5 text-delta-700 hover:bg-delta-50',
                                    selected ? 'bg-gama-50' : '',
                                ].join(' ')}
                            >
                                {active && (
                                    <span
                                        aria-hidden='true'
                                        className='pointer-events-none absolute inset-y-0 left-0 border-l-[3px] border-l-solid border-gama-500'
                                    />
                                )}
                                {t[size]}
                            </li>
                        )
                    })}
                </ul>
            </StyledPopover>
        </>
    )
}
