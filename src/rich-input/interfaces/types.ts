import type { ChipProps } from '@mui/material'
import type { Editor, UseEditorOptions } from '@tiptap/react'
import type { RefObject } from 'react'

export interface CustomCSSProperties extends React.CSSProperties {
    '--max-scrollable-height'?: string
}

export type ILocale = 'en' | 'no'

export interface IRichInput extends UseEditorOptions {
    dataTest: string
    attachmentsMenu?: React.ReactNode
    replyModeComponent?: React.ReactNode
    inputRef?: RefObject<Editor | null>
    id?: string
    // label?: string // TODO: implement same label behavior like in MUI
    title?: string
    placeholder?: string
    /**
     * @description Use this to pass a dynamic placeholder that requires some derived state like isFocused
     */
    placeholderCallback?: (PlaceholderProps: { editor: Editor; pos: number; hasAnchor: boolean }) => string
    className?: string
    editorClassName?: string
    disabled?: boolean
    error?: boolean
    readOnly?: 'plain' | 'outlined'
    helperText?: string
    required?: boolean
    hideToolbar?: boolean
    noDefaultStyles?: boolean
    maxScrollableHeight?: number
    toolbarDefaultVisible?: boolean
    locale?: ILocale
    attachments?: (ChipProps & { key: string; dataTest: string })[]
    enableImageUpload?: boolean
    /**
     * Function to handle the actual file upload to the storage microservice.
     * Receives the raw File object, returns a Promise that resolves to the final URL.
     * @param file - The image file selected by the user.
     * @returns Promise<string> - The absolute URL to the uploaded image.
     *
     * @example
     * const handleImageUpload = async (file: File): Promise<string> => {
     *   const formData = new FormData();
     *   formData.append('file', file);
     *   const response = await axios.post('/api/upload', formData);
     *   return response.data.url; // e.g., "https://cdn.example.com/uploads/abc.png"
     * }
     */
    onImageUpload?: (file: File) => Promise<string>
    /**
     * Callback function triggered when an image upload fails.
     * Use this to display user-facing error messages (toasts, snackbars, etc.)
     *
     * @param error - The error that occurred during upload
     * @param file - The file that failed to upload (optional)
     *
     * @example
     * const handleImageUploadError = (error: Error, file?: File) => {
     *   processServerError(`Failed to upload ${file?.name || 'image'}: ${error.message}`);
     * };
     */
    onImageUploadError?: (error: Error, file?: File) => void
    /**
     * @description Enables YouTube extension for handling YouTube links
     */
    enableYoutube?: boolean
}
