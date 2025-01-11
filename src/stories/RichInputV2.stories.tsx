import type { Meta } from '@storybook/react'
import { RichInput } from 'src/rich-input/RichInput'

const meta = {
    title: '*/RichInput',
    component: RichInput,
    tags: [],
    argTypes: {},
    args: {},
} satisfies Meta<typeof RichInput>

export default meta
export const Input2 = () => {
    return (
        <div className='flex flex-col gap-4'>
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
                content='Chat editor with no styles for customization'
                noDefaultStyles
                hideToolbar
            />
        </div>
    )
}
