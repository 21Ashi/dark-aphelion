import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, XIcon } from '@phosphor-icons/react'
import { gsap } from '../../lib/gsap'
import { projects, themeVars, type Media, type Project } from '../../content/projects'
import { SLIDES } from '../../content/showcase'
import { logoFor } from '../../content/stack'
import { iconSrc } from '../../content/gallery'
import { motion } from '../../lib/motion'
import { scrollToTarget, startScroll, stopScroll } from '../../lib/scroll'
import { prefersReducedMotion } from '../../lib/quality'
import { stopAt } from './track'
import s from './CaseStudy.module.css'

const BASE = import.meta.env.BASE_URL
const N = projects.length
const pad = (n: number) => String(n).padStart(2, '0')

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'gallery', label: 'Gallery' },
] as const
type Tab = (typeof TABS)[number]['id']

/**
 * A project, opened. Over the 3D stage (`staged`), the panel takes the left of
 * the screen and the stage makes room on the right: its phone stands on the
 * pedestal and shows the screenshot you pick in Features or Gallery. Without the
 * stage (no WebGL, reduced motion) the same panel sits beside the screenshots
 * themselves. Three tabs, no long page: Overview, Features, Gallery.
 *
 * Esc, the close button and the browser's Back button all close it; focus stays
 * inside while it is open; `#work/<id>` links straight to it.
 */
export function CaseStudy({
  project,
  index,
  staged = false,
  onClose,
  onNext,
}: {
  project: Project
  index: number
  origin?: DOMRect | null
  staged?: boolean
  onClose: () => void
  onNext: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const view = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  const sl = SLIDES[project.id]
  const next = projects[(index + 1) % N]
  const shots = useMemo(() => project.gallery?.filter((m) => m.type === 'image') ?? [], [project])
  const tabs = TABS.filter((t) => t.id !== 'gallery' || shots.length > 0)
  const [tab, setTab] = useState<Tab>('overview')
  const [shot, setShot] = useState(0)
  /** Width ÷ height of each screenshot, once known: wide ones are shown flat, not in the phone. */
  const [aspect, setAspect] = useState<Record<string, number>>({})
  const lines = sl?.lines ?? [project.title]

  // Screenshot sizes.
  useEffect(() => {
    let live = true
    shots.forEach((m) => {
      const img = new Image()
      img.onload = () => live && setAspect((a) => ({ ...a, [m.src]: img.naturalWidth / img.naturalHeight }))
      img.src = BASE + m.src
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])
  const tall = useMemo(() => shots.filter((m) => (aspect[m.src] ?? 0.5) < 1), [shots, aspect])
  const current = shots[shot]
  const currentWide = !!current && (aspect[current.src] ?? 0.5) >= 1

  // What the stage's phone shows: the slide's own screen on Overview, the picked one elsewhere.
  const [peek, setPeek] = useState<number | null>(null)
  useEffect(() => {
    if (!staged) return
    const cs = motion.works.cs
    if (tab === 'gallery' && current && !currentWide) cs.src = current.src
    else if (tab === 'features' && peek !== null && tall.length) cs.src = tall[peek % tall.length].src
    else if (tab === 'overview') cs.src = null
  }, [staged, tab, current, currentWide, peek, tall])

  // Open: stop the page, park the stage on this project, trap focus.
  useLayoutEffect(() => {
    const el = root.current!
    const previous = document.activeElement as HTMLElement | null
    stopScroll()
    document.documentElement.style.overflow = 'hidden'
    const w = motion.works
    let parkTimer = 0
    if (staged) {
      w.cs.open = true
      w.cs.src = null
      // Bring the chapter to this project under the panel (instantly from far away, gliding from a neighbour).
      const park = (tries = 0) => {
        if (w.pinEnd <= w.pinStart) {
          if (tries < 40) parkTimer = window.setTimeout(() => park(tries + 1), 120)
          return
        }
        const y = w.pinStart + stopAt(index) * (w.pinEnd - w.pinStart)
        const far = Math.abs(window.scrollY - y) > window.innerHeight * 1.6
        scrollToTarget(y, { immediate: far, duration: 1.1, force: true })
      }
      park()
    }

    const q = gsap.utils.selector(el)
    const ctx = gsap.context(() => {
      if (prefersReducedMotion) return
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'none' })
        .from(q('[data-cs-scrim]'), { xPercent: -30, opacity: 0, duration: 1 }, 0)
        .from(q('[data-cs-line]'), { yPercent: 40, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.15)
        .from(q('[data-cs-in]'), { y: 28, opacity: 0, duration: 0.8, stagger: 0.05 }, 0.3)
        .from(q('[data-cs-bar]'), { scaleX: 0, duration: 1.1, ease: 'power2.inOut' }, 0.3)
        .from(q('[data-cs-show]'), { y: 60, opacity: 0, scale: 0.94, duration: 1.1, stagger: 0.1 }, 0.25)
    }, el)
    closeBtn.current?.focus({ preventScroll: true })

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Tab') {
        const focusables = Array.from(el.querySelectorAll<HTMLElement>('button:not([tabindex="-1"]), a[href]')).filter(
          (n) => n.offsetParent !== null,
        )
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.clearTimeout(parkTimer)
      window.removeEventListener('keydown', onKey)
      ctx.revert()
      if (staged) {
        w.cs.open = false
        w.cs.src = null
      }
      document.documentElement.style.overflow = ''
      startScroll()
      previous?.focus?.({ preventScroll: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // On portrait screens the stage sits above the panel: tell the scene where the free band is.
  useEffect(() => {
    if (!staged) return
    const measure = () => {
      const p = panel.current
      if (!p) return
      const h = window.innerHeight
      const nav = document.querySelector<HTMLElement>('header')?.getBoundingClientRect().bottom ?? 0
      const top = root.current?.querySelector<HTMLElement>('[data-cs-top]')?.getBoundingClientRect().bottom ?? nav
      motion.works.cs.safe.top = Math.min(0.2, Math.max(64, top + 8) / h)
      motion.works.cs.safe.bottom = (p.getBoundingClientRect().top - 12) / h
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [staged])

  // The light under the open tab.
  useLayoutEffect(() => {
    const list = root.current?.querySelector<HTMLElement>('[role="tablist"]')
    const put = () => {
      const on = list?.querySelector<HTMLElement>('[aria-selected="true"]')
      if (!list || !on) return
      list.style.setProperty('--x', String(on.offsetLeft))
      list.style.setProperty('--w', String(on.offsetWidth))
    }
    put()
    document.fonts?.ready.then(put)
    window.addEventListener('resize', put)
    return () => window.removeEventListener('resize', put)
  }, [tab])

  // A new tab: it starts at its top, and its contents rise in.
  useLayoutEffect(() => {
    if (view.current) view.current.scrollTop = 0
    if (prefersReducedMotion || !view.current) return
    const ctx = gsap.context(() => {
      gsap.from(gsap.utils.selector(view.current)('[data-rise]'), {
        y: 22,
        opacity: 0,
        duration: 0.6,
        stagger: 0.045,
        ease: 'power3.out',
      })
    }, view.current)
    return () => ctx.revert()
  }, [tab])

  const close = () => {
    if (closing.current) return
    closing.current = true
    if (staged) motion.works.cs.open = false // the stage glides back while the panel fades
    if (prefersReducedMotion) return onClose()
    const el = root.current!
    gsap
      .timeline({ onComplete: onClose })
      .to(gsap.utils.selector(el)('[data-cs-line], [data-cs-in], [data-cs-show]'), {
        y: -16,
        opacity: 0,
        duration: 0.3,
        stagger: 0.015,
        ease: 'power2.in',
      })
      .to(el, { autoAlpha: 0, duration: 0.35, ease: 'none' }, 0.2)
  }

  const goNext = () => {
    if (prefersReducedMotion) return onNext()
    const el = root.current!
    gsap.to(gsap.utils.selector(el)('[data-cs-line], [data-cs-in], [data-cs-show]'), {
      y: -16,
      opacity: 0,
      duration: 0.3,
      stagger: 0.012,
      ease: 'power2.in',
      onComplete: onNext,
    })
  }

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const to =
      e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : -1
    const at = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : to
    if (at < 0) return
    e.preventDefault()
    setTab(tabs[at].id)
    root.current?.querySelector<HTMLButtonElement>(`#cs-tab-${tabs[at].id}`)?.focus()
  }

  const step = (d: number) => setShot((v) => (v + d + shots.length) % shots.length)
  const facts = useMemo(
    () =>
      [
        ['Role', project.role],
        ...(project.client ? [['Client', project.client]] : []),
        ['Status', project.status],
        ...(project.year ? [['Year', project.year]] : []),
      ] as [string, string][],
    [project],
  )

  return (
    <div
      ref={root}
      className={s.overlay}
      data-staged={staged}
      style={themeVars(project.theme)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cs-title"
      data-lenis-prevent
    >
      {!staged && <Room project={project} />}
      <div className={s.scrim} data-cs-scrim aria-hidden />

      <header className={s.top} data-cs-top>
        <button className={s.back} onClick={close} data-cs-in data-cursor="Back">
          <ArrowLeftIcon weight="bold" aria-hidden />
          <span>All works</span>
        </button>
        <p className={s.progress} data-cs-in aria-label={`Project ${index + 1} of ${N}`}>
          <b>{pad(index + 1)}</b>
          <span className={s.bar} aria-hidden>
            <i data-cs-bar style={{ '--p': (index + 1) / N } as CSSProperties} />
          </span>
          <span>{pad(N)}</span>
        </p>
        <button ref={closeBtn} className={s.close} onClick={close} aria-label="Close" data-cursor="Close" data-cs-in>
          <XIcon weight="bold" aria-hidden />
        </button>
      </header>

      <div ref={panel} className={s.panel}>
        <p className={s.kicker} data-cs-in>
          <span className={s.pill}>{project.category}</span>
          {project.year && <span>{project.year}</span>}
        </p>

        <h2 id="cs-title" className={s.title} aria-label={project.title}>
          <span className={s.solid} data-cs-line aria-hidden>
            {lines[0]}
          </span>
          {lines[1] ? (
            <span className={s.outline} data-cs-line aria-hidden>
              {lines[1]}
            </span>
          ) : (
            sl?.kicker && (
              <span className={s.subline} data-cs-line aria-hidden>
                {sl.kicker}
              </span>
            )
          )}
        </h2>

        <div className={s.tabs} role="tablist" aria-label="Project" data-cs-in style={{ '--n': tabs.length } as CSSProperties}>
          {tabs.map((t, i) => (
            <button
              key={t.id}
              id={`cs-tab-${t.id}`}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls="cs-view"
              tabIndex={tab === t.id ? 0 : -1}
              className={s.tab}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              <small>{pad(i + 1)}</small>
              {t.label}
            </button>
          ))}
          <i className={s.tabLine} aria-hidden />
        </div>

        <div ref={view} id="cs-view" className={s.view} role="tabpanel" aria-labelledby={`cs-tab-${tab}`} data-cs-in>
          {tab === 'overview' && (
            <div className={s.overview}>
              <p className={s.lead} data-rise>
                {project.description}
              </p>
              <dl className={s.facts}>
                {facts.map(([k, v]) => (
                  <div key={k} data-rise>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              {(project.problem || project.contribution) && (
                <div className={s.story}>
                  {project.problem && (
                    <div data-rise>
                      <h3>The challenge</h3>
                      <p>{project.problem}</p>
                    </div>
                  )}
                  {project.contribution && (
                    <div data-rise>
                      <h3>My part</h3>
                      <p>{project.contribution}</p>
                    </div>
                  )}
                </div>
              )}
              <div className={s.row} data-rise>
                <p className={s.stack} aria-label={`Built with ${project.stack.join(', ')}`}>
                  {(sl?.stack ?? []).map((name) => {
                    const logo = logoFor(name)
                    return (
                      logo && (
                        <svg key={name} viewBox="0 0 24 24" fill={logo.color} aria-hidden>
                          <path d={logo.path} />
                        </svg>
                      )
                    )
                  })}
                  <span>{project.stack.join(' · ')}</span>
                </p>
                {project.link && (
                  <a className={s.visit} href={project.link.href} target="_blank" rel="noreferrer" data-cursor="Visit">
                    {project.link.label}
                    <ArrowUpRightIcon weight="bold" aria-hidden />
                  </a>
                )}
              </div>
            </div>
          )}

          {tab === 'features' && (
            <div className={s.features}>
              <ol className={s.tiles}>
                {project.highlights.map((h, i) => (
                  <li
                    key={h}
                    data-rise
                    tabIndex={staged && tall.length ? 0 : undefined}
                    onPointerEnter={() => setPeek(i)}
                    onFocus={() => setPeek(i)}
                    data-active={staged && tall.length > 0 && peek === i}
                  >
                    <b>{pad(i + 1)}</b>
                    <span>{h}</span>
                  </li>
                ))}
              </ol>
              {project.details?.length ? (
                <div className={s.hood} data-rise>
                  <h3>Under the hood</h3>
                  <ul>
                    {project.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}

          {tab === 'gallery' && current && (
            <div className={s.gallery}>
              <div className={s.galleryHead} data-rise>
                <p className={s.caption}>{current.caption ?? current.alt}</p>
                <div className={s.arrows}>
                  <span>
                    {pad(shot + 1)} / {pad(shots.length)}
                  </span>
                  <button onClick={() => step(-1)} aria-label="Previous screenshot" disabled={shots.length < 2}>
                    <ArrowLeftIcon weight="bold" aria-hidden />
                  </button>
                  <button onClick={() => step(1)} aria-label="Next screenshot" disabled={shots.length < 2}>
                    <ArrowRightIcon weight="bold" aria-hidden />
                  </button>
                </div>
              </div>
              <ul className={s.thumbs}>
                {shots.map((m, i) => (
                  <li key={m.src} data-rise>
                    <button
                      className={s.thumb}
                      data-active={i === shot}
                      data-wide={(aspect[m.src] ?? 0.5) >= 1}
                      onClick={() => setShot(i)}
                      aria-label={m.alt ?? `Screenshot ${i + 1}`}
                      aria-pressed={i === shot}
                    >
                      <img src={BASE + m.src} alt="" loading="lazy" decoding="async" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button className={s.next} onClick={goNext} data-cursor="Next" data-cs-in>
          <small>Next project</small>
          <span>{next.title}</span>
          <ArrowRightIcon weight="bold" aria-hidden />
        </button>
      </div>

      {/* Over the stage, a wide (desktop) screenshot is shown flat beside the phone. */}
      {staged && tab === 'gallery' && current && currentWide && (
        <figure key={current.src} className={s.wide} data-cs-show>
          <img src={BASE + current.src} alt={current.alt ?? ''} />
        </figure>
      )}

      {/* Without the stage: the screenshots themselves, large, with the app icon. */}
      {!staged && <Showcase project={project} shot={tab === 'gallery' ? current : tab === 'features' && peek !== null ? (tall[peek % Math.max(1, tall.length)] ?? shots[0]) : shots[0]} />}
    </div>
  )
}

/** The project's room, painted: its colours and, when it has one, the owner's backdrop photo. */
function Room({ project }: { project: Project }) {
  const bd = SLIDES[project.id]?.backdrop
  return (
    <div className={s.room} aria-hidden>
      {bd && (
        <img
          src={BASE + bd.src}
          alt=""
          style={{ objectPosition: `${bd.focus[0] * 100}% ${bd.focus[1] * 100}%` } as CSSProperties}
        />
      )}
    </div>
  )
}

/** The fallback's picture side: the screenshot in focus, floating, with the app icon beside it. */
function Showcase({ project, shot }: { project: Project; shot?: Media }) {
  return (
    <div className={s.showcase} aria-hidden>
      {shot ? (
        <img key={shot.src} className={s.shot} src={BASE + shot.src} alt="" data-cs-show />
      ) : null}
      <img className={s.appIcon} src={iconSrc(project.id)} alt="" data-cs-show data-alone={!shot} />
    </div>
  )
}
