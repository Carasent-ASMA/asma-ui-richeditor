import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { LinkDialog } from 'src/rich-input/components/LinkDialog'
import { resolveDefaultExtensions } from 'src/rich-input/helpers/EditorExtensions'
import { cleanup, mount } from 'src/test-utils/renderInteraction'

/**
 * ASMA-8737: the ui-core dialog header draws its own separator under the title, so the body must
 * not draw a second line right under it. The line under the field stays: it is the only line above
 * the buttons.
 */
describe('ASMA-8737 — LinkDialog draws one line under the title', () => {
    afterEach(cleanup)

    it('has no top border on the body, only the bottom one above the buttons', () => {
        const editor = new Editor({ extensions: resolveDefaultExtensions() })
        mount(<LinkDialog open setOpen={() => undefined} editor={editor} locale='en' />)

        const body = document.querySelector('.link-input-field')?.parentElement
        if (!body) throw new Error('No link dialog body rendered')

        expect(body.className).not.toMatch(/\bborder-(y|t)\b/)
        expect(getComputedStyle(body).borderTopWidth).toBe('0px')
        expect(getComputedStyle(body).borderBottomWidth).toBe('1px')

        editor.destroy()
    })
})

/**
 * ASMA-8073 row 152: the link dialog had no validation at all — `makeLink` called
 * `editor.chain().setLink({ href: url })` with whatever was typed, including empty or non-URL text.
 */
describe('ASMA-8073 — LinkDialog validates the URL', () => {
    afterEach(cleanup)

    const addLinkButton = (container: HTMLElement): HTMLButtonElement =>
        container.querySelector<HTMLButtonElement>('[data-testid="delete-customer-confirm-button"]')!

    it('shows "Required" and does not create a link when the URL is empty', async () => {
        const editor = new Editor({ extensions: resolveDefaultExtensions() })
        const { container } = mount(<LinkDialog open setOpen={() => undefined} editor={editor} locale='en' />)

        await userEvent.click(addLinkButton(container))

        expect(container.textContent).toContain('Required')
        expect(editor.isActive('link')).toBe(false)

        editor.destroy()
    })

    it('shows the invalid-URL message and does not create a link for a non-URL value', async () => {
        const editor = new Editor({ extensions: resolveDefaultExtensions() })
        const { container } = mount(<LinkDialog open setOpen={() => undefined} editor={editor} locale='en' />)
        const textarea = container.querySelector<HTMLTextAreaElement>('[data-testid="link-input-field"]')!

        await userEvent.fill(textarea, 'not a url')
        await userEvent.click(addLinkButton(container))

        expect(container.textContent).toContain('Enter a valid URL, like https://example.com.')
        expect(editor.isActive('link')).toBe(false)

        editor.destroy()
    })

    it('creates the link for a valid http(s) URL', async () => {
        const editor = new Editor({ extensions: resolveDefaultExtensions() })
        editor.commands.insertContent('pick me')
        editor.commands.selectAll()
        const { container } = mount(<LinkDialog open setOpen={() => undefined} editor={editor} locale='en' />)
        const textarea = container.querySelector<HTMLTextAreaElement>('[data-testid="link-input-field"]')!

        await userEvent.fill(textarea, 'https://example.com')
        await userEvent.click(addLinkButton(container))

        expect(editor.isActive('link')).toBe(true)
        expect(editor.getAttributes('link')['href']).toBe('https://example.com')

        editor.destroy()
    })

    it('uses the Norwegian copy', async () => {
        const editor = new Editor({ extensions: resolveDefaultExtensions() })
        const { container } = mount(<LinkDialog open setOpen={() => undefined} editor={editor} locale='no' />)

        await userEvent.click(addLinkButton(container))

        expect(container.textContent).toContain('Obligatorisk')

        editor.destroy()
    })
})

/**
 * ASMA-8073 desk review (PR #49, F1/F2/F3): a valid blur let any later edit raise a fresh error
 * while the user was still typing, a failed submission left focus on the button instead of the
 * invalid field, and showing/clearing the error mounted/unmounted the helper row.
 */
describe('ASMA-8073 — LinkDialog error timing, focus and layout (F1/F2/F3)', () => {
    afterEach(cleanup)

    const addLinkButton = (container: HTMLElement): HTMLButtonElement =>
        container.querySelector<HTMLButtonElement>('[data-testid="delete-customer-confirm-button"]')!

    const urlField = (container: HTMLElement): HTMLTextAreaElement =>
        container.querySelector<HTMLTextAreaElement>('[data-testid="link-input-field"]')!

    it('F1: does not show an error while typing after a valid blur, only on the next blur', async () => {
        const editor = new Editor({ extensions: resolveDefaultExtensions() })
        const { container } = mount(<LinkDialog open setOpen={() => undefined} editor={editor} locale='en' />)
        const textarea = urlField(container)

        await userEvent.fill(textarea, 'https://example.com')
        await userEvent.click(addLinkButton(container)) // creates the link, closes the dialog; reopen to get a fresh blurred field
        editor.destroy()

        const editor2 = new Editor({ extensions: resolveDefaultExtensions() })
        const { container: container2 } = mount(<LinkDialog open setOpen={() => undefined} editor={editor2} locale='en' />)
        const textarea2 = urlField(container2)

        await userEvent.fill(textarea2, 'https://example.com')
        await userEvent.click(textarea2)
        await userEvent.tab() // blur while valid: no error
        await userEvent.click(textarea2)
        await userEvent.fill(textarea2, 'https://') // edit to an invalid value without blurring again

        expect(container2.textContent).not.toContain('Enter a valid URL')

        await userEvent.tab() // blur now introduces the error
        expect(container2.textContent).toContain('Enter a valid URL')

        editor2.destroy()
    })

    it('F1: a change clears an already-shown error instead of waiting for blur or submit', async () => {
        const editor = new Editor({ extensions: resolveDefaultExtensions() })
        const { container } = mount(<LinkDialog open setOpen={() => undefined} editor={editor} locale='en' />)
        const textarea = urlField(container)

        await userEvent.click(addLinkButton(container))
        expect(container.textContent).toContain('Required')

        await userEvent.type(textarea, 'https://example.com')
        expect(container.textContent).not.toContain('Required')

        editor.destroy()
    })

    it('F2: a failed submission moves focus to the invalid URL field', async () => {
        const editor = new Editor({ extensions: resolveDefaultExtensions() })
        const { container } = mount(<LinkDialog open setOpen={() => undefined} editor={editor} locale='en' />)
        const textarea = urlField(container)

        await userEvent.click(addLinkButton(container))

        expect(document.activeElement).toBe(textarea)

        editor.destroy()
    })

    it('F5: marks the field aria-invalid before blur, even while the visible error is still hidden', async () => {
        const editor = new Editor({ extensions: resolveDefaultExtensions() })
        const { container } = mount(<LinkDialog open setOpen={() => undefined} editor={editor} locale='en' />)
        const textarea = urlField(container)

        await userEvent.fill(textarea, 'https://example.com')
        await userEvent.click(textarea)
        await userEvent.tab() // blur while valid: no error
        await userEvent.click(textarea)
        await userEvent.fill(textarea, 'https://') // edit to an invalid value without blurring again

        expect(container.textContent).not.toContain('Enter a valid URL')
        expect(textarea.getAttribute('aria-invalid')).toBe('true')

        editor.destroy()
    })

    it('F3: the helper row is mounted before any error, so showing one does not shift the layout', async () => {
        const editor = new Editor({ extensions: resolveDefaultExtensions() })
        const { container } = mount(<LinkDialog open setOpen={() => undefined} editor={editor} locale='en' />)
        const textarea = urlField(container)

        const helperId = textarea.getAttribute('aria-describedby')
        expect(helperId).toBeTruthy()
        const helperBefore = document.getElementById(helperId!)
        expect(helperBefore).toBeTruthy()
        const heightBefore = helperBefore!.getBoundingClientRect().height

        await userEvent.click(addLinkButton(container))

        const helperAfter = document.getElementById(helperId!)
        expect(helperAfter).toBeTruthy()
        expect(helperAfter!.getBoundingClientRect().height).toBe(heightBefore)

        editor.destroy()
    })
})
