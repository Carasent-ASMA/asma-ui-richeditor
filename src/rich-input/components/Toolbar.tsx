import { Editor } from '@tiptap/react'
import {
    DotsVerticalIcon,
    LinkOutlineIcon,
    StyledButton,
    StyledMenuItem,
    StyledPopover,
    StyledTooltip,
} from 'asma-core-ui'
import '../styles/toolbar.css'
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useToggleMenuVisibility } from '../hooks/useToggleMenuVisibility.hook'
import type { ILocale } from '../interfaces/types'
import { FontSizeSelect } from 'src/rich-input/components/FontSizeSelect'
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
    emojiButtonRef?: React.RefObject<HTMLSpanElement>
}) => {
    const [visibleButtons, setVisibleButtons] = useState<number>(0)
    const toolbarRef = useRef<HTMLDivElement | null>(null)

    const t = useTranslations(locale)

    const isNorsk = useMemo(() => locale === 'no', [locale])

    const [actionsVisible, setActionsVisible] = useState(false)
    const [hiddenButtons, setHiddenButtons] = useState<Array<JSX.Element>>([])

    useLayoutEffect(() => {
        const observer = new ResizeObserver(() => {
            if (toolbarRef.current) {
                const width = toolbarRef.current.clientWidth

                if (width < (isNorsk ? 416 : 420)) setActionsVisible(true)
                else setActionsVisible(false)

                const buttonVisibilityMap = [
                    // { width: 156, buttons: 0 },
                    // { width: 192, buttons: 1 },
                    // { width: 270, buttons: 2 },
                    { width: isNorsk ? 296 : 300, buttons: 3 },
                    { width: isNorsk ? 340 : 342, buttons: 4 },
                    { width: isNorsk ? 374 : 378, buttons: 5 },
                    { width: isNorsk ? 416 : 420, buttons: 6 },
                    { width: isNorsk ? 416 : 420, buttons: 7 },
                    { width: Infinity, buttons: 9 },
                ]

                const visibleButtons = buttonVisibilityMap.find((item) => width < item.width)?.buttons
                setVisibleButtons(visibleButtons !== undefined ? visibleButtons : 8)

                const newHiddenButtons = []

                if (Number(visibleButtons) < 8) {
                    newHiddenButtons.push(
                        <StyledTooltip key='link' title={t.link} placement='top' arrow>
                            <span>
                                <StyledMenuItem
                                    className='flex items-center justify-center'
                                    key='link'
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        openLinkDialog()
                                    }}
                                    selected={editor.isActive('link')}
                                >
                                    <LinkOutlineIcon />
                                </StyledMenuItem>
                            </span>
                        </StyledTooltip>,
                    )
                }
                if (Number(visibleButtons) < 7) {
                    newHiddenButtons.push(
                        <StyledTooltip key='italic' title={t.italic} placement='top' arrow>
                            <span>
                                <StyledMenuItem
                                    className='flex items-center justify-center'
                                    key='italic'
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleItalic().run()
                                    }}
                                    selected={editor.isActive('italic')}
                                >
                                    <Icon icon='material-symbols:format-italic' height={20} />
                                </StyledMenuItem>
                            </span>
                        </StyledTooltip>,
                    )
                }
                if (Number(visibleButtons) < 6) {
                    newHiddenButtons.push(
                        <StyledTooltip key='bold' title={t.bold} placement='top' arrow>
                            <span>
                                <StyledMenuItem
                                    className='flex items-center justify-center'
                                    key='bold'
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleBold().run()
                                    }}
                                    selected={editor.isActive('bold')}
                                >
                                    <Icon icon='ooui:bold-b' />
                                </StyledMenuItem>
                            </span>
                        </StyledTooltip>,
                    )
                }
                if (Number(visibleButtons) < 5) {
                    newHiddenButtons.push(
                        <StyledTooltip key='ordered' title={t.ordered_list} placement='top' arrow>
                            <span>
                                <StyledMenuItem
                                    className='flex items-center justify-center'
                                    key='ordered'
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleOrderedList().run()
                                    }}
                                    selected={editor.isActive('orderedList')}
                                >
                                    <Icon icon='mdi:format-list-numbered' fontSize={20} />
                                </StyledMenuItem>
                            </span>
                        </StyledTooltip>,
                    )
                }
                if (Number(visibleButtons) < 4) {
                    newHiddenButtons.push(
                        <StyledTooltip key='bullet' title={t.bullet_list} placement='top' arrow>
                            <span>
                                <StyledMenuItem
                                    className='flex items-center justify-center'
                                    key='bullet'
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleBulletList().run()
                                    }}
                                    selected={editor.isActive('bulletList')}
                                >
                                    <Icon icon='mdi:format-list-bulleted' fontSize={20} />
                                </StyledMenuItem>
                            </span>
                        </StyledTooltip>,
                    )
                }

                setHiddenButtons(newHiddenButtons)
            }
        })

        if (toolbarRef.current) {
            observer.observe(toolbarRef.current)
        }

        return () => observer.disconnect()
    }, [editor, openLinkDialog, isNorsk])

    const { anchorEl, open, handleClose, handleOpen } = useToggleMenuVisibility()

    return (
        <>
            <div className={clsx('toolbar', { 'toolbar-error': error, 'toolbar-focused': focused })} ref={toolbarRef}>
                <div className='flex flex-row items-center gap-1'>
                    {visibleButtons >= 1 && (
                        <StyledTooltip arrow title={t.emojis} placement='top'>
                            <span ref={emojiButtonRef}>
                                <StyledButton
                                    dataTest='richeditor-emoji-button'
                                    size='small'
                                    variant='textGray'
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        openEmojiPicker()
                                    }}
                                    style={{ minWidth: 32, padding: 0 }}
                                >
                                    <Icon icon='mdi:emoticon-outline' fontSize={20} />
                                </StyledButton>
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 2 && (
                        <StyledTooltip title={t.heading1} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-h1-button'
                                    size='small'
                                    variant={editor.isActive('heading', { level: 1 }) ? 'text' : 'textGray'}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().setMark('textStyle', { fontSize: undefined }).run()
                                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                                    }}
                                >
                                    <Icon icon='bi:type-h1' />
                                </StyledButton>
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 3 && (
                        <StyledTooltip title={t.heading2} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-h2-button'
                                    size='small'
                                    variant={editor.isActive('heading', { level: 2 }) ? 'text' : 'textGray'}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().setMark('textStyle', { fontSize: undefined }).run()
                                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                                    }}
                                >
                                    <Icon icon='bi:type-h2' />
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
                                    size='small'
                                    variant={editor.isActive('bulletList') ? 'text' : 'textGray'}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleBulletList().run()
                                    }}
                                >
                                    <Icon icon='mdi:format-list-bulleted' fontSize={20} />
                                </StyledButton>
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 6 && (
                        <StyledTooltip title={t.ordered_list} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-ordered-list-button'
                                    size='small'
                                    variant={editor.isActive('orderedList') ? 'text' : 'textGray'}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleOrderedList().run()
                                    }}
                                >
                                    <Icon icon='mdi:format-list-numbered' fontSize={20} />
                                </StyledButton>
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 7 && (
                        <StyledTooltip title={t.bold} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-bold-button'
                                    size='small'
                                    variant={editor.isActive('bold') ? 'text' : 'textGray'}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleBold().run()
                                    }}
                                >
                                    <Icon icon='ooui:bold-b' />
                                </StyledButton>
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 8 && (
                        <StyledTooltip title={t.italic} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-italic-button'
                                    size='small'
                                    variant={editor.isActive('italic') ? 'text' : 'textGray'}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        editor.chain().focus().toggleItalic().run()
                                    }}
                                >
                                    <Icon icon='material-symbols:format-italic' height={20} />
                                </StyledButton>
                            </span>
                        </StyledTooltip>
                    )}
                    {visibleButtons >= 9 && (
                        <StyledTooltip title={t.link} placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-link-button'
                                    size='small'
                                    variant={editor.isActive('link') ? 'text' : 'textGray'}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        openLinkDialog()
                                    }}
                                >
                                    <LinkOutlineIcon />
                                </StyledButton>
                            </span>
                        </StyledTooltip>
                    )}
                    {actionsVisible && (
                        <>
                            <StyledTooltip title={t.more} placement='top' arrow>
                                <span>
                                    <StyledButton
                                        size='small'
                                        dataTest='richeditor-more-menu-button'
                                        variant='text'
                                        onMouseDown={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            handleOpen(e)
                                        }}
                                        onMouseUp={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                        }}
                                    >
                                        <DotsVerticalIcon className='text-delta-800' width={20} height={20} />
                                    </StyledButton>
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
                                anchorOrigin={{
                                    horizontal: 'center',
                                    vertical: 'bottom',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                            >
                                {hiddenButtons}
                            </StyledPopover>
                        </>
                    )}
                </div>
                <StyledButton
                    dataTest='richeditor-close-toolbar-button'
                    size='small'
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
