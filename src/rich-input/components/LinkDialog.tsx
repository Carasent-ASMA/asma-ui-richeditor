import type { Editor } from '@tiptap/react'
import { StyledButton, StyledDialog, StyledDialogContent, StyledInputField } from 'asma-ui-core'
import React, { useLayoutEffect, useState } from 'react'
import '../styles/toolbar.css'
import type { ILocale } from '../interfaces/types'
import { useTranslations } from './useTranslations'

const isValidUrl = (value: string): boolean => {
    try {
        const parsed = new URL(value)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

export const LinkDialog: React.FC<{
    open: boolean
    setOpen: (value: boolean) => void
    editor: Editor
    locale?: ILocale
}> = ({ open, setOpen, editor, locale }) => {
    const [url, setUrl] = useState('')
    const [touched, setTouched] = useState(false)
    const t = useTranslations(locale)

    const trimmedUrl = url.trim()
    const urlError = !trimmedUrl ? t.link_url_required : !isValidUrl(trimmedUrl) ? t.link_url_invalid : undefined

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
            setTouched(false)

            const input = document.querySelector('[data-test="link-input-field"]') as HTMLElement
            input?.focus()
        }
    }, [open, editor])

    const makeLink = () => {
        if (urlError) {
            setTouched(true)
            return
        }
        editor.chain().focus().setLink({ href: trimmedUrl }).run()
        setOpen(false)
        setUrl('')
        setTouched(false)
    }

    return (
        <StyledDialog
            open={open}
            dataTest={'link-modal-rte'}
            onClose={() => setOpen(false)}
            className={'z-[99]'}
            dialogTitle={<div className={'text-gray-700'}>{t.add_link}</div>}
        >
            <StyledDialogContent className='border-b border-solid border-delta-200 mt-4'>
                <div className='link-input-field'>
                    <StyledInputField
                        autoFocus
                        multiline
                        className='w-full'
                        dataTest={'link-input-field'}
                        size={'small'}
                        minRows={2}
                        aria-label={t.link_url}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onBlur={() => setTouched(true)}
                        error={touched && !!urlError}
                        helperText={touched ? urlError : undefined}
                    />
                </div>
            </StyledDialogContent>

            <div className='flex justify-end gap-2 p-4'>
                <StyledButton
                    dataTest={'delete-customer-reject-button'}
                    size={'medium'}
                    variant={'outlined'}
                    onClick={() => {
                        setOpen(false)
                        setUrl('')
                        setTouched(false)
                    }}
                >
                    {t.cancel}
                </StyledButton>
                <StyledButton
                    dataTest={'delete-customer-confirm-button'}
                    size={'medium'}
                    variant={'contained'}
                    onClick={makeLink}
                >
                    {t.add_link}
                </StyledButton>
            </div>
        </StyledDialog>
    )
}
