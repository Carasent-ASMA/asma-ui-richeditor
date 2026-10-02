import type { Meta, StoryObj } from '@storybook/react'
import { StyledButton } from 'asma-ui-core'
import { useState } from 'react'
import { RichInput } from 'src/rich-input/RichInput'

const meta = {
    title: '*/RichInput',
    component: RichInput,
    tags: [],
    argTypes: {},
    args: {},
} satisfies Meta<typeof RichInput>

function makeid(length: number) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    let counter = 0
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
        counter += 1
    }
    return result
}

export default meta
type Story = StoryObj<typeof meta>

export const Input2 = () => {
    const [placeholder, setPlaceholder] = useState('test')

    return (
        <div className='flex flex-col gap-4'>
            <StyledButton
                dataTest='placeholder-toggle'
                onClick={() => {
                    setPlaceholder(makeid(7))
                }}
            >
                toggle placeholder values
            </StyledButton>

            <RichInput dataTest='test' disabled onUpdate={() => undefined} content='Hello World' className='' />
            <RichInput
                dataTest='test'
                readOnly='outlined'
                onUpdate={() => undefined}
                content='Hello World'
                className=''
            />

            <RichInput
                dataTest='test'
                // content=""
                noDefaultStyles
                hideToolbar
                placeholder={placeholder}
            />
        </div>
    )
}

export const Accessibility: Story = {
    args: {
        dataTest: 'accessibility-story',
    },
    render: () => (
        <div style={{ width: 1000 }}>
            <RichInput
                dataTest='accessible-editor'
                label='Write a message'
                content='<p>Message content</p>'
                toolbarDefaultVisible
                enableImageUpload
                onImageUpload={async () => 'https://example.test/image.png'}
            />
            <RichInput dataTest='fallback-editor' content='<p>Message content</p>' />
            <RichInput dataTest='read-only-content' readOnly='plain' content='<p>Sent message</p>' />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await new Promise<void>((resolve) => setTimeout(resolve, 250))

        const editableEditor = canvasElement.querySelector<HTMLElement>('[contenteditable="true"]')
        const fallbackEditor = canvasElement.querySelectorAll<HTMLElement>('[contenteditable="true"]')[1]
        const readOnlyEditor = canvasElement.querySelector<HTMLElement>('[contenteditable="false"]')
        const formatButton = canvasElement.querySelector<HTMLButtonElement>('[data-test="richeditor-format-button"]')
        const imageUploadButton = canvasElement.querySelector<HTMLButtonElement>('[data-test="rich-editor-image-upload"]')

        if (editableEditor?.getAttribute('aria-label') !== 'Write a message') {
            throw new Error('The editable RichInput must expose its label as an accessible name.')
        }
        if (fallbackEditor?.getAttribute('aria-label') !== 'Rich text editor') {
            throw new Error('An editable RichInput without a supplied name must expose the localized fallback name.')
        }
        if (!formatButton || formatButton.getAttribute('aria-label') !== 'Show formatting options') {
            throw new Error('The format toggle must have an accessible name.')
        }
        if (formatButton.tagName !== 'BUTTON') {
            throw new Error('The format toggle must use a native keyboard-operable button.')
        }
        if (!imageUploadButton || imageUploadButton.getAttribute('aria-label') !== 'Upload image') {
            throw new Error('The image-upload button must have an accessible name.')
        }

        if (readOnlyEditor?.hasAttribute('role') || readOnlyEditor?.hasAttribute('tabindex')) {
            throw new Error('Read-only RichInput content must not expose textbox or tabindex semantics.')
        }
    },
}
