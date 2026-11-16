import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { RichInput } from 'src/rich-input/RichInput'
import { cleanup, mount } from 'src/test-utils/renderInteraction'
import { contrastRatio, parseColor, relativeLuminance, WHITE, type Rgba } from 'src/test-utils/wcagContrast'

/**
 * ASMA-8913 — the rich-text composer's two accessibility regressions, measured where they exist:
 * a real Chromium, on computed styles and real hit-testing. A DOM emulator would report the CSS
 * text it parsed rather than the colour a user sees, and would not resolve an `::after` overlay's
 * pointer target at all.
 *
 * T1 (WCAG 1.4.3 Contrast, minimum): the resting floating label and the tiptap placeholder must
 * reach 4.5:1 on the white field surface, in all three themes.
 * T2 (WCAG 2.5.8 Target Size, minimum): every control in the `.toolbar` row must accept a press
 * anywhere inside a 44x44 square centred on its drawn box, without growing that box.
 */

const WCAG_AA_TEXT = 4.5
const TARGET_SIZE = 44
const DRAWN_SIZE = 40

/** The theme attribute `.storybook/preview.ts` drives through `withThemeByDataAttribute`. */
const THEMES = ['default', 'greenish', 'fretex'] as const
type Theme = (typeof THEMES)[number]

/** The confirmed decision for ASMA-8913; ui-core finding F-01 owns the shared token. */
const CONFIRMED_TEXT_TOKEN = '--colors-delta-600'
const ENTERED_TEXT_TOKEN = '--colors-delta-800'
const REJECTED_TEXT_TOKEN = '--colors-delta-500'

const FLOATING_LABEL = 'Melding'
const PLACEHOLDER = 'Skriv her'

const setTheme = (theme: Theme): void => {
    document.documentElement.setAttribute('data-theme', theme)
}

const colourOf = (element: Element, pseudo?: string): Rgba => {
    const parsed = parseColor(getComputedStyle(element, pseudo).color)
    if (!parsed) throw new Error(`Unreadable colour on <${element.tagName.toLowerCase()}>${pseudo ?? ''}`)
    return parsed
}

/** A theme token (`--colors-delta-600`) as the colour the browser resolves it to right now. */
const tokenColour = (token: string): Rgba => {
    const probe = document.createElement('span')
    probe.style.color = `var(${token})`
    document.body.append(probe)
    const colour = colourOf(probe)
    probe.remove()
    return colour
}

/**
 * The surface the text is painted on: the nearest ancestor that paints an opaque background. An
 * unpainted fixture falls through to the canvas, which is white — the surface every theme's contrast
 * was specified against.
 */
const paintedBackground = (element: Element): Rgba => {
    for (let node: Element | null = element; node; node = node.parentElement) {
        const parsed = parseColor(getComputedStyle(node).backgroundColor)
        if (parsed && parsed.a === 1) return parsed
    }

    return WHITE
}

const unquote = (cssContent: string): string => cssContent.replace(/^["']|["']$/g, '')

const floatingLabelElement = (container: HTMLElement): HTMLElement => {
    const label = Array.from(container.querySelectorAll('span')).find(
        (node) => node.textContent === FLOATING_LABEL && node.getAttribute('aria-hidden') === 'true',
    )
    if (!label) throw new Error('No floating label rendered')

    return label
}

/**
 * The live editor, not RichInput's hidden sizing mirror: the mirror copies the ProseMirror element's
 * className and innerHTML (so its measured height matches) and sits earlier in the DOM, which makes
 * a bare `.ProseMirror` query land on a node at x=-99999 with `visibility: hidden`.
 */
const editorElement = (container: HTMLElement): HTMLElement => {
    const editor = container.querySelector<HTMLElement>('.core-ui-rte .ProseMirror')
    if (!editor) throw new Error('No ProseMirror editor rendered')

    return editor
}

/** The empty-paragraph placeholder tiptap paints through `p.is-editor-empty:first-child::before`. */
const placeholderState = (container: HTMLElement) => {
    const paragraph = editorElement(container).querySelector('p.is-editor-empty')
    if (!paragraph) throw new Error('No empty paragraph: the placeholder decoration is not applied')

    const pseudo = getComputedStyle(paragraph, '::before')
    const background = parseColor(pseudo.backgroundColor)
    if (!background) throw new Error(`Unreadable placeholder background: ${pseudo.backgroundColor}`)

    return {
        text: unquote(pseudo.content),
        colour: colourOf(paragraph, '::before'),
        background,
    }
}

/**
 * ASMA-8913: Iconify paints an icon only after its async lookup resolves. The toolbar's six payloads
 * are registered in `interaction.setup.ts`, so they exist on the first render and this gate is
 * deterministic instead of a layout-stability guess: every icon-only control has its svg and the
 * font-size control has its caret. Two animation frames then let the measured row settle.
 */
const settleToolbarLayout = async (container: HTMLElement): Promise<void> => {
    await vi.waitFor(
        () => {
            const toolbar = container.querySelector<HTMLElement>('.toolbar')
            if (!toolbar) throw new Error('the toolbar is not rendered yet')
            if (!toolbar.querySelector('[data-testid="richeditor-font-size-select"] svg')) {
                throw new Error('the font-size caret is not painted yet')
            }

            const iconOnly = Array.from(toolbar.querySelectorAll('button')).filter(
                (button) => !button.textContent?.trim(),
            )
            const painted = iconOnly.filter((button) => button.querySelector('svg') !== null)
            if (painted.length !== iconOnly.length) {
                throw new Error(`toolbar icons are not painted yet (${painted.length}/${iconOnly.length})`)
            }
        },
        { timeout: 5000, interval: 50 },
    )
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

const mountRichInput = async (containerWidth: number, withFloatingLabel: boolean, locale: 'no' | 'en' = 'no') => {
    const mounted = mount(
        <div style={{ width: containerWidth }}>
            <RichInput
                dataTest='rich-input-a11y'
                toolbarDefaultVisible
                locale={locale}
                label={withFloatingLabel ? FLOATING_LABEL : undefined}
                labelPlacement={withFloatingLabel ? 'floating' : undefined}
                placeholder={PLACEHOLDER}
            />
        </div>,
    )
    await settleToolbarLayout(mounted.container)

    return mounted
}

describe('ASMA-8913 T1 — placeholder and resting label contrast', () => {
    afterEach(cleanup)

    it.each(THEMES)('passes 1.4.3 on the %s theme', async (theme) => {
        setTheme(theme)

        const confirmed = tokenColour(CONFIRMED_TEXT_TOKEN)
        const rejected = tokenColour(REJECTED_TEXT_TOKEN)
        const entered = tokenColour(ENTERED_TEXT_TOKEN)

        // The ticket replaces a ramp step, not a computed value: the confirmed token is the darker
        // of the two in every theme, so the substitution cannot be "fixed" by picking a lighter grey.
        expect(
            relativeLuminance(rejected),
            `${REJECTED_TEXT_TOKEN} must be lighter than ${CONFIRMED_TEXT_TOKEN}`,
        ).toBeGreaterThan(relativeLuminance(confirmed))

        // Resting floating label: not shrunk (empty + unfocused), no error, not disabled/read-only.
        const labelled = await mountRichInput(600, true)
        const label = floatingLabelElement(labelled.container)
        // Guards that the assert below measures the RESTING state; the shrunk label is delta-800 and
        // is a different requirement (it sits on the border, not in the placeholder's slot).
        expect(label.style.top, 'resting label must not be shrunk').toBe('9px')

        const labelColour = colourOf(label)
        expect(labelColour, 'resting label must use the confirmed token').toEqual(confirmed)
        const labelRatio = contrastRatio(labelColour, paintedBackground(label))
        expect(
            labelRatio,
            `resting label ${getComputedStyle(label).color} on white is ${labelRatio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(WCAG_AA_TEXT)
        labelled.unmount()

        // Placeholder without a floating label: visible while the editor is empty and unfocused.
        const plain = await mountRichInput(600, false)
        const plainPlaceholder = placeholderState(plain.container)
        expect(plainPlaceholder.text, 'the placeholder check must not pass on empty content').toBe(PLACEHOLDER)
        expect(plainPlaceholder.colour, 'placeholder must use the confirmed token').toEqual(confirmed)

        const plainEditor = editorElement(plain.container)
        const plainRatio = contrastRatio(plainPlaceholder.colour, paintedBackground(plainEditor))
        expect(
            plainRatio,
            `placeholder ${getComputedStyle(plainEditor, '::before').color} on white is ${plainRatio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(WCAG_AA_TEXT)

        // The ::before must not paint its own backdrop, or the ratio would be measured against a
        // colour the user does not see behind the text.
        expect(plainPlaceholder.background.a, 'placeholder must not paint a background').toBe(0)
        expect(paintedBackground(plainEditor), 'field surface must be white').toEqual(WHITE)
        plain.unmount()

        // Placeholder with a floating label: only shown once focused (MUI behaviour). Focusing an
        // already-empty document does not rebuild the placeholder decoration — the text is a node
        // decoration captured at transaction time — so type and delete one character, which is the
        // smallest real user path that produces the focused empty state.
        const focused = await mountRichInput(600, true)
        const editor = editorElement(focused.container)
        await userEvent.click(editor)
        await userEvent.keyboard('a')
        await userEvent.keyboard('{Backspace}')
        await expect
            .poll(
                () =>
                    editorElement(focused.container).querySelector('p.is-editor-empty')
                        ? placeholderState(focused.container).text
                        : '',
                { message: 'the focused placeholder never rendered' },
            )
            .toBe(PLACEHOLDER)

        const focusedState = placeholderState(focused.container)
        expect(focusedState.colour, 'focused placeholder must use the confirmed token').toEqual(confirmed)
        const focusedRatio = contrastRatio(focusedState.colour, paintedBackground(editor))

        expect(
            focusedRatio,
            `focused placeholder ${getComputedStyle(editor, '::before').color} on white is ${focusedRatio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(WCAG_AA_TEXT)
        expect(focusedState.background.a, 'placeholder must not paint a background').toBe(0)

        // "Quieter than the entered text" is part of the design: the placeholder must stay below
        // delta-800 (what the user's own text is painted in), not just above the AA floor.
        expect(focusedRatio, 'placeholder must stay quieter than entered text').toBeLessThan(
            contrastRatio(entered, WHITE),
        )

        focused.unmount()
    })
})

describe('ASMA-8913 T2 — 44px pointer targets in the toolbar row', () => {
    afterEach(cleanup)
    afterEach(() => setTheme('default'))

    const toolbarButtons = (container: HTMLElement): HTMLElement[] =>
        Array.from(container.querySelectorAll<HTMLElement>('.toolbar button'))

    /** Nine points: the 44x44 square's corners, edge midpoints and centre, relative to the button. */
    const TARGET_POINTS: Array<[number, number]> = [-1, 0, 1].flatMap((column) =>
        [-1, 0, 1].map((row): [number, number] => [column * 21, row * 21]),
    )

    const nameOf = (button: HTMLElement): string =>
        button.getAttribute('aria-label') ?? button.getAttribute('data-testid') ?? button.textContent ?? 'button'

    const expectTargetGeometry = (button: HTMLElement): void => {
        const name = nameOf(button)
        const box = button.getBoundingClientRect()

        // The drawn box is untouched: an icon control stays 40x40, and a labelled control (the font
        // size select, the Close label) keeps its content width. Only the pointer target grows.
        expect(box.height, `${name}: drawn height`).toBe(DRAWN_SIZE)
        expect(box.width, `${name}: drawn width`).toBeGreaterThanOrEqual(DRAWN_SIZE)

        const overlay = getComputedStyle(button, '::after')
        expect(overlay.minWidth, `${name}: ::after min-width`).toBe(`${TARGET_SIZE}px`)
        expect(overlay.minHeight, `${name}: ::after min-height`).toBe(`${TARGET_SIZE}px`)
        // `width: 100%` resolves against the padding box, so a bordered button's overlay is its box
        // minus the 1px border on each side; the minimum is what carries the 44px target.
        expect(Number.parseFloat(overlay.width), `${name}: ::after width`).toBeGreaterThanOrEqual(
            Math.max(box.width - 2, TARGET_SIZE),
        )
        expect(Number.parseFloat(overlay.height), `${name}: ::after height`).toBeGreaterThanOrEqual(
            Math.max(box.height - 2, TARGET_SIZE),
        )
    }

    const expectTarget = (button: HTMLElement): void => {
        expectTargetGeometry(button)

        const box = button.getBoundingClientRect()
        const centreX = box.left + box.width / 2
        const centreY = box.top + box.height / 2

        for (const [dx, dy] of TARGET_POINTS) {
            expect(
                document.elementFromPoint(centreX + dx, centreY + dy),
                `${nameOf(button)}: no press lands at (${dx}, ${dy}) from the centre`,
            ).toBe(button)
        }
    }

    const fontSizeControl = (container: HTMLElement): HTMLElement => {
        const control = container.querySelector<HTMLElement>('[data-testid="richeditor-font-size-select"]')
        if (!control) throw new Error('No font-size control rendered')

        return control
    }

    /** Compact mode is the caret being out of the flex flow: it cannot add width. */
    const caretOutOfFlow = (container: HTMLElement): boolean => {
        const caret = container.querySelector<HTMLElement>('[data-testid="richeditor-font-size-caret"]')
        return caret !== null && getComputedStyle(caret).position === 'absolute'
    }

    const expectRowFits = (container: HTMLElement): void => {
        const toolbar = container.querySelector<HTMLElement>('.toolbar')
        if (!toolbar) throw new Error('No toolbar rendered')

        expect(toolbar.scrollWidth, 'toolbar content must fit its own width').toBeLessThanOrEqual(toolbar.clientWidth)

        const toolbarBox = toolbar.getBoundingClientRect()
        for (const button of toolbarButtons(container)) {
            const box = button.getBoundingClientRect()
            expect(box.left, `${nameOf(button)}: starts left of the field`).toBeGreaterThanOrEqual(
                toolbarBox.left - 0.5,
            )
            expect(box.right, `${nameOf(button)}: ends right of the field`).toBeLessThanOrEqual(toolbarBox.right + 0.5)
        }
    }

    it('gives all ten controls of the wide toolbar a 44x44 target', async () => {
        const { container } = await mountRichInput(1280, true)
        const buttons = toolbarButtons(container)

        // 9 formatting controls (emoji, H1, H2, font size, lists, bold, italic, link) + Close.
        expect(buttons).toHaveLength(10)
        expect(buttons.some((button) => button.getAttribute('data-testid') === 'richeditor-more-menu-button')).toBe(
            false,
        )

        // 1280 must be visually identical to bfdf679: the caret stays in flow, so the control keeps
        // its 106.5px width and the row is untouched.
        expect(caretOutOfFlow(container), 'compact mode must be off at 1280').toBe(false)
        expect(fontSizeControl(container).getBoundingClientRect().width, 'font-size control width at 1280').toBe(106.5)
        expectRowFits(container)

        for (const button of buttons) expectTarget(button)
    })

    it('covers the overflow control when the toolbar is narrow', async () => {
        // Below the 520px overflow breakpoint, so the nine formatting controls collapse and the
        // "more" control joins the row. Compact mode is on, so the caret adds no width and the row
        // keeps its 4px gaps.
        const { container } = await mountRichInput(500, true)
        const buttons = toolbarButtons(container)
        const more = container.querySelector<HTMLElement>('[data-testid="richeditor-more-menu-button"]')

        expect(more, 'the overflow control must be in the toolbar row').not.toBeNull()
        expect(buttons.length).toBeGreaterThan(1)
        expect(buttons).toContain(more)
        expect(caretOutOfFlow(container), 'compact mode must be on at 500').toBe(true)
        expectRowFits(container)

        for (const button of buttons) expectTarget(button)
    })

    it('keeps the target and the 4px gap on a 390px viewport', async () => {
        await page.viewport(390, 700)

        try {
            const { container } = await mountRichInput(390, true)
            const buttons = toolbarButtons(container)
            const more = container.querySelector<HTMLElement>('[data-testid="richeditor-more-menu-button"]')
            const close = container.querySelector<HTMLElement>('[data-testid="richeditor-close-toolbar-button"]')
            if (!more || !close) throw new Error('the narrow toolbar must render More and Close')

            // The caret fix: the row fits, nothing is clipped, and the gap before Close is back.
            expect(caretOutOfFlow(container), 'compact mode must be on at 390').toBe(true)
            expect(fontSizeControl(container).getBoundingClientRect().width, 'font-size control width at 390').toBe(86.5)
            expectRowFits(container)

            // The caret must sit at the right edge without covering the size label.
            const caret = container.querySelector<HTMLElement>('[data-testid="richeditor-font-size-caret"]')
            const labelText = fontSizeControl(container).querySelector('div')
            if (!caret || !labelText) throw new Error('the compact caret and its label must be rendered')
            const labelRange = document.createRange()
            labelRange.selectNodeContents(labelText)
            const labelBox = labelRange.getBoundingClientRect()
            const caretBox = caret.getBoundingClientRect()
            expect(caretBox.left, 'the caret must not overlap the size label').toBeGreaterThanOrEqual(
                labelBox.right + 2,
            )
            expect(caretBox.right, 'the caret must stay inside the control').toBeLessThanOrEqual(
                fontSizeControl(container).getBoundingClientRect().right,
            )
            // The gap is the 4px flex gap plus whatever space-between distributes; it must be back
            // at (at least) the designed 4px rather than collapsing to 0 as it did with the wider
            // control.
            expect(
                close.getBoundingClientRect().left - more.getBoundingClientRect().right,
                'the 4px gap before Close must be back',
            ).toBeGreaterThanOrEqual(4)

            // Strict: every control owns all nine points, no neighbour exception.
            for (const button of buttons) expectTarget(button)
        } finally {
            await page.viewport(1280, 720)
        }
    })

    it('switches the caret out of flow exactly at the compact threshold', async () => {
        // The threshold is the overflow breakpoint plus the caret's 20px: 534 for Norwegian, 540 for
        // English. Each pair is [one pixel below → compact, at the threshold → normal].
        const cases: Array<{ width: number; locale: 'no' | 'en'; compact: boolean }> = [
            { width: 390, locale: 'no', compact: true },
            { width: 500, locale: 'no', compact: true },
            { width: 514, locale: 'no', compact: true },
            { width: 520, locale: 'en', compact: true },
            { width: 533, locale: 'no', compact: true },
            { width: 534, locale: 'no', compact: false },
            { width: 539, locale: 'en', compact: true },
            { width: 540, locale: 'en', compact: false },
        ]

        for (const { width, locale, compact } of cases) {
            const { container, unmount } = await mountRichInput(width, true, locale)
            const label = `${width}px ${locale}`

            expect(caretOutOfFlow(container), `${label}: compact mode`).toBe(compact)
            expect(
                fontSizeControl(container).getBoundingClientRect().width,
                `${label}: font-size control width`,
            ).toBe(compact ? 86.5 : 106.5)
            expectRowFits(container)

            unmount()
        }
    })
})
