import type { Meta } from '@storybook/react'
import { EditSquareIcon, StyledButton, StyledInputField } from 'asma-core-ui'

import { useState } from 'react'
import { RichInput } from 'src/rich-input/RichInput'
import { AttachmentsMenu } from './AttachmentsMenuExample'

const meta = {
    title: '*/RichInput',
    component: RichInput,
    tags: [],
    argTypes: {},
    args: {},
} satisfies Meta<typeof RichInput>

export default meta
export const Input1 = () => {
    const [content, setContent] = useState('<p>Default content</p>')
    const [readOnly, setReadOnly] = useState(true)
    const error = false

    return (
        <div className='flex flex-col gap-4'>
            <StyledButton
                dataTest='toggle-editable'
                variant='contained'
                className='self-start'
                onClick={() => setReadOnly(!readOnly)}
            >
                {readOnly ? 'Edit' : 'Close'}
            </StyledButton>
            <StyledInputField
                size='small'
                dataTest='none'
                readOnly={readOnly}
                required={!readOnly}
                helperText={!readOnly && '* required'}
                // label={'Private message'}
                error={error}
                placeholder={'Private message'}
                InputProps={{
                    endAdornment: !readOnly && <EditSquareIcon width={20} height={20} />,
                }}
            />
            <RichInput
                // hideToolbar
                // noDefaultStyles={readOnly}
                // title={'Title label'}
                // label={'Group message'}
                // toolbarDefaultVisible
                placeholder={'Group message'}
                helperText={'* required'}
                error={true}
                attachmentsMenu={<AttachmentsMenu />}
                required
                dataTest='custom-rte'
                onUpdate={({ editor }) => setContent(editor.getHTML())}
                content={content}
                readOnly={readOnly ? 'outlined' : undefined}
                maxScrollableHeight={260}
                locale={'en'}
                attachments={[
                    { key: '1', label: 'label 1', dataTest: 'one' },
                    { key: '2', label: 'label 2', dataTest: 'two' },
                ]}
            />
        </div>
    )
}
