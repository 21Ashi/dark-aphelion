import { loaderDone } from '../lib/motion'

/**
 * Background work for the 3D scene, kept out of the way of the first
 * impression: nothing here runs before the intro has handed over, and the
 * rest happens in idle time.
 */
type Idle = (cb: () => void, opts?: { timeout: number }) => number
const ric: Idle =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? (cb, opts) => (window as unknown as { requestIdleCallback: Idle }).requestIdleCallback(cb, opts)
    : (cb) => window.setTimeout(cb, 120)

/** Run `cb` once the preloader has handed over and the hero's entrance has played, when idle. */
export function afterIntro(cb: () => void) {
  let cancelled = false
  const go = () => ric(() => !cancelled && cb(), { timeout: 2500 })
  let off = () => {}
  if (loaderDone.get()) go()
  else
    off = loaderDone.subscribe(() => {
      if (!loaderDone.get()) return
      off()
      window.setTimeout(go, 1800) // the hero's entrance
    })
  return () => {
    cancelled = true
    off()
  }
}

/** Small GPU jobs (uploads, single compiles), one per idle slot, so they never pile into one frame. */
const queue: (() => void)[] = []
let busy = false
function pump() {
  if (busy || !queue.length) return
  busy = true
  ric(
    () => {
      queue.shift()?.()
      busy = false
      pump()
    },
    { timeout: 400 },
  )
}
export function whenIdle(fn: () => void) {
  queue.push(fn)
  pump()
}
