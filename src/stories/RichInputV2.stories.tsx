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

const accessibleNameOf = (element: HTMLElement) => {
    const labelledBy = element.getAttribute('aria-labelledby')
    if (!labelledBy) return element.getAttribute('aria-label')
    const label = element.ownerDocument.getElementById(labelledBy)?.cloneNode(true) as HTMLElement | undefined
    label?.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove())
    return label?.textContent?.trim()
}

const textboxOf = (canvasElement: HTMLElement, dataTest: string) => {
    const textbox = canvasElement.querySelector<HTMLElement>(`[data-test="${dataTest}"] [role="textbox"]`)
    if (!textbox) throw new Error(`No textbox for ${dataTest}.`)
    return textbox
}

const fieldRootOf = (canvasElement: HTMLElement, dataTest: string) => {
    const root = canvasElement
        .querySelector<HTMLElement>(`[data-test="${dataTest}"]`)
        ?.closest<HTMLElement>('[data-field-width]')
    if (!root) throw new Error(`No field root for ${dataTest}.`)
    return root
}

const waitForEditors = () => new Promise<void>((resolve) => setTimeout(resolve, 250))

export const FieldWidth: Story = {
    args: {
        dataTest: 'field-width-story',
    },
    render: () => (
        <div className='flex flex-col gap-4' style={{ width: 1000 }}>
            <RichInput dataTest='width-default' label='Full (default)' content='<p>Full</p>' />
            <RichInput dataTest='width-m' width='m' label='M' content='<p>M</p>' />
            <RichInput dataTest='width-s' width='s' label='S' content='<p>S</p>' />
            <RichInput dataTest='width-xs' width='xs' label='XS' content='<p>XS</p>' />
            <RichInput
                dataTest='width-plain'
                readOnly='plain'
                content='<p>Plain read-only text fills its container.</p>'
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitForEditors()

        const expected: [string, string, string][] = [
            ['width-default', 'full', '600px'],
            ['width-m', 'm', '320px'],
            ['width-s', 's', '200px'],
            ['width-xs', 'xs', '128px'],
        ]
        for (const [dataTest, step, maxWidth] of expected) {
            const root = fieldRootOf(canvasElement, dataTest)
            if (root.getAttribute('data-field-width') !== step) {
                throw new Error(`${dataTest} must render the ${step} width step.`)
            }
            if (
                getComputedStyle(root).maxWidth !== maxWidth ||
                root.getBoundingClientRect().width !== parseInt(maxWidth)
            ) {
                throw new Error(`${dataTest} must be ${maxWidth} wide in a wider container.`)
            }
        }

        const plainRoot = fieldRootOf(canvasElement, 'width-plain')
        if (getComputedStyle(plainRoot).maxWidth !== 'none' || plainRoot.getBoundingClientRect().width !== 1000) {
            throw new Error('Plain read-only content is static text and must fill its container.')
        }
    },
}

export const LabelPlacement: Story = {
    args: {
        dataTest: 'label-placement-story',
    },
    render: () => (
        <div className='flex flex-col gap-6'>
            <RichInput dataTest='label-above' label='Message' required content='' />
            <RichInput dataTest='label-floating' label='Floating message' labelPlacement='floating' content='' />
            <RichInput dataTest='label-above-aria' label='Visible label' aria-label='Explicit name' content='' />
            <RichInput dataTest='label-above-disabled' label='Disabled message' disabled content='<p>x</p>' />
            <RichInput dataTest='title-and-label' title='Note' label='Message to the patient' content='' />
            <RichInput dataTest='title-same-as-label' title='Comment' label='Comment' content='' />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await waitForEditors()

        const above = textboxOf(canvasElement, 'label-above')
        const aboveLabel = fieldRootOf(canvasElement, 'label-above').querySelector('label')
        if (aboveLabel?.id !== above.getAttribute('aria-labelledby') || above.hasAttribute('aria-label')) {
            throw new Error('A label above must name the editor through aria-labelledby.')
        }
        if (accessibleNameOf(above) !== 'Message' || aboveLabel?.textContent !== 'Message\u00a0*') {
            throw new Error('The required mark must be visible but not part of the accessible name.')
        }

        const floating = textboxOf(canvasElement, 'label-floating')
        if (fieldRootOf(canvasElement, 'label-floating').querySelector('label')) {
            throw new Error('A floating label must not render a label above the field.')
        }
        if (floating.getAttribute('aria-label') !== 'Floating message' || floating.hasAttribute('aria-labelledby')) {
            throw new Error('A floating label must name the editor through aria-label.')
        }

        const explicit = textboxOf(canvasElement, 'label-above-aria')
        if (explicit.getAttribute('aria-label') !== 'Explicit name' || explicit.hasAttribute('aria-labelledby')) {
            throw new Error('`aria-label` must take precedence over the label above.')
        }

        const disabledLabel = fieldRootOf(canvasElement, 'label-above-disabled').querySelector('label')
        if (!disabledLabel?.parentElement?.classList.contains('text-delta-300')) {
            throw new Error('A disabled field must render its label in the disabled colour.')
        }

        const titleAndLabel = fieldRootOf(canvasElement, 'title-and-label')
        const title = titleAndLabel.querySelector('p')
        if (title?.textContent !== 'Note' || title.className !== titleAndLabel.querySelector('label')?.parentElement?.className) {
            throw new Error('A title must keep its text and look like the label above.')
        }

        const sameText = fieldRootOf(canvasElement, 'title-same-as-label')
        if (sameText.textContent?.split('Comment').length !== 2) {
            throw new Error('A title identical to the label must render once.')
        }
    },
}

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
            <RichInput dataTest='disabled-editor' label='Disabled message' disabled content='<p>x</p>' />
            <RichInput
                dataTest='editable-disabled-editor'
                label='Still editable'
                disabled
                editable
                content='<p>x</p>'
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await new Promise<void>((resolve) => setTimeout(resolve, 250))

        const editableEditor = canvasElement.querySelector<HTMLElement>('[contenteditable="true"]')
        const fallbackEditor = canvasElement.querySelectorAll<HTMLElement>('[contenteditable="true"]')[1]
        const readOnlyEditor = canvasElement.querySelector<HTMLElement>('[contenteditable="false"]')
        const disabledEditor = canvasElement.querySelector<HTMLElement>(
            '[data-test="disabled-editor"] [role="textbox"]',
        )
        const editableDisabledEditor = canvasElement.querySelector<HTMLElement>(
            '[data-test="editable-disabled-editor"] [role="textbox"]',
        )
        const formatButton = canvasElement.querySelector<HTMLButtonElement>('[data-testid="richeditor-format-button"]')
        const imageUploadButton = canvasElement.querySelector<HTMLButtonElement>(
            '[data-testid="rich-editor-image-upload"]',
        )

        if (!editableEditor || accessibleNameOf(editableEditor) !== 'Write a message') {
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
        if (disabledEditor?.getAttribute('aria-disabled') !== 'true') {
            throw new Error('A disabled RichInput must expose aria-disabled="true" on its textbox.')
        }
        if (editableEditor?.hasAttribute('aria-disabled') || fallbackEditor?.hasAttribute('aria-disabled')) {
            throw new Error('An enabled RichInput must not expose aria-disabled.')
        }
        if (
            editableDisabledEditor?.getAttribute('contenteditable') !== 'true' ||
            editableDisabledEditor.hasAttribute('aria-disabled')
        ) {
            throw new Error('A RichInput kept editable by `editable` must not expose aria-disabled.')
        }
    },
}
