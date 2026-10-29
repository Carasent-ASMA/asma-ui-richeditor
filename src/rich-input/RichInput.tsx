import {
    useEffect,
    useId,
    useImperativeHandle,
    useRef,
    useState,
    type FC,
    type ReactElement,
    type ReactNode,
    useCallback,
    useLayoutEffect,
} from 'react'
import clsx from 'clsx'
import { EditorContent, useEditor } from '@tiptap/react'
import { Toolbar } from './components/Toolbar'
import './styles/tiptap.css'
import {
    ErrorOutlineIcon,
    fieldLabelAboveClass,
    LoadingIcon,
    LockIcon,
    StyledButton,
    StyledChip,
    StyledDialog,
    StyledFormControl,
    StyledFormHelperText,
    StyledTooltip,
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
import { mediaQueries } from 'asma-types'
import { resolveFieldMaxHeight, resolveTextMaxHeight } from './helpers/maxHeight'
import { useMediaQuery } from './hooks/useMediaQuery.hook'
import { useOverflowCue } from './hooks/useOverflowCue.hook'

const SINGLE_LINE_TOOLBAR_WIDTH = 80

const LockedTooltip: FC<{ reason: ReactNode; children: ReactElement }> = ({ reason, children }) =>
    reason === undefined ? (
        children
    ) : (
        <StyledTooltip title={reason} openOnTap persistentDescription>
            {children}
        </StyledTooltip>
    )

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
    readOnly: readOnlyProp,
    lockedReason,
    error,
    locale,
    label,
    labelPlacement = 'above',
    width = 'full',
    title,
    placeholder,
    placeholderCallback,
    helperText,
    required,
    maxScrollableHeight,
    maxFieldHeight,
    toolbarDefaultVisible,
    hideToolbar,
    noDefaultStyles,
    attachments,
    replyModeComponent,
    enableImageUpload,
    imageUploadTooltip,
    enableImageRendering,
    imageOptions,
    onImageUpload,
    onImageUploadError,
    enableYoutube,
    enableYoutubeRendering,
    youtubeOptions,
    'aria-label': ariaLabel,
    ...props
}) => {
    const locked = Boolean(lockedReason)
    const readOnly = locked ? 'outlined' : readOnlyProp
    const cursor = useRef<number | undefined>(undefined)
    const t = useTranslations(locale)

    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const mirrorRef = useRef<HTMLDivElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const baselineHeightRef = useRef<number | null>(null)

    const [isMultiLine, setIsMultiLine] = useState(false)
    const [isEmpty, setIsEmpty] = useState(true)
    const accessibleName = ariaLabel?.trim() || label?.trim() || title?.trim() || t.rich_text_editor
    const labelId = useId()
    const hasLabel = !!label?.trim()
    const floatingLabel = hasLabel && labelPlacement === 'floating'
    const labelAbove = hasLabel && labelPlacement === 'above' && readOnly !== 'plain'
    const labelledBy = labelAbove && !ariaLabel?.trim() ? labelId : undefined
    const showTitle = !!title && !(labelAbove && title.trim() === label?.trim())
    // Rendering is separate from insertion: viewers and editable answers must keep image/video
    // nodes in the document without exposing the upload control.
    const imagesEnabled = enableImageUpload || enableImageRendering
    const youtubeEnabled = enableYoutube || enableYoutubeRendering

    const editor = useEditor(
        {
            ...props,
            extensions: [
                Placeholder.configure({
                    // With a floating label the resting label occupies the placeholder spot, so the
                    // configured placeholder only shows once the editor is focused (MUI behavior).
                    placeholder: floatingLabel
                        ? (placeholderProps) =>
                              placeholderProps.editor.isFocused
                                  ? (placeholderCallback?.(placeholderProps) ?? placeholder ?? '')
                                  : ''
                        : placeholderCallback
                          ? placeholderCallback
                          : placeholder,
                }),
                ...resolveDefaultExtensions(),
                ...(imagesEnabled
                    ? [
                          Image.configure({
                              inline: true,
                              allowBase64: false, // Prevent base64 bloat, force URLs
                              ...imageOptions,
                          }),
                      ]
                    : []),
                ...(youtubeEnabled
                    ? [
                          Youtube.configure({
                              // Render-only mode must not turn pasted YouTube links into
                              // embeds while the user is typing an answer.
                              addPasteHandler: Boolean(enableYoutube),
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
        if (readOnly && !locked) {
            // Read-only content is static text, not an input — expose no textbox role/tabindex (FND-09).
            dom.removeAttribute('role')
            dom.removeAttribute('tabindex')
            dom.removeAttribute('aria-label')
            dom.removeAttribute('aria-labelledby')
            dom.removeAttribute('aria-disabled')
        } else {
            // The editable host is a textbox; expose an accessible name (FND-03).
            dom.setAttribute('role', 'textbox')
            if (labelledBy) {
                dom.setAttribute('aria-labelledby', labelledBy)
                dom.removeAttribute('aria-label')
            } else {
                dom.setAttribute('aria-label', accessibleName)
                dom.removeAttribute('aria-labelledby')
            }
            if (disabled && !props.editable && !locked) dom.setAttribute('aria-disabled', 'true')
            else dom.removeAttribute('aria-disabled')
            // A locked editor keeps its place in the focus order so its reason can be reached (DIS-9).
            if (locked) {
                dom.setAttribute('tabindex', '0')
                dom.setAttribute('aria-readonly', 'true')
                dom.setAttribute('aria-multiline', 'true')
            } else {
                dom.removeAttribute('aria-readonly')
                dom.removeAttribute('aria-multiline')
            }
        }
    }, [editor, readOnly, locked, disabled, props.editable, accessibleName, labelledBy])

    useEffect(() => {
        if (cursor.current === undefined) return

        editor?.commands.setTextSelection(cursor.current)
    }, [props.content?.length, editor])

    const [showToolbar, setShowToolbar] = useState(toolbarDefaultVisible)
    const [linkDialogVisible, setLinkDialogVisible] = useState(false)
    useImperativeHandle(inputRef, () => editor)

    const [focused, setFocused] = useState(false)
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false)

    // Whole-field cap (pattern MLF-3/MLF-4). Mobile is the shared asma-types query; tablet is everything wider.
    const isTablet = !useMediaQuery(mediaQueries.mobile, true)
    const fieldMaxHeight = readOnly || noDefaultStyles ? undefined : resolveFieldMaxHeight(maxFieldHeight, isTablet)
    const fieldCap = fieldMaxHeight === undefined ? undefined : fieldMaxHeight === 'none' ? 'none' : 'capped'
    const overflowCue = useOverflowCue(editor, fieldCap === 'capped')

    const showError = !readOnly && error
    if (!editor) return null

    const showFormatButton = showToolbar ? isMultiLine : true
    const imageUploadTooltipText = imageUploadTooltip?.trim()

    const imageUploadButton = (
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
    )

    return (
        <StyledFormControl
            className={className}
            width={width}
            style={readOnly === 'plain' ? { maxWidth: 'none' } : undefined}
        >
            {showTitle && <p className={fieldLabelAboveClass({ disabled })}>{title}</p>}
            {labelAbove && (
                <div className={fieldLabelAboveClass({ disabled })}>
                    <label
                        id={labelId}
                        onClick={() => {
                            if (!disabled && !readOnly) editor.commands.focus()
                        }}
                    >
                        {label}
                        {required && <span aria-hidden='true'>&nbsp;*</span>}
                    </label>
                </div>
            )}
            {/* Positioning context for the floating label — the field wrapper clips overflow, so the
                shrunk label must live on a sibling layer above its top border. */}
            {label && floatingLabel && readOnly !== 'plain' && (
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
            <LockedTooltip reason={locked ? lockedReason : undefined}>
                <div
                    ref={wrapperRef}
                    className={clsx(
                        !noDefaultStyles && 'rte-wrapper',
                        readOnly === 'outlined' && 'readonly-outlined',
                        locked && 'readonly-locked',
                        readOnly === 'plain' && 'readonly-plain',
                        !readOnly && showError && (focused ? 'error-focused-state' : 'error-state'),
                        !readOnly && !showError && focused && 'focused-state',
                    )}
                    data-rte-field-cap={fieldCap}
                    data-rte-toolbar={fieldCap && showToolbar ? 'open' : undefined}
                    data-overflowing={overflowCue.overflowing ? '' : undefined}
                    data-can-scroll-up={overflowCue.canScrollUp ? '' : undefined}
                    data-can-scroll-down={overflowCue.canScrollDown ? '' : undefined}
                    style={
                        fieldCap === 'capped'
                            ? ({ '--rte-field-max-height': fieldMaxHeight } as React.CSSProperties)
                            : undefined
                    }
                >
                    {replyModeComponent}

                    <div
                        ref={mirrorRef}
                        aria-hidden
                        className='pointer-events-none invisible absolute left-[-99999px] top-0'
                    />

                    <div className='rte-editor-row flex gap-2'>
                        <div className='rte-text-col flex-1 min-w-0'>
                            <EditorContent
                                aria-required={required ? true : undefined}
                                data-test={dataTest}
                                data-testid={dataTest}
                                id={id}
                                className={clsx(
                                    !noDefaultStyles && 'core-ui-rte',
                                    !hideToolbar && !disabled && !readOnly && !showToolbar && 'displace-text',
                                    !noDefaultStyles && !disabled && !readOnly && 'edit-mode',
                                    disabled && !readOnly && !props.editable && 'cursor-not-allowed',
                                    editorClassName,
                                    showToolbar && 'displace-text',
                                )}
                                editor={editor}
                                onClick={() => editor?.chain().focus().run()}
                                style={
                                    {
                                        '--max-scrollable-height': resolveTextMaxHeight(maxScrollableHeight),
                                    } as React.CSSProperties
                                }
                            />
                        </div>

                        {locked && <LockIcon width={24} height={24} className='mr-[14px] mt-2 shrink-0 text-delta-700' />}

                        {!hideToolbar && !disabled && !readOnly && (
                            <div
                                className={clsx(
                                    'rte-actions flex shrink-0 items-center justify-end',
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
                                        {imageUploadTooltipText ? (
                                            // StyledButton does not forward refs, so the tooltip anchors on a
                                            // wrapper span. Its flex layout is inline because the consuming app
                                            // does not build this package's Tailwind classes; only asma-ui-core's
                                            // shipped CSS is guaranteed. The presentation role keeps the span
                                            // itself out of the accessibility tree, and the description still
                                            // lands on the first tabbable child (the button).
                                            <StyledTooltip
                                                title={imageUploadTooltipText}
                                                placement='top'
                                                arrow
                                                persistentDescription
                                            >
                                                <span role='presentation' style={{ display: 'flex', minWidth: 40 }}>
                                                    {imageUploadButton}
                                                </span>
                                            </StyledTooltip>
                                        ) : (
                                            imageUploadButton
                                        )}
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
                        <div className='rte-attachments p-2 flex flex-wrap items-center gap-2'>
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
            </LockedTooltip>

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
