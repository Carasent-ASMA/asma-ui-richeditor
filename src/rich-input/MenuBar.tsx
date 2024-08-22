import { Editor } from '@tiptap/react'
import { StyledButton } from 'asma-core-ui'
import type { FormEvent } from 'react'

export const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null
    }

    return (
        <div className='flex gap-2 items-center flex-wrap border border-delta-200 rounded'>
            <StyledButton
                dataTest='richeditor-bold-button'
                size='small'
                variant={editor.isActive('bold') ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
            >
                Bold
            </StyledButton>
            <StyledButton
                dataTest='richeditor-italic-button'
                size='small'
                variant={editor.isActive('italic') ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
            >
                Italic
            </StyledButton>
            <StyledButton
                dataTest='richeditor-strike-button'
                size='small'
                variant={editor.isActive('strike') ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
            >
                Strike
            </StyledButton>
            <StyledButton
                dataTest='richeditor-clear-marks-button'
                size='small'
                variant='textGray'
                onClick={() => editor.chain().focus().unsetAllMarks().run()}
            >
                Clear marks
            </StyledButton>
            <StyledButton
                dataTest='richeditor-clear-nodes-button'
                size='small'
                variant='textGray'
                onClick={() => editor.chain().focus().clearNodes().run()}
            >
                Clear nodes
            </StyledButton>
            <StyledButton
                dataTest='richeditor-paragraph-button'
                size='small'
                variant={editor.isActive('paragraph') ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().setParagraph().run()}
            >
                Paragraph
            </StyledButton>
            <StyledButton
                dataTest='richeditor-h1-button'
                size='small'
                variant={editor.isActive('heading', { level: 1 }) ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
                H1
            </StyledButton>
            <StyledButton
                dataTest='richeditor-h2-button'
                size='small'
                variant={editor.isActive('heading', { level: 2 }) ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
                H2
            </StyledButton>
            <StyledButton
                dataTest='richeditor-h3-button'
                size='small'
                variant={editor.isActive('heading', { level: 3 }) ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
                H3
            </StyledButton>
            <StyledButton
                dataTest='richeditor-h4-button'
                size='small'
                variant={editor.isActive('heading', { level: 4 }) ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            >
                H4
            </StyledButton>
            <StyledButton
                dataTest='richeditor-h5-button'
                size='small'
                variant={editor.isActive('heading', { level: 5 }) ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
            >
                H5
            </StyledButton>
            <StyledButton
                dataTest='richeditor-h6-button'
                size='small'
                variant={editor.isActive('heading', { level: 6 }) ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
            >
                H6
            </StyledButton>
            <StyledButton
                dataTest='richeditor-bullet-list-button'
                size='small'
                variant={editor.isActive('bulletList') ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
                Bullet list
            </StyledButton>
            <StyledButton
                dataTest='richeditor-ordered-list-button'
                size='small'
                variant={editor.isActive('orderedList') ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
                Ordered list
            </StyledButton>
            <StyledButton
                dataTest='richeditor-blockquote-button'
                size='small'
                variant={editor.isActive('blockquote') ? 'outlined' : 'textGray'}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
                Blockquote
            </StyledButton>
            <StyledButton
                dataTest='richeditor-horizontal-rule-button'
                size='small'
                variant='textGray'
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
                Horizontal rule
            </StyledButton>
            <StyledButton
                dataTest='richeditor-hard-break-button'
                size='small'
                variant='textGray'
                onClick={() => editor.chain().focus().setHardBreak().run()}
            >
                Hard break
            </StyledButton>
            <input
                type='color'
                onInput={(event: FormEvent<HTMLInputElement>) =>
                    editor.chain().focus().setColor(event.currentTarget.value).run()
                }
                value={editor.getAttributes('textStyle')['color']}
                data-testid='setColor'
            />
        </div>
    )
}
