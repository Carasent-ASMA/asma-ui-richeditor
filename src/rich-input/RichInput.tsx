import { useEffect, useImperativeHandle, useRef, useState, type FC, useCallback, useLayoutEffect } from 'react'
import clsx from 'clsx'
import { EditorContent, useEditor } from '@tiptap/react'
import { Toolbar } from './components/Toolbar'
import './styles/tiptap.css'
import { ErrorOutlineIcon, StyledButton, StyledChip, StyledDialog, StyledFormControl } from 'asma-core-ui'
import { Icon } from '@iconify/react'
import type { IRichInput } from './interfaces/types'
import { defaultExtensions, editModeExtensions } from './helpers/EditorExtensions'
import { LinkDialog } from './components/LinkDialog'
import Placeholder from '@tiptap/extension-placeholder'
import EmojiPicker from 'emoji-picker-react'

const SINGLE_LINE_TOOLBAR_WIDTH = 80

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
    // required,
    maxScrollableHeight,
    toolbarDefaultVisible,
    hideToolbar,
    noDefaultStyles,
    attachments,
    replyModeComponent,
    ...props
}) => {
    const cursor = useRef<number>()

    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const mirrorRef = useRef<HTMLDivElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const baselineHeightRef = useRef<number | null>(null)

    const [isMultiLine, setIsMultiLine] = useState(false)

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
            onUpdate: () => {
                scheduleMeasure()
            },
        },

        [props.shouldRerenderOnTransaction, props.immediatelyRender, placeholder],
    )

    const measure = useCallback(() => {
        if (!editor || !wrapperRef.current || !mirrorRef.current) return

        const editorEl = editor.view.dom
        const mirror = mirrorRef.current

        // Use a stable ancestor width
        const stableWidthSource = wrapperRef.current.parentElement ?? wrapperRef.current
        const targetWidth = Math.max(0, stableWidthSource.clientWidth - SINGLE_LINE_TOOLBAR_WIDTH)

        console.log('targetWidth: ', targetWidth)

        mirror.className = editorEl.className

        const editorStyle = window.getComputedStyle(editorEl)

        Object.assign(mirror.style, {
            width: `${targetWidth}px`,
            position: 'absolute',
            left: '-99999px',
            top: '0',
            visibility: 'hidden',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            boxSizing: 'border-box',
            font: editorStyle.font,
            lineHeight: editorStyle.lineHeight,
            letterSpacing: editorStyle.letterSpacing,
            padding: editorStyle.padding,
        })

        if (baselineHeightRef.current == null) {
            mirror.innerHTML = '<p><br /></p>'
            baselineHeightRef.current = mirror.scrollHeight
        }

        mirror.innerHTML = editorEl.innerHTML || '<p><br /></p>'
        const contentHeight = mirror.scrollHeight

        const nextIsMultiLine = contentHeight > (baselineHeightRef.current ?? 0) + 2

        setIsMultiLine((prev) => (prev === nextIsMultiLine ? prev : nextIsMultiLine))
    }, [editor])

    const scheduleMeasure = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = requestAnimationFrame(measure)
        })
    }, [measure])

    useLayoutEffect(() => {
        if (!editor) return

        scheduleMeasure()

        const ro = new ResizeObserver(() => {
            scheduleMeasure()
        })

        if (wrapperRef.current) ro.observe(wrapperRef.current)

        return () => {
            ro.disconnect()
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [editor, scheduleMeasure])

    useEffect(() => {
        if (!editor) return
        if (props.content !== editor.getHTML()) {
            editor.commands.setContent(props.content || '', false) // second arg=false to avoid resetting selection
        }
    }, [props.content, editor])

    useEffect(() => {
        editor?.setEditable(props.editable || (!disabled && !readOnly))
    }, [readOnly, disabled, props.editable, editor])

    useEffect(() => {
        if (cursor.current === undefined) return

        editor?.commands.setTextSelection(cursor.current)
    }, [props.content?.length, editor])

    const [showToolbar, setShowToolbar] = useState(toolbarDefaultVisible)
    const [linkDialogVisible, setLinkDialogVisible] = useState(false)
    useImperativeHandle(inputRef, () => editor)

    const [focused, setFocused] = useState(false)
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false)

    useEffect(() => {
        const handleFocus = () => setFocused(true)
        const handleBlur = () => setFocused(false)

        editor?.on('blur', handleBlur)

        return () => {
            editor?.off('focus', handleFocus)
            editor?.off('blur', handleBlur)
        }
    }, [editor])

    const isFieldEmpty = editor?.isEmpty
    const showError = !readOnly && error && isFieldEmpty
    if (!editor) return null

    const showFormatButton = showToolbar ? isMultiLine : true

    return (
        <StyledFormControl className={className}>
            {title && <p className='font-semibold text-base text-delta-700 mb-2'>{title}</p>}
            <div
                ref={wrapperRef}
                className={clsx(
                    !noDefaultStyles && 'rte-wrapper',
                    readOnly === 'outlined' && 'readonly-outlined',
                    readOnly === 'plain' && 'readonly-plain',
                    !readOnly && showError && (focused ? 'error-focused-state' : 'error-state'),
                    !readOnly && !showError && focused && 'focused-state',
                )}
            >
                {replyModeComponent}

                <div
                    ref={mirrorRef}
                    aria-hidden
                    className='pointer-events-none invisible absolute left-[-99999px] top-0'
                />

                <div className='flex gap-2'>
                    <div className='flex-1 min-w-0'>
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
                    </div>

                    {!hideToolbar && !disabled && !readOnly && (
                        <div
                            className={clsx(
                                'flex shrink-0 items-center justify-end',
                                isMultiLine ? 'flex-col w-10' : 'w-20',
                            )}
                        >
                            {attachmentsMenu}
                            {showFormatButton && (
                                <StyledButton
                                    dataTest='richeditor-format-button'
                                    className={clsx(isMultiLine ? 'order-last' : 'order-first')}
                                    size='large'
                                    variant='textGray'
                                    onClick={() => setShowToolbar(!showToolbar)}
                                    startIcon={
                                        <Icon
                                            className='cursor-pointer text-delta-700 h-6 w-6 min-w-6'
                                            icon='material-symbols:format-color-text'
                                        />
                                    }
                                />
                            )}
                        </div>
                    )}
                </div>

                {!!attachments?.length && (
                    <div className='p-2 flex flex-wrap items-center gap-2'>
                        {attachments.map((props) => (
                            <StyledChip {...props} />
                        ))}
                    </div>
                )}

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

            {helperText && (
                <div
                    className={clsx(
                        'text-sm mt-1',
                        showError ? 'flex items-center gap-1 text-red-600' : 'mx-[14px] text-gray-500',
                    )}
                >
                    {showError && <ErrorOutlineIcon width={20} height={20} className='min-w-5' />}
                    {helperText}
                </div>
            )}

            <LinkDialog open={linkDialogVisible} setOpen={setLinkDialogVisible} editor={editor} locale={locale} />

            <StyledDialog
                dataTest='emoji-picker-dialog'
                open={emojiPickerVisible}
                onClose={() => setEmojiPickerVisible(false)}
                dialogTitle={<span className='pb-4'>Emoji</span>}
            >
                <EmojiPicker
                    open={emojiPickerVisible}
                    onEmojiClick={({ emoji }) => {
                        editor?.chain().focus().insertContent(emoji).run()
                        setEmojiPickerVisible(false)
                    }}
                    allowExpandReactions={false}
                    autoFocusSearch={false}
                    className='w-full min-w-[350px]'
                    previewConfig={{
                        showPreview: false,
                    }}
                />
            </StyledDialog>
        </StyledFormControl>
    )
}

export { RichInput }
