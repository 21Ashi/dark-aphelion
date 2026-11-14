import { projects } from '../../content/projects'

/**
 * The Works chapter's scroll budget, in viewport heights. Shared by the pinned
 * chapter (Work.tsx) and the case study, which parks the stage on its project.
 */
export const N = projects.length
export const BUILD = 1.1
export const STEP = 0.75
export const TAIL = 0.4
export const OUT = 0.9
export const TOTAL = BUILD + (N - 1) * STEP + TAIL + OUT
/** Where project n sits in the pin, as a fraction of its length. */
export const stopAt = (n: number) => (BUILD + n * STEP + 0.02) / TOTAL
