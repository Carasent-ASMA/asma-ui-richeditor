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
