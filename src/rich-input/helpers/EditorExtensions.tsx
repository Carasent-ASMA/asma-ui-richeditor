import Bold from '@tiptap/extension-bold'
import BulletList from '@tiptap/extension-bullet-list'
import Heading from '@tiptap/extension-heading'
import Italic from '@tiptap/extension-italic'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import FontSize from 'tiptap-extension-font-size'
import TextStyle from '@tiptap/extension-text-style'

export const defaultExtensions = [Document, Paragraph, Text, TextStyle]
export const editModeExtensions = [
    Heading.configure({
        levels: [1, 2],
    }),
    ListItem,
    BulletList,
    OrderedList,
    Link,
    Bold,
    Italic,
    FontSize,
]
