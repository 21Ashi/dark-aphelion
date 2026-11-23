import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../lib/gsap'
import { projects, themeVars } from '../content/projects'
import { hasWebGL, prefersReducedMotion } from '../lib/quality'
import { motion, worksHover } from '../lib/motion'
import { scrollToTarget } from '../lib/scroll'
import { useStore } from '../hooks/useStore'
import { useCaseStudy } from './work/useCaseStudy'
import { BUILD, N, OUT, STEP, stopAt, TAIL, TOTAL } from './work/track'
import s from './work/Showcase.module.css'

/** The fallback chapter, only downloaded by the visitors who get it. */
const JourneyWork = lazy(() =>
  import('./journey/JourneyWork').then((m) => {
    requestAnimationFrame(() => ScrollTrigger.refresh())
    return { default: m.JourneyWork }
  }),
)

/** The stage's type column (icons and logos included), fetched in idle time after load. */
const loadSlide = () => import('./work/Slide')
const Slide = lazy(() => loadSlide().then((m) => ({ default: m.Slide })))
const ScrollHint = lazy(() => loadSlide().then((m) => ({ default: m.ScrollHint })))

/** The 3D stage needs WebGL and motion; everyone else gets the journey of worlds. */
export function Work() {
  if (hasWebGL && !prefersReducedMotion) return <Showcase />
  return (
    <Suspense
      fallback={<section id="work" className="chapter" style={{ minHeight: '100svh' }} aria-label="Selected works" />}
    >
      <JourneyWork />
    </Suspense>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** Linger on each project, move quickly between them. */
const dwell = (f: number) => (f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2)

/**
 * Works. The chapter pins and the scroll walks through the projects one at a
 * time. Each one is a slide: its name, what it is and what it does on the left;
 * on the right, in the 3D scene (src/scene/showcase), its real screens on the
 * pedestal with its icon and an orbit of light, in a room of its own colours.
 */
function Showcase() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const hit = useRef<HTMLButtonElement>(null)
  const pin = useRef<ScrollTrigger | null>(null)
  const [current, setCurrent] = useState(0)
  const [live, setLive] = useState(false)
  const liveRef = useRef(false)
  const [pair, setPair] = useState({ cur: 0, prev: -1, dir: 1 as 1 | -1, quick: false })
  /** Scroll speed through the pin, px/s: flicking past several projects skips the letter animation. */
  const speed = useRef(0)
  const [exploreHot, setExploreHot] = useState(false)
  const hovered = useStore(worksHover)
  const { opened, open, portal } = useCaseStudy()

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const w = motion.works
      const intro = SplitText.create(q('[data-intro-word]'), { type: 'chars', mask: 'chars' })

      // The chapter title rises as the section arrives...
      gsap
        .timeline({ scrollTrigger: { trigger: el, start: 'top 75%' } })
        .from(intro.chars, { yPercent: 115, duration: 1.4, stagger: 0.045, ease: 'cine' })
        .from(q('[data-foot-in]'), { y: 30, opacity: 0, duration: 1 }, 0.5)
        .from(q('[data-counter]'), { textContent: 0, snap: { textContent: 1 }, duration: 1.4, ease: 'power2.out' }, 0.5)
      // ...and is pulled apart as the stage assembles behind it.
      const leave = gsap
        .timeline({ paused: true, defaults: { ease: 'none' } })
        .to(q('[data-intro-a]'), { xPercent: -80, scale: 1.3, opacity: 0, duration: 1 }, 0)
        .to(q('[data-intro-b]'), { xPercent: 80, scale: 1.3, opacity: 0, duration: 1 }, 0)
        .to(q('[data-intro-foot]'), { y: -50, opacity: 0, duration: 0.5 }, 0)

      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'top top',
        onUpdate: (self) => {
          w.on = self.progress
        },
      })
      pin.current = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: () => `+=${TOTAL * window.innerHeight}`,
        pin: stage.current,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          w.pinStart = self.start
          w.pinEnd = self.end
        },
        onUpdate: (self) => {
          speed.current = Math.abs(self.getVelocity())
          const t = self.progress * TOTAL
          w.build = clamp01(t / BUILD)
          const raw = Math.min(N - 1, Math.max(0, (t - BUILD) / STEP))
          const i = Math.floor(raw)
          w.pos = Math.min(N - 1, i + dwell(raw - i))
          w.out = clamp01((t - (BUILD + (N - 1) * STEP + TAIL)) / OUT)
          leave.progress(clamp01(w.build / 0.7))
          setCurrent(Math.round(w.pos))
          liveRef.current = w.build > 0.82 && w.out < 0.2
          setLive(liveRef.current)
        },
      })

      return () => {
        intro.revert()
        pin.current = null
        Object.assign(w, { on: 0, build: 0, pos: 0, out: 0, pinStart: 0, pinEnd: 0 })
      }
    },
    { scope: root },
  )

  // Fetch the type column once the page has loaded and gone quiet.
  useEffect(() => {
    let id = 0
    const go = () => (id = window.setTimeout(() => void loadSlide(), 1500))
    if (document.readyState === 'complete') go()
    else window.addEventListener('load', go, { once: true })
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('load', go)
    }
  }, [])

  // On portrait screens the stage sits between the nav and the type column: tell the scene where that is.
  useEffect(() => {
    const measure = () => {
      const el = stage.current
      const slide = el?.querySelector<HTMLElement>('[data-leaving="false"]')
      if (!el || !slide) return
      const box = el.getBoundingClientRect()
      const nav = document.querySelector<HTMLElement>('header')?.getBoundingClientRect().bottom ?? 0
      const safe = motion.works.safe
      safe.top = Math.min(0.16, Math.max(64, nav + 8) / box.height)
      safe.bottom = (slide.getBoundingClientRect().top - box.top - 12) / box.height
    }
    const id = requestAnimationFrame(measure)
    const late = window.setTimeout(measure, 900) // the lazily loaded column may arrive a moment later
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(id)
      window.clearTimeout(late)
      window.removeEventListener('resize', measure)
    }
  }, [pair])

  // Which slide is arriving and which is leaving.
  useEffect(() => {
    setPair((p) =>
      p.cur === current ? p : { cur: current, prev: p.cur, dir: current > p.cur ? 1 : -1, quick: speed.current > 2400 },
    )
  }, [current])

  // A real button sits exactly over the phone in front, wherever the scene puts it.
  useEffect(() => {
    const place = () => {
      if (!liveRef.current) return
      const h = hit.current
      const r = motion.works.rect
      if (!h || r.w <= 0) return
      h.style.transform = `translate(${r.x.toFixed(1)}px, ${r.y.toFixed(1)}px)`
      h.style.width = `${r.w.toFixed(1)}px`
      h.style.height = `${r.h.toFixed(1)}px`
    }
    gsap.ticker.add(place)
    return () => gsap.ticker.remove(place)
  }, [])

  const goTo = (n: number) => {
    const t = pin.current
    if (t) scrollToTarget(t.start + stopAt(n) * (t.end - t.start))
  }
  const explore = () => {
    const r = motion.works.rect
    open(current, r.w > 0 ? new DOMRect(r.x, r.y, r.w, r.h) : null)
  }
  /** Explore hovered: the button and the stage's light answer together. */
  const hotExplore = (on: boolean) => {
    setExploreHot(on)
    motion.works.exploreHover = on
  }

  const p = projects[current]

  return (
    <>
      <section id="work" ref={root} className="chapter" aria-label="Selected works">
        <div ref={stage} className={s.stage} data-live={live} data-cs={!!opened} style={themeVars(p.theme)}>
          <div className={s.intro}>
            <h2 className={s.introTitle}>
              <span data-intro-a>
                <span data-intro-word>Selected</span>
              </span>
              <span className="serif" data-intro-b>
                <span data-intro-word>works</span>
              </span>
            </h2>
            <div data-intro-foot>
              <p className={s.counter} data-foot-in aria-label={`${N} projects`}>
                <span data-counter>{N}</span>
                <small>selected projects</small>
              </p>
            </div>
          </div>

          <button
            ref={hit}
            className={s.hit}
            onClick={explore}
            aria-label={`Explore ${p.title}`}
            data-cursor="Explore"
            tabIndex={-1}
          />

          <div className={s.copy} aria-live="polite">
            <Suspense fallback={null}>
              {[pair.prev, pair.cur].map((i, k) =>
                i < 0 || (k === 0 && i === pair.cur) ? null : (
                  <Slide
                    key={i}
                    index={i}
                    leaving={k === 0}
                    dir={pair.dir}
                    quick={pair.quick}
                    hot={k === 1 && (exploreHot || hovered === i)}
                    onExplore={explore}
                    onHot={hotExplore}
                  />
                ),
              )}
            </Suspense>
          </div>

          <nav className={s.rail} aria-label="Projects">
            {projects.map((pr, n) => (
              <button
                key={pr.id}
                className={s.tick}
                data-active={current === n}
                onClick={() => goTo(n)}
                aria-label={`Go to ${pr.title}`}
                aria-current={current === n ? 'true' : undefined}
                data-cursor="Go"
              >
                <span aria-hidden>{pad(n + 1)}</span>
              </button>
            ))}
          </nav>

          <p className={s.hint} aria-hidden>
            <Suspense fallback={null}>
              <ScrollHint />
            </Suspense>
          </p>
        </div>
        {portal}
      </section>
    </>
  )
}
