import { Editor } from '@tiptap/react'
import { afterEach, describe, expect, it } from 'vitest'
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
