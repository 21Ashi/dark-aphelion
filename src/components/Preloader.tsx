import { useEffect, useRef } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { loadProgress } from '../lib/loader'
import { loaderDone, motion } from '../lib/motion'
import { prefersReducedMotion } from '../lib/quality'
import { startScroll, stopScroll } from '../lib/scroll'
import s from './Preloader.module.css'

const BARS = 64
const MIN_TIME = prefersReducedMotion ? 0.3 : 1 // seconds the count takes at the very least

/**
 * Black → a breathing waveform → real percentage → the AA mark draws itself
 * → the waveform flattens into a horizon → the horizon opens like an eyelid
 * onto the 3D world.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null)
  const bars = useRef<(HTMLSpanElement | null)[]>([])
  const counter = useRef<HTMLSpanElement>(null)
  const amp = useRef({ value: 0.25 })

  // The waveform: one rAF, transforms only.
  useEffect(() => {
    if (prefersReducedMotion) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      // Gone (the reveal hides the preloader): stop for good, not every frame forever.
      if (root.current?.style.display === 'none') return
      const t = (now - start) / 1000
      const a = amp.current.value
      for (let i = 0; i < BARS; i++) {
        const el = bars.current[i]
        if (!el) continue
        const x = i / (BARS - 1)
        const env = Math.sin(x * Math.PI) ** 1.5
        const wave =
          0.5 + 0.5 * Math.sin(t * 3.1 + x * 11) * Math.sin(t * 1.7 - x * 6.5) + 0.25 * Math.sin(t * 7 + i * 1.7)
        el.style.transform = `scaleY(${Math.max(0.015, env * wave * a)})`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useGSAP(
    () => {
      document.documentElement.classList.add('is-loading')
      stopScroll()
      window.scrollTo(0, 0)

      const shown = { value: 0 }
      const begin = performance.now()
      let finished = false

      let last = performance.now()
      const update = () => {
        const now = performance.now()
        const dt = Math.min((now - last) / 1000, 0.5)
        last = now
        const elapsed = (now - begin) / 1000
        const cap = Math.min(1, elapsed / MIN_TIME)
        const target = Math.min(loadProgress.get(), cap)
        shown.value += (target - shown.value) * (1 - Math.exp(-dt * 7))
        if (target >= 0.999 && shown.value > 0.99) shown.value = 1
        amp.current.value = 0.25 + shown.value * 0.75
        if (counter.current) counter.current.textContent = String(Math.round(shown.value * 100)).padStart(3, '0')
        if (shown.value >= 1 && !finished) {
          finished = true
          gsap.ticker.remove(update)
          reveal()
        }
      }
      gsap.ticker.add(update)

      const reveal = () => {
        const q = gsap.utils.selector(root)
        const tl = gsap.timeline({
          onComplete: () => {
            document.documentElement.classList.remove('is-loading')
            if (root.current) root.current.style.display = 'none'
          },
        })

        if (prefersReducedMotion) {
          loaderDone.set(true)
          motion.intro = 1
          startScroll()
          tl.to(root.current, { autoAlpha: 0, duration: 0.4, ease: 'none' })
          return
        }

        tl.to(amp.current, { value: 0, duration: 0.45, ease: 'power2.in' })
          .to(q('[data-meta]'), { yPercent: -120, duration: 0.5, ease: 'power3.in', stagger: 0.04 }, 0)
          .to(q('[data-count]'), { yPercent: 110, duration: 0.55, ease: 'power3.in' }, 0)
          .fromTo(
            q('[data-stroke]'),
            { strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut', stagger: 0.08 },
            0.15,
          )
          .fromTo(q('[data-bar]'), { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power3.out' }, 0.55)
          .to(q('[data-horizon]'), { scaleX: 1, duration: 0.7, ease: 'cineInOut' }, 0.45)
          .to(q('[data-mark]'), { y: -18, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 1.0)
          .add(() => {
            loaderDone.set(true)
            startScroll()
            gsap.to(motion, { intro: 1, duration: 3.2, ease: 'cine' })
            // the name starts rising just before the lids part, so it is there as they open
          }, 0.8)
          .to(q('[data-lid="top"]'), { yPercent: -100, duration: 1.25, ease: 'cineInOut' }, 1.15)
          .to(q('[data-lid="bottom"]'), { yPercent: 100, duration: 1.25, ease: 'cineInOut' }, 1.15)
          .to(q('[data-horizon]'), { scaleY: 40, autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, 1.2)
      }

      return () => {
        gsap.ticker.remove(update)
        document.documentElement.classList.remove('is-loading')
      }
    },
    { scope: root },
  )

  return (
    <div ref={root} className={s.root} role="status" aria-live="polite" aria-label="Loading">
      <div className={s.lid} data-lid="top" />
      <div className={s.lid} data-lid="bottom" />

      <div className={s.meta}>
        <span className={s.mask}>
          <span data-meta>Abood Ashi</span>
        </span>
        <span className={s.mask}>
          <span data-meta>Portfolio — ©{new Date().getFullYear()}</span>
        </span>
      </div>

      <div className={s.center}>
        <svg className={s.mark} data-mark viewBox="0 0 120 64" aria-hidden>
          <path data-stroke pathLength={1} d="M6 58 L33 6 L60 58" />
          <path data-stroke pathLength={1} d="M60 58 L87 6 L114 58" />
          <rect data-bar x="0" y="40" width="120" height="3.2" />
        </svg>
        <div className={s.wave} aria-hidden>
          {Array.from({ length: BARS }, (_, i) => (
            <span key={i} ref={(el) => void (bars.current[i] = el)} />
          ))}
        </div>
        <div className={s.horizon} data-horizon />
      </div>

      <div className={s.foot}>
        <span className={s.mask}>
          <span data-meta>Loading the 3D scene</span>
        </span>
        <span className={s.countMask}>
          <span className={s.count} data-count>
            <span ref={counter}>000</span>
            <em>%</em>
          </span>
        </span>
      </div>
    </div>
  )
}
