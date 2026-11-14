import { useEffect, useRef, useState } from 'react'
import { gsap, SplitText, useGSAP } from '../../lib/gsap'
import { projects, themeVars } from '../../content/projects'
import { isTouch, prefersReducedMotion } from '../../lib/quality'
import { ProjectVisual } from './ProjectVisual'
import s from './Archive.module.css'

/**
 * The index: every project as one editorial row. On desktop a live preview
 * of the hovered project trails the cursor, leaning with its velocity.
 * Any row opens the full case study.
 */
export function Archive({ onOpen }: { onOpen: (index: number, from?: HTMLElement | null) => void }) {
  const root = useRef<HTMLElement>(null)
  const float = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const head = SplitText.create(q('[data-ix-head]'), { type: 'chars', mask: 'chars' })
      // This component's effects run before Work's (it's a child), so without a
      // lower priority these triggers would be measured before the Works pin
      // adds its scroll distance — and fire while the reader is still in Works.
      const after = { refreshPriority: -1 }
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(head.chars, {
          yPercent: 115,
          duration: 1.2,
          stagger: 0.035,
          scrollTrigger: { trigger: q('[data-ix-header]'), start: 'top 80%', ...after },
        })
        q('[data-row]').forEach((row: Element) => {
          gsap
            .timeline({ scrollTrigger: { trigger: row, start: 'top 92%', ...after } })
            .from(row.querySelector('[data-row-rule]'), { scaleX: 0, duration: 1.1, ease: 'cineInOut' })
            .from(row.querySelectorAll('[data-row-in]'), { yPercent: 100, opacity: 0, duration: 0.9, stagger: 0.05 }, 0.1)
        })
      })
      return () => {
        mm.revert()
        head.revert()
      }
    },
    { scope: root },
  )

  // Floating preview follows the pointer with lag and leans into the motion.
  useEffect(() => {
    if (isTouch || prefersReducedMotion) return
    const el = float.current!
    const x = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3' })
    const y = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3' })
    const r = gsap.quickTo(el, 'rotation', { duration: 0.9, ease: 'power3' })
    let lastX = 0
    const move = (e: PointerEvent) => {
      x(e.clientX)
      y(e.clientY)
      r(gsap.utils.clamp(-10, 10, (e.clientX - lastX) * 0.4))
      lastX = e.clientX
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  useEffect(() => {
    if (isTouch || prefersReducedMotion) return
    gsap.to(float.current, {
      autoAlpha: hover === null ? 0 : 1,
      scale: hover === null ? 0.7 : 1,
      duration: 0.5,
      ease: 'cine',
      overwrite: 'auto',
    })
  }, [hover])

  return (
    <section id="index" ref={root} className={`chapter ${s.archive}`} aria-label="All projects">
      <div className={s.shade} aria-hidden />
      <header className={s.header} data-ix-header>
        <h2 className={s.title}>
          <span data-ix-head>Every project</span>
        </h2>
        <p className={s.count}>
          <span className="serif">{projects.length}</span> products, newest first.
        </p>
      </header>

      <ol className={s.list} onPointerLeave={() => setHover(null)}>
        {projects.map((p, i) => (
          <li key={p.id} data-row style={themeVars(p.theme)}>
            <span className={s.rule} data-row-rule aria-hidden />
            <button
              className={s.row}
              data-active={hover === i}
              data-cursor="Open"
              onPointerEnter={() => !isTouch && setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={(e) => onOpen(i, e.currentTarget)}
            >
              <span className={s.num} data-row-in>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={s.name} data-row-in>
                {/* GSAP moves the outer span; the hover shift lives on this one. */}
                <span className={s.nameInner}>{p.title}</span>
              </span>
              <span className={`serif ${s.sub}`} data-row-in>
                {p.subtitle}
              </span>
              <span className={s.stack} data-row-in>
                {p.category}
              </span>
              <span className={s.year} data-row-in>
                {p.year ?? '—'}
              </span>
              <span className={s.arrow} aria-hidden>
                →
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div ref={float} className={s.float} aria-hidden>
        {hover !== null && <ProjectVisual project={projects[hover]} index={hover} />}
      </div>
    </section>
  )
}
