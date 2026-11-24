import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
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

/**
 * ASMA-8913 portability: the component ships Roboto faces in `styles/index.scss`, but the toolbar
 * inherits Tailwind's `ui-sans-serif, system-ui` stack, so its text metrics (and the measured
 * breakpoint slack) depended on the host OS. Pin the bundled face on each test fixture only —
 * production CSS is untouched — and load every weight before measuring, so macOS and the Linux CI
 * runner exercise the same metrics. The derived width assertions below then hold on either host.
 */
const TEST_FONT_FAMILY = 'Roboto'
const TEST_FONT_WEIGHTS = [100, 300, 400, 500, 700, 900]

beforeAll(async () => {
    const faces = await Promise.all(
        TEST_FONT_WEIGHTS.map((weight) => document.fonts.load(`${weight} 16px ${TEST_FONT_FAMILY}`)),
    )
    expect(
        faces.every((loaded) => loaded.length > 0),
        `the bundled ${TEST_FONT_FAMILY} faces must load in the test browser`,
    ).toBe(true)
    await document.fonts.ready
})

/**
 * The fixture pins the font, but a component rule could still override it on the measured control.
 * Assert the computed family at the measuring point so the derived widths cannot silently absorb a
 * different font; the font-size control is absent below four visible buttons, so fall back to the row.
 */
const expectPinnedFont = (container: HTMLElement): void => {
    const measured =
        container.querySelector<HTMLElement>('[data-testid="richeditor-font-size-select"]') ??
        container.querySelector<HTMLElement>('.toolbar')
    if (!measured) throw new Error('No measured control rendered')

    expect(getComputedStyle(measured).fontFamily, 'the measured control must render with the pinned font').toContain(
        TEST_FONT_FAMILY,
    )
}

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

            // The font-size control only exists from four visible buttons up; when it is not there,
            // there is no caret to wait for.
            const fontButton = toolbar.querySelector<HTMLElement>('[data-testid="richeditor-font-size-select"]')
            if (fontButton && !fontButton.querySelector('svg')) {
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
        <div style={{ width: containerWidth, fontFamily: TEST_FONT_FAMILY }}>
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
    expectPinnedFont(mounted.container)

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
        // minus the 1px border on each side; the minimum is what carries the 44px target. Computed
        // style serialises to four decimals, hence the tolerance.
        expect(Number.parseFloat(overlay.width), `${name}: ::after width`).toBeGreaterThanOrEqual(
            Math.max(box.width - 2, TARGET_SIZE) - 0.01,
        )
        expect(Number.parseFloat(overlay.height), `${name}: ::after height`).toBeGreaterThanOrEqual(
            Math.max(box.height - 2, TARGET_SIZE) - 0.01,
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

    /**
     * The drawn width of the font-size control, derived from the rendered label and whichever caret
     * is actually in flow. No font metric or caret pixel value is hardcoded: compact mode must
     * contribute exactly the label plus horizontal padding/border, and wide mode exactly that plus
     * the in-flow caret. If the compact caret were put back in flow, this width would grow by its box.
     */
    const expectedFontSizeControlWidth = (container: HTMLElement, compact: boolean): number => {
        const control = fontSizeControl(container)
        const label = control.querySelector<HTMLElement>('div')
        if (!label) throw new Error('No font-size label rendered')
        const style = getComputedStyle(control)
        const chrome = ['border-left-width', 'border-right-width', 'padding-left', 'padding-right'].reduce(
            (sum, property) => sum + Number.parseFloat(style.getPropertyValue(property) || '0'),
            0,
        )
        const caret = compact ? null : control.querySelector('svg')
        if (!compact && !caret) throw new Error('the wide font-size control must render its in-flow caret')

        return label.getBoundingClientRect().width + chrome + (caret?.getBoundingClientRect().width ?? 0)
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

    /**
     * ASMA-8913 round 2 — the space before Close, measured between the two drawn boxes. `space-between`
     * distributes the row's leftover width into this one gap, so at a breakpoint it collapses and the
     * control before Close loses the right edge of its 44px target.
     */
    const gapBeforeClose = (container: HTMLElement): number => {
        const buttons = toolbarButtons(container)
        const close = container.querySelector<HTMLElement>('[data-testid="richeditor-close-toolbar-button"]')
        if (!close) throw new Error('No Close control rendered')
        const index = buttons.indexOf(close)
        const previous = index > 0 ? buttons[index - 1] : undefined
        if (!previous) throw new Error('No control before Close rendered')

        return close.getBoundingClientRect().left - previous.getBoundingClientRect().right
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
        // the label plus caret width and the row is untouched.
        expect(caretOutOfFlow(container), 'compact mode must be off at 1280').toBe(false)
        expect(
            fontSizeControl(container).getBoundingClientRect().width,
            'font-size control width at 1280',
        ).toBeCloseTo(expectedFontSizeControlWidth(container, false), 2)
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
            expect(
                fontSizeControl(container).getBoundingClientRect().width,
                'font-size control width at 390',
            ).toBeCloseTo(expectedFontSizeControlWidth(container, true), 2)
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
            expect(gapBeforeClose(container), 'the 4px gap before Close must be back').toBeGreaterThanOrEqual(4)

            // Strict: every control owns all nine points, no neighbour exception.
            for (const button of buttons) expectTarget(button)
        } finally {
            await page.viewport(1280, 720)
        }
    })

    /**
     * ASMA-8913 round 2 — the audit's failing widths plus every effective breakpoint after the 13px
     * slack (nominal + 13). Each case asserts the designed behaviour end-to-end: row fits, no control
     * outside the field, **≥4px gap before Close**, and all nine hit points of every 44x44 square
     * (strict identity, no neighbour exception). The button count is pinned too, so the cost of the
     * slack — collapsing 13px earlier — is visible in the test as well as in the screenshots.
     */
    it('keeps the 4px gap and all nine hit points at every toolbar breakpoint', async () => {
        const cases: Array<{
            width: number
            locale: 'no' | 'en'
            buttons: number
            compact: boolean
            hasFontSize?: boolean
        }> = [
            // Norwegian. Audit widths first (334/380/424/469/514/534/540 + 390), then the effective
            // breakpoints and the two sides of the compact threshold (546/547). Below four visible
            // buttons the font-size control does not exist, so compact mode is not applicable.
            { width: 334, locale: 'no', buttons: 5, compact: false, hasFontSize: false },
            { width: 346, locale: 'no', buttons: 5, compact: false, hasFontSize: false },
            { width: 347, locale: 'no', buttons: 6, compact: true },
            { width: 380, locale: 'no', buttons: 6, compact: true },
            { width: 390, locale: 'no', buttons: 6, compact: true },
            { width: 392, locale: 'no', buttons: 6, compact: true },
            { width: 393, locale: 'no', buttons: 7, compact: true },
            { width: 424, locale: 'no', buttons: 7, compact: true },
            { width: 436, locale: 'no', buttons: 7, compact: true },
            { width: 437, locale: 'no', buttons: 8, compact: true },
            { width: 469, locale: 'no', buttons: 8, compact: true },
            { width: 481, locale: 'no', buttons: 8, compact: true },
            { width: 482, locale: 'no', buttons: 9, compact: true },
            { width: 514, locale: 'no', buttons: 9, compact: true },
            { width: 526, locale: 'no', buttons: 9, compact: true },
            { width: 527, locale: 'no', buttons: 10, compact: true },
            { width: 534, locale: 'no', buttons: 10, compact: true },
            { width: 540, locale: 'no', buttons: 10, compact: true },
            { width: 546, locale: 'no', buttons: 10, compact: true },
            { width: 547, locale: 'no', buttons: 10, compact: false },

            // English: the same set shifted by its wider labels; its compact threshold is 553.
            { width: 340, locale: 'en', buttons: 5, compact: false, hasFontSize: false },
            { width: 352, locale: 'en', buttons: 5, compact: false, hasFontSize: false },
            { width: 353, locale: 'en', buttons: 6, compact: true },
            { width: 383, locale: 'en', buttons: 6, compact: true },
            { width: 390, locale: 'en', buttons: 6, compact: true },
            { width: 395, locale: 'en', buttons: 6, compact: true },
            { width: 396, locale: 'en', buttons: 7, compact: true },
            { width: 430, locale: 'en', buttons: 7, compact: true },
            { width: 442, locale: 'en', buttons: 7, compact: true },
            { width: 443, locale: 'en', buttons: 8, compact: true },
            { width: 475, locale: 'en', buttons: 8, compact: true },
            { width: 487, locale: 'en', buttons: 8, compact: true },
            { width: 488, locale: 'en', buttons: 9, compact: true },
            { width: 520, locale: 'en', buttons: 9, compact: true },
            { width: 532, locale: 'en', buttons: 9, compact: true },
            { width: 533, locale: 'en', buttons: 10, compact: true },
            { width: 540, locale: 'en', buttons: 10, compact: true },
            { width: 552, locale: 'en', buttons: 10, compact: true },
            { width: 553, locale: 'en', buttons: 10, compact: false },
        ]

        for (const { width, locale, buttons, compact, hasFontSize = true } of cases) {
            const { container, unmount } = await mountRichInput(width, true, locale)
            const label = `${width}px ${locale}`
            const rendered = toolbarButtons(container)

            if (hasFontSize) {
                expect(caretOutOfFlow(container), `${label}: compact mode`).toBe(compact)
                expect(
                    fontSizeControl(container).getBoundingClientRect().width,
                    `${label}: font-size control width`,
                ).toBeCloseTo(expectedFontSizeControlWidth(container, compact), 2)
            } else {
                expect(
                    container.querySelector('[data-testid="richeditor-font-size-select"]'),
                    `${label}: no font-size control below four visible buttons`,
                ).toBeNull()
            }

            expect(rendered, `${label}: button count`).toHaveLength(buttons)
            expectRowFits(container)
            expect(gapBeforeClose(container), `${label}: gap before Close`).toBeGreaterThanOrEqual(4)

            for (const button of rendered) expectTarget(button)

            unmount()
        }
    })

    it('switches the caret out of flow exactly at the compact threshold', async () => {
        // Overflow breakpoint + caret 20px, on the slack-adjusted width: 534 + 13 = 547 (no) and
        // 540 + 13 = 553 (en) measured.
        const cases: Array<{ width: number; locale: 'no' | 'en'; compact: boolean }> = [
            { width: 546, locale: 'no', compact: true },
            { width: 547, locale: 'no', compact: false },
            { width: 552, locale: 'en', compact: true },
            { width: 553, locale: 'en', compact: false },
        ]

        for (const { width, locale, compact } of cases) {
            const { container, unmount } = await mountRichInput(width, true, locale)

            expect(caretOutOfFlow(container), `${width}px ${locale}: compact mode`).toBe(compact)
            expect(
                fontSizeControl(container).getBoundingClientRect().width,
                `${width}px ${locale}: font-size control width`,
            ).toBeCloseTo(expectedFontSizeControlWidth(container, compact), 2)

            unmount()
        }
    })

    /**
     * The sweep that motivated round 2 covers 300-620px in 1px steps. The project's own pre-fix run
     * of it reports 57/321 failing widths in Norwegian and 60/321 in English: at every breakpoint the
     * row exact-fits, the gap before Close collapses to 0-3.9px, and the control before it loses the
     * right edge of its 44px square. This is the same sweep as an assertion: at every width, the row
     * fits, no control leaves the field, the gap before Close is at least 4px, and every button owns
     * all nine points of its 44px square. Failures are collected for both locales before asserting,
     * so one run reports the count in each rather than stopping at the first failing locale.
     */
    const SWEEP_WIDTHS = Array.from({ length: 321 }, (_, index) => 300 + index)

    const sweepProblem = (container: HTMLElement): string | null => {
        const toolbar = container.querySelector<HTMLElement>('.toolbar')
        if (!toolbar) return 'no toolbar'
        if (toolbar.scrollWidth > toolbar.clientWidth) {
            return `row overflows (${toolbar.scrollWidth} > ${toolbar.clientWidth})`
        }

        const toolbarBox = toolbar.getBoundingClientRect()
        const buttons = toolbarButtons(container)
        if (buttons.length === 0) return 'no buttons'

        for (const button of buttons) {
            const box = button.getBoundingClientRect()
            if (box.left < toolbarBox.left - 0.5) return `${nameOf(button)} starts outside the field`
            if (box.right > toolbarBox.right + 0.5) return `${nameOf(button)} ends outside the field`
        }

        const gap = gapBeforeClose(container)
        if (gap < 4) return `gap before Close ${gap.toFixed(2)}px`

        for (const button of buttons) {
            const box = button.getBoundingClientRect()
            const centreX = box.left + box.width / 2
            const centreY = box.top + box.height / 2
            for (const [dx, dy] of TARGET_POINTS) {
                if (document.elementFromPoint(centreX + dx, centreY + dy) !== button) {
                    return `${nameOf(button)} does not own (${dx}, ${dy})`
                }
            }
        }

        return null
    }

    const sweepMount = (width: number, locale: 'no' | 'en') => {
        const mounted = mount(
            <div style={{ width, fontFamily: TEST_FONT_FAMILY }}>
                <RichInput
                    dataTest='rich-input-sweep'
                    toolbarDefaultVisible
                    locale={locale}
                    label={locale === 'en' ? 'Message' : 'Melding'}
                    labelPlacement='floating'
                    placeholder={locale === 'en' ? 'Write here' : 'Skriv her'}
                />
            </div>,
        )
        expectPinnedFont(mounted.container)

        return mounted
    }

    type SweepFailures = Record<'no' | 'en', string[]>

    const logSweep = (kind: 'fresh' | 'resize', failures: SweepFailures): void => {
        for (const locale of ['no', 'en'] as const) {
            console.log(
                `SWEEP ${kind} ${locale}: ${failures[locale].length}/${SWEEP_WIDTHS.length} failing widths` +
                    (failures[locale].length > 0 ? ` — ${failures[locale].slice(0, 12).join(', ')}` : ''),
            )
        }
    }

    it('passes the 300-620px fresh-mount sweep in both locales', async () => {
        const failures: SweepFailures = { no: [], en: [] }

        for (const locale of ['no', 'en'] as const) {
            for (const width of SWEEP_WIDTHS) {
                const { container, unmount } = sweepMount(width, locale)
                const problem = sweepProblem(container)
                if (problem) failures[locale].push(`${width}px: ${problem}`)
                unmount()
            }
        }

        logSweep('fresh', failures)
        // One assertion for both locales, so a failure reports the Norwegian and English counts
        // together instead of stopping at whichever locale fails first.
        expect(failures, 'fresh-mount sweep failing widths').toEqual({ no: [], en: [] })
    }, 600_000)

    it('passes the 300-620px resize sweep in both locales', async () => {
        const failures: SweepFailures = { no: [], en: [] }

        for (const locale of ['no', 'en'] as const) {
            const mounted = sweepMount(620, locale)
            const host = mounted.container.firstElementChild as HTMLElement | null
            if (!host) throw new Error('No sweep host rendered')

            for (const width of SWEEP_WIDTHS) {
                host.style.width = `${width}px`
                // ResizeObserver → React state update → layout; two frames plus a macrotask.
                await new Promise<void>((resolve) =>
                    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0))),
                )

                const problem = sweepProblem(mounted.container)
                if (problem) failures[locale].push(`${width}px: ${problem}`)
            }

            mounted.unmount()
        }

        logSweep('resize', failures)
        expect(failures, 'resize sweep failing widths').toEqual({ no: [], en: [] })
    }, 600_000)
})
