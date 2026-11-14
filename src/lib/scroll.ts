import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { motion } from './motion'
import { prefersReducedMotion, isTouch } from './quality'

let lenis: Lenis | null = null

/** Lenis drives the scroll; GSAP's ticker drives Lenis; ScrollTrigger listens. */
export function initScroll() {
  if (lenis) return lenis
  if (!prefersReducedMotion) {
    lenis = new Lenis({
      // A short lerp, not a 1.15 s eased duration: the page answers the wheel
      // at once and settles quickly, so scroll-linked motion never trails behind.
      lerp: 0.14,
      smoothWheel: true,
      // Native momentum feels right on touch screens; don't fight it.
      syncTouch: false,
    })
    lenis.on('scroll', (e: Lenis) => {
      motion.velocity = e.velocity
      ScrollTrigger.update()
    })
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
  }
  return lenis
}

function raf(time: number) {
  lenis?.raf(time * 1000)
}

export function destroyScroll() {
  gsap.ticker.remove(raf)
  lenis?.destroy()
  lenis = null
}

export function stopScroll() {
  lenis?.stop()
}
export function startScroll() {
  lenis?.start()
}

/** Smooth-scroll to an element or id. Works with and without Lenis. */
export function scrollToTarget(
  target: string | HTMLElement | number,
  opts: { immediate?: boolean; duration?: number; force?: boolean } = {},
) {
  const el = typeof target === 'string' ? document.getElementById(target.replace('#', '')) : target
  if (el === null) return
  if (lenis) {
    lenis.scrollTo(el as HTMLElement | number, {
      duration: opts.immediate ? 0 : (opts.duration ?? 1.6),
      immediate: opts.immediate,
      // move the page even while scrolling is paused (under an overlay)
      force: opts.force,
      easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    })
  } else {
    const top = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top, behavior: prefersReducedMotion || opts.immediate ? 'auto' : 'smooth' })
  }
}

export const smoothEnabled = () => lenis !== null
export { isTouch }
