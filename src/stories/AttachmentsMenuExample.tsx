import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'

const handleDocumentUploadFromComputer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return []
    return Array.from(files).map((file) => ({
        file,
        title: file.name,
        extension: 'PDF' as const,
    }))
}

export const AttachmentsMenu = ({
    inputId = 'storybook-upload',
    uploadAttachment = (fileObj: unknown) => console.log('Uploading:', fileObj),
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement | SVGSVGElement>(null)

    const open = Boolean(anchorEl)

    const handleClose = () => {
        setAnchorEl(null)
    }

    // Mock flags
    const doesNotHaveActiveDocumentPickers = false
    const isEnabledDocumentUploadFromLocalPicker = true

    return (
        <>
            <label htmlFor={inputId}>
                <Icon className='cursor-pointer text-delta-700 h-6 w-6 min-w-6 m-1' icon='ic:baseline-attach-file' />
                <input
                    hidden
                    multiple
                    type='file'
                    id={inputId}
                    onChange={(e) => {
                        const attachments = handleDocumentUploadFromComputer(e)
                        attachments.forEach(uploadAttachment)
                        e.target.value = ''
                    }}
                />
            </label>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <MenuItem
                    onClick={() => {
                        console.log('Insert questionnaire command')
                        handleClose()
                    }}
                >
                    <ListItemText>Insert Questionnaire</ListItemText>
                </MenuItem>

                {doesNotHaveActiveDocumentPickers && (
                    <MenuItem disabled>
                        <span>Document upload not available</span>
                    </MenuItem>
                )}

                {isEnabledDocumentUploadFromLocalPicker && (
                    <label htmlFor={inputId}>
                        <MenuItem>
                            <ListItemIcon>
                                <Icon
                                    icon='material-symbols:sync-saved-locally-outline'
                                    width='24'
                                    height='24'
                                    color='#1C1B1F'
                                />
                            </ListItemIcon>
                            <ListItemText>Upload from your device</ListItemText>
                            <input
                                hidden
                                multiple
                                type='file'
                                id={inputId}
                                onChange={(e) => {
                                    const attachments = handleDocumentUploadFromComputer(e)
                                    attachments.forEach(uploadAttachment)
                                    e.target.value = ''
                                    handleClose()
                                }}
                            />
                        </MenuItem>
                    </label>
                )}
            </Menu>
        </>
    )
}
