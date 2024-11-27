import { Icon } from '@iconify/react'
import { StyledInputField, type TextFieldProps } from 'asma-core-ui'
import React, { useLayoutEffect, useState, type ChangeEvent } from 'react'

import '../styles/toolbar.css'
import type { Editor } from '@tiptap/core'

const fontSizeMap: { [key: string]: string } = {
    small: '10px',
    normal: '16px',
    large: '24px',
    huge: '32px',
}

export const FontSizeSelect = (props: TextFieldProps & { editor: Editor }) => {
    const { editor } = props
    const [selectedSize, setSelectedSize] = useState<string>('normal')

    const handleFontSizeChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedSize = event.target.value
        editor.chain().focus().setMark('textStyle', { fontSize: fontSizeMap[selectedSize] }).run()
        setSelectedSize(selectedSize)
    }

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
        <StyledInputField
            {...props}
            select
            size='small'
            dataTest='font-size-select'
            onChange={handleFontSizeChange}
            value={selectedSize}
            SelectProps={{ IconComponent: () => null }}
            InputProps={{
                endAdornment: <Icon icon='tabler:caret-up-down-filled' className='chevron-icon' />,
            }}
            sx={{
                '.MuiSelect-select': {
                    border: 'none',
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--colors-delta-700)',
                    fontSize: '14px',
                    lineHeight: '20px',
                },
                '.MuiOutlinedInput-root': {
                    height: '32px',
                    width: '75px',
                    '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                    },
                },
            }}
        >
            {props.children}
        </StyledInputField>
    )
}
