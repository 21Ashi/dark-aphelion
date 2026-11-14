import { lazy, Suspense, useEffect } from 'react'
import { ScrollTrigger } from './lib/gsap'
import { initScroll, destroyScroll } from './lib/scroll'
import { hasWebGL, perfRequested } from './lib/quality'
import { activeChapter, CHAPTERS, motion } from './lib/motion'
import { complete } from './lib/loader'
import { Preloader } from './components/Preloader'
import { Cursor } from './components/Cursor'
import { Nav } from './components/Nav'
import { Rail } from './components/Rail'
import { Grain } from './components/Grain'
import { Hero } from './sections/Hero'
import { About } from './sections/About'
import { Work } from './sections/Work'
import { Experience } from './sections/Experience'
import { Skills } from './sections/Skills'
import { Contact } from './sections/Contact'

// Development only (Shift+P or ?perf); compiled out of production builds.
// Development, or ?perf on the live site (loaded only then)
const PerfPanel = import.meta.env.DEV || perfRequested ? lazy(() => import('./dev/PerfPanel')) : null

// Three.js and everything 3D arrive in their own chunk, behind the preloader.
const Scene = lazy(() =>
  import('./scene/Scene').then((m) => {
    complete('scene')
    return m
  }),
)

/**
 * Maps scroll position to a continuous chapter value for the camera, the
 * active chapter for navigation, and the finale progress for the eclipse.
 */
function useChapters() {
  useEffect(() => {
    const sections = CHAPTERS.map((c) => document.getElementById(c.id)).filter(Boolean) as HTMLElement[]
    const marks = sections.map((el, i) =>
      ScrollTrigger.create({ trigger: el, start: i === 0 ? 'top top' : 'top 55%' }),
    )
    const finale = ScrollTrigger.create({
      trigger: '#contact',
      start: 'top bottom',
      end: 'bottom bottom',
      onUpdate: (self) => (motion.finale = self.progress),
    })
    const all = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll()
        motion.progress = self.progress
        let c = 0
        for (let i = 0; i < marks.length; i++) {
          const a = marks[i].start
          const b = i + 1 < marks.length ? marks[i + 1].start : Infinity
          if (y >= a) {
            c = b === Infinity ? i : i + Math.min(1, (y - a) / Math.max(1, b - a))
          }
        }
        // The Works chapter pins for a long stretch: hold the camera there, then move on.
        const w = motion.works
        if (w.pinEnd > w.pinStart && marks[2] && marks[3] && y >= marks[2].start && y < marks[3].start) {
          c = y <= w.pinEnd ? 2 : 2 + Math.min(1, (y - w.pinEnd) / Math.max(1, marks[3].start - w.pinEnd))
        }
        motion.chapter = c
        activeChapter.set(CHAPTERS[Math.min(Math.round(c - 0.45), CHAPTERS.length - 1)]?.id ?? 'home')
      },
    })
    return () => {
      marks.forEach((m) => m.kill())
      finale.kill()
      all.kill()
    }
  }, [])
}

export default function App() {
  const webgl = hasWebGL

  useEffect(() => {
    initScroll()
    if (!webgl) {
      complete('scene')
      complete('gpu')
    }
    // Never hold anyone hostage: if the GPU is slow to answer, go anyway.
    const failsafe = window.setTimeout(() => {
      complete('scene')
      complete('gpu')
    }, 6000)

    const onMove = (e: PointerEvent) => {
      motion.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      motion.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    return () => {
      window.clearTimeout(failsafe)
      window.removeEventListener('pointermove', onMove)
      destroyScroll()
    }
  }, [webgl])

  useChapters()

  return (
    <>
      {webgl ? (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      ) : (
        <div className="fallback-sky" aria-hidden />
      )}
      {PerfPanel && (
        <Suspense fallback={null}>
          <PerfPanel />
        </Suspense>
      )}
      <Grain />
      <Preloader />
      <Cursor />
      <Nav />
      <Rail />
      <main>
        <Hero />
        <About />
        <Work />
        <Experience />
        <Skills />
        <Contact />
      </main>
    </>
  )
}
