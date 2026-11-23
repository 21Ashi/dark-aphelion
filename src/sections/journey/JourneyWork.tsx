import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap'
import { projects, themeVars, type Project } from '../../content/projects'
import { isTouch, prefersReducedMotion } from '../../lib/quality'
import { scrollToTarget } from '../../lib/scroll'
import { CaseStudy } from '../work/CaseStudy'
import { Archive } from '../work/Archive'
import { WORLDS, type Transition, type WorldDef } from './worlds'
import { Particles } from './particles'
import { Magnetic } from '../../components/Magnetic'
import s from './Journey.module.css'

type Opened = { index: number; rect: DOMRect | null }

const STOPS = WORLDS.map((w) => ({ def: w, index: projects.findIndex((p) => p.id === w.id) })).filter((x) => x.index >= 0)
const pad = (n: number) => String(n).padStart(2, '0')
const lead = (text: string) => text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text

/** Timeline units: one unit is one viewport height of scrolling. */
const INTRO = 0.7
const ENTER = 1
const HOLD = 0.85

/**
 * The Works chapter without WebGL or with reduced motion (the 3D gallery in
 * ../Work.tsx is the main version): a journey through one full-screen world per project. On desktop
 * the chapter pins and a single timeline, scrubbed by the scroll, carries the
 * visitor sideways from world to world; each arrival is its own transition
 * (particles, an expanding interface, blinds, a turn, a warp, a scan, a
 * glitch). Inside a world, type, image and background drift at different
 * depths and the image follows the pointer. Phones and reduced motion get the
 * same worlds as a vertical sequence.
 */
export function JourneyWork() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  const st = useRef<ScrollTrigger | null>(null)
  const [opened, setOpened] = useState<Opened | null>(() => {
    const m = window.location.hash.match(/^#work\/(.+)$/)
    const i = m ? projects.findIndex((p) => p.id === m[1]) : -1
    return i >= 0 ? { index: i, rect: null } : null
  })
  const [current, setCurrent] = useState(-1)
  const [ticks, setTicks] = useState<number[]>([])

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const mm = gsap.matchMedia()
      const intro = SplitText.create(q('[data-intro-word]'), { type: 'chars', mask: 'chars' })
      const titles = (q('[data-world]') as HTMLElement[]).map((w) =>
        SplitText.create(w.querySelectorAll('[data-line]'), { type: 'chars', mask: 'chars' }),
      )

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: 'top 70%' } })
          .from(intro.chars, { yPercent: 115, duration: 1.4, stagger: 0.045, ease: 'cine' })
          .from(q('[data-intro-foot] > *'), { y: 30, opacity: 0, duration: 1, stagger: 0.1 }, 0.5)
          .from(q('[data-counter]'), { textContent: 0, snap: { textContent: 1 }, duration: 1.4, ease: 'power2.out' }, 0.5)
      })

      // ── Desktop: the pinned journey ──
      mm.add(
        { big: '(min-width: 900px) and (prefers-reduced-motion: no-preference)', mid: '(max-width: 1200px)' },
        (ctx) => {
          const { mid } = ctx.conditions as { mid: boolean }
          const worlds = q('[data-world]') as HTMLElement[]
          const parts = new Particles(canvas.current!, mid ? 650 : 1300)
          const vw = (n: number) => () => (window.innerWidth * n) / 100
          const tl = gsap.timeline({ defaults: { ease: 'none' } })
          const centres: number[] = []
          const pick = (w: Element, sel: string) => w.querySelectorAll(sel)

          const particles = (mode: 'shatter' | 'warp', at: number, from: string, to: string) => {
            const p = { v: 0 }
            tl.to(p, { v: 1, duration: ENTER, onUpdate: () => parts.draw(mode, p.v, from, to) }, at)
          }

          const arrive = (kind: Transition, prev: HTMLElement | null, next: HTMLElement, at: number, i: number) => {
            const D = ENTER
            const prevAccent = i > 0 ? STOPS[i - 1].def && projects[STOPS[i - 1].index].theme.accent : '#e63946'
            const nextTheme = projects[STOPS[i].index].theme
            const show = (t: number) => tl.set(next, { autoAlpha: 1 }, t)
            const hide = (t: number) => prev && tl.set(prev, { autoAlpha: 0 }, t)
            switch (kind) {
              case 'side':
                show(at)
                tl.fromTo(next, { xPercent: 100 }, { xPercent: 0, duration: D, ease: 'power2.inOut' }, at)
                  .from(pick(next, '[data-visual]'), { xPercent: 35, duration: D, ease: 'power3.out' }, at)
                  .from(pick(next, '[data-type]'), { xPercent: 70, duration: D, ease: 'power3.out' }, at)
                  .to(q('[data-intro-a]'), { xPercent: -45, opacity: 0, duration: D }, at)
                  .to(q('[data-intro-b]'), { xPercent: -90, opacity: 0, duration: D }, at)
                  .to(q('[data-intro-foot]'), { x: vw(-40), opacity: 0, duration: D * 0.6 }, at)
                break
              case 'shatter':
                tl.to(pick(prev!, '[data-visual]'), { scale: 0.55, rotationY: -30, opacity: 0, filter: 'blur(14px)', duration: D * 0.5 }, at)
                  .to(pick(prev!, '[data-type], [data-meta]'), { opacity: 0, duration: D * 0.3 }, at)
                particles('shatter', at, prevAccent, nextTheme.accent)
                show(at + D * 0.35)
                tl.fromTo(next, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(80% at 50% 50%)', duration: D * 0.65, ease: 'power2.in' }, at + D * 0.35)
                  .from(pick(next, '[data-visual]'), { rotationX: 55, y: '25vh', scale: 1.3, transformPerspective: 1600, duration: D * 0.6, ease: 'power3.out' }, at + D * 0.4)
                hide(at + D)
                break
              case 'expand':
                tl.to(pick(prev!, '[data-type], [data-meta], [data-visual] > :not(.' + s.hero + ')'), { opacity: 0, duration: D * 0.3 }, at)
                  .to(pick(prev!, '.' + s.hero), { scale: 6, duration: D * 0.75, ease: 'power3.in' }, at)
                show(at + D * 0.3)
                tl.fromTo(next, { clipPath: 'inset(38% 40% 38% 40% round 30px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: D * 0.7, ease: 'power2.inOut' }, at + D * 0.3)
                  .from(pick(next, '[data-visual]'), { x: vw(30), rotationY: -25, transformPerspective: 1600, duration: D * 0.7, ease: 'power3.out' }, at + D * 0.3)
                hide(at + D)
                break
              case 'blinds': {
                const slices = q('[data-blinds] > i')
                tl.set(q('[data-blinds]'), { '--blind': nextTheme.deep }, at)
                  .fromTo(slices, { scaleY: 0, transformOrigin: (k: number) => (k % 2 ? '50% 100%' : '50% 0%') }, { scaleY: 1, duration: D * 0.45, stagger: D * 0.012, ease: 'power2.in' }, at)
                show(at + D * 0.5)
                hide(at + D * 0.5)
                tl.fromTo(slices, { scaleY: 1, transformOrigin: (k: number) => (k % 2 ? '50% 0%' : '50% 100%') }, { scaleY: 0, duration: D * 0.45, stagger: D * 0.012, ease: 'power2.out', immediateRender: false }, at + D * 0.52)
                  .from(pick(next, '[data-visual]'), { y: '18vh', duration: D * 0.5, ease: 'power3.out' }, at + D * 0.5)
                break
              }
              case 'turn':
                tl.to(prev, { xPercent: -70, rotationY: 55, transformOrigin: '0% 50%', transformPerspective: 1800, opacity: 0.2, duration: D, ease: 'power2.inOut' }, at)
                show(at)
                tl.fromTo(next, { xPercent: 70, rotationY: -55, transformOrigin: '100% 50%', transformPerspective: 1800 }, { xPercent: 0, rotationY: 0, duration: D, ease: 'power2.inOut' }, at)
                hide(at + D)
                break
              case 'warp':
                particles('warp', at, prevAccent, nextTheme.accent)
                tl.to(prev, { x: vw(-45), skewX: -10, opacity: 0, duration: D * 0.7, ease: 'power2.in' }, at)
                show(at + D * 0.25)
                tl.fromTo(next, { x: vw(45), skewX: 10, opacity: 0 }, { x: 0, skewX: 0, opacity: 1, duration: D * 0.75, ease: 'power3.out' }, at + D * 0.25)
                hide(at + D)
                break
              case 'scan': {
                const line = q('[data-scan]')
                tl.set(line, { '--scan': nextTheme.accent, opacity: 1 }, at)
                  .fromTo(line, { x: 0 }, { x: vw(-100), duration: D, ease: 'power1.inOut' }, at)
                show(at)
                tl.fromTo(next, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: D, ease: 'power1.inOut' }, at)
                  .to(prev, { x: vw(-12), opacity: 0.4, duration: D }, at)
                  .set(line, { opacity: 0 }, at + D)
                hide(at + D)
                break
              }
              case 'glitch':
                tl.to(prev, { x: vw(-3), skewX: 6, opacity: 0, duration: D * 0.55, ease: 'steps(5)' }, at)
                show(at + D * 0.15)
                tl.fromTo(next, { clipPath: 'inset(47% 0% 47% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: D * 0.6, ease: 'steps(6)' }, at + D * 0.15)
                  .fromTo(next, { x: vw(4), skewX: -8 }, { x: 0, skewX: 0, duration: D * 0.6, ease: 'steps(7)' }, at + D * 0.15)
                hide(at + D)
                break
            }
            // Arrival choreography shared by every world.
            tl.from(titles[i].chars, { yPercent: 115, duration: D * 0.45, stagger: D * 0.025, ease: 'power3.out' }, at + D * 0.45)
              .from(pick(next, '[data-meta] > *'), { y: 30, opacity: 0, duration: D * 0.35, stagger: D * 0.04, ease: 'power2.out' }, at + D * 0.6)
              .from(pick(next, '[data-bg]'), { scale: 1.18, duration: D, ease: 'power2.out' }, at)
          }

          // Build the journey.
          let t = INTRO
          worlds.forEach((w, i) => {
            arrive(STOPS[i].def.into, i > 0 ? worlds[i - 1] : null, w, t, i)
            // Depth while you travel: type races, image glides, background barely moves.
            const span = ENTER + HOLD + ENTER
            tl.fromTo(pick(w, '[data-type]'), { x: vw(9) }, { x: vw(-9), duration: span }, t)
              .fromTo(pick(w, '[data-visual]'), { x: vw(3.5) }, { x: vw(-3.5), duration: span }, t)
              .fromTo(pick(w, '[data-bg]'), { x: vw(1.2) }, { x: vw(-1.2), duration: span }, t)
            centres.push(t + ENTER + HOLD / 2)
            t += ENTER + HOLD
          })
          // Out: the last world folds into a line, and the page carries on.
          const last = worlds[worlds.length - 1]
          tl.to(last, { clipPath: 'inset(49.6% 0% 49.6% 0%)', duration: ENTER * 0.6, ease: 'power3.in' }, t)
            .to(last, { scaleX: 0, duration: ENTER * 0.3, ease: 'power2.in' }, t + ENTER * 0.6)
            .to(q('[data-hud]'), { opacity: 0, duration: ENTER * 0.3 }, t + ENTER * 0.5)
          tl.to({}, { duration: 0.15 }, t + ENTER)

          const total = tl.duration()
          const trigger = ScrollTrigger.create({
            trigger: el,
            start: 'top top',
            end: () => `+=${total * window.innerHeight}`,
            pin: stage.current,
            scrub: 1,
            animation: tl,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onRefresh: () => {
              parts.resize()
              setTicks(centres.map((c) => c / total))
            },
            onUpdate: (self) => {
              gsap.set(bar.current, { scaleX: self.progress })
              const now = self.progress * total
              let best = now < INTRO + ENTER * 0.5 ? -1 : 0
              if (best === 0) {
                let d = Infinity
                centres.forEach((c, i) => {
                  if (Math.abs(c - now) < d) {
                    d = Math.abs(c - now)
                    best = i
                  }
                })
              }
              setCurrent(best)
            },
          })
          st.current = trigger
          setTicks(centres.map((c) => c / total))

          return () => {
            st.current = null
            parts.clear()
          }
        },
      )

      // ── Phones: a vertical sequence of worlds, each assembling as it arrives ──
      mm.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', () => {
        ;(q('[data-world]') as HTMLElement[]).forEach((w, i) => {
          gsap
            .timeline({ scrollTrigger: { trigger: w, start: 'top 75%' } })
            .from(w.querySelector('.' + s.hero), { scale: 1.25, opacity: 0, y: 60, duration: 1.3, ease: 'cine' })
            .from(titles[i].chars, { yPercent: 115, duration: 1, stagger: 0.03 }, 0.25)
            .from(w.querySelectorAll('[data-meta] > *'), { y: 24, opacity: 0, duration: 0.8, stagger: 0.06 }, 0.45)
          gsap.fromTo(
            w.querySelector('[data-visual]'),
            { y: 50 },
            { y: -50, ease: 'none', scrollTrigger: { trigger: w, start: 'top bottom', end: 'bottom top', scrub: true } },
          )
        })
      })

      return () => {
        mm.revert()
        intro.revert()
        titles.forEach((t) => t.revert())
      }
    },
    { scope: root },
  )

  // Pointer: every depth layer follows the cursor by its own amount; the hero
  // image ripples through a displacement filter while hovered.
  useEffect(() => {
    if (isTouch || prefersReducedMotion) return
    const el = stage.current!
    const layers = Array.from(el.querySelectorAll<HTMLElement>('[data-depth]')).map((n) => ({
      d: parseFloat(n.dataset.depth || '1'),
      x: gsap.quickTo(n, 'x', { duration: 1.1, ease: 'power3' }),
      y: gsap.quickTo(n, 'y', { duration: 1.1, ease: 'power3' }),
    }))
    const move = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      layers.forEach((l) => {
        l.x(nx * l.d * -28)
        l.y(ny * l.d * -18)
      })
    }
    const disp = document.querySelector<SVGFEDisplacementMapElement>('#work-distort feDisplacementMap')
    const amount = { v: 0 }
    const render = () => disp?.setAttribute('scale', amount.v.toFixed(1))
    const heroes = Array.from(el.querySelectorAll<HTMLElement>('.' + s.hero))
    const offs = heroes.map((h) => {
      const target = h.firstElementChild as HTMLElement
      const enter = () => {
        target.style.filter = 'url(#work-distort)'
        gsap.fromTo(amount, { v: 0 }, { v: 22, duration: 0.35, ease: 'power2.out', overwrite: true, onUpdate: render })
        gsap.to(amount, { v: 0, duration: 1, delay: 0.35, ease: 'power3.out', onUpdate: render })
      }
      const leave = () => {
        gsap.to(amount, {
          v: 0,
          duration: 0.5,
          overwrite: true,
          onUpdate: render,
          onComplete: () => {
            target.style.filter = ''
          },
        })
      }
      h.addEventListener('pointerenter', enter)
      h.addEventListener('pointerleave', leave)
      return () => {
        h.removeEventListener('pointerenter', enter)
        h.removeEventListener('pointerleave', leave)
      }
    })
    el.addEventListener('pointermove', move, { passive: true })
    return () => {
      el.removeEventListener('pointermove', move)
      offs.forEach((o) => o())
    }
  }, [])

  const open = useCallback((index: number, from?: HTMLElement | null) => {
    setOpened({ index, rect: from?.getBoundingClientRect() ?? null })
  }, [])

  const goTo = (n: number) => {
    const t = st.current
    if (!t || ticks[n] === undefined) return
    scrollToTarget(t.start + ticks[n] * (t.end - t.start))
  }

  // Deep links: #work/<id> opens that case study.
  useEffect(() => {
    const fromHash = () => {
      const m = window.location.hash.match(/^#work\/(.+)$/)
      const i = m ? projects.findIndex((p) => p.id === m[1]) : -1
      setOpened((cur) => (i >= 0 ? (cur?.index === i ? cur : { index: i, rect: null }) : null))
    }
    window.addEventListener('popstate', fromHash)
    return () => window.removeEventListener('popstate', fromHash)
  }, [])

  useEffect(() => {
    const want = opened ? `#work/${projects[opened.index].id}` : ''
    const have = window.location.hash.startsWith('#work/') ? window.location.hash : ''
    const clean = window.location.pathname + window.location.search
    if (want && !have) history.pushState({ cs: true }, '', want)
    else if (want && want !== have) history.replaceState({ cs: true }, '', want)
    else if (!want && have) {
      if ((history.state as { cs?: boolean } | null)?.cs) history.back()
      else history.replaceState(null, '', clean)
    }
  }, [opened])

  const active = current >= 0 ? projects[STOPS[current].index] : null

  return (
    <>
      <section id="work" ref={root} className="chapter" aria-label="Selected works">
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
          <filter id="work-distort" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.03" numOctaves={1} seed={7} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={0} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        <div ref={stage} className={s.stage}>
          <div className={s.intro}>
            <h2 className={s.introTitle}>
              <span data-intro-a>
                <span data-intro-word>Selected</span>
              </span>
              <span className="serif" data-intro-b>
                <span data-intro-word>works</span>
              </span>
            </h2>
            <div className={s.introFoot} data-intro-foot>
              <p className={s.counter} aria-label={`${STOPS.length} of ${projects.length} projects`}>
                <span data-counter>{STOPS.length}</span>
                <small>/ {projects.length}</small>
              </p>
              <p className={s.introCopy}>
                {STOPS.length} of {projects.length} products, from a Hajj platform to party games. Open any of them for the
                full story; the index that follows lists all {projects.length}.
              </p>
            </div>
          </div>

          {STOPS.map(({ def, index }, i) => (
            <World key={def.id} def={def} project={projects[index]} index={index} n={i} onOpen={open} />
          ))}

          <canvas ref={canvas} className={s.canvas} aria-hidden />
          <div className={s.blinds} data-blinds aria-hidden>
            {Array.from({ length: 10 }, (_, k) => (
              <i key={k} />
            ))}
          </div>
          <span className={s.scanline} data-scan aria-hidden />

          <nav
            className={s.hud}
            data-hud
            aria-label="Projects in this chapter"
            style={active ? ({ '--accent': active.theme.accent } as CSSProperties) : undefined}
          >
            <span className={s.roll} aria-hidden>
              <span className={s.digits}>
                <span style={{ transform: `translateY(${-Math.max(current, 0)}em)` }}>
                  {STOPS.map((_, i) => (
                    <span key={i}>{pad(i + 1)}</span>
                  ))}
                </span>
              </span>
              <span>/ {pad(STOPS.length)}</span>
            </span>
            <span className={s.track}>
              <span ref={bar} className={s.bar2} />
              {ticks.map((t, n) => (
                <button
                  key={STOPS[n].def.id}
                  className={s.tick}
                  style={{ left: `${t * 100}%` }}
                  data-active={current === n}
                  onClick={() => goTo(n)}
                  aria-label={`Go to ${projects[STOPS[n].index].title}`}
                  aria-current={current === n ? 'true' : undefined}
                  data-cursor="Go"
                >
                  <span aria-hidden>{projects[STOPS[n].index].title}</span>
                </button>
              ))}
            </span>
            <span className={s.hudName} aria-hidden>
              {active ? active.title : 'Selected works'}
            </span>
          </nav>
        </div>

        {opened &&
          createPortal(
            <CaseStudy
              key={opened.index}
              project={projects[opened.index]}
              index={opened.index}
              origin={opened.rect}
              onClose={() => setOpened(null)}
              onNext={() => setOpened({ index: (opened.index + 1) % projects.length, rect: null })}
            />,
            document.body,
          )}
      </section>
      <Archive onOpen={open} />
    </>
  )
}

function World({
  def,
  project: p,
  index,
  n,
  onOpen,
}: {
  def: WorldDef
  project: Project
  index: number
  n: number
  onOpen: (i: number, el?: HTMLElement | null) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const Scene = def.Scene
  const openFrom = () => onOpen(index, ref.current?.querySelector<HTMLElement>('.' + s.hero) ?? null)
  return (
    <article
      ref={ref}
      className={s.world}
      data-world={def.id}
      style={{ ...themeVars(p.theme), zIndex: 2 + n }}
      aria-labelledby={`world-${p.id}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.' + s.hero)) openFrom()
      }}
    >
      <Scene project={p} index={index} />
      <div
        className={`${s.type} ${def.title.behind ? s.typeBehind : ''}`}
        style={{ ...def.title.at, ['--size' as string]: def.title.size }}
        data-type
      >
        <h3 id={`world-${p.id}`} aria-label={p.title}>
          {def.title.lines.map((l) => (
            <span
              key={l.text}
              className={`${s.line} ${l.outline ? s.outline : ''} ${l.serif ? s.serifLine : ''}`}
              data-line
              aria-hidden
            >
              {l.text}
            </span>
          ))}
        </h3>
      </div>
      <div className={s.meta} style={def.meta} data-meta>
        <p className={s.metaTop}>
          <b>{pad(index + 1)}</b>
          <span>{p.category}</span>
          {p.year && <span>{p.year}</span>}
        </p>
        <p className={s.metaSub}>{p.subtitle}</p>
        <p>{lead(p.description)}</p>
        <p className={s.metaRole}>{p.role}</p>
        <div>
          <Magnetic strength={0.3}>
            <button className={s.explore} onClick={openFrom} data-cursor="Explore">
              <span>Explore the project</span>
              <span aria-hidden>→</span>
            </button>
          </Magnetic>
        </div>
      </div>
    </article>
  )
}
