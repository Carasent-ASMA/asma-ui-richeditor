import clsx from 'clsx'

/**
 * DS floating label for the rich text editor (Figma node 20571-30699). Class recipe copied from
 * asma-ui-core `src/components/inputs/field-styles.ts` (`floatingLabelClass` +
 * `floatingLabelLayoutStyle`) — those helpers are not exported from the ui-core barrel, so the
 * shrunk-notch typography/colors are duplicated here verbatim to stay pixel-identical to
 * StyledInputField. Converge on the shared helpers if ui-core ever exports them.
 */
export const FloatingLabel = ({
    label,
    shrink,
    focused,
    error,
    disabled,
    readOnly,
}: {
    label: string
    shrink: boolean
    focused: boolean
    error?: boolean
    disabled?: boolean
    readOnly?: boolean
}) => (
    <span
        aria-hidden
        className={clsx(
            'pointer-events-none absolute z-10 max-w-[calc(100%-1.75rem)] truncate transition-colors duration-150',
            disabled
                ? 'text-delta-300'
                : readOnly
                  ? 'text-delta-800'
                  : error
                    ? 'text-error-500'
                    : focused
                      ? 'text-gama-500'
                      : shrink
                        ? 'text-delta-800'
                        : 'text-delta-500',
            shrink
                ? 'left-[14px] bg-white px-1 text-xs leading-[16px] tracking-[0.24px]' // Figma Small 12/16, ls 0.24px
                : 'left-[17px] text-base leading-6', // rests over the editor padding (16px + 1px outline)
        )}
        style={shrink ? { top: 0, transform: 'translateY(-50%)' } : { top: 9 }}
    >
        {label}
    </span>
)
