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
  const c = CONFIG[l]
  const post = CONFIG[ceiling].post
  return { ...c, post, aberration: post && c.aberration }
}

export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches

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

const WINDOW = 60 // frames per evaluation window
const BAD = 1.5 // a window is slow when its 90th percentile exceeds 1.5 refresh intervals
const GOOD = 1.15 // and comfortable below 1.15
const DOWN_AFTER = 4 // consecutive slow windows before stepping down
const UP_AFTER = 30 // consecutive comfortable windows before stepping up (doubles after each step down)
const COOLDOWN = 6 // windows ignored after any change (new settings settle, shaders compile)

/** Live numbers for the development panel. */
export const perfStats = {
  frames: new Float32Array(240),
  head: 0,
  count: 0,
  /** Estimated display refresh interval (ms). */
  budget: 16.7,
  lastP90: 0,
  changes: [] as { at: number; from: Level; to: Level; why: string }[],
}

const win: number[] = []
const floors: number[] = []
let slow = 0
let fine = 0
let cooldown = COOLDOWN
let downs = 0
/** Judging starts only once start-up work (intro, background compiles, uploads) is over. */
let armed = false
export function armQualityMonitor() {
  armed = true
  cooldown = COOLDOWN
}

const percentile = (a: number[], p: number) => {
  const s = [...a].sort((x, y) => x - y)
  return s[Math.min(s.length - 1, Math.floor(p * s.length))]
}

function step(dir: -1 | 1, why: string) {
  const cur = quality.get()
  const i = ORDER.indexOf(cur) + dir
  if (i < 0 || i > ORDER.indexOf(ceiling)) return
  const next = ORDER[i]
  perfStats.changes.push({ at: Math.round(performance.now()), from: cur, to: next, why })
  if (perfStats.changes.length > 12) perfStats.changes.shift()
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
  if (!(ms > 0) || ms > 250) return
  perfStats.frames[perfStats.head] = ms
  perfStats.head = (perfStats.head + 1) % perfStats.frames.length
  perfStats.count = Math.min(perfStats.count + 1, perfStats.frames.length)
  win.push(ms)
  if (win.length < WINDOW) return

  // The display's own cadence: the fast end of recent windows (120, 60 or 30 Hz).
  floors.push(percentile(win, 0.1))
  if (floors.length > 10) floors.shift()
  const budget = Math.max(6, Math.min(...floors))
  perfStats.budget = budget
  const p90 = percentile(win, 0.9)
  perfStats.lastP90 = p90
  win.length = 0

  if (!armed || prefersReducedMotion || new URLSearchParams(location.search).has('quality')) return
  if (cooldown > 0) {
    cooldown--
    return
  }
  if (p90 > budget * BAD) {
    slow++
    fine = 0
    if (slow >= DOWN_AFTER) step(-1, `p90 ${p90.toFixed(1)} ms over ${(budget * BAD).toFixed(1)} ms`)
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
