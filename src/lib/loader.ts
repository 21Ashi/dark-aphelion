import { createStore } from './motion'

/**
 * Real loading progress, not a fake timer. Three weighted tasks:
 *   fonts  — the display faces (SplitText must measure the real glyphs)
 *   scene  — the lazily imported Three.js chunk
 *   gpu    — the scene's shaders compiled and the first frame drawn
 */
const weights = { fonts: 0.25, scene: 0.4, gpu: 0.35 } as const
type Task = keyof typeof weights

const done = new Set<Task>()
export const loadProgress = createStore(0)

export function complete(task: Task) {
  if (done.has(task)) return
  done.add(task)
  let p = 0
  done.forEach((t) => (p += weights[t]))
  loadProgress.set(Math.min(1, p))
}

// Fonts: resolve on load, but never hold the experience hostage.
if (typeof document !== 'undefined') {
  const fontsReady = document.fonts?.ready ?? Promise.resolve()
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(() => complete('fonts'))
}
