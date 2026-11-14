import { Fragment, useRef } from 'react'
import { ArrowRightIcon, MouseScrollIcon } from '@phosphor-icons/react'
import { gsap, SplitText, useGSAP } from '../../lib/gsap'
import { projects } from '../../content/projects'
import { SLIDES } from '../../content/showcase'
import { ICONS } from './icons'
import { logoFor } from '../../content/stack'
import s from './Showcase.module.css'

/**
 * The type column of the Works stage, with its icons and logos. Kept out of the
 * main bundle: Work.tsx loads it in idle time, long before the stage assembles.
 */
const N = projects.length
const pad = (n: number) => String(n).padStart(2, '0')

/**
 * One project's type column. The name is split into masked letters that rise
 * into place (or leave upward, in the scroll's direction); the rest follows in
 * a short stagger.
 */
export function Slide({
  index,
  leaving,
  dir,
  quick,
  hot,
  onExplore,
  onHot,
}: {
  index: number
  leaving: boolean
  dir: 1 | -1
  /** Arrived while scrolling fast: a plain fade, no letter split. */
  quick: boolean
  hot: boolean
  onExplore: () => void
  onHot: (on: boolean) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const p = projects[index]
  const sl = SLIDES[p.id]
  const len = Math.max(...sl.lines.map((l) => l.length))

  useGSAP(
    () => {
      const q = gsap.utils.selector(ref)
      // Leaving: whole lines, no letter split (scrolling fast through several projects stays cheap).
      if (leaving) {
        gsap.to(q('[data-split]'), { yPercent: -40 * dir, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power3.in' })
        gsap.to(q('[data-rise]'), { y: -22 * dir, opacity: 0, duration: 0.36, stagger: 0.025, ease: 'power2.in' })
        return
      }
      if (quick) {
        gsap.from(q('[data-split], [data-rise]'), { opacity: 0, y: 14 * dir, duration: 0.45, ease: 'power2.out' })
        return
      }
      const split = SplitText.create(q('[data-split]'), { type: 'words,chars', mask: 'chars' })
      gsap.from(split.chars, {
        yPercent: 115 * dir,
        rotationX: -55 * dir,
        transformPerspective: 600,
        transformOrigin: '50% 100%',
        duration: 1.05,
        stagger: 0.022,
        ease: 'expo.out',
        delay: 0.16,
      })
      gsap.from(q('[data-rise]'), {
        y: 28 * dir,
        opacity: 0,
        duration: 0.95,
        stagger: 0.06,
        ease: 'expo.out',
        delay: 0.3,
      })
      return () => split.revert()
    },
    // the entrance must stop (and the split be undone) before the exit starts
    { scope: ref, dependencies: [leaving, dir], revertOnUpdate: true },
  )

  return (
    <div
      ref={ref}
      className={s.slide}
      data-leaving={leaving}
      aria-hidden={leaving || undefined}
      inert={leaving || undefined}
    >
      <p className={s.kicker} data-rise>
        <span className={s.pill}>
          {pad(index + 1)} <small>/ {pad(N)}</small>
        </span>
        <span className={s.rule} aria-hidden />
        <span>{p.category}</span>
      </p>
      <h3 className={s.title} style={{ ['--len' as string]: len }} data-hot={hot} aria-label={p.title}>
        <span data-split aria-hidden>
          {sl.lines[0]}
        </span>
        {sl.lines[1] ? (
          <span data-split className={s.accent} aria-hidden>
            {sl.lines[1]}
          </span>
        ) : (
          sl.kicker && (
            <span data-split className={s.sub} aria-hidden>
              {sl.kicker}
            </span>
          )
        )}
      </h3>
      <p className={s.tagline} data-rise>
        {sl.tagline}
      </p>
      <ul className={s.features} aria-label="Highlights">
        {sl.features.map(({ icon, label }) => {
          const Icon = ICONS[icon]
          return (
            <li key={label} className={s.feature} data-rise>
              <Icon weight="light" aria-hidden />
              <span>{label}</span>
            </li>
          )
        })}
      </ul>
      <div className={s.actions} data-rise>
        <button
          className={s.explore}
          onClick={onExplore}
          onPointerEnter={() => onHot(true)}
          onPointerLeave={() => onHot(false)}
          onFocus={() => onHot(true)}
          onBlur={() => onHot(false)}
          data-cursor="Open"
        >
          Explore project
          <span className={s.arrow} aria-hidden>
            <ArrowRightIcon weight="bold" />
            <ArrowRightIcon weight="bold" />
          </span>
        </button>
        <p className={s.stack} aria-label={`Built with ${sl.stack.join(', ')}`}>
          <span className={s.logos} aria-hidden>
            {sl.stack.map((name) => {
              const logo = logoFor(name)
              return (
                logo && (
                  <svg key={name} viewBox="0 0 24 24" fill={logo.color}>
                    <path d={logo.path} />
                  </svg>
                )
              )
            })}
          </span>
          <span className={s.rule} aria-hidden />
          <span className={s.names} aria-hidden>
            {sl.stack.map((name, k) => (
              <Fragment key={name}>
                {k > 0 && <i />}
                {name}
              </Fragment>
            ))}
          </span>
        </p>
      </div>
    </div>
  )
}

/** Bottom right: a nudge to keep scrolling. */
export function ScrollHint() {
  return (
    <>
      <MouseScrollIcon weight="light" />
      Scroll to explore
    </>
  )
}
