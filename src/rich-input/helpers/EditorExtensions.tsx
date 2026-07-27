import type { Extensions } from '@tiptap/core'
import { TextStyleKit } from '@tiptap/extension-text-style'
import { StarterKit } from '@tiptap/starter-kit'

const starterKit = StarterKit.configure({
    blockquote: false,
    codeBlock: false,
    hardBreak: false,
    heading: { levels: [1, 2] },
    horizontalRule: false,
    code: false,
    strike: false,
    underline: false,
    dropcursor: false,
    gapcursor: false,
    undoRedo: false,
    listKeymap: false,
    trailingNode: false,
})

export function resolveDefaultExtensions(): Extensions {
    const extensions: Extensions = [starterKit, TextStyleKit]

    return extensions
}
