import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { StyledButton } from 'asma-ui-core'

import { RichInput } from 'src/rich-input/RichInput'

/**
 * Figma DS "Rich text editor" (node `20571-30699`): a message input that supports plain text and
 * rich formatting through a toolbar. The stories below mirror the spec's variant stack one to one.
 *
 * - The **floating label** rests inside the empty field and shrinks onto the top border once the
 *   editor is focused or has content (`label` prop).
 * - The **toolbar** opens from the format button (or `toolbarDefaultVisible`) and collapses on
 *   narrow widths: low-priority actions move into a "⋮ more" popover, `Close` stays pinned right.
 * - `title` renders the bold heading above the field ("With title label" variant).
 */
const meta: Meta<typeof RichInput> = {
    title: 'Rich Text Editor',
    component: RichInput,
    decorators: [
        // StyledFormControl is inline-flex — give stories the spec's 600px column so the field
        // stretches like it does inside app forms (shrinks with the viewport on the Mobile story).
        (Story) => (
            <div className='flex w-full max-w-[600px] flex-col'>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof RichInput>

const LONG_TEXT =
    '<p>Line length is how many characters are on a single line of text. For longer body text, the recommended line length is between 40 to 60 characters. Line length is how many characters are on a single line of text. For longer body text,</p>'

const noop = () => undefined

/** Empty field — the floating label rests inside as the placeholder (spec row 1). */
export const Empty: Story = {
    render: () => <RichInput dataTest='rte-empty' label='Group message' content='' onUpdate={noop} />,
}

/** Single line with text — the label shrinks onto the top border (spec row 2). */
export const SingleLineWithText: Story = {
    render: () => (
        <RichInput
            dataTest='rte-single-line'
            label='Group message'
            content='<p>Line length is how many characters</p>'
            onUpdate={noop}
        />
    ),
}

/** Expanded with the formatting toolbar visible (spec row 3). */
export const ExpandedWithToolbar: Story = {
    render: () => (
        <RichInput
            dataTest='rte-expanded'
            label='Group message'
            content='<p>Line length is how many characters</p>'
            toolbarDefaultVisible
            onUpdate={noop}
        />
    ),
}

/** Multiline / long text — the action buttons stack into a right-hand column (spec row 4). */
export const Multiline: Story = {
    render: () => (
        <RichInput dataTest='rte-multiline' label='Group message' content={LONG_TEXT} onUpdate={noop} />
    ),
}

/** Bold title above the field via `title` (spec row 5, "Title label"). */
export const WithTitleLabel: Story = {
    render: () => <RichInput dataTest='rte-title' title='Title label' content={LONG_TEXT} onUpdate={noop} />,
}

/** Error + required — red outline, red shrunk label, helper text with icon. */
export const ErrorRequired: Story = {
    render: () => (
        <RichInput
            dataTest='rte-error'
            label='Group message'
            content='<p>Line length is how many characters</p>'
            error
            required
            helperText='* required'
            onUpdate={noop}
        />
    ),
}

/**
 * On narrow viewports the toolbar collapses: low-priority formatting actions move into the
 * "⋮ more" popover while emoji/H1/H2 stay visible and `Close` stays pinned right (spec's
 * mobile frames). This story pins the Storybook viewport to a phone.
 */
export const Mobile: Story = {
    globals: { viewport: { value: 'mobile1', isRotated: false } },
    render: () => (
        <RichInput
            dataTest='rte-mobile'
            label='Group message'
            content='<p>Line length is how many characters</p>'
            toolbarDefaultVisible
            onUpdate={noop}
        />
    ),
}

const InteractiveExample = () => {
    const [content, setContent] = useState('')
    const [readOnly, setReadOnly] = useState(false)

    return (
        <div className='flex max-w-xl flex-col gap-4'>
            <StyledButton
                dataTest='rte-demo-toggle'
                variant='outlined'
                className='self-start'
                onClick={() => setReadOnly((prev) => !prev)}
            >
                {readOnly ? 'Edit' : 'Preview read-only'}
            </StyledButton>
            <RichInput
                dataTest='rte-demo'
                label='Group message'
                content={content}
                onUpdate={({ editor }) => setContent(editor.getHTML())}
                readOnly={readOnly ? 'outlined' : undefined}
                helperText={readOnly ? undefined : 'Focus the field, then open the toolbar with the A button'}
                maxScrollableHeight={200}
            />
        </div>
    )
}

/** Interactive demo — type, format via the toolbar, toggle read-only. */
export const Interactive: Story = {
    render: () => <InteractiveExample />,
}
