import { projects } from '../../content/projects'

/**
 * The Works chapter's scroll budget, in viewport heights. Shared by the pinned
 * chapter (Work.tsx) and the case study, which parks the stage on its project.
 */
export const N = projects.length
export const BUILD = 0.85
export const STEP = 0.62
export const TAIL = 0.25
export const OUT = 0.55
export const TOTAL = BUILD + (N - 1) * STEP + TAIL + OUT
/** Where project n sits in the pin, as a fraction of its length. */
export const stopAt = (n: number) => (BUILD + n * STEP + 0.02) / TOTAL
