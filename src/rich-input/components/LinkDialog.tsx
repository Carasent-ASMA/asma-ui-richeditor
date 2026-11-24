import type { Editor } from '@tiptap/react'
import { StyledButton, StyledDialog, StyledDialogContent, StyledInputField } from 'asma-ui-core'
import React, { useLayoutEffect, useRef, useState } from 'react'
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
    const [urlError, setUrlError] = useState<string | undefined>(undefined)
    const urlInputRef = useRef<HTMLTextAreaElement>(null)
    const t = useTranslations(locale)

    const validateUrl = (value: string): string | undefined => {
        const trimmed = value.trim()
        if (!trimmed) return t.link_url_required
        return isValidUrl(trimmed) ? undefined : t.link_url_invalid
    }

    const isUrlValid = validateUrl(url) === undefined

    // ADR-0017 REQ-005: aria-invalid tracks real validity at all times, independently of whether
    // the error is visible yet. ui-core derives aria-invalid from `error`, which must stay on the
    // blur/submit timing, so publish validity on the same control through the field's inputRef.
    useLayoutEffect(() => {
        const input = urlInputRef.current
        if (!input) return
        if (isUrlValid) input.removeAttribute('aria-invalid')
        else input.setAttribute('aria-invalid', 'true')
    }, [open, isUrlValid])

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
            setUrlError(undefined)

            const input = document.querySelector('[data-test="link-input-field"]') as HTMLElement
            input?.focus()
        }
    }, [open, editor])

    // ADR-0017 REQ-001/REQ-002: blur or submit introduces an error; a change only
    // re-validates an error that is already visible, so it can clear it but never create one.
    const handleUrlChange = (value: string) => {
        setUrl(value)
        setUrlError((previous) => (previous ? validateUrl(value) : undefined))
    }

    const makeLink = () => {
        const nextError = validateUrl(url)
        if (nextError) {
            setUrlError(nextError)
            urlInputRef.current?.focus()
            return
        }
        editor.chain().focus().setLink({ href: url.trim() }).run()
        setOpen(false)
        setUrl('')
        setUrlError(undefined)
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
                        inputRef={urlInputRef}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        onBlur={() => setUrlError(validateUrl(url))}
                        error={!!urlError}
                        helperText={urlError}
                        reserveHelperText
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
                        setUrlError(undefined)
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
