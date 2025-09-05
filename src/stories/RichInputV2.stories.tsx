import type { Meta } from '@storybook/react'
import { StyledButton } from 'asma-core-ui'
import { useState } from 'react'
import { RichInput } from 'src/rich-input/RichInput'

const meta = {
    title: '*/RichInput',
    component: RichInput,
    tags: [],
    argTypes: {},
    args: {},
} satisfies Meta<typeof RichInput>

function makeid(length: number) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    let counter = 0
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
        counter += 1
    }
    return result
}

export default meta
export const Input2 = () => {
    const [placeholder, setPlaceholder] = useState('test')

    return (
        <div className='flex flex-col gap-4'>
            <StyledButton
                dataTest='placeholder-toggle'
                onClick={() => {
                    setPlaceholder(makeid(7))
                }}
            >
                toggle placeholder values
            </StyledButton>

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
                // content=""
                noDefaultStyles
                hideToolbar
                placeholder={placeholder}
            />
        </div>
    )
}
