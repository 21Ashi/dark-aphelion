import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { scrollToTarget } from '../../lib/scroll'
import s from './Coda.module.css'

const LINES: { w: string; serif?: boolean }[][] = [
  [{ w: 'The' }, { w: 'work' }],
  [{ w: 'is' }, { w: 'never' }],
  [{ w: 'finished.', serif: true }],
]

/**
 * The bridge out of the projects: one sentence, assembled word by word on a
 * sticky stage while the scene drifts on behind it, then handed over to the
 * Experience chapter. Reduced motion shows the sentence as it is.
 */
export function Coda() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: root.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.6,
              // Measured after the Works pin above it (this component's effects run first).
              refreshPriority: -1,
            },
          })
          .from(q('[data-word]'), { yPercent: 120, rotate: 4, duration: 1, stagger: 0.55 })
          .from(q('[data-rule]'), { scaleX: 0, duration: 1.2 }, '-=0.4')
          .from(q('[data-next]'), { opacity: 0, y: 20, duration: 0.8 }, '<0.4')
          .to(q('[data-stage]'), { scale: 1.06, opacity: 0, duration: 1.4 }, '+=1')
      })
      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="coda" ref={root} className={s.coda} aria-label="The work is never finished">
      <div className={s.sticky}>
        <div className={s.stage} data-stage>
          <h2 className={s.words}>
            {LINES.map((line, i) => (
              <span key={i} className={s.line} data-line={i}>
                {line.map(({ w, serif }) => (
                  <span key={w} className={s.mask}>
                    <span data-word className={serif ? `serif ${s.serif}` : undefined}>
                      {w}
                    </span>
                  </span>
                ))}
              </span>
            ))}
          </h2>
          <span className={s.rule} data-rule aria-hidden />
          <a
            className={s.next}
            href="#experience"
            data-next
            data-cursor="Next"
            onClick={(e) => {
              e.preventDefault()
              scrollToTarget('#experience')
            }}
          >
            <span>Next</span> Trajectory <span aria-hidden>↓</span>
          </a>
        </div>
      </div>
    </section>
  )
}
