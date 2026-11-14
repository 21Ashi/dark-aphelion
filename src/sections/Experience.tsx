import { useRef, type CSSProperties } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { jobs } from '../content/experience'
import { isTouch } from '../lib/quality'
import { Chars, travel, useFit, velocitySkew } from './about/kinetic'
import s from './Experience.module.css'

const pad = (n: number) => String(n).padStart(2, '0')

// ── The sequence, in viewport-heights of scroll ──────────────────────────
const PRE = 0.75 // the first role assembles while the stage rises into place
const HOLD = 0.7 // one role
const SWAP = 0.55 // the roll from one role to the next
const POST = 1 // the stage scrolls away
const PIN = jobs.length * HOLD + (jobs.length - 1) * SWAP

/**
 * Trajectory. One pinned stage, one role at a time: the year in hollow
 * numerals drifting across the scene, the company set as large as it will go,
 * the role as a single label. Between roles the year rolls like an odometer
 * and the name leaves and arrives through its own mask. No descriptions.
 */
export function Experience() {
  const root = useRef<HTMLElement>(null)
  useFit(root)

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const lean = velocitySkew(q('[data-year]'), 'skewX', 8)

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: el,
            start: 'top 75%',
            end: 'bottom top',
            scrub: isTouch ? 0.5 : 0.8,
            invalidateOnRefresh: true,
            // Measured after the long Works pin above it.
            refreshPriority: -1,
            onUpdate: (self) => lean.kick(self.getVelocity()),
          },
        })

        const parts = (q('[data-job]') as HTMLElement[]).map((li) => ({
          digits: li.querySelectorAll('[data-digit]'),
          chars: li.querySelectorAll('[data-ch]'),
          lines: li.querySelectorAll('[data-line]'),
        }))
        if (!parts.length) return
        parts.forEach((p) => {
          gsap.set(p.digits, { yPercent: 45, opacity: 0 })
          gsap.set(p.chars, { yPercent: 55, opacity: 0 })
          gsap.set(p.lines, { yPercent: 55, opacity: 0 })
        })
        gsap.set(q('[data-index], [data-count]'), { yPercent: 60, opacity: 0 })

        const arrive = (p: (typeof parts)[number], t: number, after: number) =>
          tl
            .to(p.digits, { yPercent: 0, opacity: 1, duration: 0.34, ease: 'power3.inOut', stagger: 0.035 }, t)
            .to(p.chars, { yPercent: 0, opacity: 1, duration: 0.3, ease: 'power3.out', stagger: { amount: 0.14 } }, t + after)
            .to(p.lines, { yPercent: 0, opacity: 1, duration: 0.2, ease: 'power3.out', stagger: 0.03 }, t + after + 0.1)
        const depart = (p: (typeof parts)[number], t: number) =>
          tl
            .to(p.digits, { yPercent: -45, opacity: 0, duration: 0.34, ease: 'power3.inOut', stagger: 0.035 }, t)
            .to(p.chars, { yPercent: -55, opacity: 0, duration: 0.22, ease: 'power2.in', stagger: { amount: 0.1 } }, t)
            .to(p.lines, { yPercent: -55, opacity: 0, duration: 0.16, ease: 'power2.in', stagger: 0.02 }, t)

        // The first role forms on the approach and has landed by the time the
        // stage pins (t = PRE), so a jump to #experience arrives on a finished frame.
        tl.to(q('[data-index], [data-count]'), { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out', stagger: 0.05 }, 0.3)
        arrive(parts[0], 0.16, 0.12)

        // Every later one rolls in as the last rolls out: same columns, same
        // moment, so the year reads as one odometer.
        parts.forEach((p, i) => {
          if (!i) return
          const t = PRE + i * HOLD + (i - 1) * SWAP
          depart(parts[i - 1], t)
          arrive(p, t, 0.2)
          tl.to(q('[data-roll]'), { yPercent: (-100 / parts.length) * i, duration: 0.3, ease: 'power3.inOut' }, t + 0.06)
        })

        // The numerals drift the whole way through; the line keeps count.
        tl.fromTo(q('[data-year]'), { x: travel(24, 4) }, { x: travel(-10, -5), duration: PRE + PIN + POST }, 0)
          .fromTo(q('[data-bar]'), { scaleX: 0 }, { scaleX: 1, duration: PIN }, PRE)
          .set({}, {}, PRE + PIN + POST)

        return () => lean.kill()
      })

      return () => mm.revert()
    },
    { scope: root },
  )

  return (
    <section id="experience" ref={root} className={`chapter ${s.exp}`} style={{ '--pin': PIN } as CSSProperties}>
      <div className={s.stage}>
        <h2 className={s.index}>
          <span className={s.mask}>
            <span data-index>
              <span aria-hidden>
                <b>04</b> —{' '}
              </span>
              Trajectory
            </span>
          </span>
        </h2>

        <ol className={s.jobs}>
          {jobs.map((j) => {
            const year = j.period.match(/\d{4}/)?.[0] ?? ''
            return (
              <li key={j.company + j.role} className={s.job} data-job>
                {/* The start year, enlarged. The period itself is the label below. */}
                <div className={s.year} data-year aria-hidden>
                  {Array.from(year).map((d, n) => (
                    <span key={n} className={s.slot}>
                      <span data-digit>{d}</span>
                    </span>
                  ))}
                </div>

                <div className={s.body}>
                  <h3 className={s.company} data-fit>
                    <span className="sr-only">{j.company}</span>
                    <Chars text={j.company} />
                  </h3>
                  <div className={s.meta}>
                    <p className={s.role}>
                      <span className={s.mask}>
                        <span data-line>{j.role}</span>
                      </span>
                      <span className={`${s.mask} ${s.period}`}>
                        <span data-line>{j.period}</span>
                      </span>
                    </p>
                    <ul className={s.tags}>
                      {j.stack.slice(0, 3).map((t, n) => (
                        <li key={t}>
                          <span className={s.mask}>
                            <span data-line>
                              {t}
                              {n < 2 && n < j.stack.length - 1 && <b aria-hidden>/</b>}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        <div className={s.foot} aria-hidden>
          <span className={s.counter}>
            <span className={s.mask}>
              <span data-count>
                <span className={s.roll}>
                  <span className={s.rollStrip} data-roll>
                    {jobs.map((_, i) => (
                      <span key={i}>{pad(i + 1)}</span>
                    ))}
                  </span>
                </span>
                <span className={s.of}>/ {pad(jobs.length)}</span>
              </span>
            </span>
          </span>
          <span className={s.track}>
            <span className={s.bar} data-bar />
            {jobs.map((_, i) => (
              <i key={i} style={{ left: `${((i * (HOLD + SWAP) + HOLD / 2) / PIN) * 100}%` }} />
            ))}
          </span>
        </div>
      </div>
    </section>
  )
}
