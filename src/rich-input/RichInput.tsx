import { useEffect, useImperativeHandle, useRef, useState, type FC } from 'react'
import clsx from 'clsx'
import { EditorContent, useEditor } from '@tiptap/react'
import { Toolbar } from './components/Toolbar'
import './styles/tiptap.css'
import { StyledDialog, StyledFormControl, StyledFormHelperText } from 'asma-core-ui'
import { Icon } from '@iconify/react'
import type { IRichInput } from './interfaces/types'
import { defaultExtensions, editModeExtensions } from './helpers/EditorExtensions'
import { LinkDialog } from './components/LinkDialog'
import Placeholder from '@tiptap/extension-placeholder'
import EmojiPicker from 'emoji-picker-react'

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
    attachmentsMenu,
    id,
    inputRef,
    className,
    editorClassName,
    disabled,
    readOnly,
    error,
    locale,
    // label, // this in not implemented yet
    title,
    placeholder,
    helperText,
    required,
    maxScrollableHeight,
    toolbarDefaultVisible,
    hideToolbar,
    noDefaultStyles,
    ...props
}) => {
    const cursor = useRef<number>()

    const editor = useEditor(
        {
            ...props,
            extensions: [
                Placeholder.configure({ placeholder }),
                ...defaultExtensions,
                ...editModeExtensions,
                ...(props.extensions || []),
            ],
            parseOptions: {
                preserveWhitespace: true,
                ...props.parseOptions,
            },
            shouldRerenderOnTransaction: props.shouldRerenderOnTransaction || false,
            immediatelyRender: props.immediatelyRender || true,
            editable: props.editable || (!disabled && !readOnly),
            onSelectionUpdate: (updateProps) => {
                props.onSelectionUpdate?.(updateProps)
                cursor.current = updateProps.editor.state.selection.anchor
                updateProps.editor.commands.focus()
            },
        },
        //NOTE: the dependency list doesn't accept the props object without creating a max call stack error
        [
            props.extensions,
            props.shouldRerenderOnTransaction,
            props.immediatelyRender,
            props.editable,
            props.content,
            disabled,
            readOnly,
            placeholder,
        ],
    )

    useEffect(() => {
        if (cursor.current === undefined) return
        editor?.commands.setTextSelection(cursor.current)
    }, [props.content, editor])

    const [showToolbar, setShowToolbar] = useState(toolbarDefaultVisible)
    const [linkDialogVisible, setLinkDialogVisible] = useState(false)
    useImperativeHandle(inputRef, () => editor)

    const [focused, setFocused] = useState(false)
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false)

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

    const isFieldEmpty = editor?.isEmpty
    const showError = !readOnly && error && isFieldEmpty
    if (!editor) return null

    return (
        <>
            <StyledFormControl className={className}>
                {title && <p className='font-semibold text-base text-delta-700 mb-2'>{title}</p>}
                <div
                    className={clsx(
                        !noDefaultStyles && 'rte-wrapper',
                        readOnly === 'outlined' && 'readonly-outlined',
                        readOnly === 'plain' && 'readonly-plain',
                        !readOnly && showError && (focused ? 'error-focused-state' : 'error-state'),
                        !readOnly && !showError && focused && 'focused-state',
                    )}
                >
                    <div className='flex justify-between'>
                        <EditorContent
                            data-test={dataTest}
                            id={id}
                            className={clsx(
                                !noDefaultStyles && 'core-ui-rte',
                                !hideToolbar && !disabled && !readOnly && !showToolbar && 'displace-text',
                                !noDefaultStyles && !disabled && !readOnly && 'edit-mode',
                                editorClassName,
                                showToolbar && 'displace-text',
                            )}
                            editor={editor}
                            onClick={() => editor?.chain().focus().run()}
                            style={
                                { '--max-scrollable-height': `${maxScrollableHeight || 100}px` } as React.CSSProperties
                            }
                        />

                        {!hideToolbar && !disabled && !readOnly && (
                            <div className='flex flex-col items-end justify-end gap-2 m-1'>
                                {!showToolbar && (
                                    <Icon
                                        onClick={() => setShowToolbar(true)}
                                        className='cursor-pointer text-delta-700 h-6 w-6 min-w-6 m-1'
                                        icon='material-symbols:format-color-text'
                                    />
                                )}
                                {attachmentsMenu}
                            </div>
                        )}
                    </div>
                    {!hideToolbar && !disabled && !readOnly && showToolbar && (
                        <Toolbar
                            editor={editor}
                            onClose={() => setShowToolbar(false)}
                            error={error}
                            focused={focused}
                            openLinkDialog={() => setLinkDialogVisible(true)}
                            openEmojiPicker={() => setEmojiPickerVisible(true)}
                            locale={locale}
                        />
                    )}
                </div>

                {showError && helperText && (
                    <StyledFormHelperText error data-test={`error-${dataTest}`}>
                        {helperText}
                    </StyledFormHelperText>
                )}
            </StyledFormControl>

            <LinkDialog open={linkDialogVisible} setOpen={setLinkDialogVisible} editor={editor} locale={locale} />

            <StyledDialog
                dataTest='emoji-picker-dialog'
                open={emojiPickerVisible}
                showCloseIcon={false}
                onClose={() => setEmojiPickerVisible(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '8px',
                    },
                }}
            >
                <EmojiPicker
                    open={emojiPickerVisible}
                    onEmojiClick={({ emoji }) => {
                        editor?.chain().focus().insertContent(emoji).run()
                        setEmojiPickerVisible(false)
                    }}
                />
            </StyledDialog>
        </>
    )
}

export { RichInput }
