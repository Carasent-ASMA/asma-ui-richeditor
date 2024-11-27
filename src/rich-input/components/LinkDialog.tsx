import type { Editor } from '@tiptap/react'
import { StyledButton, StyledDialog, StyledInputField } from 'asma-core-ui'
import React, { useLayoutEffect, useMemo, useState } from 'react'

import '../styles/toolbar.css'
import type { ILocale } from '../interfaces/types'

export const LinkDialog: React.FC<{
    open: boolean
    setOpen: (value: boolean) => void
    editor: Editor
    locale?: ILocale
}> = ({ open, setOpen, editor, locale }) => {
    const [url, setUrl] = useState('')
    const isNorsk = useMemo(() => locale === 'no', [locale])

    useLayoutEffect(() => {
        if (open) {
            const { from, to } = editor.state.selection
            let currentLink = null

            editor.state.doc.nodesBetween(from - 1, to, (node) => {
                if (node.marks) {
                    const linkMark = node.marks.find((mark) => mark.type.name === 'link')
                    if (linkMark) {
                        currentLink = linkMark.attrs['href']
                    }
                }
            })

            if (currentLink) setUrl(currentLink)
            else setUrl('')

            const input = document.querySelector('[data-test="link-input-field"]') as HTMLElement
            input?.focus()
        }
    }, [open, editor])

    const makeLink = () => {
        editor.chain().focus().setLink({ href: url }).run()
        setOpen(false)
        setUrl('')
    }

    return (
        <StyledDialog
            open={open}
            dataTest={'link-modal-rte'}
            onClose={() => setOpen(false)}
            className={'z-[99]'}
            dialogTitle={<div className={'text-gray-700'}>{isNorsk ? 'Legg til lenke' : 'Add link'}</div>}
        >
            <main className={'flex flex-col items-start justify-center p-0 gap-6 m-4 h-full'}>
                <div className='link-input-field'>
                    <StyledInputField
                        autoFocus
                        multiline
                        className='w-full'
                        dataTest={'link-input-field'}
                        size={'small'}
                        sx={{
                            '& .MuiInputBase-root': {
                                minHeight: 64,
                                alignItems: 'start',
                            },
                        }}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </div>
                <div className={'flex gap-2 p-0 w-full justify-end'}>
                    <StyledButton
                        dataTest={'delete-customer-reject-button'}
                        size={'medium'}
                        variant={'outlined'}
                        onClick={() => {
                            setOpen(false)
                            setUrl('')
                        }}
                    >
                        {isNorsk ? 'Avbryt' : 'Cancel'}
                    </StyledButton>
                    <StyledButton
                        dataTest={'delete-customer-confirm-button'}
                        size={'medium'}
                        variant={'contained'}
                        onClick={makeLink}
                    >
                        {isNorsk ? 'Legg til lenke' : 'Add link'}
                    </StyledButton>
                </div>
            </main>
        </StyledDialog>
    )
}
