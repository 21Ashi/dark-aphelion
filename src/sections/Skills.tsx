import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../lib/gsap'
import { skillCategories } from '../content/skills'
import { motion } from '../lib/motion'
import { isTouch, prefersReducedMotion } from '../lib/quality'
import { Constellation } from './skills/Constellation'
import s from './Skills.module.css'

const MARQUEE = ['Flutter', 'React', 'Node.js', 'C# .NET', 'TypeScript', 'Three.js', 'GLSL', 'Firebase', 'MySQL', 'GSAP']

/**
 * Instruments. A kinetic marquee whose direction follows your scroll, then
 * the toolkit as a constellation: pick a category, its stars gather.
 */
export function Skills() {
  const root = useRef<HTMLElement>(null)
  const marquee = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const head = SplitText.create(q('[data-sk-head]'), { type: 'chars', mask: 'chars' })
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ scrollTrigger: { trigger: q('[data-sk-header]'), start: 'top 80%' } })
          .from(head.chars, { yPercent: 115, duration: 1.2, stagger: 0.04 })
          .from(q('[data-cat]'), { yPercent: 100, opacity: 0, duration: 1, stagger: 0.06 }, 0.2)
          .from(q('[data-sky]'), { opacity: 0, scale: 0.9, duration: 1.6 }, 0.1)
      })
      return () => {
        mm.revert()
        head.revert()
      }
    },
    { scope: root },
  )

  // Marquee: constant drift; scroll velocity adds speed and sets direction.
  useEffect(() => {
    const el = marquee.current!
    const strip = el.firstElementChild as HTMLElement
    if (prefersReducedMotion) return
    let x = 0
    let dir = -1
    let visible = false
    const st = ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (self) => (visible = self.isActive) })
    const tick = (_: number, dt: number) => {
      if (!visible) return
      const v = motion.velocity
      if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1
      x += dir * (0.06 + Math.min(Math.abs(v) * 0.02, 0.6)) * dt
      const half = strip.scrollWidth / 2
      if (x <= -half) x += half
      if (x > 0) x -= half
      strip.style.transform = `translate3d(${x}px,0,0) skewX(${gsap.utils.clamp(-10, 10, v * -0.3)}deg)`
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      st.kill()
    }
  }, [])

  const current = active === null ? null : skillCategories[active]

  return (
    <section id="skills" ref={root} className={`chapter ${s.skills}`}>
      <div className={s.shade} aria-hidden />
      <div ref={marquee} className={s.marquee} aria-hidden>
        <div className={s.strip}>
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className={i % 2 ? s.outline : undefined}>
              {t}
              <i>✦</i>
            </span>
          ))}
        </div>
      </div>

      <div className={s.layout}>
        <div className={s.left}>
          <header data-sk-header>
            <span className={s.index}>
              <span>05</span> — Instruments
            </span>
            <h2 className={s.title}>
              <span data-sk-head>Toolkit</span>
            </h2>
          </header>

          <ul className={s.cats} onPointerLeave={() => !isTouch && setActive(null)}>
            {skillCategories.map((c, i) => (
              <li key={c.id}>
                <button
                  className={s.cat}
                  data-cat
                  aria-pressed={active === i}
                  onPointerEnter={() => !isTouch && setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive((a) => (a === i && isTouch ? null : i))}
                >
                  <span className={s.catNum}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={s.catLabel}>{c.label}</span>
                  <span className={s.catCount}>{c.skills.length}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className={s.detail} aria-live="polite">
            {current ? (
              <>
                <p className={s.blurb}>{current.blurb}</p>
                <p className={s.list}>{current.skills.join(' · ')}</p>
              </>
            ) : (
              <p className={s.blurb}>
                {isTouch ? 'Tap' : 'Hover'} a category to gather its stars.
              </p>
            )}
          </div>
        </div>

        <div className={s.sky} data-sky>
          <Constellation active={active} />
        </div>
      </div>

      {/* Full list for assistive tech */}
      <div className="sr-only">
        {skillCategories.map((c) => (
          <p key={c.id}>
            {c.label}: {c.skills.join(', ')}
          </p>
        ))}
      </div>
    </section>
  )
}
