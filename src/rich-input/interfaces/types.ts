import type { Editor, UseEditorOptions } from '@tiptap/react'
import type { YoutubeOptions } from '@tiptap/extension-youtube'
import type { RefObject } from 'react'
import type { ImageOptions } from '@tiptap/extension-image'
import type { FieldLabelPlacement, FieldWidth, StyledChipProps } from 'asma-ui-core'

export interface CustomCSSProperties extends React.CSSProperties {
    '--max-scrollable-height'?: string
}

export type ILocale = 'en' | 'no'

/** A pixel number, `'none'` (no cap) or a CSS length such as `'min(400px, 40dvh)'`. `Infinity` means `'none'`. */
export type RichInputMaxHeight = number | string

/** A cap per breakpoint, from the shared asma-types breakpoints. */
export interface RichInputResponsiveMaxHeight {
    /** Mobile, 0–743px. Omitted: no cap on mobile. */
    mobile?: RichInputMaxHeight
    /** Tablet and wider, from 744px. Omitted: the `mobile` value. */
    tablet?: RichInputMaxHeight
}

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
    /**
     * @description Legacy cap on the text area alone, in pixels; the toolbar, attachment chips and reply
     * header add to it. Omitted or `0` keeps the 100px default, `Infinity` removes the cap. Ignored when
     * `maxFieldHeight` is set; prefer `maxFieldHeight` in new code.
     */
    maxScrollableHeight?: number
    /**
     * @description Cap on the whole field: reply header, text, attachment chips and toolbar. Past the cap
     * the text scrolls inside the field and shows a visible scrollbar and edge fade, and the field is never
     * taller than the screen. Takes a pixel number, a CSS length such as `'min(400px, 40dvh)'`, a
     * per-breakpoint object such as `{ mobile: 300, tablet: 400 }` (the chat composer), or `'none'`: the
     * field grows with its content and the toolbar or format button sticks to the bottom of the view
     * while the field is in it. `Infinity` means `'none'`. Ignored when `readOnly` (read-only text is
     * always shown in full) and with `noDefaultStyles`.
     */
    maxFieldHeight?: RichInputMaxHeight | RichInputResponsiveMaxHeight
    toolbarDefaultVisible?: boolean
    locale?: ILocale
    attachments?: (StyledChipProps & { key: string; dataTest: string })[]
    /**
     * @description Enables the image node and the toolbar upload control. The user can add and
     * replace images; an `onImageUpload` implementation is required.
     */
    enableImageUpload?: boolean
    /**
     * @description Text shown as a tooltip on hover and keyboard focus of the image upload button,
     * and exposed as the button's accessible description. When it is omitted (or blank), the
     * button renders exactly as before: no tooltip and no extra attributes.
     */
    imageUploadTooltip?: string
    /**
     * @description Enables the image node for parsing and rendering only. Existing `<img>` content
     * survives edits and read-only views, but no upload control is rendered. Use this for answers
     * and viewers that may display images without allowing the user to add them.
     */
    enableImageRendering?: boolean
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
     * @description Enables YouTube embeds: existing embeds render and pasted YouTube URLs are
     * converted automatically.
     */
    enableYoutube?: boolean
    /**
     * @description Enables the YouTube node for parsing and rendering only. Existing embeds render,
     * but pasted links are left as plain text and no embed UI is offered. Use this where video is
     * displayed but not authored.
     */
    enableYoutubeRendering?: boolean
    /**
     * @description Options for the youtube plugin
     */
    youtubeOptions?: Partial<YoutubeOptions>
}
