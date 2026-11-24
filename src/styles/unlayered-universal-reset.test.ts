import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postcss, { type Declaration, type Rule } from 'postcss'
import { describe, expect, it } from 'vitest'

/**
 * ASMA-9047 guard: the published stylesheet must not contain an unlayered universal rule that
 * sets margin or padding.
 *
 * `asma-app-chat` imports `dist/style.css` globally. An unlayered `* { margin: 0; padding: 0 }`
 * therefore beats every CSS layer (and the app's Tailwind utilities) on every page that loads
 * chat, not just inside the rich editor. The reset may keep resetting the editor, but it must be
 * scoped to the editor root and/or live inside a layer.
 *
 * Run order: `pnpm build` (writes dist/style.css), then `pnpm test`.
 *
 * This test deliberately does not build. It must inspect the artifact exactly as it is published,
 * and a build step here would hide a stale or mutated stylesheet instead of failing on it.
 */
const stylesheetPath = resolve(process.cwd(), 'dist/style.css')

/** A declaration on the rule itself (not one nested in a child rule) that sets a box spacing side. */
const isSpacingDeclaration = (property: string) => /^(margin|padding)(-|$)/.test(property.toLowerCase())

/** A rule is layered when any ancestor at-rule is `@layer` (named or anonymous). */
const isLayered = (rule: Rule) => {
    for (let ancestor = rule.parent; ancestor && ancestor.type !== 'root'; ancestor = ancestor.parent) {
        if (ancestor.type === 'atrule' && ancestor.name.toLowerCase() === 'layer') return true
    }
    return false
}

/** A selector list contains a bare universal when one entry is exactly `*`. */
const hasBareUniversal = (rule: Rule) => rule.selectors.some((selector) => selector.trim() === '*')

describe('built stylesheet (dist/style.css)', () => {
    it('has no unlayered universal rule that sets margin or padding', () => {
        expect(
            existsSync(stylesheetPath),
            `dist/style.css was not found at ${stylesheetPath}. Run "pnpm build" before "pnpm test": ` +
                'this guard reads the built stylesheet, not the source CSS.',
        ).toBe(true)

        const root = postcss.parse(readFileSync(stylesheetPath, 'utf8'), { from: stylesheetPath })

        const offenders: string[] = []
        root.walkRules((rule) => {
            if (isLayered(rule) || !hasBareUniversal(rule)) return

            const spacing = rule.nodes
                .filter((node): node is Declaration => node.type === 'decl' && isSpacingDeclaration(node.prop))
                .map((node) => `${node.prop}: ${node.value}`)
            if (spacing.length === 0) return

            const start = rule.source?.start
            const location = start ? `line ${start.line}, column ${start.column}` : 'unknown location'
            offenders.push(`${location}: ${rule.selector} { ${spacing.join('; ')} }`)
        })

        expect(
            offenders,
            'Unlayered universal rules that set margin or padding override every CSS layer. ' +
                'Scope the reset to the editor root (for example `:where(.core-ui-rte, .core-ui-rte *)`) ' +
                'or put it in an `@layer`. Offending rules in dist/style.css:\n' +
                offenders.map((offender) => `  - ${offender}`).join('\n'),
        ).toEqual([])
    })
})
