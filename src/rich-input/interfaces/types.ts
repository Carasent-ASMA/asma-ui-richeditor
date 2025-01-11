import type { Editor, UseEditorOptions } from '@tiptap/react'
import type { MutableRefObject } from 'react'

export interface CustomCSSProperties extends React.CSSProperties {
    '--max-scrollable-height'?: string
}

export type ILocale = 'en' | 'no'

export interface IRichInput extends UseEditorOptions {
    dataTest: string
    inputRef?: MutableRefObject<Editor | null>
    id?: string
    // label?: string // TODO: implement same label behavior like in MUI
    title?: string
    placeholder?: string
    className?: string
    editorClassName?: string
    disabled?: boolean
    error?: boolean
    readOnly?: 'plain' | 'outlined'
    helperText?: string
    required?: boolean
    hideToolbar?: boolean
    noDefaultStyles?: boolean
    maxScrollableHeight?: number | string
    toolbarDefaultVisible?: boolean
    locale?: ILocale
}
