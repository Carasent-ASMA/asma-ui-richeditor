/* eslint-disable storybook/use-storybook-expect -- eslint-plugin-storybook 0.6 predates `storybook/test`, the Storybook 10 home of expect */
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { Editor } from '@tiptap/react'
import { useState } from 'react'
import { expect, userEvent, waitFor } from 'storybook/test'
import { RichInput } from '../rich-input/RichInput'

/**
 * Height API (ASMA-8297, multiline-fields pattern MLF-1 to MLF-4). jsdom has no layout, so these stories
 * are the tests: each `play` measures the real layout. `test-storybook` applies each story's viewport.
 *
 * - `maxScrollableHeight` (legacy): caps the text area alone; numbers behave as before.
 * - `maxFieldHeight`: caps the whole field (reply header, text, chips, toolbar) and shows an overflow cue,
 *   or with `'none'` lets the field grow with a toolbar that stays reachable.
 */
const meta: Meta<typeof RichInput> = {
    title: '*/RichInput/Height',
    component: RichInput,
    parameters: {
        layout: 'padded',
    },
}

export default meta
type Story = StoryObj<typeof RichInput>

const paragraphs = (count: number) =>
    Array.from({ length: count }, (_, i) => `<p>Line ${i + 1}: some text that takes a line of its own.</p>`).join('')
const LONG = paragraphs(60)
const VERY_LONG = paragraphs(200)

const attachments = [
    { key: 'a', dataTest: 'chip-report', label: 'report.pdf' },
    { key: 'b', dataTest: 'chip-photo', label: 'photo.png' },
]
/** Like the chat composer's reply header: the quoted message is itself a read-only RichInput. */
const replyHeader = (
    <div className='border-b border-delta-200 p-2 text-sm text-delta-700'>
        <RichInput dataTest='reply-quote' readOnly='plain' content='<p>Anna: “Can you send the report?”</p>' />
    </div>
)

/** Finds the nodes a test needs, from the `dataTest` that EditorContent receives. */
const findField = async (canvasElement: HTMLElement, dataTest: string) => {
    let content: HTMLElement | null = null
    await waitFor(() => {
        content = canvasElement.querySelector<HTMLElement>(`[data-testid="${dataTest}"]`)
        expect(content?.querySelector('.tiptap')).toBeTruthy()
    })
    const el = content as unknown as HTMLElement
    const wrapper = el.closest<HTMLElement>('.rte-wrapper') as HTMLElement
    return {
        content: el,
        tiptap: el.querySelector<HTMLElement>('.tiptap') as HTMLElement,
        wrapper,
        toolbar: () => wrapper.querySelector<HTMLElement>('.toolbar'),
        actions: () => wrapper.querySelector<HTMLElement>('.rte-actions'),
    }
}
const heightOf = (el: Element) => el.getBoundingClientRect().height
/** Lets the effects and the ResizeObserver run before asserting that something did not happen. */
const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
/** tiptap keeps its editor on the ProseMirror element. */
const editorOf = (tiptap: HTMLElement) => (tiptap as HTMLElement & { editor: Editor }).editor
const caretBox = () => {
    const selection = window.getSelection()
    return selection && selection.rangeCount ? selection.getRangeAt(0).getBoundingClientRect() : null
}
/** The runner's Chromium predates the unprefixed mask-image; the CSS declares both. */
const maskOf = (el: Element) => {
    const style = getComputedStyle(el)
    return style.getPropertyValue('mask-image') || style.getPropertyValue('-webkit-mask-image')
}
const boxOf = async (find: () => HTMLElement | null) => {
    let el: HTMLElement | null = null
    await waitFor(() => {
        el = find()
        expect(el).toBeTruthy()
    })
    return (el as unknown as HTMLElement).getBoundingClientRect()
}
const hasNewAttributes = (wrapper: HTMLElement) =>
    ['data-rte-field-cap', 'data-rte-toolbar', 'data-overflowing', 'style'].some((a) => wrapper.hasAttribute(a))

/* ---------- Legacy text-area cap ---------- */

/** Existing callers are unchanged: omitted / 0 → 100px, 200 → 200px, no new attributes. `Infinity` → `none`. */
export const NumericCallersUnchanged: Story = {
    render: () => (
        <div className='flex flex-col gap-4 max-w-2xl'>
            <RichInput dataTest='legacy-default' content={LONG} />
            <RichInput dataTest='legacy-zero' content={LONG} maxScrollableHeight={0} />
            <RichInput dataTest='legacy-200' content={LONG} maxScrollableHeight={200} />
            <RichInput dataTest='legacy-infinity' content={LONG} maxScrollableHeight={Infinity} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const cases = [
            ['legacy-default', '100px', '100px'],
            ['legacy-zero', '100px', '100px'],
            ['legacy-200', '200px', '200px'],
            ['legacy-infinity', 'none', 'none'],
        ] as const
        for (const [dataTest, inlineValue, maxHeight] of cases) {
            const { content, tiptap, wrapper } = await findField(canvasElement, dataTest)
            await expect(content.style.getPropertyValue('--max-scrollable-height')).toBe(inlineValue)
            await expect(getComputedStyle(tiptap).maxHeight).toBe(maxHeight)
            await expect(hasNewAttributes(wrapper)).toBe(false)
        }
    },
}

/* ---------- Whole-field cap: number, CSS length, 'none', Infinity ---------- */

/** A pixel number and a CSS length each cap the whole field; `'none'` and `Infinity` let it grow. */
export const FieldCapValues: Story = {
    render: () => (
        <div className='flex flex-col gap-4 max-w-2xl'>
            <RichInput dataTest='field-number' label='Number' content={LONG} maxFieldHeight={200} />
            <RichInput dataTest='field-css' label='CSS length' content={LONG} maxFieldHeight='min(180px, 90vh)' />
            <RichInput dataTest='field-none' label='None' content={LONG} maxFieldHeight='none' />
            <RichInput dataTest='field-infinity' label='Infinity' content={LONG} maxFieldHeight={Infinity} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const number = await findField(canvasElement, 'field-number')
        await expect(number.wrapper.dataset['rteFieldCap']).toBe('capped')
        await expect(heightOf(number.wrapper)).toBeCloseTo(200, 0)
        await expect(number.content.scrollHeight).toBeGreaterThan(number.content.clientHeight)

        // The string is used as-is: no `px` appended.
        const css = await findField(canvasElement, 'field-css')
        await expect(css.wrapper.style.getPropertyValue('--rte-field-max-height')).toBe('min(180px, 90vh)')
        await expect(heightOf(css.wrapper)).toBeCloseTo(Math.min(180, window.innerHeight * 0.9), 0)

        for (const dataTest of ['field-none', 'field-infinity']) {
            const { wrapper, content, tiptap } = await findField(canvasElement, dataTest)
            await expect(wrapper.dataset['rteFieldCap']).toBe('none')
            await expect(getComputedStyle(tiptap).maxHeight).toBe('none')
            await expect(heightOf(wrapper)).toBeGreaterThan(1000)
            await expect(content.scrollHeight).toBeLessThanOrEqual(content.clientHeight + 1)
        }
    },
}

/* ---------- The chat composer: whole field 300px on mobile, 400px from 744px ---------- */

const composer = (dataTest: string) => (
    <div className='flex flex-col max-w-2xl'>
        <RichInput
            dataTest={dataTest}
            label='Message'
            content={LONG}
            toolbarDefaultVisible
            attachments={attachments}
            replyModeComponent={replyHeader}
            maxFieldHeight={{ mobile: 300, tablet: 400 }}
        />
    </div>
)

const expectCappedComposer = async (canvasElement: HTMLElement, dataTest: string, cap: number) => {
    const { wrapper, content, toolbar } = await findField(canvasElement, dataTest)
    await waitFor(() => expect(heightOf(wrapper)).toBeCloseTo(cap, 0))

    // The cap counts the reply header, chips and toolbar: all of them sit inside the capped field.
    const field = wrapper.getBoundingClientRect()
    for (const part of [wrapper.firstElementChild, wrapper.querySelector('.rte-attachments'), toolbar()]) {
        await expect(part).toBeTruthy()
        await expect((part as Element).getBoundingClientRect().bottom).toBeLessThanOrEqual(field.bottom + 1)
    }

    // Only the text scrolls, with a visible cue on the side that hides text.
    await expect(content.scrollHeight).toBeGreaterThan(content.clientHeight)
    await waitFor(() => expect(wrapper.hasAttribute('data-overflowing')).toBe(true))
    await expect(wrapper.hasAttribute('data-can-scroll-down')).toBe(true)
    await expect(wrapper.hasAttribute('data-can-scroll-up')).toBe(false)
    await expect(maskOf(content)).toContain('linear-gradient')
    if (CSS.supports('scrollbar-width', 'auto')) {
        await expect(getComputedStyle(content).getPropertyValue('scrollbar-width')).toBe('auto')
    }

    // A short reply does not scroll, so it is no extra tab stop.
    const reply = wrapper.querySelector<HTMLElement>(':scope > .rte-reply')
    await expect(reply?.hasAttribute('tabindex')).toBe(false)

    // The quoted message nested in the reply header keeps its own read-only look: no scroller, no fade.
    const quote = await findField(canvasElement, 'reply-quote')
    await expect(maskOf(quote.content)).toBe('none')
    await expect(getComputedStyle(quote.content).overflowY).toBe('hidden')
    await expect(getComputedStyle(quote.tiptap).overflowY).toBe('hidden')

    // Scrolled to the end, the cue moves to the top edge.
    content.scrollTop = content.scrollHeight
    await waitFor(() => expect(wrapper.hasAttribute('data-can-scroll-down')).toBe(false))
    await expect(wrapper.hasAttribute('data-can-scroll-up')).toBe(true)
}

/** Mobile (0–743px): the whole field is at most 300px. */
export const ComposerMobile: Story = {
    globals: { viewport: { value: 'mobile2', isRotated: false } },
    render: () => composer('composer-mobile'),
    play: ({ canvasElement }) => expectCappedComposer(canvasElement, 'composer-mobile', 300),
}

/** Tablet and wider (from 744px): the whole field is at most 400px. */
export const ComposerTablet: Story = {
    globals: { viewport: { value: 'tablet', isRotated: false } },
    render: () => composer('composer-tablet'),
    play: ({ canvasElement }) => expectCappedComposer(canvasElement, 'composer-tablet', 400),
}

/** A viewport shorter than the cap (400% zoom of 1280×1024 is 320×256): the field shrinks to the screen. */
export const ComposerShortViewport: Story = {
    parameters: {
        viewport: {
            options: { zoom400: { name: '400% zoom', styles: { width: '320px', height: '256px' }, type: 'mobile' } },
        },
    },
    globals: { viewport: { value: 'zoom400', isRotated: false } },
    render: () => composer('composer-short'),
    play: async ({ canvasElement }) => {
        const { wrapper, content } = await findField(canvasElement, 'composer-short')
        await waitFor(() => expect(wrapper.hasAttribute('data-overflowing')).toBe(true))
        await expect(window.innerHeight).toBeLessThan(300)
        await expect(heightOf(wrapper)).toBeLessThanOrEqual(window.innerHeight + 1)
        await expect(content.clientHeight).toBeGreaterThan(0)
    },
}

const manyAttachments = Array.from({ length: 12 }, (_, i) => ({
    key: `file-${i}`,
    dataTest: `chip-file-${i}`,
    label: `attachment-${i + 1}.pdf`,
}))

const crowdedComposer = (dataTest: string) => (
    <div className='flex flex-col max-w-2xl'>
        <RichInput
            dataTest={dataTest}
            label='Message'
            content={LONG}
            toolbarDefaultVisible
            attachments={manyAttachments}
            replyModeComponent={
                <div className='border-b border-delta-200 p-2 text-sm text-delta-700'>
                    <RichInput dataTest={`${dataTest}-quote`} readOnly='plain' content={paragraphs(20)} />
                </div>
            }
            maxFieldHeight={{ mobile: 300, tablet: 400 }}
        />
    </div>
)

const outlineOf = (el: Element, pseudo?: string) => {
    const style = getComputedStyle(el, pseudo)
    return `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor} ${style.outlineOffset}`
}

const expectCrowdedComposer = async (canvasElement: HTMLElement, dataTest: string, minText: number) => {
    const { wrapper, content, tiptap, toolbar } = await findField(canvasElement, dataTest)
    await waitFor(() => expect(wrapper.hasAttribute('data-overflowing')).toBe(true))
    const cap = Math.min(300, window.innerHeight)
    await expect(heightOf(wrapper)).toBeCloseTo(cap, 0)
    const field = wrapper.getBoundingClientRect()
    const toolbarBox = await boxOf(toolbar)
    await expect(toolbarBox.bottom).toBeLessThanOrEqual(field.bottom + 1)
    // The text keeps some lines, and the reply and the chips scroll inside their 30% share as named,
    // keyboard-reachable regions.
    await expect(content.clientHeight).toBeGreaterThanOrEqual(minText)
    for (const [selector, label] of [
        ['.rte-reply', 'Quoted message'],
        ['.rte-attachments', 'Attachments'],
    ] as const) {
        const part = wrapper.querySelector<HTMLElement>(`:scope > ${selector}`) as HTMLElement
        await expect(part).toBeTruthy()
        await expect(heightOf(part)).toBeLessThanOrEqual(cap * 0.3 + 1)
        await expect(part.scrollHeight).toBeGreaterThan(part.clientHeight)
        await waitFor(() => expect(part.getAttribute('tabindex')).toBe('0'))
        await expect(part.getAttribute('aria-label')).toBe(label)
    }
    // The outline is redrawn above the toolbar: the same outline as the field's, at rest and focused.
    await expect(getComputedStyle(wrapper, '::after').zIndex).toBe('2')
    await expect(outlineOf(wrapper, '::after')).toBe(outlineOf(wrapper))
    editorOf(tiptap).commands.focus()
    await waitFor(() => expect(wrapper.classList.contains('focused-state')).toBe(true))
    await expect(outlineOf(wrapper, '::after')).toBe(outlineOf(wrapper))
}

/** A long quoted reply and many chips each scroll within 30% of the cap, so the text and toolbar keep their place. */
export const ComposerLongReplyManyChips: Story = {
    globals: { viewport: { value: 'mobile2', isRotated: false } },
    render: () => crowdedComposer('composer-crowded'),
    play: ({ canvasElement }) => expectCrowdedComposer(canvasElement, 'composer-crowded', 60),
}

/** The same crowded composer on a 320×256 screen (400% zoom): the toolbar still fits and some text shows. */
export const ComposerLongReplyShortViewport: Story = {
    parameters: {
        viewport: {
            options: { zoom400: { name: '400% zoom', styles: { width: '320px', height: '256px' }, type: 'mobile' } },
        },
    },
    globals: { viewport: { value: 'zoom400', isRotated: false } },
    render: () => crowdedComposer('composer-crowded-short'),
    play: ({ canvasElement }) => expectCrowdedComposer(canvasElement, 'composer-crowded-short', 30),
}

const ReadOnlyToggle = () => {
    const [readOnly, setReadOnly] = useState(false)
    return (
        <div className='flex flex-col gap-2 max-w-2xl'>
            <button type='button' onClick={() => setReadOnly(!readOnly)}>
                Toggle read-only
            </button>
            <RichInput
                dataTest='toggle-composer'
                content={LONG}
                readOnly={readOnly ? 'outlined' : undefined}
                replyModeComponent={
                    <div className='border-b border-delta-200 p-2 text-sm text-delta-700'>
                        <RichInput dataTest='toggle-quote' readOnly='plain' content='<p>Anna: “See you at 10.”</p>' />
                    </div>
                }
                maxFieldHeight={300}
            />
        </div>
    )
}

/** Switching the cap off and on (here through readOnly) keeps the reply content mounted. */
export const ReplyStaysMountedWhenCapChanges: Story = {
    render: () => <ReadOnlyToggle />,
    play: async ({ canvasElement }) => {
        const before = (await findField(canvasElement, 'toggle-quote')).tiptap
        const button = canvasElement.querySelector('button') as HTMLButtonElement
        await userEvent.click(button)
        const { wrapper } = await findField(canvasElement, 'toggle-composer')
        await waitFor(() => expect(wrapper.hasAttribute('data-rte-field-cap')).toBe(false))
        await userEvent.click(button)
        await waitFor(() => expect(wrapper.getAttribute('data-rte-field-cap')).toBe('capped'))
        const after = (await findField(canvasElement, 'toggle-quote')).tiptap
        await expect(after).toBe(before)
    },
}

/** Short content stays short and shows no cue; read-only text ignores the cap and shows in full (MLF-2). */
export const NoCueWhenNotCapped: Story = {
    render: () => (
        <div className='flex flex-col gap-4 max-w-2xl'>
            <RichInput dataTest='short-content' content='<p>Hello</p>' maxFieldHeight={300} />
            <RichInput dataTest='read-only' content={LONG} readOnly='outlined' maxFieldHeight={300} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const short = await findField(canvasElement, 'short-content')
        await frames()
        await expect(heightOf(short.wrapper)).toBeLessThan(300)
        await expect(short.wrapper.hasAttribute('data-overflowing')).toBe(false)
        await expect(maskOf(short.content)).toBe('none')

        const readOnly = await findField(canvasElement, 'read-only')
        await expect(readOnly.wrapper.hasAttribute('data-rte-field-cap')).toBe(false)
        await expect(heightOf(readOnly.wrapper)).toBeGreaterThan(1000)
    },
}

/* ---------- No cap: grows with the page, toolbar and format button stay reachable (MLF-4) ---------- */

/** With the toolbar open, the toolbar sticks to the bottom of the view while the field is in it. */
export const UncappedToolbarOpen: Story = {
    render: () => (
        <div className='flex flex-col max-w-2xl'>
            <RichInput
                dataTest='uncapped-open'
                label='Notes'
                content={VERY_LONG}
                maxFieldHeight='none'
                toolbarDefaultVisible
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const { wrapper, content, toolbar } = await findField(canvasElement, 'uncapped-open')
        await expect(heightOf(wrapper)).toBeGreaterThan(window.innerHeight)
        await expect(content.scrollHeight).toBeLessThanOrEqual(content.clientHeight + 1)
        await expect(wrapper.hasAttribute('data-overflowing')).toBe(false)
        window.scrollTo(0, 0)
        // Without sticky the toolbar would sit below thousands of pixels of text.
        const box = await boxOf(toolbar)
        await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight + 1)
        await expect(box.top).toBeGreaterThanOrEqual(0)
        // The outline redrawn above the toolbar must not take its clicks.
        const button = toolbar()?.querySelector('button')
        await expect(button).toBeTruthy()
        const target = (button as HTMLElement).getBoundingClientRect()
        const hit = document.elementFromPoint(target.left + target.width / 2, target.top + target.height / 2)
        await expect(toolbar()?.contains(hit)).toBe(true)
    },
}

/** With the toolbar closed, the format button sticks to the bottom of the view instead. */
export const UncappedToolbarClosed: Story = {
    render: () => (
        <div className='flex flex-col max-w-2xl'>
            <RichInput dataTest='uncapped-closed' label='Notes' content={VERY_LONG} maxFieldHeight='none' />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const { wrapper, actions } = await findField(canvasElement, 'uncapped-closed')
        await expect(heightOf(wrapper)).toBeGreaterThan(window.innerHeight)
        window.scrollTo(0, 0)
        const box = await boxOf(actions)
        await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight + 1)
        await expect(box.top).toBeGreaterThanOrEqual(0)
    },
}

/* ---------- Typing: the caret line stays clear of the fade and of the sticky toolbar ---------- */

/** ProseMirror's own 5px scroll margin would leave the line being typed under the fade or the toolbar. */
export const CaretStaysClear: Story = {
    globals: { viewport: { value: 'tablet', isRotated: false } },
    render: () => (
        <div className='flex flex-col gap-4 max-w-2xl'>
            <RichInput dataTest='type-capped' content={LONG} maxFieldHeight={300} />
            <RichInput dataTest='type-uncapped' content={VERY_LONG} maxFieldHeight='none' toolbarDefaultVisible />
        </div>
    ),
    play: async ({ canvasElement }) => {
        // Capped: typing at the end scrolls to the very end, so no fade covers the new line.
        const capped = await findField(canvasElement, 'type-capped')
        editorOf(capped.tiptap).commands.focus('end')
        await userEvent.keyboard('{Enter}One more line')
        await waitFor(() => expect(capped.wrapper.hasAttribute('data-can-scroll-down')).toBe(false))
        // Moving up past the visible lines keeps the caret line out of the 24px top fade.
        await userEvent.keyboard('{ArrowUp}'.repeat(20))
        await waitFor(() => expect(capped.wrapper.hasAttribute('data-can-scroll-up')).toBe(true))
        const scroller = capped.content.getBoundingClientRect()
        const upCaret = caretBox()
        await expect(upCaret).toBeTruthy()
        await expect((upCaret as DOMRect).top).toBeGreaterThanOrEqual(scroller.top + 24 - 1)

        // Uncapped: the line typed at the end stays above the sticky toolbar.
        const uncapped = await findField(canvasElement, 'type-uncapped')
        editorOf(uncapped.tiptap).commands.focus('end')
        await userEvent.keyboard('{Enter}One more line')
        await frames()
        const caret = caretBox()
        const toolbarBox = await boxOf(uncapped.toolbar)
        await expect(caret).toBeTruthy()
        await expect((caret as DOMRect).bottom).toBeLessThanOrEqual(toolbarBox.top)
    },
}
