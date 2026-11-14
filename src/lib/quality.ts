import { createStore } from './motion'

/**
 * Quality manager. One place decides how much the 3D scene does.
 *
 *   ultra   strong desktop GPUs: up to 1.75x, reflections, all post effects
 *   high    capable laptops: up to 1.5x, reflections, bloom + vignette
 *   medium  tablets and modest machines: up to 1.25x, no reflections, fewer particles
 *   low     phones and weak/software GPUs: 1x, no post-processing, minimal particles
 *
 * The starting level comes from what the browser reports (GPU renderer,
 * cores, memory, screen, touch), never from the user-agent string. While the
 * scene runs, `sampleFrame` watches real frame times against the display's own
 * refresh interval: sustained slow frames step the level down, a long stable
 * stretch steps it back up (never above where it started). Hysteresis and a
 * cooldown keep it from flip-flopping. Force a level with ?quality=…
 */
export type Level = 'ultra' | 'high' | 'medium' | 'low'
export type Tier = Level

const ORDER: Level[] = ['low', 'medium', 'high', 'ultra']

export type LevelConfig = {
  /** Upper bound for the canvas pixel ratio. */
  dprMax: number
  post: boolean
  aberration: boolean
  reflect: boolean
  /** Dust motes in the air. */
  dust: number
  /** Floating shards. */
  shards: number
}

const CONFIG: Record<Level, LevelConfig> = {
  ultra: { dprMax: 1.75, post: true, aberration: true, reflect: true, dust: 1600, shards: 72 },
  high: { dprMax: 1.5, post: true, aberration: false, reflect: true, dust: 1200, shards: 60 },
  medium: { dprMax: 1.25, post: true, aberration: false, reflect: false, dust: 800, shards: 40 },
  low: { dprMax: 1, post: false, aberration: false, reflect: false, dust: 400, shards: 24 },
}
/**
 * Post-processing stays as the starting level set it: switching it on or off
 * changes every material's output path and recompiles them all (a freeze).
 * Runtime steps change only what is cheap to change: resolution, particles,
 * reflections and chromatic aberration.
 */
export const levelConfig = (l: Level): LevelConfig => {
  const c = l === 'low' && phone ? { ...CONFIG.low, dprMax: phoneDpr.get() } : CONFIG[l]
  // ...except on a machine that kept struggling all the way down to `low`: there one
  // recompile (a single hitch) is worth far more than a scene that never catches up.
  const post = CONFIG[ceiling].post && !(postDropped && l === 'low')
  return { ...c, post, aberration: post && c.aberration }
}

export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches
/** A phone: touch, and a small screen. */
const phone =
  isTouch && typeof window !== 'undefined' && Math.min(window.innerWidth, window.screen?.width ?? window.innerWidth) < 768
/**
 * Phones start at `low`, but their screens are small: at 2× a phone draws about as many
 * pixels as a laptop at 1×, and at 1× the 3D on a 3× screen is visibly blurry. So on a
 * phone `low` keeps 2×; if even that is too slow, the governor steps it to 1.5×, then 1×.
 */
export const phoneDpr = createStore(phone ? 2 : 1)

/** What the GPU says it is (unmasked where the browser allows it). */
function gpuName(): string {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return ''
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return name
  } catch {
    return ''
  }
}

export const gpu = typeof window === 'undefined' ? '' : gpuName()
/** Whether this browser can draw the 3D scene at all. */
export const hasWebGL = gpu !== ''

function detect(): Level {
  if (typeof window === 'undefined') return 'medium'
  const params = new URLSearchParams(window.location.search)
  const forced = params.get('quality') ?? params.get('tier')
  if (forced && (ORDER as string[]).includes(forced)) return forced as Level

  const g = gpu.toLowerCase()
  const w = Math.min(window.innerWidth, window.screen?.width ?? window.innerWidth)
  const cores = navigator.hardwareConcurrency ?? 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory // Chrome only; capped at 8
  const software = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/.test(g)
  const strongGpu = /apple m\d|apple gpu|rtx|radeon rx|radeon pro|geforce gtx 1[6-9]|geforce gtx [2-9]\d|arc a/.test(g)

  if (software) return 'low'
  if (isTouch && w < 768) return 'low' // phones
  if (isTouch) return 'medium' // tablets
  if (cores <= 4 || (memory !== undefined && memory <= 4)) return 'medium'
  if (strongGpu && cores >= 8 && (memory === undefined || memory >= 8)) return 'ultra'
  return 'high'
}

/** Where the device starts, and the highest level adaptation may return to. */
export const ceiling: Level = detect()
/** Kept for modules that size things once at start. */
export const tier: Level = ceiling
export const tierConfig = CONFIG[ceiling]

/** The level in force right now. */
export const quality = createStore<Level>(ceiling)

/* ── Runtime adaptation ─────────────────────────────────────────────── */

/**
 * One evaluation window is a second of frames, whatever the display's rate: at 240 Hz
 * a 60-frame window was a quarter of a second, short enough for one hitch to count.
 */
const WINDOW_MS = 1000
const MIN_FRAMES = 6 // a very slow machine still needs a few frames per window
const BAD = 1.5 // a window is slow when its 90th percentile exceeds 1.5 frame budgets
const SEVERE = 3 // and badly slow beyond 3 × 16.7 ms (under 20 fps): it counts twice
const GOOD = 1.15 // and comfortable below 1.15
const DOWN_AFTER = 4 // slow windows (severe ones count twice) before stepping down
const UP_AFTER = 30 // consecutive comfortable windows before stepping up (doubles after each step down)
const COOLDOWN = 4 // windows ignored after any change (new settings settle, shaders compile)
/**
 * The frame budget follows the display, within limits. Never tighter than 90 fps: a 144 or
 * 240 Hz monitor must not make a machine running at 100+ fps look slow. Never looser than
 * 50 fps: a machine that only manages 20 fps must not be mistaken for a 20 Hz display.
 */
const MIN_BUDGET = 1000 / 90
const MAX_BUDGET = 20
/** A frame longer than this is a pause (hidden tab, a stall), not a measure of the device. */
const GAP = 1000

/** Live numbers for the development panel. */
export const perfStats = {
  frames: new Float32Array(240),
  head: 0,
  count: 0,
  /** Estimated display refresh interval (ms). */
  budget: 16.7,
  lastP90: 0,
  changes: [] as { at: number; from: Level; to: Level; why: string }[],
  /** When the 3D last drew a frame (performance.now), whatever the render mode. */
  lastFrameAt: 0,
}
/** Diagnostics on the live site: `?perf` shows the performance panel. */
export const perfRequested = typeof location !== 'undefined' && new URLSearchParams(location.search).has('perf')

const win: number[] = []
let winTime = 0
const floors: number[] = []
/**
 * Set once a badly slow machine fell all the way to `low`: post-processing goes too. That
 * recompiles every shader, a long freeze on Windows, so only real need justifies it.
 */
let postDropped = false
let slow = 0
let fine = 0
let cooldown = COOLDOWN
let downs = 0
/** Judging starts only once start-up work (intro, background compiles, uploads) is over. */
let armed = false
export function armQualityMonitor() {
  if (armed) return
  armed = true
  cooldown = COOLDOWN
}
// Start-up normally arms it (Scene.tsx, after the intro and background compiles); on a
// machine too slow to ever finish those, start judging anyway.
if (typeof window !== 'undefined') window.setTimeout(armQualityMonitor, 25000)

const percentile = (a: number[], p: number) => {
  const s = [...a].sort((x, y) => x - y)
  return s[Math.min(s.length - 1, Math.floor(p * s.length))]
}

function step(dir: -1 | 1, why: string, severe = false) {
  const cur = quality.get()
  const i = ORDER.indexOf(cur) + dir
  // Already at the bottom on a phone: lower the resolution instead.
  if (i < 0 && phone && phoneDpr.get() > 1) {
    const to = Math.max(1, phoneDpr.get() - 0.5)
    perfStats.changes.push({ at: Math.round(performance.now()), from: cur, to: cur, why: `${why}; resolution ${to}×` })
    if (perfStats.changes.length > 12) perfStats.changes.shift()
    phoneDpr.set(to)
    slow = 0
    fine = 0
    cooldown = COOLDOWN
    return
  }
  if (i < 0 || i > ORDER.indexOf(ceiling)) return
  const next = ORDER[i]
  perfStats.changes.push({ at: Math.round(performance.now()), from: cur, to: next, why })
  if (perfStats.changes.length > 12) perfStats.changes.shift()
  if (dir < 0 && next === 'low' && severe) postDropped = true
  quality.set(next)
  if (dir < 0) downs++
  slow = 0
  fine = 0
  cooldown = COOLDOWN
}

/**
 * Feed one frame's duration (ms). Called by the scene every rendered frame.
 * Gaps (tab hidden, rendering paused) are ignored.
 */
export function sampleFrame(ms: number) {
  if (!(ms > 0) || ms > GAP) return
  perfStats.frames[perfStats.head] = ms
  perfStats.head = (perfStats.head + 1) % perfStats.frames.length
  perfStats.count = Math.min(perfStats.count + 1, perfStats.frames.length)
  win.push(ms)
  winTime += ms
  if (winTime < WINDOW_MS || win.length < MIN_FRAMES) return

  // The display's own cadence: the fast end of recent windows (120 or 60 Hz), capped.
  floors.push(percentile(win, 0.1))
  if (floors.length > 10) floors.shift()
  const budget = Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, Math.min(...floors)))
  perfStats.budget = budget
  const p90 = percentile(win, 0.9)
  perfStats.lastP90 = p90
  win.length = 0
  winTime = 0

  if (!armed || prefersReducedMotion || new URLSearchParams(location.search).has('quality')) return
  if (cooldown > 0) {
    cooldown--
    return
  }
  if (p90 > budget * BAD) {
    // "badly slow" is judged against 60 fps, so a fast screen's hitches never count double
    const severe = p90 > Math.max(budget, 1000 / 60) * SEVERE
    slow += severe ? 2 : 1
    fine = 0
    if (slow >= DOWN_AFTER) step(-1, `p90 ${p90.toFixed(1)} ms over ${(budget * BAD).toFixed(1)} ms`, severe)
  } else if (p90 <= budget * GOOD) {
    fine++
    slow = 0
    // Climbing back is slow and stops after two drops: a resize costs a hitch of its own.
    if (downs < 2 && fine >= UP_AFTER * 2 ** downs) step(1, `stable at p90 ${p90.toFixed(1)} ms`)
  } else {
    slow = 0
    fine = 0
  }
}
