import { Editor } from '@tiptap/react'
import { DotsVerticalIcon, LinkOutlineIcon, StyledButton, StyledMenuItem } from 'asma-core-ui'
import '../styles/toolbar.css'
import { Icon } from '@iconify/react'
import clsx from 'clsx'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Popover, Tooltip } from '@mui/material'
import { useToggleMenuVisibility } from '../hooks/useToggleMenuVisibility.hook'
import type { ILocale } from '../interfaces/types'
import { CustomMenuItem } from 'src/rich-input/components/CustomMenuItem'
import { FontSizeSelect } from 'src/rich-input/components/FontSizeSelect'

export const Toolbar = ({
    editor,
    onClose,
    error,
    focused,
    openLinkDialog,
    openEmojiPicker,
    locale,
}: {
    editor: Editor
    onClose: () => void
    error?: boolean
    focused: boolean
    openLinkDialog: () => void
    openEmojiPicker: () => void
    locale?: ILocale
}) => {
    const [visibleButtons, setVisibleButtons] = useState<number>(0)
    const toolbarRef = useRef<HTMLDivElement | null>(null)

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
                    { width: Infinity, buttons: 8 },
                ]

                const visibleButtons = buttonVisibilityMap.find((item) => width < item.width)?.buttons
                setVisibleButtons(visibleButtons !== undefined ? visibleButtons : 8)

                const newHiddenButtons = []

                if (Number(visibleButtons) < 8) {
                    newHiddenButtons.push(
                        <Tooltip key='link' title='Link' placement='top' arrow>
                            <span>
                                <StyledMenuItem
                                    className='flex items-center justify-center'
                                    key='link'
                                    onClick={openLinkDialog}
                                    selected={editor.isActive('link')}
                                >
                                    <LinkOutlineIcon />
                                </StyledMenuItem>
                            </span>
                        </Tooltip>,
                    )
                }
                if (Number(visibleButtons) < 7) {
                    newHiddenButtons.push(
                        <Tooltip key='italic' title='Italic' placement='top' arrow>
                            <span>
                                <StyledMenuItem
                                    className='flex items-center justify-center'
                                    key='italic'
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                    selected={editor.isActive('italic')}
                                >
                                    <Icon icon='material-symbols:format-italic' height={20} />
                                </StyledMenuItem>
                            </span>
                        </Tooltip>,
                    )
                }
                if (Number(visibleButtons) < 6) {
                    newHiddenButtons.push(
                        <Tooltip key='bold' title='Bold' placement='top' arrow>
                            <span>
                                <StyledMenuItem
                                    className='flex items-center justify-center'
                                    key='bold'
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                    selected={editor.isActive('bold')}
                                >
                                    <Icon icon='ooui:bold-b' />
                                </StyledMenuItem>
                            </span>
                        </Tooltip>,
                    )
                }
                if (Number(visibleButtons) < 5) {
                    newHiddenButtons.push(
                        <Tooltip key='ordered' title='Ordered list' placement='top' arrow>
                            <span>
                                <StyledMenuItem
                                    className='flex items-center justify-center'
                                    key='ordered'
                                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                    selected={editor.isActive('orderedList')}
                                >
                                    <Icon icon='mdi:format-list-numbered' fontSize={20} />
                                </StyledMenuItem>
                            </span>
                        </Tooltip>,
                    )
                }
                if (Number(visibleButtons) < 4) {
                    newHiddenButtons.push(
                        <Tooltip key='bullet' title='Bullet list' placement='top' arrow>
                            <span>
                                <StyledMenuItem
                                    className='flex items-center justify-center'
                                    key='bullet'
                                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                                    selected={editor.isActive('bulletList')}
                                >
                                    <Icon icon='mdi:format-list-bulleted' fontSize={20} />
                                </StyledMenuItem>
                            </span>
                        </Tooltip>,
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
                        <Tooltip arrow title='Emojis' placement='top'>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-emoji-button'
                                    size='small'
                                    variant='textGray'
                                    onClick={openEmojiPicker}
                                    style={{ minWidth: 32, padding: 0 }}
                                >
                                    <Icon icon='mdi:emoticon-outline' fontSize={20} />
                                </StyledButton>
                            </span>
                        </Tooltip>
                    )}
                    {visibleButtons >= 2 && (
                        <Tooltip title='Heading 1' placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-h1-button'
                                    size='small'
                                    variant={editor.isActive('heading', { level: 1 }) ? 'text' : 'textGray'}
                                    onClick={() => {
                                        editor.chain().focus().setMark('textStyle', { fontSize: undefined }).run()
                                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                                    }}
                                >
                                    <Icon icon='bi:type-h1' />
                                </StyledButton>
                            </span>
                        </Tooltip>
                    )}
                    {visibleButtons >= 3 && (
                        <Tooltip title='Heading 2' placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-h2-button'
                                    size='small'
                                    variant={editor.isActive('heading', { level: 2 }) ? 'text' : 'textGray'}
                                    onClick={() => {
                                        editor.chain().focus().setMark('textStyle', { fontSize: undefined }).run()
                                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                                    }}
                                >
                                    <Icon icon='bi:type-h2' />
                                </StyledButton>
                            </span>
                        </Tooltip>
                    )}
                    {visibleButtons >= 4 && (
                        <Tooltip title='Font size' placement='top' arrow>
                            <span>
                                <FontSizeSelect editor={editor}>
                                    <CustomMenuItem value='small'>{isNorsk ? 'Liten' : 'Small'}</CustomMenuItem>
                                    <CustomMenuItem value='normal'>{'Normal'}</CustomMenuItem>
                                    <CustomMenuItem value='large'>{isNorsk ? 'Stor' : 'Large'}</CustomMenuItem>
                                    <CustomMenuItem value='huge'>{isNorsk ? 'Enorm' : 'Huge'}</CustomMenuItem>
                                </FontSizeSelect>
                            </span>
                        </Tooltip>
                    )}
                    {visibleButtons >= 5 && (
                        <Tooltip title='Bullet list' placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-bullet-list-button'
                                    size='small'
                                    variant={editor.isActive('bulletList') ? 'text' : 'textGray'}
                                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                                >
                                    <Icon icon='mdi:format-list-bulleted' fontSize={20} />
                                </StyledButton>
                            </span>
                        </Tooltip>
                    )}
                    {visibleButtons >= 6 && (
                        <Tooltip title='Ordered list' placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-ordered-list-button'
                                    size='small'
                                    variant={editor.isActive('orderedList') ? 'text' : 'textGray'}
                                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                >
                                    <Icon icon='mdi:format-list-numbered' fontSize={20} />
                                </StyledButton>
                            </span>
                        </Tooltip>
                    )}
                    {visibleButtons >= 7 && (
                        <Tooltip title='Bold' placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-bold-button'
                                    size='small'
                                    variant={editor.isActive('bold') ? 'text' : 'textGray'}
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                >
                                    <Icon icon='ooui:bold-b' />
                                </StyledButton>
                            </span>
                        </Tooltip>
                    )}
                    {visibleButtons >= 8 && (
                        <Tooltip title='Italic' placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-italic-button'
                                    size='small'
                                    variant={editor.isActive('italic') ? 'text' : 'textGray'}
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                >
                                    <Icon icon='material-symbols:format-italic' height={20} />
                                </StyledButton>
                            </span>
                        </Tooltip>
                    )}
                    {visibleButtons >= 9 && (
                        <Tooltip title='Link' placement='top' arrow>
                            <span>
                                <StyledButton
                                    dataTest='richeditor-link-button'
                                    size='small'
                                    variant={editor.isActive('link') ? 'text' : 'textGray'}
                                    onClick={openLinkDialog}
                                >
                                    <LinkOutlineIcon />
                                </StyledButton>
                            </span>
                        </Tooltip>
                    )}
                    {actionsVisible && (
                        <>
                            <Tooltip title='More' placement='top' arrow>
                                <span>
                                    <StyledButton
                                        size='small'
                                        dataTest='richeditor-more-menu-button'
                                        variant='text'
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            handleOpen(e)
                                        }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                        }}
                                        onMouseUp={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                        }}
                                    >
                                        <DotsVerticalIcon className='text-delta-800' width={20} height={20} />
                                    </StyledButton>
                                </span>
                            </Tooltip>
                            <Popover
                                open={open}
                                anchorEl={anchorEl}
                                onClose={handleClose}
                                onClick={handleClose}
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
                            </Popover>
                        </>
                    )}
                </div>
                <StyledButton dataTest='richeditor-close-toolbar-button' size='small' variant='text' onClick={onClose}>
                    {isNorsk ? 'Lukk' : 'Close'}
                </StyledButton>
            </div>
        </>
    )
}
