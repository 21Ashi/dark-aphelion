import { Vector3 } from 'three'

/**
 * One keyframe per chapter (hero, about, work, experience, skills, contact).
 * The camera glides between them as `motion.chapter` moves continuously.
 */
type Key = { pos: [number, number, number]; look: [number, number, number]; sculpt: [number, number, number] }

export const SUN = { pos: new Vector3(0, 16, -380), radius: 62 }

/** Live positions shared between scene components each frame. */
export const live = { sculpt: new Vector3(1.9, 5.4, 1.5) }

export const KEYS: Key[] = [
  // 0 · Arrival — low, centred, the star rising behind the sculpture
  { pos: [0, 3.2, 16], look: [0, 7.5, -60], sculpt: [1.9, 5.4, 1.5] },
  // 1 · Origin — slide left and forward, sculpture turns crystalline on the right
  { pos: [-5.5, 2.6, -2], look: [3, 6.5, -70], sculpt: [7.2, 5.6, -11] },
  // 2 · Works — climb above the colonnade
  { pos: [0, 12, -24], look: [0, 9, -140], sculpt: [0, 9, -48] },
  // 3 · Trajectory — drift right through the second gate
  { pos: [7, 4.5, -52], look: [-6, 10, -170], sculpt: [-5, 7, -72] },
  // 4 · Instruments — drop low and look up at the monoliths
  { pos: [-2, 1.4, -78], look: [2, 18, -210], sculpt: [3, 6, -96] },
  // 5 · Aphelion — face the star for the eclipse
  { pos: [0, 7, -112], look: [0, 28, -380], sculpt: [0, 12, -150] },
]

const smooth = (t: number) => t * t * (3 - 2 * t)

const a = new Vector3()
const b = new Vector3()

export function samplePath(chapter: number, out: { pos: Vector3; look: Vector3; sculpt: Vector3 }) {
  const c = Math.min(Math.max(chapter, 0), KEYS.length - 1)
  const i = Math.min(Math.floor(c), KEYS.length - 2)
  const t = smooth(Math.min(Math.max(c - i, 0), 1))
  const k0 = KEYS[i]
  const k1 = KEYS[i + 1]
  out.pos.copy(a.fromArray(k0.pos).lerp(b.fromArray(k1.pos), t))
  out.look.copy(a.fromArray(k0.look).lerp(b.fromArray(k1.look), t))
  out.sculpt.copy(a.fromArray(k0.sculpt).lerp(b.fromArray(k1.sculpt), t))
  return out
}

/** Deterministic random so the world is identical on every visit. */
export function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
