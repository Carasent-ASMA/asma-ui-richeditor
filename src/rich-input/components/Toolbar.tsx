import { Editor, useEditorState } from '@tiptap/react'
import {
    DotsVerticalIcon,
    LinkOutlineIcon,
    StyledButton,
    StyledPopover,
    StyledTooltip,
} from 'asma-ui-core'
import '../styles/toolbar.css'
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useToggleMenuVisibility } from '../hooks/useToggleMenuVisibility.hook'
import type { ILocale } from '../interfaces/types'
import { FontSizeSelect } from 'src/rich-input/components/FontSizeSelect'
import { getOverflowMenuBreakpoint, getVisibleButtonCount } from './toolbar.helpers'
import { ToolbarOverflowItem } from './ToolbarOverflowItem'
import { useTranslations } from './useTranslations'

export const Toolbar = ({
    editor,
    onClose,
    error,
    focused,
    openLinkDialog,
    openEmojiPicker,
    locale,
    emojiButtonRef,
}: {
    editor: Editor
    onClose: () => void
    error?: boolean
    focused: boolean
    openLinkDialog: () => void
    openEmojiPicker: () => void
    locale?: ILocale
    emojiButtonRef?: RefObject<HTMLSpanElement>
}) => {
    const [visibleButtons, setVisibleButtons] = useState<number>(0)
    const toolbarRef = useRef<HTMLDivElement | null>(null)

    const t = useTranslations(locale)

    const isNorsk = locale === 'no'

    const [actionsVisible, setActionsVisible] = useState(false)

    const {
        emptySelection,
        isBold,
        isBulletList,
        isH1,
        isH2,
        isItalic,
        isLink,
        isOrderedList,
    } = useEditorState({
        editor,
        selector: ({ editor }) => ({
            emptySelection: editor.state.selection.empty,
            isBold: editor.isActive('bold'),
            isBulletList: editor.isActive('bulletList'),
            isH1: editor.isActive('heading', { level: 1 }),
            isH2: editor.isActive('heading', { level: 2 }),
            isItalic: editor.isActive('italic'),
            isLink: editor.isActive('link'),
            isOrderedList: editor.isActive('orderedList'),
        }),
    })

    /**
     * Only measures. The overflow entries themselves are derived during render so they always
     * reflect the current editor state instead of whatever it was when the last resize fired.
     */
    useLayoutEffect(() => {
        const toolbar = toolbarRef.current

        if (!toolbar) return

        const observer = new ResizeObserver(() => {
            const width = toolbar.clientWidth

            setActionsVisible(width < getOverflowMenuBreakpoint(isNorsk))
            setVisibleButtons(getVisibleButtonCount(width, isNorsk))
        })

        observer.observe(toolbar)

        return () => observer.disconnect()
    }, [isNorsk])

    const { anchorEl, open, handleClose, handleOpen } = useToggleMenuVisibility()

    /** Buttons that no longer fit, in the same order they drop out of the toolbar. */
    const overflowItems = [
        visibleButtons < 9 && (
            <ToolbarOverflowItem
                key='link'
                title={emptySelection ? t.empty_selection_link : t.link}
                disabled={emptySelection}
                selected={isLink}
                onSelect={openLinkDialog}
            >
                <LinkOutlineIcon />
            </ToolbarOverflowItem>
        ),
        visibleButtons < 8 && (
            <ToolbarOverflowItem
                key='italic'
                title={t.italic}
                selected={isItalic}
                onSelect={() => editor.chain().focus().toggleItalic().run()}
            >
                <Icon icon='material-symbols:format-italic' height={20} />
            </ToolbarOverflowItem>
        ),
        visibleButtons < 7 && (
            <ToolbarOverflowItem
                key='bold'
                title={t.bold}
                selected={isBold}
                onSelect={() => editor.chain().focus().toggleBold().run()}
            >
                <Icon icon='ooui:bold-b' />
            </ToolbarOverflowItem>
        ),
        visibleButtons < 6 && (
            <ToolbarOverflowItem
                key='ordered'
                title={t.ordered_list}
                selected={isOrderedList}
                onSelect={() => editor.chain().focus().toggleOrderedList().run()}
            >
                <Icon icon='mdi:format-list-numbered' fontSize={20} />
            </ToolbarOverflowItem>
        ),
        visibleButtons < 5 && (
            <ToolbarOverflowItem
                key='bullet'
                title={t.bullet_list}
                selected={isBulletList}
                onSelect={() => editor.chain().focus().toggleBulletList().run()}
            >
                <Icon icon='mdi:format-list-bulleted' fontSize={20} />
            </ToolbarOverflowItem>
        ),
    ].filter(Boolean)

    return (
        <>
            <div className={clsx('toolbar', { 'toolbar-error': error, 'toolbar-focused': focused })} ref={toolbarRef}>
                <div className='flex flex-row items-center gap-1'>
                    {visibleButtons >= 1 && (
                        <StyledTooltip arrow title={t.emojis} placement='top'>
                            <span ref={emojiButtonRef}>
                                <StyledButton
                                    dataTest='richeditor-emoji-button'
                                    size='large'
                                    variant='textGray'
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        openEmojiPicker()
                                    }}
                                    style={{ minWidth: 40, maxWidth: 40 }}
                                    startIcon={<Icon icon='mdi:emoticon-outline' width={24} height={24} />}
                                />
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 2 && (
                        <StyledTooltip title={t.heading1} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-h1-button'
                                    className='text-delta-700 text-sm font-semibold'
                                    size='large'
                                    variant={isH1 ? 'text' : 'textGray'}
                                    style={{ minWidth: 40, maxWidth: 40, padding: 0 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().setMark('textStyle', { fontSize: undefined }).run()
                                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                                    }}
                                >
                                    H1
                                </StyledButton>
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 3 && (
                        <StyledTooltip title={t.heading2} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-h2-button'
                                    className='text-delta-700 text-sm font-semibold'
                                    size='large'
                                    variant={isH2 ? 'text' : 'textGray'}
                                    style={{ minWidth: 40, maxWidth: 40, padding: 0 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().setMark('textStyle', { fontSize: undefined }).run()
                                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                                    }}
                                >
                                    H2
                                </StyledButton>
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 4 && <FontSizeSelect editor={editor} isNorsk={isNorsk} locale={locale} />}
                    {visibleButtons >= 5 && (
                        <StyledTooltip title={t.bullet_list} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-bullet-list-button'
                                    size='large'
                                    variant={isBulletList ? 'text' : 'textGray'}
                                    style={{ minWidth: 40, maxWidth: 40 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleBulletList().run()
                                    }}
                                    startIcon={<Icon icon='mdi:format-list-bulleted' width={24} height={24} />}
                                />
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 6 && (
                        <StyledTooltip title={t.ordered_list} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-ordered-list-button'
                                    size='large'
                                    variant={isOrderedList ? 'text' : 'textGray'}
                                    style={{ minWidth: 40, maxWidth: 40 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleOrderedList().run()
                                    }}
                                    startIcon={<Icon icon='mdi:format-list-numbered' width={24} height={24} />}
                                />
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 7 && (
                        <StyledTooltip title={t.bold} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-bold-button'
                                    size='large'
                                    variant={isBold ? 'text' : 'textGray'}
                                    style={{ minWidth: 40, maxWidth: 40 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleBold().run()
                                    }}
                                    startIcon={<Icon icon='ooui:bold-b' width={16} height={16} />}
                                />
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 8 && (
                        <StyledTooltip title={t.italic} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-italic-button'
                                    size='large'
                                    variant={isItalic ? 'text' : 'textGray'}
                                    style={{ minWidth: 40, maxWidth: 40 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleItalic().run()
                                    }}
                                    startIcon={<Icon icon='material-symbols:format-italic' width={24} height={24} />}
                                />
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 9 && (
                        <StyledTooltip title={emptySelection ? t.empty_selection_link : t.link} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-link-button'
                                    className={emptySelection ? 'cursor-not-allowed' : ''}
                                    disabled={emptySelection}
                                    size='large'
                                    variant={isLink ? 'text' : 'textGray'}
                                    style={{ minWidth: 40, maxWidth: 40 }}
                                    startIcon={<LinkOutlineIcon width={24} height={24} />}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        openLinkDialog()
                                    }}
                                />
                            </span>
                        </StyledTooltip>
                    )}
                    {actionsVisible && (
                        <>
                            <StyledTooltip title={t.more} placement='top' arrow>
                                <span>
                                    <StyledButton
                                        size='large'
                                        dataTest='richeditor-more-menu-button'
                                        variant='text'
                                        style={{ minWidth: 40, maxWidth: 40 }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            handleOpen(e)
                                        }}
                                        onMouseUp={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                        }}
                                        startIcon={
                                            <DotsVerticalIcon className='text-delta-800' width={20} height={20} />
                                        }
                                    />
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
                            >
                                {overflowItems}
                            </StyledPopover>
                        </>
                    )}
                </div>
                <StyledButton
                    dataTest='richeditor-close-toolbar-button'
                    size='large'
                    variant='text'
                    onMouseDown={(e) => {
                        e.preventDefault()
                        onClose()
                    }}
                >
                    {t.close}
                </StyledButton>
            </div>
        </>
    )
}
