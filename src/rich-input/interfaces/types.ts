import type { Editor, UseEditorOptions } from '@tiptap/react'
import type { YoutubeOptions } from '@tiptap/extension-youtube'
import type { RefObject } from 'react'
import type { ImageOptions } from '@tiptap/extension-image'
import type { FieldLabelPlacement, FieldWidth, StyledChipProps } from 'asma-ui-core'

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
    /** Field label, rendered above the field by default (see `labelPlacement`). */
    label?: string
    /**
     * @description `'above'` (default) renders `label` above the field like asma-ui-core fields.
     * `'floating'` keeps the MUI-style label that rests inside the empty field and shrinks onto the
     * top border once the editor is focused or has content (Figma DS "Rich text editor", node 20571-30699).
     */
    labelPlacement?: FieldLabelPlacement
    /**
     * Field width pattern step; Full by default. `readOnly='plain'` is static text, not a field: it
     * fills its container whatever the step.
     */
    width?: FieldWidth
    /** Accessible name for the editable editor host. Takes precedence over `label`. */
    'aria-label'?: string
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
    /**
     * A locked field (disabled-states DIS-9): editing is paused for now. Shows the outlined read-only
     * box with a lock icon, stays focusable, and the reason opens on hover, focus and tap and is the
     * editor's accessible description.
     */
    lockedReason?: React.ReactNode
    helperText?: string
    required?: boolean
    hideToolbar?: boolean
    noDefaultStyles?: boolean
    maxScrollableHeight?: number
    toolbarDefaultVisible?: boolean
    locale?: ILocale
    attachments?: (StyledChipProps & { key: string; dataTest: string })[]
    enableImageUpload?: boolean
    /**
     * @description Options for the image plugin
     */
    imageOptions?: Partial<ImageOptions>
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
    /**
     * @description Options for the youtube plugin
     */
    youtubeOptions?: Partial<YoutubeOptions>
}
