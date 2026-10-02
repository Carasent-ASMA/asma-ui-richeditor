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
import { useListboxTriggerKeyboard } from '../hooks/useListboxTriggerKeyboard.hook'
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
    linkDialogOpen,
    emojiPickerOpen,
    locale,
    emojiButtonRef,
}: {
    editor: Editor
    onClose: () => void
    error?: boolean
    focused: boolean
    openLinkDialog: () => void
    openEmojiPicker: () => void
    linkDialogOpen: boolean
    emojiPickerOpen: boolean
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

        const updateVisibleActions = () => {
            const width = toolbar.clientWidth

            setActionsVisible(width < getOverflowMenuBreakpoint(isNorsk))
            setVisibleButtons(getVisibleButtonCount(width, isNorsk))
        }

        updateVisibleActions()

        const observer = new ResizeObserver(updateVisibleActions)
        observer.observe(toolbar)

        return () => observer.disconnect()
    }, [isNorsk])

    const { anchorEl, open, handleClose, openFromElement } = useToggleMenuVisibility()
    const overflowMenuId = 'richinput-overflow-menu'

    /** Buttons that no longer fit, in the same order they drop out of the toolbar. */
    const overflowItems = [
        visibleButtons < 9
            ? {
                key: 'link',
                title: emptySelection ? t.empty_selection_link : t.link,
                disabled: emptySelection,
                selected: isLink,
                onSelect: openLinkDialog,
                children: <LinkOutlineIcon />,
            }
            : null,
        visibleButtons < 8
            ? {
                key: 'italic',
                title: t.italic,
                selected: isItalic,
                onSelect: () => editor.chain().focus().toggleItalic().run(),
                children: <Icon icon='material-symbols:format-italic' height={20} />,
            }
            : null,
        visibleButtons < 7
            ? {
                key: 'bold',
                title: t.bold,
                selected: isBold,
                onSelect: () => editor.chain().focus().toggleBold().run(),
                children: <Icon icon='ooui:bold-b' />,
            }
            : null,
        visibleButtons < 6
            ? {
                key: 'ordered',
                title: t.ordered_list,
                selected: isOrderedList,
                onSelect: () => editor.chain().focus().toggleOrderedList().run(),
                children: <Icon icon='mdi:format-list-numbered' fontSize={20} />,
            }
            : null,
        visibleButtons < 5
            ? {
                key: 'bullet',
                title: t.bullet_list,
                selected: isBulletList,
                onSelect: () => editor.chain().focus().toggleBulletList().run(),
                children: <Icon icon='mdi:format-list-bulleted' fontSize={20} />,
            }
            : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null)

    const selectOverflowItem = (index: number, close: boolean) => {
        const item = overflowItems[index]
        if (!item || item.disabled) return

        item.onSelect()
        if (close) handleClose()
    }

    const {
        activeIndex: activeOverflowIndex,
        keyboardActive: keyboardOverflowActive,
        openFromPointer: openOverflowMenu,
        handleKeyDown: handleOverflowKeyDown,
    } = useListboxTriggerKeyboard({
        isOpen: open,
        itemCount: overflowItems.length,
        getInitialActiveIndex: () => 0,
        onOpen: openFromElement,
        onClose: handleClose,
        onSelect: (index, { close }) => selectOverflowItem(index, close),
        moveActiveIndexOnOpen: false,
    })

    const activeOverflowItemId =
        overflowItems[activeOverflowIndex] && `${overflowMenuId}-${overflowItems[activeOverflowIndex].key}`

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
                                    aria-label={t.emojis}
                                    aria-haspopup='dialog'
                                    aria-expanded={emojiPickerOpen}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        openEmojiPicker()
                                    }}
                                    onClick={(e) => {
                                        if (e.detail !== 0) return
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
                                    aria-pressed={isH1}
                                    style={{ minWidth: 40, maxWidth: 40, padding: 0 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().setMark('textStyle', { fontSize: undefined }).run()
                                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                                    }}
                                    onClick={(e) => {
                                        if (e.detail !== 0) return
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
                                    aria-pressed={isH2}
                                    style={{ minWidth: 40, maxWidth: 40, padding: 0 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().setMark('textStyle', { fontSize: undefined }).run()
                                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                                    }}
                                    onClick={(e) => {
                                        if (e.detail !== 0) return
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
                    {visibleButtons >= 4 && <FontSizeSelect editor={editor} locale={locale} />}
                    {visibleButtons >= 5 && (
                        <StyledTooltip title={t.bullet_list} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-bullet-list-button'
                                    size='large'
                                    variant={isBulletList ? 'text' : 'textGray'}
                                    aria-label={t.bullet_list}
                                    aria-pressed={isBulletList}
                                    style={{ minWidth: 40, maxWidth: 40 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleBulletList().run()
                                    }}
                                    onClick={(e) => {
                                        if (e.detail !== 0) return
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
                                    aria-label={t.ordered_list}
                                    aria-pressed={isOrderedList}
                                    style={{ minWidth: 40, maxWidth: 40 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleOrderedList().run()
                                    }}
                                    onClick={(e) => {
                                        if (e.detail !== 0) return
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
                                    aria-label={t.bold}
                                    aria-pressed={isBold}
                                    style={{ minWidth: 40, maxWidth: 40 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleBold().run()
                                    }}
                                    onClick={(e) => {
                                        if (e.detail !== 0) return
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
                                    aria-label={t.italic}
                                    aria-pressed={isItalic}
                                    style={{ minWidth: 40, maxWidth: 40 }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleItalic().run()
                                    }}
                                    onClick={(e) => {
                                        if (e.detail !== 0) return
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
                                    aria-label={emptySelection ? t.empty_selection_link : t.link}
                                    aria-haspopup='dialog'
                                    aria-expanded={linkDialogOpen}
                                    startIcon={<LinkOutlineIcon width={24} height={24} />}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        openLinkDialog()
                                    }}
                                    onClick={(e) => {
                                        if (e.detail !== 0) return
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
                                        aria-label={t.more}
                                        role='combobox'
                                        aria-haspopup='listbox'
                                        aria-expanded={open}
                                        aria-controls={open ? overflowMenuId : undefined}
                                        aria-activedescendant={open ? activeOverflowItemId : undefined}
                                        onMouseDown={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            openOverflowMenu(e.currentTarget)
                                        }}
                                        onMouseUp={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                        }}
                                        onClick={(e) => {
                                            if (e.detail !== 0) return
                                            e.stopPropagation()
                                            e.preventDefault()
                                            openOverflowMenu(e.currentTarget)
                                        }}
                                        onKeyDown={handleOverflowKeyDown}
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
                            >
                                <ul id={overflowMenuId} role='listbox' aria-label={t.more} className='m-0 list-none p-0'>
                                    {overflowItems.map((item, index) => (
                                        <ToolbarOverflowItem
                                            key={item.key}
                                            id={`${overflowMenuId}-${item.key}`}
                                            title={item.title}
                                            disabled={item.disabled}
                                            selected={item.selected}
                                            active={keyboardOverflowActive && activeOverflowIndex === index}
                                            onSelect={() => selectOverflowItem(index, true)}
                                        >
                                            {item.children}
                                        </ToolbarOverflowItem>
                                    ))}
                                </ul>
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
                    onClick={(e) => {
                        if (e.detail !== 0) return
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
