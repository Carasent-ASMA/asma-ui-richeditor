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
        <div className=''>
            <RichInput dataTest='test' disabled onChange={() => undefined} value='Hello World' className='' />
        </div>
    )
}
