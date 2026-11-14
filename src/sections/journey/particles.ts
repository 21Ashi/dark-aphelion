/**
 * Transition particles for the Works journey, drawn on one 2D canvas.
 * Every frame is a pure function of the transition's progress (0 → 1), so
 * scrubbing backwards replays it exactly, and nothing simulates off-screen.
 */
export type ParticleMode = 'shatter' | 'warp'

type P = { sx: number; sy: number; ang: number; spd: number; tx: number; ty: number; size: number; delay: number }

const rnd = (seed: number) => {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), s | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export class Particles {
  private ctx: CanvasRenderingContext2D
  private ps: P[] = []
  private w = 0
  private h = 0
  private dpr = 1
  private dirty = false

  constructor(
    private canvas: HTMLCanvasElement,
    private count: number,
  ) {
    this.ctx = canvas.getContext('2d')!
    this.resize()
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    this.w = this.canvas.clientWidth
    this.h = this.canvas.clientHeight
    this.canvas.width = Math.round(this.w * this.dpr)
    this.canvas.height = Math.round(this.h * this.dpr)
    const r = rnd(1448)
    const { w, h } = this
    this.ps = Array.from({ length: this.count }, () => {
      // Start: the outgoing composition, roughly a centred block.
      const sx = w * (0.18 + r() * 0.64)
      const sy = h * (0.12 + r() * 0.76)
      // Target: a ring around the incoming composition's centre.
      const a = r() * Math.PI * 2
      const rad = Math.min(w, h) * (0.18 + r() * 0.3)
      return {
        sx,
        sy,
        ang: Math.atan2(sy - h / 2, sx - w / 2) + (r() - 0.5) * 0.9,
        spd: 0.25 + r() * 0.75,
        tx: w / 2 + Math.cos(a) * rad * 1.5,
        ty: h / 2 + Math.sin(a) * rad,
        size: 1 + r() * 2.6,
        delay: r() * 0.25,
      }
    })
  }

  clear() {
    if (!this.dirty) return
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.dirty = false
  }

  /** Draw one transition frame. `from` / `to` are #rrggbb colours. */
  draw(mode: ParticleMode, progress: number, from: string, to: string) {
    if (progress <= 0.001 || progress >= 0.999) return this.clear()
    const { ctx, w, h } = this
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    this.dirty = true
    const A = hex(from)
    const B = hex(to)
    const env = Math.sin(Math.PI * progress)
    const reach = Math.max(w, h)

    for (const p of this.ps) {
      const t = clamp01((progress - p.delay) / 0.75)
      const c = [0, 1, 2].map((k) => Math.round(A[k] + (B[k] - A[k]) * ease(t)))
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(env * (0.35 + p.spd * 0.65)).toFixed(3)})`
      if (mode === 'shatter') {
        // Burst outward from where the old world was, then reassemble.
        const burst = Math.sin(Math.PI * Math.min(1, t * 1.1)) * reach * 0.22 * p.spd
        const k = ease(t)
        const x = p.sx + (p.tx - p.sx) * k + Math.cos(p.ang) * burst
        const y = p.sy + (p.ty - p.sy) * k + Math.sin(p.ang) * burst
        const s = p.size * (1 + env * 1.2)
        ctx.fillRect(x - s / 2, y - s / 2, s, s)
      } else {
        // Warp: streaks travelling right to left, longest at mid-transition.
        const x = (((p.sx - t * w * (1.2 + p.spd * 1.6)) % (w * 1.4)) + w * 1.4) % (w * 1.4) - w * 0.2
        const len = 10 + env * 220 * p.spd
        ctx.fillRect(x, p.sy, len, Math.max(1, p.size * 0.6))
      }
    }
  }
}
