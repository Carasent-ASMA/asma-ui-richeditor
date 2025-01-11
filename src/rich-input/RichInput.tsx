import { useEffect, useImperativeHandle, useState, type FC } from 'react'
import clsx from 'clsx'
import { EditorContent, useEditor } from '@tiptap/react'
import { Toolbar } from './components/Toolbar'

import './styles/tiptap.css'
import { StyledFormControl, StyledFormHelperText } from 'asma-core-ui'
import { Icon } from '@iconify/react'
import type { CustomCSSProperties, IRichInput } from './interfaces/types'
import { defaultExtensions, editModeExtensions } from './helpers/EditorExtensions'
import { LinkDialog } from './components/LinkDialog'
import Placeholder from '@tiptap/extension-placeholder'

/**
 * ASMA RichInput - A rich text editor component.
 *
 * @param readOnly - Determines the display style in read-only mode.
 * Options:
 * - `'plain'`: Displays the editor with a white background and no borders.
 * - `'outlined'`: Displays the editor with a gray background and visible borders.
 */
const RichInput: FC<IRichInput> = ({
    dataTest,
    id,
    inputRef,
    className,
    editorClassName,
    disabled,
    readOnly,
    error,
    // label, // this in not implemented yet
    placeholder,
    helperText,
    required,
    hideToolbar,
    noDefaultStyles,
    ...props
}) => {
    const editor = useEditor({
        ...props,
        extensions: [
            Placeholder.configure({ placeholder }),
            ...defaultExtensions,
            ...editModeExtensions,
            ...(props.extensions || []),
        ],
        shouldRerenderOnTransaction: props.shouldRerenderOnTransaction || false,
        immediatelyRender: props.immediatelyRender || true,
        editable: props.editable || (!disabled && !readOnly),
    })

    const [showToolbar, setShowToolbar] = useState(props.toolbarDefaultVisible)
    const [linkDialogVisible, setLinkDialogVisible] = useState(false)
    useImperativeHandle(inputRef, () => editor)

    const [focused, setFocused] = useState(false)

    useEffect(() => {
        const handleFocus = () => setFocused(true)
        const handleBlur = () => setFocused(false)

        editor?.on('focus', handleFocus)
        editor?.on('blur', handleBlur)

        return () => {
            editor?.off('focus', handleFocus)
            editor?.off('blur', handleBlur)
        }
    }, [editor])

    if (!editor) return null

    return (
        <>
            <StyledFormControl className={className}>
                {props.title && <p className='font-semibold text-base text-gray-700 mb-2'>{props.title}</p>}
                <div
                    className={clsx(
                        !noDefaultStyles && 'rte-wrapper',
                        readOnly === 'outlined' && 'readonly-outlined',
                        readOnly === 'plain' && 'readonly-plain',
                        error && !focused && 'error-state',
                        focused && !readOnly && (error ? 'error-focused-state' : 'focused-state'),
                    )}
                >
                    <EditorContent
                        data-test={dataTest}
                        id={id}
                        className={clsx(
                            'border-none rounded-none',
                            !noDefaultStyles && 'core-ui-rte',
                            !hideToolbar && !disabled && !readOnly && !showToolbar && 'displace-text',
                            !noDefaultStyles && !disabled && !readOnly && 'edit-mode',
                            editorClassName,
                        )}
                        editor={editor}
                        onClick={() => editor?.chain().focus().run()}
                        style={
                            {
                                '--max-scrollable-height': props.maxScrollableHeight
                                    ? `${props.maxScrollableHeight}${
                                          typeof props.maxScrollableHeight === 'number' ? 'px' : ''
                                      }`
                                    : 'none',
                            } as CustomCSSProperties
                        }
                    />
                    {!hideToolbar && !disabled && !readOnly && !showToolbar && (
                        <Icon
                            onClick={() => setShowToolbar(true)}
                            className='cursor-pointer absolute bottom-2.5 right-4'
                            icon='material-symbols:format-color-text'
                            color='var(--colors-gray-700)'
                            height={24}
                            width={24}
                        />
                    )}
                    {!hideToolbar && !disabled && !readOnly && showToolbar && (
                        <Toolbar
                            editor={editor}
                            onClose={() => setShowToolbar(false)}
                            error={error}
                            focused={focused}
                            openLinkDialog={() => setLinkDialogVisible(true)}
                            locale={props.locale}
                        />
                    )}
                </div>

                {(error || required) && !readOnly && (
                    <StyledFormHelperText error={error} data-test={`error-${dataTest}`}>
                        {helperText}
                    </StyledFormHelperText>
                )}
            </StyledFormControl>
            <LinkDialog open={linkDialogVisible} setOpen={setLinkDialogVisible} editor={editor} locale={props.locale} />
        </>
    )
}

export { RichInput }
