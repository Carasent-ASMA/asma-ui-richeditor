import { useEffect, useImperativeHandle, useRef, useState, type FC, useCallback, useLayoutEffect } from 'react'
import clsx from 'clsx'
import { EditorContent, useEditor } from '@tiptap/react'
import { Toolbar } from './components/Toolbar'
import './styles/tiptap.css'
import {
    ErrorOutlineIcon,
    LoadingIcon,
    StyledButton,
    StyledChip,
    StyledDialog,
    StyledFormControl,
    StyledFormHelperText,
} from 'asma-ui-core'
import { Icon } from '@iconify/react'
import type { IRichInput } from './interfaces/types'
import { FloatingLabel } from './components/FloatingLabel'
import { LinkDialog } from './components/LinkDialog'
import EmojiPicker from 'emoji-picker-react'
import { Placeholder } from '@tiptap/extensions'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { resolveDefaultExtensions } from './helpers/EditorExtensions'
import { useTranslations } from './components/useTranslations'

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
    label,
    title,
    placeholder,
    placeholderCallback,
    helperText,
    required,
    maxScrollableHeight,
    toolbarDefaultVisible,
    hideToolbar,
    noDefaultStyles,
    attachments,
    replyModeComponent,
    enableImageUpload,
    imageOptions,
    onImageUpload,
    onImageUploadError,
    enableYoutube,
    youtubeOptions,
    'aria-label': ariaLabel,
    ...props
}) => {
    const cursor = useRef<number | undefined>(undefined)
    const t = useTranslations(locale)

    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const mirrorRef = useRef<HTMLDivElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const baselineHeightRef = useRef<number | null>(null)

    const [isMultiLine, setIsMultiLine] = useState(false)
    const [isEmpty, setIsEmpty] = useState(true)
    const accessibleName = ariaLabel?.trim() || label?.trim() || title?.trim() || t.rich_text_editor

    const editor = useEditor(
        {
            ...props,
            extensions: [
                Placeholder.configure({
                    // With a floating label the resting label occupies the placeholder spot, so the
                    // configured placeholder only shows once the editor is focused (MUI behavior).
                    placeholder: label
                        ? (placeholderProps) =>
                              placeholderProps.editor.isFocused
                                  ? (placeholderCallback?.(placeholderProps) ?? placeholder ?? '')
                                  : ''
                        : placeholderCallback
                          ? placeholderCallback
                          : placeholder,
                }),
                ...resolveDefaultExtensions(),
                ...(enableImageUpload
                    ? [
                          Image.configure({
                              inline: true,
                              allowBase64: false, // Prevent base64 bloat, force URLs
                              ...imageOptions,
                          }),
                      ]
                    : []),
                ...(enableYoutube
                    ? [
                          Youtube.configure({
                              addPasteHandler: true,
                              controls: true,
                              nocookie: true,
                              ...youtubeOptions,
                          }),
                      ]
                    : []),
                ...(props.extensions || []),
            ],
            parseOptions: {
                preserveWhitespace: true,
                ...props.parseOptions,
            },
            shouldRerenderOnTransaction: props.shouldRerenderOnTransaction || false,
            immediatelyRender: props.immediatelyRender || true,
            editable: props.editable || (!disabled && !readOnly),
            onBlur: (blurProps) => {
                props.onBlur?.(blurProps)
                setFocused(false)
            },
            onFocus: (focusProps) => {
                props.onFocus?.(focusProps)
                setFocused(true)
            },
            onSelectionUpdate: (updateProps) => {
                props.onSelectionUpdate?.(updateProps)
                cursor.current = updateProps.editor.state.selection.anchor
                updateProps.editor.commands.focus()
            },
            onCreate: (createProps) => {
                props.onCreate?.(createProps)
                setIsEmpty(createProps.editor.isEmpty)
            },
            onUpdate: (updateProps) => {
                props.onUpdate?.(updateProps)
                setIsEmpty(updateProps.editor.isEmpty)
                scheduleMeasure()
            },
        },
        [props.shouldRerenderOnTransaction, props.immediatelyRender],
    )

    const imageInputRef = useRef<HTMLInputElement | null>(null)
    const [isUploadingImage, setIsUploadingImage] = useState(false)

    const handleImageUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (!files || !editor) return

            if (!onImageUpload) {
                console.error('RichInput: "onImageUpload" prop is required when "enableImageUpload" is true.')
                e.target.value = ''
                return
            }

            setIsUploadingImage(true)
            const fileArray = Array.from(files)

            for (const file of fileArray) {
                try {
                    const fileUrl = await onImageUpload(file)
                    editor.commands.setImage({ src: fileUrl, alt: file.name })
                } catch (error) {
                    console.error('Failed to upload:', file.name, error)
                    if (onImageUploadError) {
                        onImageUploadError(error instanceof Error ? error : new Error(String(error)), file)
                    }
                }
            }
            setIsUploadingImage(false)
            e.target.value = ''
        },
        [editor, onImageUpload, onImageUploadError],
    )

    const measure = useCallback(() => {
        if (!editor || !wrapperRef.current || !mirrorRef.current) return

        const editorEl = editor.view.dom
        const mirror = mirrorRef.current

        // Use a stable ancestor width
        const stableWidthSource = wrapperRef.current.parentElement ?? wrapperRef.current
        const targetWidth = Math.max(0, stableWidthSource.clientWidth - SINGLE_LINE_TOOLBAR_WIDTH)

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
            editor.commands.setContent(props.content || '', { emitUpdate: false }) // second arg=false to avoid resetting selection
            setIsEmpty(editor.isEmpty)
        }
    }, [props.content, editor])

    useEffect(() => {
        editor?.setEditable(props.editable || (!disabled && !readOnly))
    }, [readOnly, disabled, props.editable, editor])

    useEffect(() => {
        const dom = editor?.view.dom
        if (!dom) return
        if (readOnly) {
            // Read-only content is static text, not an input — expose no textbox role/tabindex (FND-09).
            dom.removeAttribute('role')
            dom.removeAttribute('tabindex')
            dom.removeAttribute('aria-label')
        } else {
            // The editable host is a textbox; expose an accessible name (FND-03).
            dom.setAttribute('role', 'textbox')
            dom.setAttribute('aria-label', accessibleName)
        }
    }, [editor, readOnly, accessibleName])

    useEffect(() => {
        if (cursor.current === undefined) return

        editor?.commands.setTextSelection(cursor.current)
    }, [props.content?.length, editor])

    const [showToolbar, setShowToolbar] = useState(toolbarDefaultVisible)
    const [linkDialogVisible, setLinkDialogVisible] = useState(false)
    useImperativeHandle(inputRef, () => editor)

    const [focused, setFocused] = useState(false)
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false)

    const showError = !readOnly && error
    if (!editor) return null

    const showFormatButton = showToolbar ? isMultiLine : true

    return (
        <StyledFormControl className={className}>
            {title && <p className='font-semibold text-base text-delta-700 mb-2'>{title}</p>}
            {/* Positioning context for the floating label — the field wrapper clips overflow, so the
                shrunk label must live on a sibling layer above its top border. */}
            {label && readOnly !== 'plain' && (
                <div className='relative'>
                    <FloatingLabel
                        label={label}
                        shrink={focused || !isEmpty}
                        focused={focused}
                        error={!!showError}
                        disabled={disabled}
                        readOnly={!!readOnly}
                    />
                </div>
            )}
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
                            aria-required={required ? true : undefined}
                            data-test={dataTest}
                            data-testid={dataTest}
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
                            {enableImageUpload ? (
                                <>
                                    <input
                                        type='file'
                                        ref={imageInputRef}
                                        hidden
                                        multiple
                                        accept='image/*'
                                        onChange={handleImageUpload}
                                    />
                                    <StyledButton
                                        dataTest='rich-editor-image-upload'
                                        size='large'
                                        variant='textGray'
                                        aria-label={t.upload_image}
                                        onClick={() => imageInputRef.current?.click()}
                                        startIcon={
                                            isUploadingImage ? (
                                                <LoadingIcon width={20} height={20} />
                                            ) : (
                                                <Icon
                                                    className='cursor-pointer text-delta-700 h-6 w-6 min-w-6'
                                                    icon='ic:baseline-attach-file'
                                                />
                                            )
                                        }
                                    />
                                </>
                            ) : (
                                attachmentsMenu
                            )}
                            {showFormatButton && (
                                <StyledButton
                                    dataTest='richeditor-format-button'
                                    aria-label={showToolbar ? t.hide_formatting : t.show_formatting}
                                    aria-pressed={showToolbar}
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
                        linkDialogOpen={linkDialogVisible}
                        emojiPickerOpen={emojiPickerVisible}
                        locale={locale}
                    />
                )}
            </div>

            {helperText && (
                <StyledFormHelperText
                    className={clsx(
                        'm-0 flex items-center gap-1 pt-1 text-base min-h-6',
                        showError ? 'text-error-500' : 'text-delta-600',
                    )}
                >
                    {showError && <ErrorOutlineIcon width={20} height={20} />}
                    {helperText}
                </StyledFormHelperText>
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
