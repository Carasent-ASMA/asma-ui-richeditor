import clsx from 'clsx'

/**
 * DS floating label for the rich text editor (Figma node 20571-30699). Class recipe copied from
 * asma-ui-core `src/components/inputs/field-styles.ts` (`floatingLabelClass` +
 * `floatingLabelLayoutStyle`) — those helpers are not exported from the ui-core barrel, so the
 * layout/typography is duplicated here to match StyledInputField.
 *
 * One deliberate departure, ASMA-8913: the resting (not shrunk) label is `text-delta-600`, not the
 * `text-delta-500` ui-core still uses. delta-500 is #7a899e on white, 3.56:1, below the 4.5:1 that
 * WCAG 1.4.3 requires of a placeholder surrogate; delta-600 measures 5.18:1 (default and greenish)
 * and 8.59:1 (fretex). ui-core finding F-01 covers the same defect in StyledInputField; until ui-core
 * resolves it, this label is intentionally a step darker than the shared field's. Converge on the
 * shared helpers (and drop this override) once F-01 ships.
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
                        : 'text-delta-600',
            shrink
                ? 'left-[14px] bg-white px-1 text-xs leading-[16px] tracking-[0.24px]' // Figma Small 12/16, ls 0.24px
                : 'left-[17px] text-base leading-6', // rests over the editor padding (16px + 1px outline)
        )}
        style={shrink ? { top: 0, transform: 'translateY(-50%)' } : { top: 9 }}
    >
        {label}
    </span>
)
