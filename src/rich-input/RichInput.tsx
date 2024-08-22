import { useImperativeHandle, type FC, type MutableRefObject } from 'react'
import clsx from 'clsx'

import { Editor, EditorContent, useEditor, type UseEditorOptions } from '@tiptap/react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Placeholder from '@tiptap/extension-placeholder'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import Blockquote from '@tiptap/extension-blockquote'
import HardBreak from '@tiptap/extension-hard-break'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { MenuBar } from './MenuBar'

import './tiptap.css'

export interface IRichInput extends UseEditorOptions {
    dataTest: string
    inputRef?: MutableRefObject<Editor | null>
    immediatelyRender?: boolean
    id?: string
    label?: string
    placeholder?: string
    className?: string
    disabled?: boolean
    is_error?: boolean
    ghost?: boolean
    helperText?: string
    isRequired?: boolean
    hideMenuBar?: boolean
    noDefaultStyles?: boolean
}

const defaultExtensions = [Document, Paragraph, Text]
const editModeExtensions = [
    Bold,
    Italic,
    Strike,
    Color,
    TextStyle,
    BulletList,
    OrderedList,
    ListItem,
    Heading,
    Blockquote,
    HorizontalRule,
    HardBreak,
]

const RichInput: FC<IRichInput> = ({
    dataTest,
    id,
    inputRef,
    className,
    disabled,
    ghost,
    is_error,
    label,
    placeholder,
    helperText,
    isRequired,
    hideMenuBar,
    noDefaultStyles,
    ...props
}) => {
    const editor = useEditor(
        {
            ...props,
            extensions:
                disabled || ghost || hideMenuBar
                    ? [...defaultExtensions, Placeholder.configure({ placeholder }), ...(props.extensions || [])]
                    : [
                          ...defaultExtensions,
                          ...editModeExtensions,
                          Placeholder.configure({
                              placeholder,
                          }),
                          ...(props.extensions || []),
                      ],
            shouldRerenderOnTransaction: props.shouldRerenderOnTransaction || false,
            immediatelyRender: props.immediatelyRender || true,
            editable: props.editable || (!disabled && !ghost),
        },
        [],
    )

    useImperativeHandle(inputRef, () => editor)

    if (!editor) {
        return null
    }

    return (
        <div className='relative'>
            {label && (
                <span
                    className='text-custom-grey-06 mb-2 font-sans text-xs font-semibold leading-4'
                    data-test={`label-${dataTest}`}
                >
                    {label}
                </span>
            )}

            {!hideMenuBar && !disabled && !ghost && <MenuBar editor={editor} />}
            <EditorContent
                id={id}
                className={clsx(
                    !noDefaultStyles && 'core-ui-rte',
                    !noDefaultStyles && !disabled && !ghost && 'core-ui-rte-edit-mode',
                    ghost && 'core-ui-rte-ghost-mode',
                    is_error && 'core-ui-rte-error',
                    className,
                )}
                editor={editor}
            />

            {(is_error || isRequired) && (
                <span
                    className={clsx('core-ui-rte-helper-text', is_error && 'core-ui-rte-error')}
                    data-test={`error-${dataTest}`}
                >
                    {helperText}
                </span>
            )}
        </div>
    )
}

export { RichInput }
