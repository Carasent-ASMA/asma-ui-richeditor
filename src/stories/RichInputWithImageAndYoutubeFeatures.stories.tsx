import type { Meta, StoryObj } from '@storybook/react'
import { RichInput } from '../rich-input/RichInput'
import { useState } from 'react'

/**
 * Mock image upload handler for Storybook.
 * Creates an object URL from the selected file, simulating a successful upload.
 */
const mockImageUpload = async (file: File): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return URL.createObjectURL(file)
}

/**
 * Mock error handler to show how errors are surfaced.
 */
const mockImageUploadError = (error: Error, file?: File) => {
    console.error('Upload error:', error.message, file?.name)
}

const meta: Meta<typeof RichInput> = {
    title: '*/RichInput/Features',
    component: RichInput,
    parameters: {
        layout: 'padded',
    },
    argTypes: {
        enableImageUpload: { control: 'boolean' },
        enableYoutube: { control: 'boolean' },
        readOnly: { control: 'select', options: ['plain', 'outlined', undefined] },
    },
}

export default meta
type Story = StoryObj<typeof RichInput>

export const ImageUpload: Story = {
    render: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [content, setContent] = useState('<p>Click the paperclip icon to upload an image or GIF.</p>')

        return (
            <div className='flex flex-col gap-4 max-w-2xl'>
                <RichInput
                    dataTest='image-upload-input'
                    enableImageUpload
                    onImageUpload={mockImageUpload}
                    onImageUploadError={mockImageUploadError}
                    content={content}
                    onUpdate={({ editor }) => setContent(editor.getHTML())}
                    placeholder='Write something…'
                    helperText='Upload images or GIFs directly into the editor'
                />
                <div className='text-sm text-gray-500'>
                    <p>Current content:</p>
                    <pre className='bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40'>{content}</pre>
                </div>
            </div>
        )
    },
    parameters: {
        docs: {
            description: {
                story: 'When `enableImageUpload` is `true`, the paperclip icon opens a file picker for images. The `onImageUpload` prop handles the actual upload and returns a URL. A loading spinner appears during upload.',
            },
        },
    },
}

export const YoutubeEmbed: Story = {
    render: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [content, setContent] = useState('<p>Paste a YouTube URL here to embed it.</p>')

        return (
            <div className='flex flex-col gap-4 max-w-2xl'>
                <RichInput
                    dataTest='youtube-embed-input'
                    enableYoutube
                    content={content}
                    onUpdate={({ editor }) => setContent(editor.getHTML())}
                    placeholder='Paste a YouTube URL…'
                    helperText='Paste any YouTube video URL to embed it'
                />
                <div className='text-sm text-gray-500'>
                    <p>Current content:</p>
                    <pre className='bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40'>{content}</pre>
                </div>
            </div>
        )
    },
    parameters: {
        docs: {
            description: {
                story: 'When `enableYoutube` is `true`, the editor automatically detects pasted YouTube URLs and converts them into embedded videos. You can also use the toolbar button (if the toolbar is visible) to insert a video manually.',
            },
        },
    },
}

export const BothFeatures: Story = {
    render: () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [content, setContent] = useState('<p>Try uploading an image or pasting a YouTube URL.</p>')

        return (
            <div className='flex flex-col gap-4 max-w-2xl'>
                <RichInput
                    dataTest='rich-input'
                    enableImageUpload
                    onImageUpload={mockImageUpload}
                    onImageUploadError={mockImageUploadError}
                    enableYoutube
                    content={content}
                    onUpdate={({ editor }) => setContent(editor.getHTML())}
                    placeholder='Write, upload images, or paste YouTube links…'
                />
                <div className='text-sm text-gray-500'>
                    <p>Current content:</p>
                    <pre className='bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40'>{content}</pre>
                </div>
            </div>
        )
    },
}
