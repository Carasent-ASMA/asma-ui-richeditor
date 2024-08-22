import type { Meta } from '@storybook/react'

import { useState } from 'react'
import { RichInput } from 'src/rich-input/RichInput'

const meta = {
    title: '*/RichInput',
    component: RichInput,
    tags: [],
    argTypes: {},
    args: {},
} satisfies Meta<typeof RichInput>

export default meta
export const Input1 = () => {
    const [val, setVal] = useState('')

    return (
        <div className='flex flex-col w-full gap-12'>
            <RichInput
                // hideMenuBar
                // noDefaultStyles
                label='Test label'
                helperText='Required Field'
                // is_error
                isRequired
                dataTest='test'
                onUpdate={(editor) => setVal(editor.editor.getText())}
                placeholder='Type something'
                content={val}
            />
        </div>
    )
}
