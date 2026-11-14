import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { projects } from '../../content/projects'
import { motion } from '../../lib/motion'
import { hasWebGL, prefersReducedMotion } from '../../lib/quality'
// Loaded on demand (with the project art it brings), prefetched once the page is idle.
const load = () => import('./CaseStudy')
const CaseStudy = lazy(() => load().then((m) => ({ default: m.CaseStudy })))
if (typeof window !== 'undefined') {
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
  window.addEventListener('load', () => (idle ? idle(() => load()) : window.setTimeout(load, 2500)), { once: true })
}

type Opened = { index: number; rect: DOMRect | null }
/** The case study opens over the live 3D stage (the Works chapter's own), not over an opaque page. */
const STAGED = hasWebGL && !prefersReducedMotion
const fromHash = () => {
  const m = window.location.hash.match(/^#work\/(.+)$/)
  return m ? projects.findIndex((p) => p.id === m[1]) : -1
}

/**
 * The full-screen case study: which project is open, deep links
 * (`#work/<id>`), browser Back, and the overlay itself as `portal`.
 */
export function useCaseStudy() {
  const [opened, setOpened] = useState<Opened | null>(() => {
    const i = fromHash()
    return i >= 0 ? { index: i, rect: null } : null
  })

  const open = useCallback((index: number, from?: HTMLElement | DOMRect | null) => {
    setOpened({
      index,
      rect: from instanceof HTMLElement ? from.getBoundingClientRect() : (from ?? null),
    })
  }, [])

  useEffect(() => {
    const sync = () => {
      const i = fromHash()
      setOpened((cur) => (i >= 0 ? (cur?.index === i ? cur : { index: i, rect: null }) : null))
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    const want = opened ? `#work/${projects[opened.index].id}` : ''
    const have = window.location.hash.startsWith('#work/') ? window.location.hash : ''
    const clean = window.location.pathname + window.location.search
    if (want && !have) history.pushState({ cs: true }, '', want)
    else if (want && want !== have) history.replaceState({ cs: true }, '', want)
    else if (!want && have) {
      // Closing: step back over the entry we added, so Back doesn't reopen it.
      if ((history.state as { cs?: boolean } | null)?.cs) history.back()
      else history.replaceState(null, '', clean)
    }
    // Over the stage the scene is the picture; only the opaque fallback lets it rest.
    motion.sceneCovered = !!opened && !STAGED
    return () => {
      motion.sceneCovered = false
    }
  }, [opened])

  const portal =
    opened &&
    createPortal(
      <Suspense fallback={null}>
        <CaseStudy
          key={opened.index}
          project={projects[opened.index]}
          index={opened.index}
          origin={opened.rect}
          staged={STAGED}
          onClose={() => setOpened(null)}
          onNext={() =>
            setOpened({
              index: (opened.index + 1) % projects.length,
              rect: null,
            })
          }
        />
      </Suspense>,
      document.body,
    )

  return { opened, open, portal }
}
