import { injectAxe, checkA11y, configureAxe } from 'axe-playwright'
import { MINIMAL_VIEWPORTS } from 'storybook/viewport'

import { type TestRunnerConfig, getStoryContext } from '@storybook/test-runner'

type Size = { width: number; height: number }
type ViewportGlobal = { value?: string; isRotated?: boolean }
let runnerViewport: Size | null = null

/*
 * See https://storybook.js.org/docs/react/writing-tests/test-runner#test-hook-api-experimental
 * to learn more about the test-runner hooks API.
 */
const a11yConfig: TestRunnerConfig = {
    async preVisit(page, context) {
        await injectAxe(page)

        // The Storybook UI honours a story's `globals.viewport`; the runner does not by itself. Apply it,
        // and restore the runner's own size for the next story on the same page.
        runnerViewport ??= page.viewportSize()
        const { storyGlobals, parameters } = await getStoryContext(page, context)
        const viewport = storyGlobals?.['viewport'] as ViewportGlobal | undefined
        const options = { ...MINIMAL_VIEWPORTS, ...parameters?.['viewport']?.options }
        const styles = viewport?.value ? options[viewport.value]?.styles : undefined
        if (styles && typeof styles === 'object') {
            const width = parseInt(String(styles.width), 10)
            const height = parseInt(String(styles.height), 10)
            await page.setViewportSize(viewport?.isRotated ? { width: height, height: width } : { width, height })
        } else if (runnerViewport) {
            await page.setViewportSize(runnerViewport)
        }
    },
    async postVisit(page, context) {
        // Get the entire context of a story, including parameters, args, argTypes, etc.
        const storyContext = await getStoryContext(page, context)

        // Apply story-level a11y rules
        await configureAxe(page, {
            rules: storyContext.parameters?.a11y?.config?.rules,
        })

        // Report only (skipFailures): until this config became an ES module export the runner never loaded
        // it, so these checks never ran, and existing stories still have violations to triage.
        await checkA11y(
            page,
            '#storybook-root',
            {
                detailedReport: true,
                detailedReportOptions: {
                    html: true,
                },
            },
            true,
        )
    },
}

export default a11yConfig
