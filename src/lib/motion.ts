/**
 * Shared, mutable motion state. The DOM (GSAP / Lenis / pointer events) writes
 * here; the WebGL scene reads it inside useFrame. Nothing in here triggers a
 * React render — that is the point.
 */
export const motion = {
  /** Continuous chapter index: 0 hero, 1 about, 2 work, 3 experience, 4 skills, 5 contact. */
  chapter: 0,
  /** Whole-page scroll progress 0..1. */
  progress: 0,
  /** Lenis velocity, roughly px per frame. */
  velocity: 0,
  /** Pointer in normalised device coords (-1..1), y up. */
  pointer: { x: 0, y: 0 },
  /** 0 → 1 once the preloader hands over; drives the camera's opening move. */
  intro: 0,
  /** Contact finale progress 0..1 — the eclipse. */
  finale: 0,
  /** How the scene is being drawn: every frame, at 30 fps while the visitor is idle, or not at all. */
  renderMode: 'always' as 'always' | 'idle' | 'never',
  /** True while the work section covers the viewport; the scene may idle. */
  sceneCovered: false,
  /** The Works gallery. The DOM writes the scroll state; the scene writes `rect` and `hover` back. */
  works: {
    /** 0 → 1 as the chapter arrives: its colour space fades in. */
    on: 0,
    /** 0 → 1: the cards fly in and assemble into rings. */
    build: 0,
    /** Continuous index of the project in focus. */
    pos: 0,
    /** 0 → 1: the gallery collapses into the sculpture. */
    out: 0,
    /** The Explore button is hovered: the studio light answers. */
    exploreHover: false,
    /** 0 rings, 1 spiral. */
    spiral: 0,
    /** Scroll range of the pin; the camera chapter holds still inside it. */
    pinStart: 0,
    pinEnd: 0,
    /** Screen rect (CSS px) of the card in focus: where its case study opens from. */
    rect: { x: 0, y: 0, w: 0, h: 0 },
    /** Its four corners on screen (x, y pairs, clockwise), so type can pass behind it. */
    quad: [0, 0, 0, 0, 0, 0, 0, 0],
    /**
     * The free band for the stage on portrait screens, as fractions of the screen height:
     * below the nav, above the type column (measured by Work.tsx).
     */
    safe: { top: 0.09, bottom: 0.56 },
    /**
     * A case study is open over the stage (CaseStudy.tsx): the stage makes room for its
     * panel, and the phone shows `src` (a real screenshot) instead of the slide's screen.
     * `safe` is the free band for the stage on portrait screens, above the panel.
     */
    cs: { open: false, src: null as string | null, safe: { top: 0.09, bottom: 0.42 } },
  },
  /** The star on screen, in CSS px (written by the scene). */
  sun: { x: 0, y: 0, r: 0, horizon: 0, ready: false },
}

export const CHAPTERS = [
  { id: 'home', label: 'Arrival', nav: 'Home' },
  { id: 'about', label: 'Origin', nav: 'About' },
  { id: 'work', label: 'Works', nav: 'Projects' },
  { id: 'experience', label: 'Trajectory', nav: 'Experience' },
  { id: 'contact', label: 'Aphelion', nav: 'Contact' },
] as const

export type ChapterId = (typeof CHAPTERS)[number]['id']

export const NAV_ITEMS: { id: ChapterId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
]

/** Tiny observable for the few things React does need to re-render on. */
type Listener = () => void
export function createStore<T>(initial: T) {
  let value = initial
  const listeners = new Set<Listener>()
  return {
    get: () => value,
    set: (next: T) => {
      if (Object.is(next, value)) return
      value = next
      listeners.forEach((l) => l())
    },
    subscribe: (l: Listener) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

export const activeChapter = createStore<ChapterId>('home')
export const loaderDone = createStore(false)

/** Project index of the gallery card under the pointer, or -1 (written by the scene). */
export const worksHover = createStore(-1)
