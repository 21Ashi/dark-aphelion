import { Fragment, useLayoutEffect, type RefObject } from 'react'
import { gsap } from '../../lib/gsap'
import k from './kinetic.module.css'

/**
 * Shared pieces for the kinetic sequences (Origin and Trajectory): masked
 * characters, shrink-to-fit display type, and a skew that follows scroll speed.
 */

/**
 * A string as masked characters, word by word, so each one can rise out of
 * its own line. Decorative: always paired with the same words as real text.
 * Words also break after a hyphen, so a long compound can wrap on a phone.
 */
export function Chars({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} aria-hidden>
      {text.split(' ').map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          {(word.match(/[^-]+-?|-+/g) ?? [word]).map((unit, j) => (
            <span key={j} className={k.word}>
              {Array.from(unit).map((ch, n) => (
                <span key={n} className={k.ch} data-ch>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </Fragment>
      ))}
    </span>
  )
}

/**
 * Shrinks every `[data-fit]` element under `root` until it fits its parent.
 * The CSS font-size is the design size; this only ever scales it down, and
 * `data-fit` is the share of the parent's width it may take (default 1).
 * Wrapping text is fitted by its longest word, single lines by their length.
 */
export function useFit(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-fit]'))

    const fit = () => {
      targets.forEach((t) => (t.style.fontSize = ''))
      const next = targets.map((t) => {
        const box = t.parentElement!
        const cs = getComputedStyle(box)
        const room =
          (box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) * (Number(t.dataset.fit) || 1)
        const own = getComputedStyle(t)
        const width = t.style.width
        t.style.width = own.whiteSpace === 'nowrap' ? 'max-content' : 'min-content'
        const natural = t.offsetWidth
        t.style.width = width
        return natural > room && room > 0 ? (parseFloat(own.fontSize) * room) / natural : 0
      })
      targets.forEach((t, i) => {
        if (next[i]) t.style.fontSize = `${next[i].toFixed(2)}px`
      })
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    let live = true
    const late = () => live && fit()
    document.fonts?.ready.then(late)
    document.fonts?.addEventListener('loadingdone', late)
    return () => {
      live = false
      ro.disconnect()
      document.fonts?.removeEventListener('loadingdone', late)
      targets.forEach((t) => (t.style.fontSize = ''))
    }
  }, [root])
}

/** Phones and upright tablets: the sequences recompose as vertical posters (mirrors the CSS). */
const POSTER = '(max-width: 640px), (orientation: portrait) and (max-width: 1024px)'

/**
 * A horizontal distance in viewport widths, as a function GSAP re-reads on
 * refresh. Posters get their own (shorter) run: type there nearly fills the width.
 */
export const travel = (wide: number, narrow = wide) => () =>
  (window.innerWidth * (window.matchMedia(POSTER).matches ? narrow : wide)) / 100

/**
 * Leans the targets with scroll speed and lets them settle when it stops.
 * Feed `kick` the ScrollTrigger velocity; call `kill` on cleanup.
 */
export function velocitySkew(targets: Element[], prop: 'skewX' | 'skewY', max: number) {
  const set = gsap.quickSetter(targets, prop, 'deg')
  const lean = { v: 0 }
  const clamp = gsap.utils.clamp(-max, max)
  return {
    kick(velocity: number) {
      const v = clamp(velocity / -260)
      if (Math.abs(v) < Math.abs(lean.v)) return
      lean.v = v
      gsap.to(lean, { v: 0, duration: 0.8, ease: 'power3.out', overwrite: true, onUpdate: () => set(lean.v) })
    },
    kill() {
      gsap.killTweensOf(lean)
      lean.v = 0
      set(0)
    },
  }
}
